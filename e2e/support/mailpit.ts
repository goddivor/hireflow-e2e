import { expect, type APIRequestContext } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

type MessageSummary = { ID: string; Subject: string; To: { Address: string }[] };
export type Message = { ID: string; Subject: string; Text: string; HTML: string };

/** Reads the emails the app sent, through the Mailpit REST API (https://mailpit.axllent.org/docs/api-v1/). */
export class Mailpit {
  constructor(private readonly request: APIRequestContext) {}

  async latestFor(address: string): Promise<Message> {
    const search = await this.request.get(`${MAILPIT_URL}/api/v1/search`, {
      params: { query: `to:"${address}"`, limit: "1" },
    });
    expect(search.ok()).toBeTruthy();
    const { messages } = (await search.json()) as { messages: MessageSummary[] };
    expect(messages, `no email found for ${address}`).toHaveLength(1);
    const message = await this.request.get(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
    return (await message.json()) as Message;
  }
}

export const extractCode = (message: Message) => message.Text.match(/\b(\d{6})\b/)?.[1] ?? "";

export const extractLink = (message: Message) => message.Text.match(/https?:\/\/\S+/)?.[0] ?? "";
