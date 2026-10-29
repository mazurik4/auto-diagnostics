#!/usr/bin/env python3
"""Оновлює шапку й підвал на всіх сторінках у корені сайту (див. tools/site_chrome.py)."""
from pathlib import Path

from site_chrome import inject

ROOT = Path(__file__).resolve().parent.parent

if __name__ == "__main__":
    changed = [p.name for p in sorted(ROOT.glob("*.html")) if inject(p)]
    print("Оновлено:", ", ".join(changed) if changed else "нічого")
