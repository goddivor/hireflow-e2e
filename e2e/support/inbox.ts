import { expect, type APIRequestContext } from "@playwright/test";
import { env } from "./env";

export type Email = { subject: string; text: string; html: string };
export type TextMessage = { to: string; body: string };

/** Where the suite reads emails from. Tests depend on this interface, never on a provider. */
export interface MailInbox {
  /** Waits for the newest email to `to`, optionally one whose subject matches. */
  latest(to: string, subject?: RegExp): Promise<Email>;
}

/** Local and CI provider: Mailpit's REST API (https://mailpit.axllent.org/docs/api-v1/). */
export class MailpitInbox implements MailInbox {
  constructor(private readonly request: APIRequestContext) {}

  async latest(to: string, subject?: RegExp): Promise<Email> {
    let id: string | undefined;
    // Rails sends mail from a background job, so the email lands some time after the page responds.
    await expect
      .poll(
        async () => {
          const response = await this.request.get(`${env.mailpitUrl}/api/v1/search`, { params: { query: `to:"${to}"` } });
          const { messages } = (await response.json()) as { messages: { ID: string; Subject: string }[] };
          id = messages.find((m) => !subject || subject.test(m.Subject))?.ID;
          return id;
        },
        { message: `email to ${to}${subject ? ` matching ${subject}` : ""}`, timeout: 15_000 },
      )
      .toBeTruthy();
    const message = await (await this.request.get(`${env.mailpitUrl}/api/v1/message/${id}`)).json();
    return { subject: message.Subject, text: message.Text, html: message.HTML };
  }
}

/**
 * Hosted provider for a shared UAT: Mailosaur's REST API (https://mailosaur.com/docs/api).
 * Selected when MAILOSAUR_API_KEY and MAILOSAUR_SERVER_ID are set; recipients must then use
 * the server's domain, which `unique.email` does automatically.
 */
export class MailosaurInbox implements MailInbox {
  constructor(private readonly request: APIRequestContext) {}

  async latest(to: string, subject?: RegExp): Promise<Email> {
    const response = await this.request.post("https://mailosaur.com/api/messages/await", {
      params: { server: env.mailosaurServerId!, timeout: "15000" },
      headers: { Authorization: `Basic ${Buffer.from(`${env.mailosaurApiKey}:`).toString("base64")}` },
      data: { sentTo: to, ...(subject ? { subject: subject.source } : {}) },
    });
    expect(response.ok(), `Mailosaur answered ${response.status()}`).toBeTruthy();
    const message = await response.json();
    return { subject: message.subject, text: message.text?.body ?? "", html: message.html?.body ?? "" };
  }
}

/** Reads texts from the local SMS sink (sms-sink/server.mjs). */
export class SmsInbox {
  constructor(private readonly request: APIRequestContext) {}

  async latest(to: string): Promise<TextMessage> {
    let message: TextMessage | undefined;
    await expect
      .poll(
        async () => {
          const response = await this.request.get(`${env.smsSinkUrl}/messages`, { params: { to } });
          [message] = ((await response.json()) as { messages: TextMessage[] }).messages;
          return message;
        },
        { message: `text message to ${to}`, timeout: 15_000 },
      )
      .toBeTruthy();
    return message!;
  }
}

export const extractCode = (text: string) => {
  const code = text.match(/\b(\d{6})\b/)?.[1];
  expect(code, `no 6-digit code in: ${text}`).toBeTruthy();
  return code!;
};

export const extractLink = (text: string, path: string | RegExp) => {
  const link = text.match(/https?:\/\/\S+/g)?.find((url) => (typeof path === "string" ? url.includes(path) : path.test(url)));
  expect(link, `no link matching ${path} in: ${text}`).toBeTruthy();
  return link!;
};
