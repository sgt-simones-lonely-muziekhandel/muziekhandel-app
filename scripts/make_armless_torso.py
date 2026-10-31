"""Make the boy's torso without the sleeves painted on it (public/art/characters/kid-*/torso-armless.webp).

The torso pieces of kid-past and kid-future came with both sleeves drawn on: the near one hanging
over the jacket, the far one along its front edge. js/boy.js swings its own arm pieces on top, so
with the painted sleeves the boy had four arms. This takes them off: the far sleeve is cut away,
the near one (below the shoulder, which the arm piece covers) becomes jacket cloth, and the new
edges get the drawing's black line. Both kits share the sheet layout, so the same regions fit both.
Run: python3 scripts/make_armless_torso.py (needs Pillow, numpy, scipy).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
KITS = ["kid-past", "kid-future"]
# in torso.webp pixels
NEAR = [(66, 98), (108, 98), (112, 106), (97, 130), (90, 152), (88, 200), (30, 200), (44, 165), (52, 140), (60, 115)]
FAR = [(184, 30), (240, 30), (240, 205), (194, 205), (192, 150), (189, 90), (186, 55)]
INK = (28, 18, 12)


def region(size, poly):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.asarray(m) > 0


def armless(im):
    a = np.asarray(im.convert("RGBA")).astype(float)
    near, far = region(im.size, NEAR), region(im.size, FAR)
    a[far, 3] = 0
    # the near sleeve becomes cloth: the jacket's colour around it, with a soft grain, feathered in
    ring = ndimage.binary_dilation(near, iterations=8) & ~near & (a[..., 3] > 200) & (a[..., :3].max(-1) > 70)
    cloth = np.median(a[ring, :3], axis=0)
    grain = ndimage.gaussian_filter(np.random.default_rng(1).random(near.shape), 1.6)
    grain = (grain - grain.mean()) / grain.std() * 7
    soft = ndimage.gaussian_filter(near.astype(float), 1.5)
    for c in range(3):
        a[..., c] = a[..., c] * (1 - soft) + (cloth[c] + grain) * soft
    # a black line along the new silhouette, as thick as the drawing's own
    solid = a[..., 3] > 128
    edge = solid & ~ndimage.binary_erosion(solid, iterations=4) & ndimage.binary_dilation(near | far, iterations=3)
    a[edge, :3] = INK
    return Image.fromarray(a.clip(0, 255).astype("uint8"))


def main():
    for kit in KITS:
        src = ROOT / f"public/art/characters/{kit}/torso.webp"
        out = src.with_name("torso-armless.webp")
        armless(Image.open(src)).save(out, "WEBP", quality=92, method=6)
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
