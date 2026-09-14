# Reuse matrix — Gustavo / PettaDev

Source review performed before implementation. Customer Guide reference: branch agent/transsion-log-guide, commit d11db7bcbc0543e955b723ea326ee838b6118e13. MobileQA RC3 source supplied by product owner. Requirements supplied in Texto colado(1).txt.

| Component | Source | Decision | Reason |
|---|---|---|---|
| React/TypeScript + Vite | CustomersGuide | REUSE | Preserve browser architecture; add Node.js API |
| Brand themes and marks | CustomersGuide src/themes | REUSE | Brand colors already defined |
| i18n, guide JSON, screenshots/videos | CustomersGuide | MIGRATE | Keep complete guided fallback and language resources |
| Wizard | CustomersGuide MethodPage | REFACTOR | Add device/problem/evidence/case steps |
| Guide rendering | CustomersGuide | REUSE | Existing blocks and instructions remain available |
| AI assistant | CustomersGuide api/chat.ts | REFACTOR | Optional provider; must not claim device access or use brand for logger routing |
| Device/platform detection | MobileQA Resolve-Platform, Refresh-Device | MIGRATE | Node.js local bridge with same property precedence |
| Capture orchestration | MobileQA START/STOP | MIGRATE | Exact logger commands, owned PID, MP4 validation and partial recovery |
| YLog | MobileQA | REUSE | Manual start before video; stop video before manual stop confirmation |
| WPF embedded mirror | MobileQA | REPLACE | Native scrcpy window launched by local bridge |
| Runtime binaries | MobileQA | REUSE | Refer to existing verified SCRCPY runtime; never publish attached captures |
| Case API, authentication, storage | — | NEW | Separate customer access and TFAE session; persistent backend |
| Multiple capture sessions and upload | — | NEW | Each capture belongs to a case and has independent lifecycle |
| Public archive captures/error logs | MobileQA ZIP | REMOVE | Runtime evidence is not product source or deploy content |

## Source findings
- MobileQA is Windows PowerShell 5.1/WPF, with exact ownership verification in /proc/PID/cmdline.
- Unknown platforms block START; logger selection never derives from device brand.
- MTK uses /data/debuglogger and exact com.debug.loggerui.ADB_CMD broadcasts.
- SPD/UNISOC uses /data/ylog with manual confirmations.
- MP4 validation parses box lengths, ftyp, moov and mdat; mere string matching is insufficient.
- Remote size must stabilize and match local size; hash recorded before remote deletion.
- Logger pull retries rotating files three times; incomplete evidence must not be shown as complete.
- Customer Guide supports seven languages, country selection, brand themes, guided PC and Android 11+ wireless fallback, translated screenshots and videos.
- Existing assistant contains blanket MTK instructions and an escalation WhatsApp address; the new portal must contextualize platform and escalate through cases.
- Native PowerShell tests cannot run here because Windows/WPF and PowerShell are unavailable. Regression fixtures will exercise migrated Node.js logic; physical-device acceptance remains required.
- Published Customer Guide could not be retrieved through web fetch; repository assets and code were inspected directly.
