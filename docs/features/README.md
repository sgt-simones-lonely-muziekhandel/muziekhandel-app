# Features

One document per feature: what it does for the player, how it's built, where the code lives, and what's still missing. When a feature changes, its document is updated and the change is logged in [`CHANGELOG.md`](CHANGELOG.md).

| Feature | Document | Main files |
|---|---|---|
| Prologue (where and when you are) | [prologue.md](prologue.md) | `js/prologue.js`, `js/film.js` |
| Future street | [future-street.md](future-street.md) | `js/future.js` |
| Story: the time travel | [story.md](story.md) | `js/story.js`, `js/film.js` |
| Street outside the shop | [street.md](street.md) | `js/street.js` |
| Real-time sky | [sky.md](sky.md) | `js/sky.js` |
| Cyclists | [cyclists.md](cyclists.md) | `js/cyclist.js` |
| Player character | [player.md](player.md) | `js/boy.js` |
| Shop interior | [shop.md](shop.md) | `js/shop.js`, `js/hotspots.js` |
| Listening corner | [listening-corner.md](listening-corner.md) | `js/corner.js` |
| Sheet music cabinet and viewer | [sheet-music.md](sheet-music.md) | `js/ui/library.js`, `js/ui/sheet.js`, `js/notation.js` |
| Piano | [piano.md](piano.md) | `js/ui/piano.js`, `js/music.js` |
| Audio (Salamander Grand Piano) | [audio.md](audio.md) | `js/audio.js` |
| Composers: portraits, biography and music | [composers.md](composers.md) | `js/ui/gallery.js`, `js/data.js` |
| Gramophone | [gramophone.md](gramophone.md) | `js/ui/gramophone.js` |
| Shopkeeper (help) | [shopkeeper.md](shopkeeper.md) | `js/ui/keeper.js` |
| Game shell, input and overlays | [game-shell.md](game-shell.md) | `index.html`, `js/main.js`, `js/ui/ui.js`, `css/style.css` |
| Content data (composers and pieces) | [content-data.md](content-data.md) | `js/data.js` |
| Real sheet music (SOM collection) | [som-scores.md](som-scores.md) | `tools/sheet2midi/`, `scripts/import_scores.py`, `js/som-scores.js` |
| Art assets | [assets.md](assets.md) | `assets/`, `tools/build_assets.py` |

## Conventions

- All in-game text is Dutch; code, comments and these documents are English.
- Colours, fonts and UI style follow the [design guide](../design/README.md).
- No build step: plain ES modules served as static files. Run instructions are in the [root README](../../README.md).
