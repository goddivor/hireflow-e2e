import type { APIRequestContext } from "@playwright/test";
import { extractCode, SmsInbox } from "../support/inbox";
import type { Tenant } from "../support/seed";

const csrfToken = (html: string) => {
  const token = html.match(/name="authenticity_token" value="([^"]+)"/)?.[1];
  if (!token) throw new Error("no authenticity_token in the page");
  return token;
};

/**
 * Signs `api` in over HTTP, with the same forms a person uses, and leaves the session cookie in it.
 * Staff use email and password; candidates use their magic link, then the code texted to them.
 */
export async function signInOverHttp(api: APIRequestContext, tenant: Tenant, role: "admin" | "recruiter" | "candidate") {
  const base = `/o/${tenant.slug}`;

  if (role === "candidate") {
    const verifyPage = await api.get(`${base}/magic/${tenant.candidate_sign_in_token}`);
    if (!verifyPage.url().endsWith("/verify_phone")) throw new Error(`magic link landed on ${verifyPage.url()}`);
    const sms = await new SmsInbox(api).latest(tenant.users.candidate.phone!);
    const response = await api.post(`${base}/verify_phone`, {
      form: { authenticity_token: csrfToken(await verifyPage.text()), code: extractCode(sms.body) },
    });
    if (!response.url().endsWith("/my/interviews")) throw new Error(`phone verification landed on ${response.url()}`);
    return;
  }

  const user = tenant.users[role];
  const loginPage = await api.get(`${base}/login`);
  const response = await api.post(`${base}/login`, {
    form: { authenticity_token: csrfToken(await loginPage.text()), email: user.email, password: user.password },
  });
  if (!response.url().endsWith(base)) throw new Error(`${role} login landed on ${response.url()}`);
}
