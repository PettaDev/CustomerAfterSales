import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as db from "../server/store.mjs";

test("rate limits are atomic under simultaneous requests and do not extend blocked windows", async () => {
  const old = process.cwd();
  const oldDb = process.env.DATABASE_URL;
  const oldVercel = process.env.VERCEL;
  const dir = await mkdtemp(tmpdir() + "/brte-atomic-rate-");
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.chdir(dir);
  try {
    const at = 1_900_000_000_000;
    const requests = await Promise.all(
      Array.from({ length: 80 }, () =>
        db.consumeRate("case-rate-atomic-test", { max: 10, windowMs: 60_000, now: at }),
      ),
    );
    assert.equal(requests.filter(Boolean).length, 10);
    assert.equal(requests.filter((ok) => !ok).length, 70);
    const stored = await db.get("case-rate-atomic-test");
    assert.deepEqual(stored, { count: 10, until: at + 60_000, lastAt: at });

    assert.equal(await db.consumeRate("case-rate-atomic-test", {
      max: 10, windowMs: 60_000, now: at + 59_999,
    }), false);
    assert.deepEqual(await db.get("case-rate-atomic-test"), stored, "blocked attempts cannot extend window");
    assert.equal(await db.consumeRate("case-rate-atomic-test", {
      max: 10, windowMs: 60_000, now: at + 60_000,
    }), true, "a new fixed window begins at expiry");
    assert.deepEqual(await db.get("case-rate-atomic-test"), {
      count: 1, until: at + 120_000, lastAt: at + 60_000,
    });
  } finally {
    process.chdir(old);
    if (oldDb === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldDb;
    if (oldVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = oldVercel;
    await rm(dir, { recursive: true, force: true });
  }
});

test("OTP cooldown is atomic, expires correctly and still observes max attempts", async () => {
  const at = 1_900_050_000_000;
  const key = "otp-rate-test";
  const settings = { max: 3, windowMs: 15 * 60_000, cooldownMs: 60_000 };
  assert.equal(await db.consumeRate(key, { ...settings, now: at }), true);
  const attempts = await Promise.all(
    Array.from({ length: 15 }, () => db.consumeRate(key, { ...settings, now: at + 1000 })),
  );
  assert.equal(attempts.filter(Boolean).length, 0);
  assert.equal((await db.get(key)).count, 1, "rejected cooldown does not consume quota");
  assert.equal(await db.consumeRate(key, { ...settings, now: at + 60_000 }), true);
  assert.equal(await db.consumeRate(key, { ...settings, now: at + 120_000 }), true);
  assert.equal(await db.consumeRate(key, { ...settings, now: at + 180_000 }), false);
  assert.equal(await db.consumeRate(key, { ...settings, now: at + settings.windowMs }), true);
});

test("all abuse-sensitive routes call the atomic limiter rather than read-modify-write", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);
  const enhanced = await readFile(new URL("server/app-enhanced.mjs", root), "utf8");
  const base = await readFile(new URL("server/app.mjs", root), "utf8");
  const store = await readFile(new URL("server/store.mjs", root), "utf8");
  assert.match(enhanced, /db\.consumeRate\(key, \{ max, windowMs \}\)/);
  assert.match(base, /db\.consumeRate\(key, \{/);
  assert.match(base, /db\.consumeRate\(key, \{ max: 10, windowMs:/);
  assert.match(store, /ON CONFLICT \(id\) DO UPDATE SET/);
  assert.match(store, /WHERE records\.kind = 'rate'/);
  assert.doesNotMatch(enhanced, /await db\.get\(key\)/, "customer rate keys may not use unsafe get/put pattern");
});

test("invalid limiter configuration fails closed", async () => {
  await assert.rejects(db.consumeRate("bad", { max: 0, windowMs: 10 }), TypeError);
  await assert.rejects(db.consumeRate("", { max: 1, windowMs: 10 }), TypeError);
  await assert.rejects(db.consumeRate("bad", { max: 1, windowMs: -1 }), TypeError);
  await assert.rejects(db.consumeRate("bad", { max: 1, windowMs: 10, cooldownMs: -1 }), TypeError);
});
