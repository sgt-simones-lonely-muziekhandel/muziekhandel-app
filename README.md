# Muziekhandel FINAL PRODUCT

A game for Dutch kids (5–15) built on sheet music from Muziekschatten. Made for HackaLOD 2026.

- Design guide and mood boards: [`docs/design/`](docs/design/README.md)

## Who works where

| Area | Folders | Owners |
|---|---|---|
| **Front end** | `src/scenes/`, `src/game/` (`world/`, `ui/`, `fx/`), `public/art/` | Amber, Antonio |
| **Back end** | `src/data/`, `src/audio/`, `public/data/`, `public/audio/` | Rei, Teo |
| Design | `docs/design/`, `scripts/import_art.py` | Amber, Antonio |

The data layer knows nothing about Phaser, and the scenes only use the types and interface from `src/data/`. Agree on `src/data/DataSource.ts` together first: it's the contract between front end and back end.

## Folder map

```
src/
  data/        BACK END   Muziekschatten / LOD → plain TypeScript types
  audio/       BACK END   sheet music → notes → sound
  game/        FRONT END  shared helpers: state, navigation
    world/                walkable scenes, player, hotspots
    ui/                   paper cards, brass buttons, icons, dialogue
    fx/                   lamplight, rain, fog, time travel
  scenes/      FRONT END  one Phaser scene per view
public/
  art/         game-ready images (made by scripts/import_art.py)
  data/        cached Muziekschatten data (JSON)
  audio/       MusicXML, SoundFont samples, recordings
scripts/       tools you run yourself (art import, data fetch)
docs/design/   design guide and mood boards
```

Each folder has a short README with what goes in it.

## Working together

- Everyone works on their own branch (`git switch -c <your-name>`).
- Merge into `main` with a pull request.
- Pull `main` into your branch regularly so you don't drift apart.
