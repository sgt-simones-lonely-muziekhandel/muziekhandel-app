# Real sheet music from the SOM collection

The shop sells real sheet music: the 37 songs of our SOM collection (old Dutch, Belgian, English and German popular music, dance tunes and piano solos), every hand-checked score in the pipeline's `validated/` (its 64 `.mxl` files), fill three cabinets of 15 places. We have an agreement with SOM to use the scans and so the melodies played on the game's piano. The songs come from the **sheet2midi** pipeline, which turns the PDF scans into MusicXML with Audiveris (optical music recognition). It lives in `tools/sheet2midi/` (copied from its own repo, see its [README](../../tools/sheet2midi/README.md)); only its hand-checked scores (`validated/`) are used.

The hand-written demo pieces of the six composers are no longer in the cabinet or the cylinder chest: they are the composers' own music, reached from their cards in the [portrait gallery](composers.md).

## The songs

| Song | Makers | From |
|---|---|---|
| Die Oogen van jou | Wim Kreuer, tekst Arnold Frank | own score (melody only, a lead sheet) |
| The girl with the hazel brown eyes | Louis Noiret | own score, with piano |
| De tango uit mijn dromen | Jack Bess en Tom Rays | own score, with piano |
| You (You're the cause) | Jack Millar | own score, with piano |
| Un livre d'images | Emile Deltour, tekst Noël Barcy | own score, with piano |
| Way Down South | Peter Packay, tekst Jim Mac Kilburn en Glen Powell | own score, with piano |
| Posthorn Galop | H. Koenig | piano solo (melody: the right hand) |
| Oh, my Horsey | Ar Colijn, tekst Th. C. Warrens | own score, with piano |
| Black Train Blues, That Girl of Mine | Peter en Paul Prennessel; Jimmy Toren en Jeff De Boeck; teksten Pol Stone | one score with two songs (movements 1 and 2), with piano |
| Prikkebeen, Hoe heet je?, Weet je wat ik zou willen?, Valse miniature, Hompie-Kurkie | Bart Ekkers (Hompie-Kurkie with Jack Bess and Pi Scheffer) | own scores; *Hoe heet je?* and *Weet je…* melody only; *Valse miniature* is played from the piano's right hand |
| Améthyste, Chocante | Rud Wharton, Pol Stone, Marcel Azzola | one score with two piano/accordion waltzes (movements 1–3 and 4–5) |
| Meet me to-night in Dreamland | Leo Friedman, tekst Beth Slater Whitson | own score, with piano |
| Memory of Hawaii | Henk Breton, tekst D. Ace | own score, with piano |
| Het gaat alles voorbij | Fred Raymond, tekst Arnold Frank | own score, melody only |
| Flying-Patrol | Mac. A. Parr en Joop de Leur | piano solo (polka) |
| In eenen nacht in mei, Señor en Señorita | Peter Kreuder (and Friedrich Schröder), teksten May Dale, Th. C. Warrens | own scores, melody only |
| Ping Ping Ping | Tom Rays, tekst Jack Bess | own score, with piano |
| Uit de Cantine | Louis Noiret, Joop de Leur e.a. | piano solo (march potpourri) |
| Witte Rozen | Tummers, tekst E. Paoli | own score, melody only |
| Keep Pretending | Guy Brain, bewerking Dolf van der Linden | an orchestra's set of parts: the first violin's page |
| In de Sahara, Tante Jeannetje, Waarom treuren, Moana, Het ouwe nest, Pretoria, Meisje waarom wou jij gaan trouwen, Offer, De mooie vrouwtjes, De noodrem | Louis Noiret, Oct. van Aerschot, Luvaun (Moana); texts by Kees Pruis, Maupie Staal, Chef van Dijk | *Album voor Mandoline en Viool* (Louis Noiret Music Publishing Company, Amsterdam), one page each, melody only |

## For the player

- **In the cabinets** (three for the songs, *kast 1–3*, then the composers' cabinet; ← → or the arrows walk along) each shelf holds five songs of its level, so every cabinet has easy songs on top and hard ones below. Each song stands in its own place with its printed cover, or, when it has none (*De tango*, the album's tunes), a **cover drawn for it**: a coloured board with a gold frame, the title and *muziek van* the composer in a cream cartouche, a mandolin (album) or violin (tango) in a burst of rays, and for the album *Album voor Mandoline en Viool · No. 3* and *Amsterdam · Holland*. Only the makers' names are on it, no portrait. The shelf (★ / ★★ / ★★★) is the difficulty the import worked out.
- **The book** is only **the original**: the scan pages, without a drawn cover or caption. An album tune's book has the album's own printed cover on top and then its page; the pages bend like paper when turned (see [sheet music](sheet-music.md)). The melody in the game's coloured notes is on the piano. The makers have no card in the gallery, so their names are not a link.
- **Piano**: the melody can be learned with *Speel mee* and plays along in free play, like every piece. Triplets have a small 3 over them; tied notes are joined with an arc and only played once (no name circle on the second note).
- **Listening** (*Luister* at the piano and the gramophone): the melody, and for the four songs with a piano part the real **piano accompaniment** under it, softer, starting with the piano's introduction before the singing comes in. At the piano **every key that sounds lights up** while it sounds: the melody in its full colour (and on the sheet), the accompaniment softer. *Die Oogen van jou* and the album tunes have no piano part, so they play the melody alone.

## How it's built

- **`scripts/import_scores.py`** (Python, needs Pillow and PyMuPDF): reads `tools/sheet2midi/validated/` (or another copy of the pipeline with `--source`), and writes
  - `js/som-scores.js`: `SOM_PIECES`, generated, don't edit by hand;
  - `public/art/scores/<scan>/page-N.webp`: the scan pages, 1100 px wide, from `tools/sheet2midi/scans/` (not in git): one folder per song (`som-oogen`, …), one for the album (`som-81323`, rendered once). Without a PDF (or with `--no-scans`) the pages already there are kept.
- **Which files**: a folder with a merged `.xml` (the first songs) reads that; otherwise all its `.mvtN.mxl` are read one after the other, in number order (`load_score()`, `read_scores()`: the n-th vocal/piano part of each movement follows on the one before, divisions and time signature carry over). A song can name its `movement`, a number or a list, when one score holds several songs (*Black Train Blues* / *That Girl of Mine*, *Améthyste* / *Chocante*) or a set of parts (*Keep Pretending*: the first violin, movement 4).
- **Piano solos**: a score without a vocal part, or a song with `melodyFrom: "piano"` (*Valse miniature*, whose OMR'd vocal part is wrong), takes its melody from the piano's top staff (`right_hand()`); those notes are then left out of the accompaniment so they don't sound twice.
- **Scan pages** no song shows (the other instruments' parts of *Keep Pretending*, publishers' advertisement pages) are deleted after the import.
- `SONGS` at the top of the script lists the songs with what the MusicXML doesn't say: title, subtitle, makers (`credit`, `creditShort`), tempo (from the tempo word on the scan), whether the first scan page is a cover, and for a cover-less song the `emblem` on its drawn cover. The album's tunes (`ALBUM_TUNES`) each name their `movement` (Audiveris writes one `.mvtN.mxl` per tune) and their scan `pages` (`[1, N]`: the album cover, then the tune's page), plus `series` and `place` for the drawn cover. To add a song: convert, merge and check it with the pipeline, add a line, run the script.
- **Difficulty** (`difficulty()`, `assign_levels()`): for each melody the range (semitones), the share of black keys, of notes shorter than an eighth and of odd values (dotted, triplets), the mean leap, notes a second at the song's tempo, and the length. Each measure is turned into a z-score against the other songs and summed; the songs are ranked and split into equal thirds, ★ ★★ ★★★; the cabinets (`songCabinets()` in `js/ui/library.js`) put five of each level in each cabinet. The script prints the table.
- **Melody**: per bar, the first non-piano part that has notes there (OMR sometimes splits one voice over several parts, page by page), its first voice, the top note of chords. Gaps become rests, notes past the bar line are cut. Bars where nobody sings at the start and the end are left out; with a piano part the intro's length becomes `introBeats`.
- **Durations**: counted in 24ths of a quarter. Each note is written as the fewest game tokens; a value that needs more than one token becomes tied notes. Every bar then adds up exactly to the time signature (checked for all 15). One time signature per song; when OMR missed it (*De tango*), the usual bar length decides (2/4).
- **Accompaniment**: every note of the piano part(s), tied notes joined, as `[onset, duration, midi]` in 24ths of a quarter from the start of the music (`accomp`, `accompGrid: 24`).
- **In the game**: `PIECES` in `js/data.js` is `SOM_PIECES` (cabinet, cylinder chest); `ALL_PIECES` adds the composers' demo pieces, for `pieceById()`. `creditFor(piece)` gives the composer, or for these songs `{ id: null, name: credit, short: creditShort }`. `piece.scans = { dir, pages, cover }` (`pages`: the page numbers in book order, the first is the cover when `cover`) drives the cover (`coverHtml()` in `js/ui/library.js`) and the pages of the book (`js/ui/sheet.js`).
- **Drawn covers**: `designedCover(piece, credit)` in `js/ui/cover.js` returns an inline SVG (356 × 498, the shape of the cover pictures), so it is sharp in the cabinet and on the desk. The board colour is one of six old printing inks, chosen from the piece id; the title wraps to at most three lines and sizes itself. Every drawing gets its own gradient ids, since a hidden copy (the cabinet under the book) would otherwise break them.
- New in the note engine for these songs (see [content data](content-data.md)): `16.`, `32`, triplets `ht qt 8t 16t`, and `~` ties. Playback (`playPiece()`, [audio](audio.md)) plays a tied chain as one note and schedules the accompaniment next to the melody, which starts `introBeats` later.

## Known limits / next steps

- *Uit de Cantine* changes metre (6/8, 2/4, 2/2) between its soldiers' songs; the game has one time signature per piece (6/8), so the bars in another metre are cut or padded.
- Piano solos (*Posthorn Galop*, *Flying-Patrol*, *Améthyste*, *Chocante*, *Uit de Cantine*) are fast and full of short notes: the top ★★★ songs. Their melody is the top line of the right hand, which is not always the tune.
- Titles, makers and tempo of the new songs were read from the scans; the tempos are estimates from the tempo words.

- OMR output, even validated: some rhythms are simplified (for example a missed dot becomes a rest), and the first sung note of *The girl with the hazel brown eyes* looks suspicious. Worth playing each song once against the scan.
- The album was printed for mandolin and violin: a few tunes go high (up to E6 in *Tante Jeannetje*), above what the computer keyboard reaches without shifting octaves.
- No lyrics: the MusicXML has none.
- No repeats, D.C. or volta brackets: the music plays straight through as printed.
