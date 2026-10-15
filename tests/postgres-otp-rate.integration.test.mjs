import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

test("PostgreSQL OTP cooldown and atomic rate limits (real Postgres, no production connection)", {
  skip: !process.env.PG_TEST_DATABASE_URL && "Requires ephemeral CI PostgreSQL service",
}, async () => {
  const connection = process.env.PG_TEST_DATABASE_URL;
  if (process.env.VERCEL) throw new Error("Integration tests must not run in a Vercel deployment");
  process.env.DATABASE_URL = connection;
  const db = await import("../server/store.mjs?postgres-otp-integration");
  const postgres = (await import("postgres")).default;
  const sql = postgres(connection, { max: 1 });
  const prefix = "brte-test-" + randomUUID();
  const otpKey = prefix + "-otp";
  const otherKey = prefix + "-case";
  const now = 1_900_000_000_000;

  try {
    const opts = { max: 3, windowMs: 900_000, cooldownMs: 60_000 };
    // Checks the production PostgreSQL SQL statement, including ON CONFLICT
    // and jsonb_build_object parameter types. SQLite cannot catch SQLSTATE 42P18.
    assert.equal(await db.consumeRate(otpKey, { ...opts, now }), true);
    assert.deepEqual(await db.get(otpKey), {
      count: 1, until: now + opts.windowMs, lastAt: now,
    });
    assert.equal(await db.consumeRate(otpKey, { ...opts, now: now + 1_000 }), false);
    assert.equal(await db.consumeRate(otpKey, { ...opts, now: now + 60_000 }), true);
    assert.equal(await db.consumeRate(otpKey, { ...opts, now: now + 120_000 }), true);
    assert.equal(await db.consumeRate(otpKey, { ...opts, now: now + 180_000 }), false);
    assert.deepEqual(await db.get(otpKey), {
      count: 3, until: now + opts.windowMs, lastAt: now + 120_000,
    });
    assert.equal(await db.consumeRate(otpKey, { ...opts, now: now + 900_000 }), true);

    const parallel = await Promise.all(Array.from({ length: 12 }, () =>
      db.consumeRate(otherKey, { max: 2, windowMs: 60_000, now }),
    ));
    assert.equal(parallel.filter(Boolean).length, 2);
    assert.equal(parallel.filter(value => !value).length, 10);
    assert.deepEqual(await db.get(otherKey), {
      count: 2, until: now + 60_000, lastAt: now,
    });
  } finally {
    // CI uses an isolated, throwaway Postgres service. Clean up test rows anyway.
    await sql`DELETE FROM records WHERE id IN (${otpKey}, ${otherKey})`;
    await sql.end({ timeout: 5 });
  }
});

test("OTP diagnostics redact sensitive values and error styles remain legible", async () => {
  const [store, app, email, css] = await Promise.all([
    "../server/store.mjs", "../server/app.mjs",
    "../server/email.mjs", "../src/portal/portal.css",
  ].map(path => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(store, /'lastAt',\s*\$\{now\}::bigint/);
  assert.match(app, /\[BRTE\] request failed/);
  assert.match(app, /sqlState/);
  assert.doesNotMatch(app, /console\.error\([^\n]*err\.message/);
  assert.match(email, /\[BRTE\] OTP email provider rejected request/);
  assert.match(css, /\.portal \.error\s*\{\s*\/\*[^]*?color:\s*#8b1e2d/i);
});
