# Verification
Run npm test and npm run build.

Automated tests: case validation, capability access, denial of unauthorized dashboard/status updates, upload/download, staff sign-in/logout, timeline; SoC routing, ADB state parsing, PID ambiguity, exact MTK broadcast, structural MP4 validation, PID reuse refusal, unauthorized/unknown-platform rejection, YLog ordering and failure evidence preservation.

Source validation: all 14 required components match original RC3 manifest hashes and sizes. See SOURCE_VALIDATION.json.

Native PowerShell/WPF tests were not executed (no PowerShell/Windows). No real USB device is attached. Node tests use deterministic inputs and injected ADB responses, and do not prove hardware compatibility.

## Required Windows acceptance
1. MTK device: authorization, model/build, mirror, START, reproduce, STOP, playable MP4, logs, valid ZIP.
2. UNISOC device: START blocked before YLog confirmation; STOP stops video before manual logger prompt.
3. Disconnect, unauthorized, screenrecord expiry, reused PID, rotating logger files, insufficient disk, failed pull.
4. Runtime corruption must block execution; unknown platforms must fail closed.
5. Two USB devices; two sequential captures for one case; concurrent captures on separate devices.
6. Restart Bridge mid-capture; recovery without killing other recordings.
7. HTTPS portal pairing under browser local-network permissions; upload, offline retry, large ZIP, private storage.
8. TFAE review and customer tracking with another case's token must remain isolated.
