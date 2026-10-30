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
    # crop away the baked-in Italian labels, keep the gramophone
    Image.open(os.path.join(DESK, "Gemini_Generated_Image_6n1xm46n1xm46n1x.jpeg")).convert("RGB").crop(
        (0, 140, 510, 860)).save(os.path.join(OUT, "gramophone-corner.jpg"), quality=88)
    print("backgrounds ok")


if __name__ == "__main__":
    portraits(); backgrounds()
