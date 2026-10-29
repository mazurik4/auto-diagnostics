"""
Спільна шапка («Острів») і підвал для всіх сторінок сайту.

Розмітка — у tools/templates/header.html і footer.html. Сторінки, написані вручну
(index, poslugy, pro-nas, kontakty, gallery), мають у коді мітки
<!-- chrome:header --> … <!-- /chrome:header --> і <!-- chrome:footer --> … <!-- /chrome:footer -->:
між ними вміст щоразу замінюється свіжою шапкою/підвалом. Поточний пункт меню береться
з <body data-page="…">. Сторінки «Наші роботи» отримують те саме через build_news.py.

Після зміни меню чи підвалу:  python3 tools/build_site.py
"""

import re
from datetime import datetime
from pathlib import Path

TEMPLATES = Path(__file__).resolve().parent / "templates"
MENU_KEYS = ["poslugy", "roboty", "gallery", "pro_nas", "kontakty"]


def _fill(name: str, values: dict) -> str:
    tpl = (TEMPLATES / name).read_text(encoding="utf-8")
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(values.get(m.group(1), "")), tpl)


def header(site: str, current: str = "") -> str:
    current = current.replace("-", "_")
    values = {f"cur_{k}": (' aria-current="page"' if k == current else "") for k in MENU_KEYS}
    values["site"] = site
    return _fill("header.html", values).rstrip()


def footer(site: str) -> str:
    return _fill("footer.html", {"site": site, "year": datetime.now().year}).rstrip()


def replace_block(text: str, name: str, content: str) -> str:
    """Замінює все між <!-- name --> і <!-- /name --> (мітки лишаються)."""
    pattern = re.compile(rf"(<!-- {re.escape(name)} -->)(.*?)(<!-- /{re.escape(name)} -->)", re.S)
    if not pattern.search(text):
        raise ValueError(f"немає міток <!-- {name} -->")
    return pattern.sub(lambda m: f"{m.group(1)}\n{content}\n{m.group(3)}", text, count=1)


def inject(path: Path, site: str = "") -> bool:
    """Вставляє шапку й підвал у сторінку з мітками. Повертає True, якщо файл змінився."""
    text = path.read_text(encoding="utf-8")
    if "<!-- chrome:header -->" not in text:
        return False
    m = re.search(r'<body[^>]*\bdata-page="([^"]+)"', text)
    new = replace_block(text, "chrome:header", header(site, m.group(1) if m else ""))
    new = replace_block(new, "chrome:footer", footer(site))
    if new != text:
        path.write_text(new, encoding="utf-8")
        return True
    return False
