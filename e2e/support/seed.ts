import type { APIRequestContext } from "@playwright/test";
import { env } from "./env";

export type Role = "admin" | "recruiter" | "candidate";
export type SeededUser = { id: number; name: string; email: string; phone: string | null; password: string };
export type Tenant = {
  slug: string;
  name: string;
  users: Record<Role, SeededUser>;
  candidate_sign_in_token: string;
};

/** Client for the Rails seed endpoint (web/app/controllers/test_support/seeds_controller.rb). */
export class SeedApi {
  constructor(private readonly request: APIRequestContext) {}

  private get headers() {
    return { Authorization: `Bearer ${env.seedToken}` };
  }

  async tenant(name: string): Promise<Tenant> {
    const response = await this.request.post("/test_support/tenants", { headers: this.headers, data: { name } });
    if (response.status() !== 201) throw new Error(`seeding tenant failed: ${response.status()} ${await response.text()}`);
    return response.json();
  }

  async record<T = Record<string, unknown>>(
    organization: string,
    factory: "interview_template" | "invitation",
    options: { traits?: string[]; attributes?: Record<string, unknown> } = {},
  ): Promise<T> {
    const response = await this.request.post("/test_support/records", {
      headers: this.headers,
      data: { organization, factory, ...options },
    });
    if (response.status() !== 201) throw new Error(`seeding ${factory} failed: ${response.status()} ${await response.text()}`);
    return response.json();
  }
}
