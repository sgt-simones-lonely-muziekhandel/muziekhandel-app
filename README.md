# Muziekhandel FINAL PRODUCT

A game for Dutch kids (5–15) built on sheet music from Muziekschatten. Made for HackaLOD 2026.

- Design guide and mood boards: [`docs/design/`](docs/design/README.md)
- One document per feature, plus a changelog: [`docs/features/`](docs/features/README.md)

## Run it

No build step: it's plain HTML, CSS and JavaScript modules. Serve the folder and open it in a browser:

```sh
python3 -m http.server 8765
# open http://localhost:8765
```

Opening `index.html` straight from disk won't work, because browsers block JS modules on `file://`.
The piano samples (Salamander Grand Piano), Tone.js and the fonts load from the internet.

### Test shortcuts (URL parameters)

| Parameter | Effect |
|---|---|
| `?uur=21.5` | Pretend it's 21:30, to see the sky at another time of day |
| `?autostart` | Skip the title screen |
| `?autostart&scene=shop` | Start inside the shop |
| `?autostart&scene=shop&open=piano&piece=ode` | Open a view: `piano`, `sheet`, `library`, `gallery`, `composer` (`&composer=mozart`), `gramophone`, `keeper` |

## What's in the game

- **Street** (`js/street.js`): Amsterdam around 1900, drawn live on a canvas. Canal and bridge on the left, houses and the shop on the right. The sky follows the visitor's real local time (`js/sky.js`); windows and street lamps light up in the evening. When the player stands still, people ride past on bikes (`js/cyclist.js`).
- **Shop** (`js/shop.js`): painted interior with hotspots: the sheet music cabinet, the piano, the portraits, Meneer Van der Velde and the gramophone. Walk with ← → or click/tap an object.
- **Sheet music** (`js/ui/library.js`, `js/ui/sheet.js`, `js/notation.js`): pick a tube from the cabinet, flip pages with ← →, Space takes the piece to the piano. Every note has a colour and a name, matching the piano keys.
- **Piano** (`js/ui/piano.js`): Salamander Grand Piano through Tone.js (`js/audio.js`). Play with the computer keyboard (physical key positions, so QWERTY/AZERTY/Italian layouts all work and the real key labels are shown), mouse, touch, or a USB/MIDI keyboard. *Luister* plays the piece with the notes lighting up; *Speel mee* waits for the player to press each lit-up key. *Hulp* shows a picture of the computer keyboard with the notes painted on it.
- **Composers** (`js/ui/gallery.js`): portrait wall, biography, "Wist je dat?" and a family tree.
- **Gramophone** (`js/ui/gramophone.js`): pick a record; it plays with a muffled, crackly old sound.
- **Meneer Van der Velde** (`js/ui/keeper.js`): greets the player and explains each part. Texts can be read aloud (Dutch speech synthesis) for kids who can't read yet.

## Adding content

Composers and pieces live in `js/data.js`. A piece is a line of notes like `E4:q D#4:8 r:16 G4:h.` (pitch or `r` for a rest, then `w h. h q. q 8. 8 16`). Pieces now are a small demo set; replace or extend them with the Muziekschatten data.

## Assets

- `assets/boy-walk.png`: 8-frame walk cycle, cut from `docs/design/Eight-Frame Boy Walking Cycle.png`
- `assets/shop-interior.jpg`, `assets/gramophone-corner.jpg`, `assets/portraits/*`: generated reference art
