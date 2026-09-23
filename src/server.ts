import { createApp } from "./app.js";
import { openDb } from "./db.js";
import { createMailer } from "./mailer.js";

const port = Number(process.env.PORT ?? 3000);

const app = createApp({
  db: openDb(process.env.DATABASE_PATH ?? "data/taskflow.db"),
  mailer: createMailer(process.env.SMTP_HOST ?? "127.0.0.1", Number(process.env.SMTP_PORT ?? 1025)),
  baseUrl: process.env.APP_URL ?? `http://localhost:${port}`,
  enableTestApi: process.env.ENABLE_TEST_API === "1",
});

app.listen(port, () => console.log(`Taskflow listening on http://localhost:${port}`));
