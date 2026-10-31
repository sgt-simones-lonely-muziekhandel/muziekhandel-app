"""Cut the first hanging lamp out of the shop's back wall (public/art/shop/back-wall.webp) into
public/art/shop/lamp.webp, so the game can draw it again over the paintings that hang behind it.

The wallpaper around it is dark green; everything that isn't (the shade, the brass) is the lamp,
plus the dark outline right around it. Run: python3 scripts/cut_shop_lamp.py (needs Pillow, numpy).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WALL = ROOT / "public/art/shop/back-wall.webp"
OUT = ROOT / "public/art/shop/lamp.webp"
WORLD_W = 1440                  # the shop is 1440 world units wide (js/shop.js)
BOX = (474, 96, 566, 206)       # the lamp, in world units: left, top, right, bottom


def main():
    im = Image.open(WALL).convert("RGB")
    k = im.width / WORLD_W
    c = np.asarray(im.crop(tuple(int(v * k) for v in BOX))).astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    bright = (r + g + b) / 3
    lamp = ~((g >= r - 4) & (bright < 95))
    core = Image.fromarray((lamp * 255).astype("uint8")).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    outline = ImageChops.multiply(core.filter(ImageFilter.MaxFilter(5)), Image.fromarray(((bright < 55) * 255).astype("uint8")))
    mask = ImageChops.lighter(core, outline).filter(ImageFilter.GaussianBlur(0.6))
    out = Image.fromarray(c.astype("uint8")).convert("RGBA")
    out.putalpha(mask)
    out.save(OUT, "WEBP", quality=90)
    print(f"{OUT.relative_to(ROOT)} {out.size}")


if __name__ == "__main__":
    main()
