import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";

export const PASSWORD = "correct-horse-battery";

/** Unique per call, so tests never collide on the UNIQUE email column or in the shared Mailpit inbox. */
export const uniqueEmail = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}@taskflow.test`;

export async function seedVerifiedUser(request: APIRequestContext, email: string, password = PASSWORD) {
  const response = await request.post("/__test__/users", { data: { email, password } });
  if (response.status() !== 201) throw new Error(`seeding ${email} failed: ${response.status()} ${await response.text()}`);
  return { email, password };
}
