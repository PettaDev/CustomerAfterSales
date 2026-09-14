import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { scryptSync } from "node:crypto";
import app from "../server/app.mjs";
test("case/evidence lifecycle: validation, authorization, isolation, upload and staff updates", async () => {
  const cwd = process.cwd(),
    dir = await mkdtemp(tmpdir() + "/aftercare-");
  process.chdir(dir);
  process.env.STAFF_EMAIL = "tester@example.com";
  process.env.STAFF_PASSWORD_HASH =
    "test-salt:" +
    scryptSync("test-only-password", "test-salt", 64).toString("hex");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const call = (p, body, t, method = "POST", cookie) =>
    fetch(base + "/api" + p, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: "Bearer " + t } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  try {
    assert.equal((await call("/cases", {}, null)).status, 400);
    const body = {
      brand: "infinix",
      model: "Test model",
      category: "software",
      problem: "Camera closes unexpectedly",
      description: "Open camera and select video three times.",
      name: "Test User",
      email: "test@example.com",
      country: "Brasil",
      consent: true,
    };
    const r = await call("/cases", body);
    assert.equal(r.status, 201);
    const { case: c, accessToken } = await r.json();
    assert.equal(c.accessHash, undefined);
    assert.equal(
      (await call("/cases/" + c.id, undefined, "wrong", "GET")).status,
      403,
    );
    assert.equal(
      (await call("/cases/" + c.id, undefined, accessToken, "GET")).status,
      200,
    );
    assert.equal(
      (await call("/cases", undefined, accessToken, "GET")).status,
      401,
    );
    assert.equal(
      (
        await call(
          "/cases/" + c.id,
          { status: "resolved" },
          accessToken,
          "PATCH",
        )
      ).status,
      401,
    );
    const e = await (
      await call(
        "/cases/" + c.id + "/evidence",
        { name: "sample.txt", type: "text/plain", size: 5 },
        accessToken,
      )
    ).json();
    const up = await fetch(base + e.url, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + e.uploadToken,
        "Content-Type": "text/plain",
      },
      body: "hello",
    });
    assert.equal(up.status, 200);
    assert.equal(
      (await call("/evidence/" + e.id + "/complete", {}, accessToken)).status,
      200,
    );
    assert.equal(
      (await call("/evidence/" + e.id + "/download", undefined, "wrong", "GET"))
        .status,
      403,
    );
    const d = await call(
      "/evidence/" + e.id + "/download",
      undefined,
      accessToken,
      "GET",
    );
    assert.equal(await d.text(), "hello");
    const login = await call("/auth/login", {
      email: "tester@example.com",
      password: "test-only-password",
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal(
      (
        await call(
          "/cases/" + c.id,
          { status: "reviewing", note: "Analyzing evidence" },
          null,
          "PATCH",
          cookie,
        )
      ).status,
      200,
    );
    const detail = await (
      await call("/cases/" + c.id, undefined, accessToken, "GET")
    ).json();
    assert.equal(detail.case.status, "reviewing");
    assert.equal(detail.events.length, 1);
    await call("/auth/logout", {}, null, "POST", cookie);
    assert.equal(
      (await call("/cases", undefined, null, "GET", cookie)).status,
      401,
    );
  } finally {
    server.close();
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});
