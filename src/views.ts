import type { Task } from "./db.js";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string, email?: string): string {
  const nav = email
    ? `<span data-testid="current-user">${esc(email)}</span>
       <form method="post" action="/logout"><button type="submit">Log out</button></form>`
    : `<a href="/login">Log in</a> <a href="/signup">Sign up</a>`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · Taskflow</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; max-width: 34rem; margin: 2rem auto; padding: 0 1rem; }
    header { display: flex; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
    header nav { display: flex; gap: .75rem; align-items: center; }
    form { display: grid; gap: .5rem; }
    header form, li form { display: inline; }
    input { padding: .4rem; font: inherit; }
    [role=alert] { padding: .5rem .75rem; border-radius: 4px; background: #fdecea; color: #8a1c10; }
    [role=status] { padding: .5rem .75rem; border-radius: 4px; background: #e8f5e9; color: #1b5e20; }
    ul { padding: 0; list-style: none; }
    li { display: flex; gap: .5rem; align-items: center; padding: .35rem 0; border-bottom: 1px solid #eee; }
    li.done span { text-decoration: line-through; color: #888; }
    li span { flex: 1; }
  </style>
</head>
<body>
  <header><strong>Taskflow</strong><nav>${nav}</nav></header>
  <main>
    <h1>${esc(title)}</h1>
    ${body}
  </main>
</body>
</html>`;
}

const flash = (error?: string, notice?: string) =>
  (error ? `<p role="alert">${esc(error)}</p>` : "") + (notice ? `<p role="status">${esc(notice)}</p>` : "");

export const signupPage = (error?: string, email = "") =>
  layout(
    "Create your account",
    `${flash(error)}
    <form method="post" action="/signup">
      <label>Email <input type="email" name="email" value="${esc(email)}" required></label>
      <label>Password <input type="password" name="password" minlength="8" required></label>
      <button type="submit">Create account</button>
    </form>`,
  );

export const verifyPage = (email: string, error?: string) =>
  layout(
    "Check your inbox",
    `${flash(error)}
    <p>We sent a 6-digit code to <strong>${esc(email)}</strong>.</p>
    <form method="post" action="/verify">
      <input type="hidden" name="email" value="${esc(email)}">
      <label>Verification code <input name="code" inputmode="numeric" autocomplete="one-time-code" required></label>
      <button type="submit">Verify</button>
    </form>`,
  );

export const loginPage = (error?: string, notice?: string, email = "") =>
  layout(
    "Log in",
    `${flash(error, notice)}
    <form method="post" action="/login">
      <label>Email <input type="email" name="email" value="${esc(email)}" required></label>
      <label>Password <input type="password" name="password" required></label>
      <button type="submit">Log in</button>
    </form>
    <p><a href="/forgot">Forgot your password?</a></p>`,
  );

export const forgotPage = (notice?: string) =>
  layout(
    "Reset your password",
    `${flash(undefined, notice)}
    <form method="post" action="/forgot">
      <label>Email <input type="email" name="email" required></label>
      <button type="submit">Send reset link</button>
    </form>`,
  );

export const resetPage = (token: string, error?: string) =>
  layout(
    "Choose a new password",
    `${flash(error)}
    <form method="post" action="/reset">
      <input type="hidden" name="token" value="${esc(token)}">
      <label>New password <input type="password" name="password" minlength="8" required></label>
      <button type="submit">Update password</button>
    </form>`,
  );

export const tasksPage = (email: string, tasks: Task[]) => {
  const open = tasks.filter((t) => !t.done).length;
  const items = tasks
    .map(
      (t) => `<li class="${t.done ? "done" : ""}" data-testid="task">
        <form method="post" action="/tasks/${t.id}/toggle">
          <button type="submit" aria-label="${t.done ? "Reopen" : "Complete"} ${esc(t.title)}">${t.done ? "↺" : "✓"}</button>
        </form>
        <span>${esc(t.title)}</span>
        <form method="post" action="/tasks/${t.id}/delete">
          <button type="submit" aria-label="Delete ${esc(t.title)}">✕</button>
        </form>
      </li>`,
    )
    .join("");
  return layout(
    "Your tasks",
    `<p data-testid="open-count">${open} open ${open === 1 ? "task" : "tasks"}</p>
    <form method="post" action="/tasks">
      <label>New task <input name="title" maxlength="200" required></label>
      <button type="submit">Add task</button>
    </form>
    ${tasks.length ? `<ul aria-label="Tasks">${items}</ul>` : `<p data-testid="empty">Nothing to do yet.</p>`}`,
    email,
  );
};
