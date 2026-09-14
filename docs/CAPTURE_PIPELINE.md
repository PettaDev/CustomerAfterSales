# Capture pipeline
Migrated from MobileQA RC3 functions Resolve-Platform, Refresh-Device, Start-Capture, Stop-Capture and Test-LocalMp4. See REUSE_MATRIX.md.

START: runtime integrity → authorized serial → platform properties → reject unknown platform → reject existing screenrecord → confirm YLog started if SPD → unique session/remote path → start exact MTK logger → screenrecord → identify exactly one new PID → verify command ownership → persist metadata.

STOP: verify owned PID path → SIGINT only that PID → wait for recording completion → for SPD pause for manual YLog stop → for MTK exact STOP broadcast → settle logs → verify stable positive remote size → pull video → parse ftyp/moov/mdat boxes and compare size → SHA-256 → remove only validated remote video → pull logger with up to three transient-file retries → metadata → ZIP.

Monitor: poll authorized device and PID. Disconnect or unexpected process exit triggers controlled finalization and creates failure metadata/partial ZIP. Restart restores sessions and marks unfinished captures interrupted so they can be recovered. Successful uploads never delete local packages. Upload is separate from capture finalization.

A rotating-file pull failure is marked partial. Unknown/missing/corrupt video is never labeled complete. Engine and portal expose interrupted/partial/failed separately from complete. Native screenrecord duration limits still apply and produce an interrupted capture rather than a fabricated success.

Technical reference: https://github.com/Genymobile/scrcpy (official release 4.1 at source review).
