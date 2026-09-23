// A stand-in for an SMS provider in UAT and CI: the app POSTs outgoing texts here, and the E2E suite
// reads them back over HTTP, the same way it reads emails from Mailpit. Messages live in memory only.
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8026);
const messages = [];
let nextId = 1;

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/messages") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const { to, body } = JSON.parse(raw || "{}");
    if (!to || !body) return json(res, 422, { error: "to and body are required" });
    const message = { id: nextId++, to, body, receivedAt: new Date().toISOString() };
    messages.push(message);
    return json(res, 201, message);
  }

  if (req.method === "GET" && url.pathname === "/messages") {
    const to = url.searchParams.get("to");
    return json(res, 200, { messages: messages.filter((m) => !to || m.to === to).reverse() });
  }

  if (req.method === "GET" && url.pathname === "/health") return json(res, 200, { ok: true });

  json(res, 404, { error: "not found" });
}).listen(port, () => console.log(`SMS sink listening on http://localhost:${port}`));
