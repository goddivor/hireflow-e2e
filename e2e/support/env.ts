export const env = {
  runId: process.env.E2E_RUN_ID ?? "local",
  seedToken: process.env.SEED_TOKEN ?? "local-seed-token",
  mailpitUrl: process.env.MAILPIT_URL ?? "http://localhost:8025",
  smsSinkUrl: process.env.SMS_SINK_URL ?? "http://localhost:8026",
  mailosaurApiKey: process.env.MAILOSAUR_API_KEY,
  mailosaurServerId: process.env.MAILOSAUR_SERVER_ID,
};
