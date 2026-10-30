"""Turn the generated art in the design folder into game-ready images.

    python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements-art.txt
    .venv/bin/python scripts/import_art.py ../design

- Removes the magenta (#FF00FF) background and the magenta fringe on edges.
- Cuts sheets (characters, icons, UI frames, effects) into separate images.
- Shrinks everything to game size and saves it as WebP in public/art/.
- Writes public/art/manifest.json: one entry per image (key, file, size,
  and for sheet parts the position on the original sheet, used for rigging).

To add or replace art: put the new image in the design folder, add or edit its
line in ASSETS below and run the script again.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path(__file__).resolve().parent.parent / "public" / "art"
MAGENTA = np.array([248.0, 4.0, 249.0])  # measured average of the generated backgrounds

# How an image is processed:
#   opaque  full image, no background to remove
#   layer   magenta removed, canvas kept as is (layers must stay aligned)
#   object  magenta removed, trimmed to the object
#   sheet   magenta removed, cut into parts (names listed left-to-right, top-to-bottom;
#           "row": True for a single row, so uneven heights don't change the order)
#   glow    black background turned into transparency, cut into parts
# max: longest side in px (None = keep). scale: fixed factor for all parts of a sheet.
CHAR_SCALE = 0.7  # same for every character, so they keep their relative sizes
ARM_LEG = ["upper-arm-1", "torso", "upper-arm-2", "lower-arm-1", "lower-arm-2", "upper-leg-1", "upper-leg-2"]

ASSETS = [
    # Past street (parallax, back to front)
    ("past/Serene Golden-Hour Cloudscape.png", "opaque", "past-street/sky", {}),
    ("past/Magenta-Sky Amsterdam Canal at Golden Hour.png", "layer", "past-street/far", {}),
    ("past/Golden-Hour Canal Music Shop.png", "layer", "past-street/walk", {}),
    ("past/Magenta Garden Silhouette Frame.png", "layer", "past-street/foreground", {}),
    # Future street
    ("future/Stormy Twilight Sky with Rain.png", "opaque", "future-street/sky", {}),
    ("future/Ruined Canal City at Dusk.png", "layer", "future-street/far", {}),
    ("future/Flooded Ruins at Muziekhandel Simone.png", "layer", "future-street/walk", {}),
    ("future/Magenta Ruins Silhouette Frame.png", "layer", "future-street/foreground", {}),
    ("future/Weathered Crate of Vintage Music Relics.png", "object", "future-street/crate", {"max": 1024}),
    # Shop floor
    ("music_store_internal/Canal-Side Atelier at Dusk.png", "opaque", "shop/back-wall", {}),
    ("music_store_internal/Magenta Interior Silhouette with Lamps.png", "layer", "shop/foreground", {}),
    ("music_store_internal/Slapende kat op een antieke piano.png", "object", "shop/piano", {"max": 1024}),
    ("music_store_internal/Vintage Shop Counter on Magenta.png", "object", "shop/counter", {"max": 1024}),
    ("music_store_internal/Antique Apothecary Music Cabinet.png", "object", "shop/cabinet", {"max": 1024}),
    ("music_store_internal/Antique Gramophone on Ornate Cabinet.png", "object", "shop/gramophone", {"max": 1024}),
    ("music_store_internal/Ornate Golden Frames on Magenta.png", "sheet", "shop/frames",
     {"max": 768, "dilate": 6, "row": True, "names": ["oval-large", "rect-large", "oval-small", "rect-medium", "rect-small"]}),
    # Close-ups
    ("past/Antique Piano with Blank Sheet Music.png", "opaque", "closeups/piano", {}),
    ("past/Antique Wooden Display Cabinet Interior.png", "opaque", "closeups/cabinet", {}),
    ("music_store_internal/Vintage Green Damask Gallery Wall.png", "opaque", "closeups/gallery-wall", {}),
    ("past/Edwardian Canal-Side Music Nook.png", "opaque", "closeups/gramophone-corner", {}),
    # Characters (cut-out puppets; "1" is the part on the left of the sheet)
    ("characters/Vintage Boy Character Sprite Sheet.png", "sheet", "characters/kid-past",
     {"scale": CHAR_SCALE, "names": ["head", "full", *ARM_LEG, "lower-leg-1", "lower-leg-2"]}),
    ("characters/Wartime Gas Mask Character Sprite Sheet.png", "sheet", "characters/kid-future",
     {"scale": CHAR_SCALE, "names": ["head", "full", *ARM_LEG, "lower-leg-1", "lower-leg-2"]}),
    ("characters/Victorian Gentleman Puppet Sprite Sheet.png", "sheet", "characters/shopkeeper",
     {"scale": CHAR_SCALE, "names": ["full", "head", *ARM_LEG, "lower-leg-1", "lower-leg-2", "foot-1", "foot-2"]}),
    # Items
    ("music_store_internal/Vintage Phonograph Cylinder Collection.png", "sheet", "items/cylinder",
     {"max": 512, "dilate": 6, "row": True, "names": ["cream", "red", "blue", "green", "open"]}),
    # UI
    ("details/Vintage Parchment and Brass UI Frames.png", "sheet", "ui",
     {"max": 512, "dilate": 6, "row": True, "names": ["card", "plaque", "button", "paper-strip"]}),
    ("details/Vintage Brass UI Icon Grid.png", "sheet", "ui/icons",
     {"max": 128, "dilate": 6, "names": ["read", "music", "discover", "collect", "play", "back", "sound", "close"]}),
    # Effects
    ("details/Atmospheric Light and Smoke Effects.png", "glow", "fx",
     {"max": 256, "dilate": 6, "row": True, "threshold": 0.1, "names": ["glow-yellow", "glow-orange", "fog", "rain", "ash"]}),
    ("details/Magenta Overlay Effects Sprite Sheet.png", "sheet", "fx",
     {"max": 256, "dilate": 6, "row": True, "names": [None, None, None, None, None, "sheet-music", "note"]}),
    # Easter egg: the team on the gallery wall
    ("paintings/Gemini_Generated_Image_duczd5duczd5ducz.jpeg", "opaque", "portraits/team-1", {"max": 768}),
    ("paintings/Gemini_Generated_Image_pal7k1pal7k1pal7.jpeg", "opaque", "portraits/team-2", {"max": 768}),
    ("paintings/Gemini_Generated_Image_vvc338vvc338vvc3.jpeg", "opaque", "portraits/team-3", {"max": 768}),
    ("paintings/Untitled.png", "opaque", "portraits/team-4", {"max": 768}),
]


def remove_magenta(img, lo=35.0, hi=140.0):
    """Alpha from how magenta a pixel is, then unmix the magenta out of soft edges."""
    a = np.asarray(img.convert("RGB")).astype(float)
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    alpha = np.clip((hi - m) / (hi - lo), 0, 1)
    al = np.maximum(alpha, 1e-3)[..., None]
    unmixed = np.clip((a - (1 - al) * MAGENTA) / al, 0, 255)
    rgb = np.where(alpha[..., None] >= 1, a, unmixed)
    return np.dstack([rgb, alpha * 255])


def black_to_alpha(img):
    """Light on black: brightness becomes alpha, so it works with normal and additive blending."""
    a = np.asarray(img.convert("RGB")).astype(float)
    alpha = a.max(-1)
    alpha = np.where(alpha < 12, 0, alpha)  # drop compression noise in the black
    rgb = np.clip(a * 255 / np.maximum(alpha, 1)[..., None], 0, 255)
    return np.dstack([rgb, alpha])


def to_image(arr):
    return Image.fromarray(arr.round().astype(np.uint8))


def fit(img, max_side=None, scale=None):
    if scale:
        size = (max(1, round(img.width * scale)), max(1, round(img.height * scale)))
    elif max_side and max(img.size) > max_side:
        f = max_side / max(img.size)
        size = (max(1, round(img.width * f)), max(1, round(img.height * f)))
    else:
        return img
    return img.resize(size, Image.LANCZOS)


def split(rgba, dilate, threshold=0.5, row=False, min_area=1500, pad=4):
    """Find the separate pieces on a sheet, in reading order."""
    alpha = rgba[..., 3] / 255
    mask = alpha > threshold
    if dilate:
        mask = ndimage.binary_dilation(mask, iterations=dilate)
    labels, _ = ndimage.label(mask)
    # grow each piece a few px so its soft edge comes along
    dist, (iy, ix) = ndimage.distance_transform_edt(labels == 0, return_indices=True)
    grown = np.where(dist <= 3, labels[iy, ix], 0)
    pieces = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        if sl is None or (labels[sl] == i).sum() < min_area:
            continue
        y0, y1 = max(sl[0].start - pad, 0), min(sl[0].stop + pad, rgba.shape[0])
        x0, x1 = max(sl[1].start - pad, 0), min(sl[1].stop + pad, rgba.shape[1])
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] *= grown[y0:y1, x0:x1] == i
        pieces.append(((y0, x0), crop))
    pieces.sort(key=lambda p: p[0][1] if row else (round(p[0][0] / 120), p[0][1]))
    return pieces


def trim(rgba, pad=4):
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    y0, x0 = max(ys.min() - pad, 0), max(xs.min() - pad, 0)
    return rgba[y0:ys.max() + pad + 1, x0:xs.max() + pad + 1]


def save(img, key, manifest, extra=None):
    path = OUT / f"{key}.webp"
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode == "RGBA":
        img.save(path, "WEBP", quality=85, alpha_quality=90, method=6)
    else:
        img.convert("RGB").save(path, "WEBP", quality=85, method=6)
    manifest[key] = {"file": f"art/{key}.webp", "width": img.width, "height": img.height, **(extra or {})}


def main(src_dir):
    src_dir = Path(src_dir)
    manifest = {}
    for rel, kind, key, opt in ASSETS:
        img = Image.open(src_dir / rel)
        if kind == "opaque":
            save(fit(img.convert("RGB"), opt.get("max")), key, manifest)
        elif kind == "layer":
            save(fit(to_image(remove_magenta(img)), opt.get("max")), key, manifest)
        elif kind == "object":
            save(fit(to_image(trim(remove_magenta(img))), opt.get("max")), key, manifest)
        else:
            rgba = black_to_alpha(img) if kind == "glow" else remove_magenta(img)
            pieces = split(rgba, opt.get("dilate", 0), opt.get("threshold", 0.5), opt.get("row", False))
            names = opt["names"]
            if len(pieces) != len(names):
                sys.exit(f"{rel}: found {len(pieces)} pieces, expected {len(names)}")
            for ((y, x), arr), name in zip(pieces, names):
                if name is None:
                    continue
                scale = opt.get("scale")
                extra = {"sheetX": round(x * scale), "sheetY": round(y * scale)} if scale else None
                save(fit(to_image(arr), opt.get("max"), scale), f"{key}/{name}", manifest, extra)
        print("ok ", key)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{len(manifest)} images -> {OUT}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
