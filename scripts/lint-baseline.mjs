// Existing lint debt is recorded per file to prevent regressions without hiding
// an ESLint failure behind GitHub Actions' continue-on-error. Reducing the
// baseline after each refactor is required before the corporate release.
import { ESLint } from "eslint";
import { relative } from "node:path";

const baseline = {
  "src/portal/BrowserCapture.tsx": [
    14,
    1
  ],
  "src/portal/Capture.tsx": [
    5,
    1
  ],
  "src/portal/Cases.tsx": [
    6,
    0
  ],
  "src/portal/Customer.tsx": [
    2,
    0
  ],
  "src/portal/CustomerFlow.tsx": [
    2,
    0
  ],
  "src/portal/CustomerIntl.tsx": [
    6,
    0
  ],
  "src/portal/CustomerIntlV2.tsx": [
    4,
    0
  ],
  "src/portal/HardwareCollection.tsx": [
    0,
    1
  ],
  "src/portal/api.ts": [
    1,
    0
  ],
  "src/portal/mediatek-debuglogger.ts": [
    11,
    0
  ],
  "src/portal/qualcomm-tranlog.ts": [
    16,
    0
  ]
};
const eslint = new ESLint();
const results = await eslint.lintFiles(".");
let failed = false;
let errors = 0;
let warnings = 0;

for (const result of results) {
  const path = relative(process.cwd(), result.filePath).replaceAll("\\", "/");
  errors += result.errorCount;
  warnings += result.warningCount;
  const [maxErrors, maxWarnings] = baseline[path] ?? [0, 0];
  if (result.errorCount > maxErrors || result.warningCount > maxWarnings || result.fatalErrorCount > 0) {
    failed = true;
    console.error("New lint debt in " + path + ": " + result.errorCount + " errors / " + result.warningCount + " warnings; baseline " + maxErrors + "/" + maxWarnings);
    for (const m of result.messages) console.error("  line " + m.line + ": " + m.ruleId + " " + m.message);
  }
}
console.log("Lint non-regression gate: " + errors + " errors, " + warnings + " warnings (historical maximum: 67/3).");
if (failed) process.exitCode = 1;
