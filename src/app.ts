import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import express, { type NextFunction, type Request, type Response } from "express";
import type { Task, User } from "./db.js";
import type { Mailer } from "./mailer.js";
import * as views from "./views.js";

export type AppOptions = {
  db: DatabaseSync;
  mailer: Mailer;
  baseUrl: string;
  /** Exposes `/__test__/*` so the E2E suite can seed accounts without going through email. */
  enableTestApi?: boolean;
};

const SESSION_COOKIE = "sid";
const VERIFY_TTL_MS = 15 * 60_000;
const RESET_TTL_MS = 30 * 60_000;

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 32).toString("hex")}`;
}

function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(scryptSync(password, Buffer.from(salt, "hex"), 32), Buffer.from(hash, "hex"));
}

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

type AuthedRequest = Request & { user: User };

export function createApp({ db, mailer, baseUrl, enableTestApi = false }: AppOptions) {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  const findUserByEmail = (email: string) =>
    db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim()) as User | undefined;

  function createUser(email: string, password: string, verified: boolean): User {
    const { lastInsertRowid } = db
      .prepare("INSERT INTO users (email, password_hash, verified) VALUES (?, ?, ?)")
      .run(email.trim(), hashPassword(password), verified ? 1 : 0);
    return db.prepare("SELECT * FROM users WHERE id = ?").get(lastInsertRowid) as User;
  }

  function startSession(res: Response, userId: number) {
    const id = randomBytes(24).toString("hex");
    db.prepare("INSERT INTO sessions (id, user_id) VALUES (?, ?)").run(id, userId);
    res.cookie(SESSION_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  }

  function issueToken(userId: number, kind: "verify" | "reset", token: string, ttlMs: number) {
    db.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = ?").run(userId, kind);
    db.prepare("INSERT INTO tokens (token, user_id, kind, expires_at) VALUES (?, ?, ?, ?)").run(
      token,
      userId,
      kind,
      Date.now() + ttlMs,
    );
  }

  /** Returns the token's user and burns the token: every emailed secret is single-use. */
  function consumeToken(kind: "verify" | "reset", token: string, userId?: number): User | undefined {
    const row = db
      .prepare("SELECT * FROM tokens WHERE token = ? AND kind = ? AND expires_at > ?")
      .get(token, kind, Date.now()) as { user_id: number } | undefined;
    if (!row || (userId !== undefined && row.user_id !== userId)) return undefined;
    db.prepare("DELETE FROM tokens WHERE token = ?").run(token);
    return db.prepare("SELECT * FROM users WHERE id = ?").get(row.user_id) as User;
  }

  async function sendVerificationCode(user: User) {
    // Codes are only unique per user, so the primary key carries the user id.
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    issueToken(user.id, "verify", `${user.id}:${code}`, VERIFY_TTL_MS);
    await mailer.send(
      user.email,
      `Your Taskflow code is ${code}`,
      `Enter this code to confirm your email address: ${code}\nIt expires in 15 minutes.`,
      `<p>Enter this code to confirm your email address:</p><p style="font-size:24px"><strong>${code}</strong></p><p>It expires in 15 minutes.</p>`,
    );
  }

  function currentUser(req: Request): User | undefined {
    const sid = readCookie(req, SESSION_COOKIE);
    if (!sid) return undefined;
    return db
      .prepare("SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ?")
      .get(sid) as User | undefined;
  }

  function requireUser(req: Request, res: Response, next: NextFunction) {
    const user = currentUser(req);
    if (!user) return res.redirect("/login");
    (req as AuthedRequest).user = user;
    next();
  }

  app.get("/", (req, res) => res.redirect(currentUser(req) ? "/tasks" : "/login"));
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/signup", (_req, res) => res.send(views.signupPage()));
  app.post("/signup", async (req, res) => {
    const email = String(req.body.email ?? "").trim();
    const password = String(req.body.password ?? "");
    if (password.length < 8) return res.status(422).send(views.signupPage("Password must be at least 8 characters.", email));
    if (findUserByEmail(email)) return res.status(422).send(views.signupPage("An account already exists for this email.", email));
    const user = createUser(email, password, false);
    await sendVerificationCode(user);
    res.redirect(`/verify?email=${encodeURIComponent(user.email)}`);
  });

  app.get("/verify", (req, res) => res.send(views.verifyPage(String(req.query.email ?? ""))));
  app.post("/verify", (req, res) => {
    const email = String(req.body.email ?? "");
    const code = String(req.body.code ?? "").trim();
    const user = findUserByEmail(email);
    if (!user || !consumeToken("verify", `${user.id}:${code}`, user.id)) {
      return res.status(422).send(views.verifyPage(email, "That code is invalid or has expired."));
    }
    db.prepare("UPDATE users SET verified = 1 WHERE id = ?").run(user.id);
    startSession(res, user.id);
    res.redirect("/tasks");
  });

  app.get("/login", (req, res) =>
    res.send(views.loginPage(undefined, req.query.reset ? "Password updated. You can log in now." : undefined)),
  );
  app.post("/login", (req, res) => {
    const email = String(req.body.email ?? "");
    const user = findUserByEmail(email);
    if (!user || !checkPassword(String(req.body.password ?? ""), user.password_hash)) {
      return res.status(401).send(views.loginPage("Wrong email or password.", undefined, email));
    }
    if (!user.verified) {
      return res.status(403).send(views.loginPage("Confirm your email address before logging in.", undefined, email));
    }
    startSession(res, user.id);
    res.redirect("/tasks");
  });

  app.post("/logout", (req, res) => {
    const sid = readCookie(req, SESSION_COOKIE);
    if (sid) db.prepare("DELETE FROM sessions WHERE id = ?").run(sid);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.redirect("/login");
  });

  const FORGOT_NOTICE = "If an account exists for that email, a reset link is on its way.";
  app.get("/forgot", (_req, res) => res.send(views.forgotPage()));
  app.post("/forgot", async (req, res) => {
    // Same answer whether or not the account exists, so the form cannot be used to probe emails.
    const user = findUserByEmail(String(req.body.email ?? ""));
    if (user) {
      const token = randomBytes(24).toString("hex");
      issueToken(user.id, "reset", token, RESET_TTL_MS);
      const link = `${baseUrl}/reset?token=${token}`;
      await mailer.send(
        user.email,
        "Reset your Taskflow password",
        `Follow this link to choose a new password: ${link}\nIt expires in 30 minutes.`,
        `<p><a href="${link}">Choose a new password</a></p><p>It expires in 30 minutes.</p>`,
      );
    }
    res.send(views.forgotPage(FORGOT_NOTICE));
  });

  app.get("/reset", (req, res) => res.send(views.resetPage(String(req.query.token ?? ""))));
  app.post("/reset", (req, res) => {
    const token = String(req.body.token ?? "");
    const password = String(req.body.password ?? "");
    if (password.length < 8) return res.status(422).send(views.resetPage(token, "Password must be at least 8 characters."));
    const user = consumeToken("reset", token);
    if (!user) return res.status(422).send(views.resetPage(token, "This reset link is invalid or has expired."));
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), user.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
    res.redirect("/login?reset=1");
  });

  app.get("/tasks", requireUser, (req, res) => {
    const { user } = req as AuthedRequest;
    const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id").all(user.id) as Task[];
    res.send(views.tasksPage(user.email, tasks));
  });
  app.post("/tasks", requireUser, (req, res) => {
    const title = String(req.body.title ?? "").trim();
    if (title) db.prepare("INSERT INTO tasks (user_id, title) VALUES (?, ?)").run((req as AuthedRequest).user.id, title);
    res.redirect("/tasks");
  });
  app.post("/tasks/:id/toggle", requireUser, (req, res) => {
    db.prepare("UPDATE tasks SET done = 1 - done WHERE id = ? AND user_id = ?").run(String(req.params.id), (req as AuthedRequest).user.id);
    res.redirect("/tasks");
  });
  app.post("/tasks/:id/delete", requireUser, (req, res) => {
    db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(String(req.params.id), (req as AuthedRequest).user.id);
    res.redirect("/tasks");
  });

  if (enableTestApi) {
    app.post("/__test__/users", (req, res) => {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) return res.status(400).json({ error: "email and password are required" });
      const existing = findUserByEmail(email);
      if (existing) db.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
      const user = createUser(email, password, true);
      res.status(201).json({ id: user.id, email: user.email });
    });
  }

  return app;
}
