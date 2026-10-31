# Composers: portraits, biography and music

The portraits on the shop wall above the piano. Clicking them opens a close-up of the wall; each portrait there opens the composer's story and music.

## For the player

1. **Portrait wall** (*De componisten*), full screen: the close-up `public/art/closeups/gallery-wall.webp` (green damask wall, picture lamp, wainscot) with the six portraits in the same gilded frames as in the shop, two rows of three, slightly crooked like on a real wall, without name plaques (the name shows when you open one). Pointing at a frame straightens it and makes it glow; click it to open the composer.
2. **Composer card** (a paper card over the dimmed wall):
   - Large portrait with plaque.
   - Large portrait with plaque on the left.
   - **Biography** (*Het verhaal van …*) on the right, in short, simple sentences, a **Wist je dat?** (did you know?) fact, and birth/death dates and places. **Voorlezen** (speaker icon) reads it aloud in Dutch.
   - Under it, **Muziek van …**: one card per piece of this composer (their hand-written pieces, which are not in the cabinet: that holds the SOM songs), with its music cylinder, title and subtitle, and two buttons: **Luister** plays it on the [gramophone](gramophone.md), **Bladmuziek** opens the [sheet-music book](sheet-music.md). Composers without pieces yet get a short note from Meneer Simone instead.
   - The family tree that used to be here was removed.

The six composers: Bach, Mozart, Beethoven, Chopin, Verdi, Tchaikovsky (*Tsjaikovski* in Dutch).

## How it's built

`js/ui/gallery.js`: `galleryView()` and `composerView()`. Data in `js/data.js` (see [content data](content-data.md)).

- **Wall close-up**: `galleryView()` uses `frame(…, { closeup })` (see [game shell](game-shell.md)). `HANG` gives each frame's centre x, top and height in pixels of the 1672 × 941 picture; they're turned into percentages so the frames scale with the picture. Which frame each composer gets, and the size of each frame's opening, come from `js/frames.js` (shared with the shop wall). The portrait is an `<img>` under the frame image, fitted to the opening and rounded for the oval frames.

- **Composer card**: a CSS grid, portrait (`p`) left over two rows, biography (`b`) and music (`m`) on the right. The music cards use `cylinderColor()` and `coverFor()` from `js/ui/library.js`, so the cylinder and the little cover on the button are the same as at the gramophone and in the cabinet.
- On narrow screens portrait, biography and music stack vertically.
- The `tree` data in `js/data.js` is no longer shown.

## Known limits / next steps

- Pieces exist only for Bach, Mozart and Beethoven so far; Chopin, Verdi and Tchaikovsky have a biography only.
- Links between composers (teachers, influences) from the design guide's story flow aren't there yet.
