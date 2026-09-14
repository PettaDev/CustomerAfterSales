import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  resolvePlatform,
  parseDevices,
  ownedPID,
  loggerArgs,
  validateMP4,
  CaptureEngine,
} from "../bridge/core.mjs";
test("logger routing follows SoC, never brand", () => {
  assert.equal(resolvePlatform({ board: "mt6877" }), "MTK");
  assert.equal(resolvePlatform({ soc: "UNISOC", board: "ums9230" }), "SPD");
  assert.equal(resolvePlatform({ soc: "sp9863a" }), "SPD");
  assert.equal(resolvePlatform({ brand: "Infinix" }), "UNKNOWN");
});
test("authorized, unauthorized and offline devices stay distinct", () =>
  assert.deepEqual(
    parseDevices(
      "List of devices attached\nA device product:test\nB unauthorized\nC offline\n",
    ),
    [
      { serial: "A", state: "device" },
      { serial: "B", state: "unauthorized" },
      { serial: "C", state: "offline" },
    ],
  ));
test("ambiguous or missing PID cannot be killed", () => {
  assert.equal(ownedPID(["100"], ["100", "245"]), "245");
  assert.throws(() => ownedPID(["100"], ["100"]));
  assert.throws(() => ownedPID(["100"], ["100", "245", "246"]));
});
test("exact validated DebugLogger receiver and command are preserved", () =>
  assert.deepEqual(loggerArgs("stop"), [
    "shell",
    "am",
    "broadcast",
    "-a",
    "com.debug.loggerui.ADB_CMD",
    "-e",
    "cmd_name",
    "stop",
    "--ei",
    "cmd_target",
    "-1",
    "-n",
    "com.debug.loggerui/.framework.LogReceiver",
  ]));
test("MP4 parser rejects text markers and truncated containers", async () => {
  const dir = await mkdtemp(tmpdir() + "/mp4-");
  try {
    const box = (t, p) => {
      const b = Buffer.alloc(8 + p.length);
      b.writeUInt32BE(b.length);
      b.write(t, 4);
      p.copy(b, 8);
      return b;
    };
    const valid = Buffer.concat([
      box("ftyp", Buffer.from("isom")),
      box("mdat", Buffer.alloc(1024)),
      box("moov", Buffer.alloc(4)),
    ]);
    await writeFile(dir + "/v.mp4", valid);
    assert.equal(await validateMP4(dir + "/v.mp4"), true);
    await writeFile(dir + "/v.mp4", valid.subarray(0, -3));
    assert.equal(await validateMP4(dir + "/v.mp4"), false);
    await writeFile(dir + "/v.mp4", "not a video ftyp moov mdat");
    assert.equal(await validateMP4(dir + "/v.mp4"), false);
  } finally {
    await rm(dir, { recursive: true });
  }
});
test("STOP refuses a reused PID belonging to another recording", async () => {
  const calls = [];
  const e = new CaptureEngine({
    run: async (args) => {
      calls.push(args);
      return "screenrecord /sdcard/another.mp4";
    },
  });
  await assert.rejects(
    e.stopVideo({
      pid: "120",
      remoteVideo: "/sdcard/own.mp4",
      device: { serial: "A" },
    }),
    /outro processo/,
  );
  assert.equal(
    calls.some((c) => c.includes("kill")),
    false,
  );
});
test("unauthorized device cannot start capture", async () => {
  const e = new CaptureEngine({ run: async () => "A unauthorized" });
  await assert.rejects(e.start("A", true), /autorize/);
  assert.equal(e.busy.size, 0);
});
test("YLog confirmation precedes video and logger commands", async () => {
  const calls = [];
  const e = new CaptureEngine({
    run: async (args) => {
      calls.push(args);
      return args.includes("devices")
        ? "A device"
        : "[ro.board.platform]: [ums9230]";
    },
  });
  await assert.rejects(e.start("A", false), /YLog/);
  assert.equal(
    calls.some((c) => c.includes("screenrecord") || c.includes("broadcast")),
    false,
  );
});
test("unknown platform blocks capture without starting logger", async () => {
  const e = new CaptureEngine({
    run: async (args) =>
      args.includes("devices") ? "A device" : "[ro.board.platform]: [unknown]",
  });
  await assert.rejects(e.start("A", false), /sem suporte/);
});
test("YLog STOP finalizes video before asking for manual logger stop", async () => {
  const dir = await mkdtemp(tmpdir() + "/ylog-");
  try {
    const e = new CaptureEngine({
      root: dir,
      run: async () => "",
      pause: async () => {},
    });
    let stopped = false;
    e.stopVideo = async () => {
      stopped = true;
    };
    const s = {
      id: "test-ylog",
      status: "recording",
      device: { serial: "A", platform: "SPD" },
      startedAt: new Date().toISOString(),
    };
    e.sessions.set(s.id, s);
    e.busy.add("A");
    const r = await e.stop(s.id);
    assert.equal(stopped, true);
    assert.equal(r.status, "awaiting_ylog_stop");
    assert.equal(e.busy.has("A"), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("interrupted capture preserves failure metadata and a partial package", async () => {
  const dir = await mkdtemp(tmpdir() + "/partial-");
  try {
    const e = new CaptureEngine({
      root: dir,
      run: async () => {
        throw Error("disconnected");
      },
      pause: async () => {},
    });
    const s = {
      id: "test-failure",
      pid: "100",
      remoteVideo: "/sdcard/own.mp4",
      status: "recording",
      device: { serial: "A", platform: "MTK" },
      startedAt: new Date().toISOString(),
    };
    e.sessions.set(s.id, s);
    e.busy.add("A");
    await e.persist(s);
    const r = await e.stop(s.id);
    assert.equal(r.status, "failed");
    assert.ok(r.packagePath.endsWith(".zip"));
    assert.equal(e.busy.has("A"), false);
    const { readFile } = await import("node:fs/promises");
    assert.equal(
      JSON.parse(await readFile(dir + "/test-failure/failure.json"))
        .remoteVideoPreserved,
      true,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
