# Sheet music cabinet and viewer

The first object in the shop: a cabinet with cardboard tubes. Each tube holds a rolled-up piece of sheet music.

## For the player

1. **Cabinet** (*De bladmuziekkast*): one wooden shelf per composer, with a brass name plaque. Each tube shows the title and 1–3 stars for difficulty. Clicking a tube pulls it off the shelf and opens the music.
2. **Sheet** (*Bladmuziek*): an old paper page with title, subtitle and composer (click the composer's name for their [biography](composers.md)).
   - **← →** or the *Vorige* / *Volgende* buttons flip pages, with a small page-turn animation.
   - **Space** or *Speel op de piano* opens the piece on the [piano](piano.md).
   - Every note has a coloured circle with its name under the staff. The colours are the same as on the piano keys.

When the cabinet is opened from the piano (*Kies bladmuziek*), picking a tube loads the piece straight into the piano instead.

## How it's built

- `js/ui/library.js`: builds the shelves from `COMPOSERS` and `piecesBy()`; composers without pieces get no shelf. The tubes are pure CSS (gradients for cardboard, rounded caps).
- `js/ui/sheet.js`: the reader view. Keyboard: ← → flip, Space → piano (`ui.replace('piano', …)`, so *Terug* from the piano goes back to the cabinet).
- `js/notation.js`: a small SVG engraver for single-line melodies in treble clef.
  - Staff with 10-unit line spacing, 4 bars per line; 2 lines per page in the reader, 1 in the piano.
  - Note heads (filled or open), stems up or down depending on the position, flags for eighths and sixteenths, dots, sharps/flats, ledger lines above and below, rests (glyphs from the *Noto Music* font), bar lines, a final double bar, time signature, bar numbers.
  - Bar widths depend on how many notes and how long they are.
  - Each note is a `<g class="note" data-i="…">` with a hidden highlight box; the piano adds `active` (lit up) and `done` (played) classes. `renderPage()` returns a map from note index to element.
  - Note names can be letters (C D E) or solfège (do re mi), see [piano](piano.md).

## Known limits / next steps

- Melody only, treble clef only: no chords, no bass clef, no key signatures (accidentals are written on every note), no beams (each eighth has its own flag), no ties or lyrics.
- For real scores from Muziekschatten, an engraver like VexFlow or OpenSheetMusicDisplay (MusicXML) would be needed; the highlight hook (`data-i` per note) can stay the same.
