# Sheet music cabinet and viewer

The cabinet right of the counter in the shop (`public/art/shop/cabinet.webp`). It holds music cylinders, each with a rolled-up piece of sheet music.

## For the player

1. **Cabinet** (*De bladmuziekkast*): clicking the cabinet in the shop opens its close-up, `public/art/closeups/cabinet.webp`: three shelves of five compartments, each with a brass plaque. Each piece is a music cylinder (red, blue, green or cream, in turn) in its own compartment, with the composer's name on the plaque and a paper tag with the title and 1–3 stars. The shelves go by difficulty: top shelf ★, middle ★★, bottom ★★★. Clicking a cylinder lifts it, swaps it for the open cylinder with its lid off, and opens the music.
2. **Sheet** (*Bladmuziek*): an old paper page with title, subtitle and composer (click the composer's name for their [biography](composers.md)).
   - **← →** or the *Vorige* / *Volgende* buttons flip pages, with a small page-turn animation.
   - **Space** or *Speel op de piano* opens the piece on the [piano](piano.md).
   - Every note has a coloured circle with its name under the staff. The colours are the same as on the piano keys.

When the cabinet is opened from the piano (*Kies bladmuziek*), picking a cylinder loads the piece straight into the piano instead.

## How it's built

- `js/ui/library.js`: uses `frame(…, { closeup })` (see [game shell](game-shell.md)) and places the cylinders and plaque names on the picture. `COLS` (plaque centres; the compartments sit `TUBE_DX` further right) and `SHELVES` (y of each shelf edge and plaque row) are measured in pixels of the 1672 × 941 picture and turned into percentages, so everything scales with it; sizes use `cqw` units of the picture box. Pieces go on the shelf of their `level`, at most five per shelf. The cylinders are the images in `public/art/items/cylinder/` (`red`, `blue`, `green`, `cream`, and `open` for the opened one).
- `js/ui/sheet.js`: the reader view. Keyboard: ← → flip, Space → piano (`ui.replace('piano', …)`, so *Terug* from the piano goes back to the cabinet).
- `js/notation.js`: a small SVG engraver for single-line melodies in treble clef.
  - Staff with 10-unit line spacing, 4 bars per line; 2 lines per page in the reader, 1 in the piano.
  - Note heads (filled or open), stems up or down depending on the position, flags for eighths and sixteenths, dots, sharps/flats, ledger lines above and below, rests (glyphs from the *Noto Music* font), bar lines, a final double bar, time signature, bar numbers.
  - Bar widths depend on how many notes and how long they are.
  - Each note is a `<g class="note" data-i="…">` with a hidden highlight box; the piano adds `active` (lit up) and `done` (played) classes. `renderPage()` returns a map from note index to element.
  - Note names can be letters (C D E) or solfège (do re mi), see [piano](piano.md).

## Known limits / next steps

- Five compartments per shelf: a sixth piece of the same difficulty doesn't fit yet (it would need a second cabinet page or two cylinders per compartment).

- Melody only, treble clef only: no chords, no bass clef, no key signatures (accidentals are written on every note), no beams (each eighth has its own flag), no ties or lyrics.
- For real scores from Muziekschatten, an engraver like VexFlow or OpenSheetMusicDisplay (MusicXML) would be needed; the highlight hook (`data-i` per note) can stay the same.
