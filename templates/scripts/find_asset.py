"""Find ready-made 3D models for an object a short needs, and make a numbered preview sheet to choose from.

Sources (free, no login needed to search):
  - Sketchfab: downloadable models under CC0 or CC BY (CC BY = credit the author in the video description).
    Downloading still needs the owner's own Sketchfab login (done by hand in the browser).
  - Poly Haven: CC0 models (direct glTF download, no login).

Usage:
  python tools/find_asset.py "police car" [--n 6] [--out shorts/_aset/cari]
Writes <out>/<slug>.jpg (numbered thumbnails) and <out>/<slug>.md (name, author, licence, triangles, page link,
credit line). Nothing is downloaded except the small preview thumbnails.
"""
import argparse, io, json, os, re, sys, urllib.parse, urllib.request
from PIL import Image, ImageDraw

UA = {"User-Agent": "asset-finder/1.0"}  # generic client name, no personal data


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        data = r.read()
    return data if binary else json.loads(data)


def sketchfab(term, n):
    q = urllib.parse.urlencode({"type": "models", "q": term, "downloadable": "true", "sort_by": "-likeCount", "count": 24})
    out = []
    for m in get(f"https://api.sketchfab.com/v3/search?{q}")["results"]:
        lic = (m.get("license") or {}).get("label", "")
        if lic not in ("CC Attribution", "CC0 Public Domain"):
            continue  # only licences that allow use in a monetised video without asking
        imgs = sorted(m["thumbnails"]["images"], key=lambda i: abs(i["width"] - 480))
        out.append({"src": "Sketchfab", "name": m["name"], "author": m["user"]["username"], "licence": "CC BY 4.0" if lic == "CC Attribution" else "CC0",
                    "tris": m.get("faceCount") or 0, "page": m["viewerUrl"], "thumb": imgs[0]["url"]})
        if len(out) >= n:
            break
    return out


def polyhaven(term, n):
    words = [w for w in term.lower().split() if len(w) > 2]
    out = []
    for slug, a in get("https://api.polyhaven.com/assets?t=models").items():
        text = " ".join([a.get("name", "")] + a.get("tags", []) + a.get("categories", [])).lower()
        if words and all(w in text for w in words):
            out.append({"src": "Poly Haven", "name": a["name"], "author": ", ".join(a.get("authors", {}).keys()), "licence": "CC0",
                        "tris": a.get("polycount", 0), "page": f"https://polyhaven.com/a/{slug}", "thumb": f"https://cdn.polyhaven.com/asset_img/thumbs/{slug}.png?width=480"})
    return out[:n]


def sheet(items, path):
    W, H = 480, 300
    cols = 3; rows = (len(items) + cols - 1) // cols
    s = Image.new("RGB", (W * cols, H * max(rows, 1)), (24, 24, 28))
    for i, it in enumerate(items):
        try:
            im = Image.open(io.BytesIO(get(it["thumb"], binary=True))).convert("RGB")
            im.thumbnail((W, H - 30))
        except Exception:
            im = Image.new("RGB", (W, H - 30), (60, 60, 60))
        x, y = (i % cols) * W, (i // cols) * H
        s.paste(im, (x + (W - im.width) // 2, y))
        d = ImageDraw.Draw(s)
        d.rectangle((x, y, x + 30, y + 26), fill=(0, 0, 0)); d.text((x + 9, y + 6), str(i + 1), fill=(255, 230, 0))
        d.text((x + 6, y + H - 24), f"{it['name'][:44]} | {it['licence']}", fill=(235, 235, 235))
    s.save(path, quality=90)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("term"); ap.add_argument("--n", type=int, default=6); ap.add_argument("--out", default="shorts/_aset/cari")
    a = ap.parse_args()
    items = polyhaven(a.term, a.n) + sketchfab(a.term, a.n)
    items = items[: max(a.n, 1) + 3]
    if not items:
        print("no free model found for", a.term); return 1
    os.makedirs(a.out, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", a.term.lower()).strip("-")
    sheet(items, os.path.join(a.out, f"{slug}.jpg"))
    lines = [f"# Kandidat model: {a.term}", "", "| No | Model | Pembuat | Lisensi | Segitiga | Sumber |", "|---|---|---|---|---|---|"]
    for i, it in enumerate(items, 1):
        lines.append(f"| {i} | [{it['name']}]({it['page']}) | {it['author']} | {it['licence']} | {it['tris']:,} | {it['src']} |")
    lines += ["", "Baris kredit (CC BY, untuk deskripsi video):"]
    lines += [f"- \"{it['name']}\" by {it['author']} ({it['src']}), {it['licence']}" for it in items if it["licence"] == "CC BY 4.0"]
    open(os.path.join(a.out, f"{slug}.md"), "w", encoding="utf8").write("\n".join(lines) + "\n")
    print(os.path.join(a.out, f"{slug}.jpg")); print(os.path.join(a.out, f"{slug}.md"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
