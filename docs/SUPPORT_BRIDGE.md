# Support Bridge — Windows validation setup
Owner: Gustavo / PettaDev

## Requirements
- Windows, Node.js 24 LTS-compatible runtime.
- Existing extracted MobileQA RC3 distribution supplied by the project owner. Do not use the uploaded archive's Captures directory as deploy content.
- The Bridge validates every SCRCPY runtime file against the RC3 SHA-256 manifest before execution. Paths always resolve to SCRCPY/adb.exe and SCRCPY/scrcpy.exe; no fallback to another ADB.

## Run
```powershell
git clone https://github.com/PettaDev/CustomerAfterSales.git
cd CustomerAfterSales
npm ci
Copy-Item .env.example .env
```
Edit .env:
```dotenv
APP_ORIGIN=https://YOUR-ACTUAL-VERCEL-DOMAIN
MOBILEQA_RUNTIME=C:/Tools/MobileQA_Tool_v1.0_RC3
```
APP_ORIGIN must exactly match the portal's scheme/hostname, without trailing slash. For local development use http://localhost:5173 and open the portal with that exact URL.

```powershell
npm run bridge
```
Open /capture in the portal and paste the per-run connection code printed in the local terminal. This is not the case access code. It changes each time the Bridge restarts. The customer then explicitly authorizes screen/log collection.

Native scrcpy opens a separate window titled Visualização do seu celular. It is not embedded in the web page. Runtime Windows/USB behavior and browser HTTPS-to-loopback permission need real-device qualification. Do not relax origin/host checks or disable browser protections to make pairing work.

## Limits
Source-run validation package; signed one-click Windows installer not yet produced. No remote control over the internet. Local capture packages remain in .local/captures, including after upload, until deliberately removed by the operator. Multiple sessions are supported, with at most one active capture per device. The same case may have multiple sessions.
