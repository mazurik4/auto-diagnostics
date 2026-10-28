#!/usr/bin/env python3
"""
Збирає статичні сторінки «Наші роботи» з постів Google-профілю.

Що робить:
  1. Бере всі пости з бекенда (GET /api/news/archive) — повний текст, дата, фото.
  2. Для кожного поста створює сторінку roboty/<slug>.html і кладе фото в roboty/img/.
  3. Створює архів roboty/index.html, roboty/links.json (куди вести картки каруселі
     на головній) і оновлює sitemap.xml. Сторінки видалених/прихованих постів прибирає.

Сторінки — звичайний HTML без JavaScript-підвантаження, тому Google читає текст одразу.
Запускається автоматично з GitHub Actions (див. .github/workflows/build-news.yml),
вручну — так:  python3 tools/build_news.py
Шапка й підвал сторінок — спільні шаблони в tools/templates/, їх же використовуватимуть
майбутні сторінки сайту.
"""

import argparse
import html
import json
import re
import time
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "tools" / "templates"
API_URL = "https://backend-cmr4.onrender.com"
SITE_URL = "https://autoworkshop.com.ua"
SECTION = "roboty"
GBP_URL = "https://www.google.com/maps?cid=15792600053340114773"

MONTHS = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня",
          "серпня", "вересня", "жовтня", "листопада", "грудня"]

# Транслітерація за постановою КМУ №55 (як у закордонних паспортах), спрощено для адрес сторінок.
TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "h", "ґ": "g", "д": "d", "е": "e", "є": "ie", "ж": "zh",
    "з": "z", "и": "y", "і": "i", "ї": "i", "й": "i", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "shch", "ь": "", "ю": "iu", "я": "ia", "ʼ": "", "'": "", "’": "",
    "ы": "y", "э": "e", "ё": "e", "ъ": "",
}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def slugify(text: str, limit: int = 60) -> str:
    out = "".join(TRANSLIT.get(ch, ch) for ch in text.lower())
    out = re.sub(r"[^a-z0-9]+", "-", out).strip("-")
    if len(out) > limit:
        out = out[:limit].rsplit("-", 1)[0]
    return out or "robota"


def human_date(iso: str) -> str:
    d = datetime.fromisoformat(iso[:19])
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def cut_words(text: str, limit: int) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",.;:—-– ") + "…"


def split_post(text: str):
    """Заголовок — перший рядок поста, якщо він короткий; інакше перше речення."""
    text = text.strip()
    first, _, rest = text.partition("\n")
    first = first.strip()
    if 10 <= len(first) <= 120 and rest.strip():
        return first.rstrip("."), rest.strip()
    return cut_words(re.split(r"(?<=[.!?])\s", text, 1)[0], 90).rstrip("."), text


def paragraphs(body: str) -> str:
    parts = [p.strip() for p in re.split(r"\n\s*\n|\n", body) if p.strip()]
    return "\n".join(f"<p>{esc(p)}</p>" for p in parts)


def render(name: str, **values) -> str:
    """Підставляє {{ключ}} у шаблон. Значення вже мають бути екрановані."""
    tpl = (TEMPLATES / name).read_text(encoding="utf-8")
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(values.get(m.group(1), "")), tpl)


def page(ctx, *, title, description, canonical, body, og_image, jsonld, nav_active=""):
    """Загальний каркас сторінки: head + спільна шапка + вміст + спільний підвал."""
    nav = render("header.html", site=ctx["site"], active_roboty=' class="active" aria-current="page"' if nav_active == "roboty" else "")
    foot = render("footer.html", site=ctx["site"], year=str(datetime.now().year))
    return render(
        "layout.html",
        title=esc(title), description=esc(description), canonical=esc(canonical),
        og_image=esc(og_image), jsonld=jsonld, assets=ctx["assets"],
        header=nav, footer=foot, body=body, extra_head=ctx.get("extra_head", ""),
    )


def card(post, href_prefix) -> str:
    return render(
        "card.html",
        href=esc(href_prefix + post["file"]), img=esc(post["thumb_src"]), alt=esc(post["alt"]),
        date_iso=post["created_at"][:10], date=esc(post["date"]), title=esc(post["title"]),
        excerpt=esc(cut_words(post["body"], 170)),
    )


def jpeg_size(data: bytes):
    """Ширина й висота JPEG без сторонніх бібліотек (читаємо заголовок SOF)."""
    i = 2
    while i + 9 < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
        i += 2 + int.from_bytes(data[i + 2:i + 4], "big")
    return 0, 0


def prepare(posts, ctx):
    """Заголовок, текст, адреса сторінки й фото для кожного поста."""
    used = set()
    for p in posts:
        p["title"], p["body"] = split_post(p["text"])
        slug = slugify(p["title"])
        if slug in used:
            slug = f"{slug}-{p['created_at'][:10]}"
        used.add(slug)
        p["slug"], p["file"] = slug, ctx["page_name"](slug)
        p["date"] = human_date(p["created_at"])
        p["alt"] = cut_words(p["title"], 110)
        p["img_src"] = ctx["img_src"](p)
        p["thumb_src"] = ctx["thumb_src"](p)


def build(posts, out_dir: Path, ctx):
    out_dir.mkdir(parents=True, exist_ok=True)
    if "slug" not in posts[0]:
        prepare(posts, ctx)

    # --- сторінка кожної роботи ---
    for i, p in enumerate(posts):
        others = [q for q in posts if q is not p][:3]
        url = f"{SITE_URL}/{SECTION}/{p['slug']}.html"
        img_abs = f"{SITE_URL}/{SECTION}/img/{p['slug']}.jpg"
        jsonld = json.dumps([
            {
                "@context": "https://schema.org", "@type": "BlogPosting",
                "headline": p["title"][:110], "description": cut_words(p["body"], 160),
                "datePublished": p["created_at"][:19], "image": img_abs, "url": url,
                "inLanguage": "uk",
                "author": {"@type": "Organization", "name": "Автоелектрик Київ", "url": SITE_URL + "/"},
                "publisher": {"@type": "AutoRepair", "name": "Автоелектрик Київ", "url": SITE_URL + "/",
                              "telephone": "+380954851166"},
            },
            {
                "@context": "https://schema.org", "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Головна", "item": SITE_URL + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Наші роботи", "item": f"{SITE_URL}/{SECTION}/"},
                    {"@type": "ListItem", "position": 3, "name": p["title"], "item": url},
                ],
            },
        ], ensure_ascii=False, indent=1)
        body = render(
            "post.html",
            site=ctx["site"], archive=ctx["archive_href"], title=esc(p["title"]),
            date_iso=p["created_at"][:10], date=esc(p["date"]), img=esc(p["img_src"]), alt=esc(p["alt"]),
            img_w=str(p.get("img_w") or 1200), img_h=str(p.get("img_h") or 900),
            text=paragraphs(p["body"]), gbp=esc(p.get("url") or GBP_URL),
            others="\n".join(card(q, "") for q in others),
        )
        (out_dir / p["file"]).write_text(page(
            ctx, title=f"{p['title']} — Автоелектрик Київ", description=cut_words(p["body"], 155),
            canonical=url, body=body, og_image=img_abs, jsonld=jsonld, nav_active="roboty",
        ), encoding="utf-8")

    # --- архів ---
    jsonld = json.dumps({
        "@context": "https://schema.org", "@type": "CollectionPage", "name": "Наші роботи",
        "url": f"{SITE_URL}/{SECTION}/", "inLanguage": "uk",
        "hasPart": [{"@type": "BlogPosting", "headline": p["title"][:110],
                     "url": f"{SITE_URL}/{SECTION}/{p['slug']}.html"} for p in posts],
    }, ensure_ascii=False, indent=1)
    body = render("archive.html", count=str(len(posts)), cards="\n".join(card(p, "") for p in posts))
    (out_dir / ctx["archive_file"]).write_text(page(
        ctx, title="Наші роботи — реальні випадки з майстерні | Автоелектрик Київ",
        description="Реальні випадки з нашої майстерні: діагностика й ремонт автоелектрики, "
                    "що було несправно і як ми знайшли причину. Автоелектрик Київ, вул. Гуцульська 97А.",
        canonical=f"{SITE_URL}/{SECTION}/", body=body, og_image=f"{SITE_URL}/img/og-image.jpg",
        jsonld=jsonld, nav_active="roboty",
    ), encoding="utf-8")
    return posts


def fetch(url: str, timeout: int = 90) -> bytes:
    # бекенд на безкоштовному Render може спати — даємо йому кілька спроб прокинутися
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=timeout) as r:
                return r.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(10 * (attempt + 1))
    raise RuntimeError(f"не вдалося завантажити {url}: {last}")


def save_images(posts, out_dir: Path, fetcher):
    """
    Фото кладемо на сам сайт: так вони швидкі й індексуються Google разом зі сторінкою.
    Щоразу звіряємо з бекендом і перезаписуємо лише змінені (напр. фото перекачане в кращій якості).
    """
    img_dir = out_dir / "img"
    (img_dir / "thumb").mkdir(parents=True, exist_ok=True)
    for p in posts:
        # повне фото — для сторінки роботи, зменшена копія 640 px — для карток
        for target, data in (
            (img_dir / f"{p['slug']}.jpg", fetcher(p, "")),
            (img_dir / "thumb" / f"{p['slug']}.jpg", fetcher(p, "640")),
        ):
            if not target.exists() or target.read_bytes() != data:
                target.write_bytes(data)
        p["img_w"], p["img_h"] = jpeg_size((img_dir / f"{p['slug']}.jpg").read_bytes())


def remove_stale(posts, out_dir: Path, archive_file: str):
    """Пост приховали в адмінці або змінили заголовок — стара сторінка й фото зникають."""
    pages = {p["file"] for p in posts} | {archive_file}
    images = {f"{p['slug']}.jpg" for p in posts}
    for f in out_dir.glob("*.html"):
        if f.name not in pages:
            f.unlink()
    for f in list((out_dir / "img").glob("*.jpg")) + list((out_dir / "img" / "thumb").glob("*.jpg")):
        if f.name not in images:
            f.unlink()


def write_links(posts, out_dir: Path):
    """id новини -> адреса її сторінки; за цим файлом карусель на головній веде на сайт, а не в Google."""
    links = {str(p["id"]): f"{SECTION}/{p['file']}" for p in posts}
    (out_dir / "links.json").write_text(json.dumps(links, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def update_sitemap(posts, sitemap: Path):
    """Залишає в sitemap.xml усі інші сторінки як є і заново дописує сторінки розділу."""
    text = sitemap.read_text(encoding="utf-8")
    keep = [u for u in re.findall(r"<url>.*?</url>", text, flags=re.S) if f"/{SECTION}/" not in u]
    def entry(loc, lastmod, freq, prio):
        return (f"<url>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n"
                f"    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>")
    newest = max(p["created_at"][:10] for p in posts)
    ours = [entry(f"{SITE_URL}/{SECTION}/", newest, "weekly", "0.8")]
    ours += [entry(f"{SITE_URL}/{SECTION}/{p['file']}", p["created_at"][:10], "monthly", "0.6") for p in posts]
    body = "\n  ".join(keep + ours)
    sitemap.write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  {body}\n</urlset>\n",
        encoding="utf-8",
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", help="взяти пости з файлу замість бекенда (для перевірки)")
    args = ap.parse_args()
    if args.json:
        posts = json.loads(Path(args.json).read_text(encoding="utf-8"))
    else:
        posts = json.loads(fetch(API_URL + "/api/news/archive"))
    if not posts:
        # порожня відповідь — швидше збій, ніж «усе видалили»; сайт не чіпаємо
        raise SystemExit("Бекенд не повернув жодного поста — нічого не змінюю.")
    posts.sort(key=lambda p: (p["created_at"], p["id"]), reverse=True)
    out = ROOT / SECTION
    ctx = {
        "site": "../", "assets": "../", "archive_href": "./", "archive_file": "index.html",
        "page_name": lambda slug: f"{slug}.html",
        "img_src": lambda p: f"img/{p['slug']}.jpg",
        "thumb_src": lambda p: f"img/thumb/{p['slug']}.jpg",
        "extra_head": (TEMPLATES / "analytics.html").read_text(encoding="utf-8"),
    }
    prepare(posts, ctx)
    def photo(p, width):
        url = API_URL + p["image_url"]
        return fetch(url + ("&" if "?" in url else "?") + f"w={width}" if width else url)
    save_images(posts, out, photo)
    build(posts, out, ctx)
    remove_stale(posts, out, ctx["archive_file"])
    write_links(posts, out)
    update_sitemap(posts, ROOT / "sitemap.xml")
    print(f"Готово: {len(posts)} робіт у {out}")


if __name__ == "__main__":
    main()
