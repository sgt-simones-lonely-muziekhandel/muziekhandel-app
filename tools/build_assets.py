"""Rebuild the game assets from the source art.

Usage:  python3 tools/build_assets.py [SOURCE_DIR]
Needs Pillow and numpy (pip install pillow numpy).

SOURCE_DIR holds the generated reference images that are not in the repo
(default: ~/Desktop). See docs/features/assets.md.
"""
import sys, os
from collections import deque
import numpy as np
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESK = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Desktop")
OUT = os.path.join(REPO, "assets")
os.makedirs(os.path.join(OUT, "portraits"), exist_ok=True)


def remove_bg(img):
    """Flood-fill near-white pixels connected to the border -> transparent."""
    a = np.array(img.convert("RGBA"))
    h, w = a.shape[:2]
    rgb = a[:, :, :3].astype(int)
    white = (rgb.min(axis=2) > 225) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 25)
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x]:
                seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and white[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    a[seen, 3] = 0
    # soften the fringe: semi-transparent for light pixels touching the background
    near = np.zeros_like(seen)
    near[1:, :] |= seen[:-1, :]; near[:-1, :] |= seen[1:, :]
    near[:, 1:] |= seen[:, :-1]; near[:, :-1] |= seen[:, 1:]
    fringe = near & ~seen & (rgb.min(axis=2) > 170)
    a[fringe, 3] = 110
    return Image.fromarray(a)


def walk_sheet():
    src = Image.open(os.path.join(REPO, "docs/design/Eight-Frame Boy Walking Cycle.png"))
    W, H = src.size
    fw = W / 8
    frames = []
    for i in range(8):
        crop = src.crop((int(i * fw), 40, int((i + 1) * fw), 590))
        fr = remove_bg(crop)
        al = np.array(fr)[:, :, 3]
        ys, xs = np.nonzero(al > 0)
        bottom = ys.max()
        # horizontal anchor: centre of the head region (top 30% of the figure)
        top = ys.min()
        head = al[top:top + int((bottom - top) * 0.3)] > 0
        hx = np.nonzero(head.any(axis=0))[0]
        cx = (hx.min() + hx.max()) / 2
        frames.append((fr, bottom, cx, top))
    tops = min(t for _, _, _, t in frames)
    FW, FH = 300, 0
    FH = max(b for _, b, _, _ in frames) - tops + 6
    sheet = Image.new("RGBA", (FW * 8, FH), (0, 0, 0, 0))
    base = max(b for _, b, _, _ in frames)
    for i, (fr, bottom, cx, top) in enumerate(frames):
        ox = int(i * FW + FW / 2 - cx)
        oy = int(base - bottom) - tops
        sheet.paste(fr, (ox, oy), fr)
    sheet = sheet.resize((sheet.width * 6 // 10, sheet.height * 6 // 10), Image.LANCZOS)  # 180x277 frames
    sheet.save(os.path.join(OUT, "boy-walk.png"), optimize=True)
    print("walk sheet", sheet.size)


PORTRAITS = {
    # inner painting areas in Gemini_Generated_Image_ivo2oqivo2oqivo2.jpeg (1085x992)
    "beethoven": (88, 82, 318, 345),
    "mozart": (445, 82, 683, 400),
    "bach": (792, 92, 1008, 402),
    "chopin": (83, 478, 348, 828),
    "verdi": (468, 528, 683, 812),
    "tchaikovsky": (795, 538, 1008, 828),
}


def portraits():
    src = Image.open(os.path.join(DESK, "Gemini_Generated_Image_ivo2oqivo2oqivo2.jpeg")).convert("RGB")
    for name, box in PORTRAITS.items():
        src.crop(box).save(os.path.join(OUT, "portraits", name + ".jpg"), quality=88)
    print("portraits ok")


def backgrounds():
    Image.open(os.path.join(DESK, "Gemini_Generated_Image_faywvlfaywvlfayw.jpeg")).convert("RGB").save(
        os.path.join(OUT, "shop-interior.jpg"), quality=90)
    # crop away the baked-in Italian labels, keep the gramophone
    Image.open(os.path.join(DESK, "Gemini_Generated_Image_6n1xm46n1xm46n1x.jpeg")).convert("RGB").crop(
        (0, 140, 510, 860)).save(os.path.join(OUT, "gramophone-corner.jpg"), quality=88)
    print("backgrounds ok")


if __name__ == "__main__":
    walk_sheet(); portraits(); backgrounds()
