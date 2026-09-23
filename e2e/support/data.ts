import { randomBytes } from "node:crypto";
import { env } from "./env";

const suffix = () => randomBytes(3).toString("hex");
const mailDomain = env.mailosaurServerId ? `${env.mailosaurServerId}.mailosaur.net` : "hireflow.test";

/** Every test builds its own records from these, so no test depends on another's data. */
export const unique = {
  name: (prefix: string) => `${prefix} ${suffix()}`,
  email: (prefix: string) => `${prefix}-${suffix()}@${mailDomain}`,
  // Random so that concurrent tests never read each other's texts from the SMS sink.
  phone: () => `+1555${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`,
};
