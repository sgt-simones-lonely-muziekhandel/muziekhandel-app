# Art assets

The images the game uses, where they come from, and how to rebuild them.

| File | Used for | Source |
|---|---|---|
| `assets/portraits/*.jpg` | [Composer](composers.md) portraits | `Gemini_Generated_Image_ivo2oq….jpeg` (portrait wall) |
| `assets/gramophone-corner.jpg` | No longer used (the [gramophone](gramophone.md) view shows `closeups/gramophone-corner.webp`) | `Gemini_Generated_Image_6n1xm4….jpeg` |

From `public/art/` (produced by `scripts/import_art.py`, listed in `public/art/manifest.json`):

| Folder | Used for |
|---|---|
| `past-street/` | [Street](street.md) layers: sky, far, walk, foreground |
| `shop/` | [Shop](shop.md): back wall, cabinet, piano, counter, gramophone, foreground silhouettes, gilded frames |
| `characters/shopkeeper/full.webp`, `head.webp` | Shopkeeper behind the counter, and his face in the [help](shopkeeper.md) medallions |
| `items/cylinder/` | Music cylinders at the [gramophone](gramophone.md) |
| `items/sheet-music/` | `cover-1…6`: sheet-music books in the [cabinet](sheet-music.md); `cover-inside`: the title page of every piece. `page-left` / `page-right` are not used yet |
| `characters/cyclist-man/`, `cyclist-woman/` | [Cyclist](cyclists.md) puppets (bicycle, wheels, crank, legs, body); `full.webp` is the reference the rig is lined up against |

## Rebuilding

`tools/build_assets.py` recreates all of the above.

```sh
pip install pillow numpy
python3 tools/build_assets.py ~/Desktop   # folder with the Gemini images
```

What it does:

- **Portraits**: crops the painting inside each frame of the portrait wall (coordinates in `PORTRAITS`).
- **Gramophone**: crops the left part to remove the Italian labels baked into the image.

The source Gemini images are not in the repo; only `docs/design/` art is. Keep the originals somewhere safe, or add them to `docs/design/`.

## Wanted

Higher-quality art that would replace code drawings or fix limits:

1. ~~Street in Amsterdam around 1900 as separate layers~~ — done, `public/art/past-street/`.
2. The shopkeeper facing forward or towards the player, in 2–3 poses (talking, pointing); `characters/shopkeeper/` has one side-view pose plus body parts.
3. ~~A cyclist~~ — done, `characters/cyclist-man/` and `cyclist-woman/` as puppets.
4. ~~The shop interior with empty portrait frames~~ — done, `public/art/shop/`.
5. ~~The boy as separate pieces~~ — done, `public/art/characters/kid-past/` (see [player](player.md)). The gramophone on its own, without text.
