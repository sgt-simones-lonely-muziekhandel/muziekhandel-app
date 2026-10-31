# Portrait wall (the team) and composer cards

The portraits on the shop wall above the piano are the **four makers of the game**, painted as oil paintings in old-fashioned clothes (`public/art/portraits/team-1` … `team-4`). They used to be six composers; the pictures don't show composers, so no composer names are on the wall any more. The composer cards and their data are still in the code, but nothing in the shop opens them any more (the cabinet holds the SOM songs, whose makers have no card); `?open=composer&composer=bach` still shows one.

## For the player

1. **Shop wall**: four gilded frames above the piano, two by two left and right of the hanging lamp, without name plaques. The hotspot is called *Schilderijen*.
2. **Portrait wall** (*De makers*), full screen: the close-up `public/art/closeups/gallery-wall.webp` (green damask wall, picture lamp, wainscot) with the four paintings in one row, rectangles at the sides and ovals in the middle, slightly crooked like on a real wall. Pointing at a frame straightens it and makes it glow; clicking any of them opens **De makers van dit spel**: a paper card with all four portraits and a short text that these people made the game.
3. Meneer Simone's topic *Wie zijn die mensen aan de muur?* now says they are the makers of the game.
4. **Composer card** (no longer reachable in normal play; kept for later) (a paper card over the dimmed wall):
   - Large portrait with plaque.
   - Large portrait with plaque on the left.
   - **Biography** (*Het verhaal van …*) on the right, in short, simple sentences, a **Wist je dat?** (did you know?) fact, and birth/death dates and places. **Voorlezen** (speaker icon) reads it aloud in Dutch.
   - Under it, **Muziek van …**: one card per piece of this composer (their hand-written pieces, which are not in the cabinet: that holds the SOM songs), with its music cylinder, title and subtitle, and two buttons: **Luister** plays it on the [gramophone](gramophone.md), **Bladmuziek** opens the [sheet-music book](sheet-music.md). Composers without pieces yet get a short note from Meneer Simone instead.
   - The family tree that used to be here was removed.

The six composers: Bach, Mozart, Beethoven, Chopin, Verdi, Tchaikovsky (*Tsjaikovski* in Dutch).

## How it's built

`js/ui/gallery.js`: `galleryView()`, `teamView()` (view `team`) and `composerView()`. Data in `js/data.js` (see [content data](content-data.md)): `TEAM` lists the four portraits with an empty `name`; fill in a name and a brass plaque appears under that frame, on the wall close-up, in the shop and on the team card.

- **Shop wall**: `FRAMES` in `js/shop.js` (centre x, top, height in world units, and the team id); `drawFrame()` skips the plaque when there's no name.
- **Wall close-up**: `galleryView()` uses `frame(…, { closeup })` (see [game shell](game-shell.md)). `HANG` gives each frame's centre x, top and height in pixels of the 1672 × 941 picture; they're turned into percentages so the frames scale with the picture. Which frame each portrait gets (`TEAM_FRAME`), and the size of each frame's opening, come from `js/frames.js` (shared with the shop wall). The portrait is an `<img>` under the frame image, fitted to the opening and rounded for the oval frames.

- **Composer card**: a CSS grid, portrait (`p`) left over two rows, biography (`b`) and music (`m`) on the right. The music cards use `cylinderColor()` and `coverFor()` from `js/ui/library.js`, so the cylinder and the little cover on the button are the same as at the gramophone and in the cabinet.
- On narrow screens portrait, biography and music stack vertically.
- The `tree` data in `js/data.js` is no longer shown.

## Known limits / next steps

- Pieces exist only for Bach, Mozart and Beethoven so far; Chopin, Verdi and Tchaikovsky have a biography only.
- Links between composers (teachers, influences) from the design guide's story flow aren't there yet.
