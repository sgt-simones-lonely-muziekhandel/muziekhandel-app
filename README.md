# Muziekhandel FINAL PRODUCT

A game for Dutch kids (5–15) built on sheet music from Muziekschatten. Made for HackaLOD 2026.

- Design guide and mood boards: [`docs/design/`](docs/design/README.md)
- One document per feature, plus a changelog: [`docs/features/`](docs/features/README.md)

## Run it

No build step: it's plain HTML, CSS and JavaScript modules. The back end serves them, and gets the
sheet music and the composers from Virtuoso (see [the back end](docs/features/backend.md)):

```sh
ssh -N -L 8890:localhost:8890 root@hackalod.kernelmaft.com   # Virtuoso, in another terminal
python3 backend/server.py
# open http://localhost:8765
```

Without Virtuoso the game still runs, but the sheet-music cabinet and the portrait wall stay empty.

With Nix: `nix run` does the same (`PORT=9000 nix run` for another port), and `nix develop` gives a
shell with Python and the packages the scripts in `scripts/` and `tools/` need.

Opening `index.html` straight from disk won't work, because browsers block JS modules on `file://`.
The piano samples (Salamander Grand Piano), Tone.js and the fonts load from the internet.

### Test shortcuts (URL parameters)

| Parameter | Effect |
|---|---|
| `?uur=21.5` | Pretend it's 21:30, to see the sky at another time of day |
| `?autostart` | Skip the title screen (plays the prologue) |
| `?autostart&scene=future` | Start on the future street |
| `?autostart&scene=story` | Play the time-travel story |
| `?autostart&scene=street` | Start in the past, on the street |
| `?autostart&scene=shop` | Start inside the shop |
| `?autostart&scene=shop&open=piano&piece=ode` | Open a view: `piano`, `sheet`, `library`, `gallery`, `composer` (`&composer=mozart`), `gramophone`, `keeper` |

### Deploy to a NixOS server

The flake has a NixOS module that serves the game with nginx over plain HTTP. In the server's flake,
add this repo as an input, import `muziekhandel.nixosModules.default` and set
`services.muziekhandel.enable = true;`.

This opens port 80, and the game answers on any domain name or IP address that points at the
server. After a change to the game, `nix flake update muziekhandel` in the server's config and
rebuild.

## What's in the game

- **Prologue** (`js/prologue.js`): the start. A short anime-like film: Amsterdam today, the sea rising over the map from 2026 to 2126, and the flooded street in smoky air.
- **Future street** (`js/future.js`): the first playable scene. The same quay far in the future: flooded, ruined, raining. The boy (in his gas mask) finds a glowing crate with cylinders and sheet music; opening it leads to the past.
- **Story** (`js/story.js`): the time travel as a short anime-like film: the crate, the cylinder tube opening, and the swirl that turns the flooded street into the past, dissolving into the street.
- **Street** (`js/street.js`): Amsterdam around 1900, drawn live on a canvas. Canal and bridge on the left, houses and the shop on the right. The sky follows the visitor's real local time (`js/sky.js`); windows and street lamps light up in the evening. When the player stands still, people ride past on bikes (`js/cyclist.js`).
- **Shop** (`js/shop.js`): painted interior with hotspots: the sheet music cabinet, the piano, the portraits, Meneer Simone and the gramophone. Walk with ← → or click/tap an object.
- **Sheet music** (`js/ui/library.js`, `js/ui/sheet.js`, `js/notation.js`): pick a tube from the cabinet, flip pages with ← →, Space takes the piece to the piano. Every note has a colour and a name, matching the piano keys.
- **Piano** (`js/ui/piano.js`): Salamander Grand Piano through Tone.js (`js/audio.js`). Play with the computer keyboard (physical key positions, so QWERTY/AZERTY/Italian layouts all work and the real key labels are shown), mouse, touch, or a USB/MIDI keyboard. *Luister* plays the piece with the notes lighting up; *Speel mee* waits for the player to press each lit-up key. *Hulp* shows a picture of the computer keyboard with the notes painted on it.
- **Composers** (`js/ui/gallery.js`): portrait wall, biography, "Wist je dat?" and a family tree.
- **Gramophone** (`js/ui/gramophone.js`): pick a record; it plays with a muffled, crackly old sound.
- **Meneer Simone** (`js/ui/keeper.js`): greets the player and explains each part. Texts can be read aloud (Dutch speech synthesis) for kids who can't read yet.

## Adding content

Composers and pieces live in `js/data.js`. A piece is a line of notes like `E4:q D#4:8 r:16 G4:h.` (pitch or `r` for a rest, then `w h. h q. q 8. 8 16`). Pieces now are a small demo set; replace or extend them with the Muziekschatten data.

## Who works where

| Area | Files | Owners |
|---|---|---|
| **Front end** | `index.html`, `css/`, `js/` (scenes, player, views in `js/ui/`), `public/art/`, `assets/` | Amber, Antonio |
| **Back end** | `backend/` (API over Virtuoso), `js/catalogue.js`, `public/audio/` | Rei, Teo |
| Design | `docs/design/`, `scripts/import_art.py` | Amber, Antonio |

**The contract between back end and front end** is the API of `backend/server.py`, described in [`docs/features/backend.md`](docs/features/backend.md); `js/catalogue.js` turns its answers into the shape of the composers and pieces in `js/data.js` ([`docs/features/content-data.md`](docs/features/content-data.md)). Agree on any extra fields together before building on either side.

## Folder map

```
index.html       start page and title screen
css/             styling: paper cards, brass buttons
js/              FRONT END  the game: main loop, street, shop, boy, cyclists, sky
  ui/                       the views: piano, sheet music, gallery, gramophone, shopkeeper
  data.js                   the game's own composers and pieces
  catalogue.js              BACK END  the Muziekschatten sheet music and composers, from the API
  music.js, notation.js     note text → notes on the staff and the keys
  audio.js                  piano sound (Tone.js)
public/
  art/           game-ready images (made by scripts/import_art.py)
  data/          BACK END   Muziekschatten data as JSON
  audio/         BACK END   recordings for the gramophone
assets/          a few images of the game's own (composer portraits)
backend/         BACK END   the API over Virtuoso (server.py), which also serves the game
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
