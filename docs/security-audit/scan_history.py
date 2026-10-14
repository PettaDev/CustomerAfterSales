#!/usr/bin/env python3
"""Fail when common live-secret formats appear in Git history or the built frontend.

This intentionally targets high-confidence credential formats instead of generic words such
as `token` or environment-variable names, which would create false positives in source code.
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys

PATTERNS = {
    "Google API key": re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    "AWS access key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "GitHub token": re.compile(r"gh[pousr]_[0-9A-Za-z]{30,}"),
    "Private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "PostgreSQL URL with password": re.compile(r"postgres(?:ql)?://[^\s:@/]+:[^\s@/]+@", re.I),
    "Generic JWT": re.compile(r"eyJ[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{8,}"),
}


def matches(text: str):
    found = []
    for name, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            found.append((name, match.start(), match.group(0)[:16] + "…"))
    return found


def scan_history() -> list[tuple[str, int, str]]:
    proc = subprocess.run(
        ["git", "log", "-p", "--all", "--", ".", ":!package-lock.json"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        errors="replace",
    )
    return matches(proc.stdout)


def scan_bundle() -> list[tuple[str, str, int, str]]:
    results = []
    dist = pathlib.Path("dist")
    if not dist.exists():
        return results
    for path in dist.rglob("*"):
        if not path.is_file() or path.stat().st_size > 8_000_000:
            continue
        try:
            text = path.read_text("utf-8")
        except UnicodeDecodeError:
            continue
        for name, pos, sample in matches(text):
            results.append((name, str(path), pos, sample))
    return results


def main() -> int:
    history = scan_history()
    bundle = scan_bundle()
    if history or bundle:
        print("Potential live secrets detected:")
        for item in history:
            print("history:", item)
        for item in bundle:
            print("bundle:", item)
        return 1
    print("Secret scan: no high-confidence credential formats found in Git history or dist/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
