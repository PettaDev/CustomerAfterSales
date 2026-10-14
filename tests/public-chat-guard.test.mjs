import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import app from "../server/app-enhanced.mjs";

test("anonymous AI chat is disabled until explicitly enabled", async () => {
  const original = process.env.ENABLE_PUBLIC_CHAT;
  delete process.env.ENABLE_PUBLIC_CHAT;
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const response = await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Help" }] }),
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.ok(body.error.includes("Central de Ajuda"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (original === undefined) delete process.env.ENABLE_PUBLIC_CHAT;
    else process.env.ENABLE_PUBLIC_CHAT = original;
  }
});

test("production health includes staff authentication readiness", async () => {
  const source = await readFile(new URL("../server/app.mjs", import.meta.url), "utf8");
  assert.match(source, /teamAuthReady/);
  assert.match(source, /!process\.env\.VERCEL \|\| teamAuthReady/);
});
