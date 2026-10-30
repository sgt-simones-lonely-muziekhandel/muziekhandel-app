# Muziekhandel FINAL PRODUCT

A game for Dutch kids (5–15) built on sheet music from Muziekschatten. Made for HackaLOD 2026.

- Design guide and mood boards: [`docs/design/`](docs/design/README.md)

## How it's built

Plain HTML, CSS and JavaScript modules, drawn on a canvas. No framework and no build step: serve the folder with `python3 -m http.server 8765` and open `http://localhost:8765`. Sound uses Tone.js. Antonio's branch has the details (run instructions, test shortcuts, what each feature does).

## Who works where

| Area | Files | Owners |
|---|---|---|
| **Front end** | `index.html`, `css/`, `js/` (scenes, player, views in `js/ui/`), `public/art/`, `assets/` | Amber, Antonio |
| **Back end** | `public/data/` (Muziekschatten JSON), `public/audio/`, `scripts/fetch-data` | Rei, Teo |
| Design | `docs/design/`, `scripts/import_art.py` | Amber, Antonio |

**The contract between back end and front end** is the shape of the composers and pieces in `js/data.js`, described in [`docs/features/content-data.md`](docs/features/content-data.md). The back end delivers Muziekschatten data as JSON in that shape in `public/data/`, and `js/data.js` loads it instead of the demo set. Agree on any extra fields (IRIs, links between people and works) together before building on either side.

## Folder map

```
index.html       start page and title screen
css/             styling: paper cards, brass buttons
js/              FRONT END  the game: main loop, street, shop, boy, cyclists, sky
  ui/                       the views: piano, sheet music, gallery, gramophone, shopkeeper
  data.js                   composers and pieces (demo now, Muziekschatten later)
  music.js, notation.js     note text → notes on the staff and the keys
  audio.js                  piano sound (Tone.js)
public/
  art/           game-ready images (made by scripts/import_art.py)
  data/          BACK END   Muziekschatten data as JSON
  audio/         BACK END   recordings for the gramophone
assets/          a few images of the game's own (composer portraits)
scripts/         tools you run yourself (art import, data fetch)
docs/
  design/        design guide and mood boards
  features/      one document per feature, plus a changelog
```

## Working together

- Everyone works on their own branch (`git switch -c <your-name>`).
- Merge into `main` with a pull request.
- Pull `main` into your branch regularly so you don't drift apart.
- When you change a feature, update its document in `docs/features/` and add a line to the changelog.
