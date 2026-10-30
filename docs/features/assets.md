# Art assets

The images the game uses, where they come from, and how to rebuild them.

| File | Used for | Source |
|---|---|---|
| `assets/boy-walk.png` | [Player](player.md) walk cycle, 8 frames of 180 × 277 | `docs/design/Eight-Frame Boy Walking Cycle.png` |
| `assets/shop-interior.jpg` | [Shop](shop.md) background (1440 × 720), title screen, shopkeeper face | `Gemini_Generated_Image_faywvl….jpeg` |
| `assets/portraits/*.jpg` | [Composer](composers.md) portraits | `Gemini_Generated_Image_ivo2oq….jpeg` (portrait wall) |
| `assets/gramophone-corner.jpg` | [Gramophone](gramophone.md) view | `Gemini_Generated_Image_6n1xm4….jpeg` |

The street has no image: it's drawn in code (see [street](street.md)).

## Rebuilding

`tools/build_assets.py` recreates all of the above.

```sh
pip install pillow numpy
python3 tools/build_assets.py ~/Desktop   # folder with the Gemini images
```

What it does:

- **Walk cycle**: cuts the sheet into 8 equal slices; removes the white background with a flood fill from the edges (so white inside the drawing, like the collar, stays); softens the edge; aligns every frame on the feet (bottom) and head (centre of the top 30%) so the boy doesn't jitter; scales to 60%.
- **Portraits**: crops the painting inside each frame of the portrait wall (coordinates in `PORTRAITS`).
- **Shop**: re-saves the furnished interior as JPEG.
- **Gramophone**: crops the left part to remove the Italian labels baked into the image.

The source Gemini images are not in the repo; only `docs/design/` art is. Keep the originals somewhere safe, or add them to `docs/design/`.

## Wanted

Higher-quality art that would replace code drawings or fix limits:

1. Street in Amsterdam around 1900 as separate transparent layers (sky, far, middle with the shop, foreground).
2. The shopkeeper on white, 2–3 poses (standing, talking, pointing).
3. A cyclist on white, 4–6 pedalling frames.
4. The shop interior with empty portrait frames and clean plaques.
5. The boy standing still on white; the gramophone on its own, without text.
