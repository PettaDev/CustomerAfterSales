import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root=path=>readFile(new URL("../"+path,import.meta.url),"utf8");
test("ADB and diagnostic ZIP collection load only reviewed, locally bundled packages",async()=>{
 const [capture,mtk,qualcomm,pkg,lock]=await Promise.all([
  root("src/portal/BrowserCapture.tsx"),root("src/portal/mediatek-debuglogger.ts"),
  root("src/portal/qualcomm-tranlog.ts"),root("package.json"),root("package-lock.json"),
 ]);
 const dependencies=JSON.parse(pkg).dependencies,packages=JSON.parse(lock).packages;
 for(const [name,version] of [
   ["@yume-chan/adb","2.1.0"],
   ["@yume-chan/adb-daemon-webusb","2.1.0"],
   ["@yume-chan/adb-credential-web","2.1.0"],
   ["fflate","0.8.3"],
 ]) {
   assert.equal(dependencies[name],version);
   assert.equal(packages["node_modules/"+name].version,version);
 }
 for(const [file,code] of [["capture",capture],["mtk",mtk],["qualcomm",qualcomm]]) {
   assert.doesNotMatch(code,/cdn\.jsdelivr\.net|remoteImport\(|@vite-ignore/,"Remote JS in "+file);
 }
 assert.match(capture,/import\("@yume-chan\/adb"\)/);
 assert.match(capture,/import\("@yume-chan\/adb-daemon-webusb"\)/);
 assert.match(capture,/import\("@yume-chan\/adb-credential-web"\)/);
 assert.match(mtk,/import\("fflate"\)/);
 assert.match(qualcomm,/import\("fflate"\)/);
});
