# Scripts

Tools that run on your own computer, not in the game.

| Script | Owner | What it does |
|---|---|---|
| `import_art.py` | Amber, Antonio | Turns the generated art (magenta backgrounds) into `public/art/`. See [the design guide](../docs/design/README.md#adding-or-replacing-art). |
| `import_scores.py` | Antonio | Imports the hand-checked scores of the sheet2midi pipeline in `tools/sheet2midi/` (MusicXML from SOM scans) as playable songs: melody, piano accompaniment and the scan pages. Needs `pip install pillow pymupdf`. See [real sheet music](../docs/features/som-scores.md). |
| `cut_shop_lamp.py` | Antonio | Cuts the first hanging lamp out of the shop's back wall into `public/art/shop/lamp.webp`, so the shop can draw it over the paintings. See [the shop](../docs/features/shop.md). |
| `make_armless_torso.py` | Antonio | Makes `torso-armless.webp` for both boys: the torso without the sleeves painted on it. Needs `pip install pillow numpy scipy`. See [the player](../docs/features/player.md). |
| `fetch-data` (to be written) | Rei, Teo | Fetches the selected pieces and people from Muziekschatten and saves them to `public/data/` as JSON in the shape of `js/data.js` (see `docs/features/content-data.md`). |
