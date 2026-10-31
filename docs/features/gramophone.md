# Gramophone

A brass-horned gramophone and a cabinet of records to listen to. It stands on its own cabinet in the [listening corner](listening-corner.md), the room to the right of the shop.

## For the player

- Left: a **showcase**, a dark velvet box with a warm spotlight in the middle (no picture of the room any more). Once a cylinder is chosen it stands there big, in the centre of the light: the open box with the wax cylinder showing (`<colour>-open`), its lid (`<colour>-lid`) dropping in to lean beside it, and a paper label with the title and composer underneath. While it plays the cylinder trembles a little, and the spotlight breathes. Before that it says *Kies een cilinder uit de kist*. Right: *Nu speelt* (now playing) and *De cilinderkist* (the cylinder chest): one music cylinder per piece (`public/art/items/cylinder/`), each with a paper tag with the title and composer (or the song's makers) **under** the box (not over it). The view has no title bar text (*De grammofoon* is only there for screen readers), just *Terug* and ✕.
- Click a cylinder: the box gives a little jump, its **lid pops off**, flies up and lands leaning against the box, and the box now shows the black wax cylinder inside. Then the cylinder slides onto the gramophone lying on its side, and after a short spin-up the music plays with an old crackly sound. While it plays, a band of light runs over the cylinder so it looks like it's turning and a progress bar fills.
- ■ stops the music; leaving the view stops it too.
- A composer card can open the gramophone with a cylinder already playing.
- Each piece has the same cylinder colour here as in the [sheet music cabinet](sheet-music.md).

## How it's built

`js/ui/gramophone.js`, `gramophoneView({ pieceId })`.

- Playback is `playPiece()` with `setGramophone(true)` from [audio](audio.md) (filtered sound + hiss + clicks).
- A 600 ms delay before the music imitates the cylinder getting up to speed.
- The cylinder colour comes from `cylinderColor(piece)` in `js/ui/library.js`, shared with the cabinet.
- **Opening a box** (`openBox()` / `closeBox()`): each chest slot (`.cyl-box`) holds the box picture and its lid (`<colour>-lid.webp`, hidden while closed) laid on top. Opening runs a short jump on the box with the Web Animations API, then swaps the picture to `<colour>-open.webp` (taller, 553 vs 512 px, since the wax cylinder sticks out) and flies the lid up and over in an arc to `LID_REST` beside the box (`fill: forwards`). Closing (picking another cylinder, ■, leaving) flies the lid back onto the box and swaps back to the closed picture. The cylinder on the gramophone (`.now-cyl.put`) starts 0.75 s later, once the lid is off.
- The turning cylinder (a moving striped highlight over it) and the cylinder sliding on are CSS animations. There are no floating music notes any more.
- The showcase (`.gramo-scene`) is CSS only: radial-gradient spotlight on a dark gradient, `::before` breathing glow while `.playing`. The chosen cylinder is the `.cover` figure centred in it, at most about half the showcase high (`height: min(52%, 360px)`), so it stands in the light with room around it and its label always shows: `.cover-stand` (aspect ratio of the open box plus lid, so it scales with the panel) holds `.cover-cyl` and `.cover-lid`, with a soft floor shadow; `cover-in` pops it in, `lid-land` drops the lid next to it, `cover-hum` while playing.

## Known limits / next steps

- It plays the same data as the piano: melody only for the composers' pieces and the songs without a piano part, and melody with the real piano accompaniment for the [real SOM songs](som-scores.md) (the 15 songs of the cabinet; a composer's card can put one of their own pieces on too). Real early recordings would make it a true listening corner.
- No volume control.
