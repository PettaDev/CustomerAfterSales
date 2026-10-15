import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseYLogBounds, newYLogPaths, detectSpdYLog,
  SPD_LOG_ROOT, SPD_SWITCHES,
} from "../src/portal/spd-ylog.ts";

test("dynamic touch coordinates are calculated from live bounds, invalid positions rejected", () => {
  assert.deepEqual(parseYLogBounds("[12,44][112,144]"), { x: 62, y: 94 });
  assert.deepEqual(parseYLogBounds("[1,1][6,10]"), { x: 3, y: 5 });
  for (const input of ["[0,0][0,90]", "[200,10][10,50]", "100,200", "[0,0][99999,100]", null]) {
    assert.equal(parseYLogBounds(input), null);
  }
});

test("only newly created YLog files are added, old files and unsafe paths excluded", () => {
  const first = [
    SPD_LOG_ROOT + "/previous.ylog",
    SPD_LOG_ROOT + "/run/new.ylog",
    SPD_LOG_ROOT + "/run/new.ylog",
    SPD_LOG_ROOT + "/run/info.txt",
    SPD_LOG_ROOT + "/../other.ylog",
    "/sdcard/other.ylog",
  ];
  assert.deepEqual(newYLogPaths([SPD_LOG_ROOT + "/previous.ylog"], first), [
    SPD_LOG_ROOT + "/run/new.ylog",
  ]);
  assert.deepEqual(newYLogPaths([], []), []);
  assert.deepEqual([...SPD_SWITCHES], ["ap_log", "modem_log", "wcn_log", "other_log"]);
});

test("SPD detection requires both chipset evidence and installed YLog", async () => {
  const script = async (values) => detectSpdYLog({}, async (_adb, command) => {
    const cmd = command.join(" ");
    return values[cmd] || "";
  });
  assert.equal(await script({
    "getprop ro.soc.manufacturer": "UNISOC",
    "getprop ro.board.platform": "ums9230",
    "pm path com.sprd.logmanager": "package:/system/app/YLog.apk",
  }), true);
  assert.equal(await script({
    "getprop ro.hardware": "qcom",
    "pm path com.sprd.logmanager": "package:/system/app/YLog.apk",
  }), false);
  assert.equal(await script({
    "getprop ro.hardware": "sprd",
  }), false);
});

test("BRTE WebUSB connects YLog start/stop, fresh-file ZIP and preserves Qualcomm/MTK paths", async () => {
  const read = file => readFile(new URL("../" + file, import.meta.url), "utf8");
  const [browser, ylog, qcom, mtk] = await Promise.all([
    read("src/portal/BrowserCapture.tsx"),
    read("src/portal/spd-ylog.ts"),
    read("src/portal/qualcomm-tranlog.ts"),
    read("src/portal/mediatek-debuglogger.ts"),
  ]);
  assert.match(browser, /detectSpdYLog\(adb, shell\)/);
  assert.match(browser, /spdCapableRef\.current = spdCapable/);
  assert.match(browser, /spdBaselineRef\.current = await startSpdYLog\(adb, shell\)/);
  assert.match(browser, /await stopSpdYLog\(adb, shell\)/);
  assert.match(browser, /pullSpdYLog\(adb, shell, readRemoteFile, spdBaselineRef\.current/);
  assert.match(browser, /"YLog \(SPD\/Unisoc\)"/);
  assert.match(browser, /oemLoggerRef\.current === "mediatek"/);
  assert.match(browser, /oemLoggerRef\.current === "qualcomm"/);
  assert.match(browser, /"ADB Logcat \(genérico\)"/);
  for (const marker of [
    "android:id/action_bar", 'getAttribute("resource-id")', 'getAttribute("bounds")',
    '"Custom"', '"uiautomator"', '"input", "tap"', '"checked"', '"start"', '"stop"',
    'await waitState(adb, shell, "running")', 'await waitState(adb, shell, "stopped")',
    "newYLogPaths(baseline", "MAX_TOTAL_BYTES", "MAX_FILE_BYTES", "MAX_FILES",
  ]) assert.ok(ylog.includes(marker), "missing YLog protection: " + marker);
  assert.ok(!ylog.includes('["find", SPD_LOG_ROOT, "-type", "f", "-delete"]'), "never delete existing YLog files");
  assert.match(qcom, /await sleep\(8000\)/);
  assert.match(qcom, /"android\.widget\.Switch"/);
  assert.match(mtk, /MTK_TARGET = 39/);
});
