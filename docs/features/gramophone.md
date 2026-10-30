# Gramophone

A brass-horned gramophone and a cabinet of records to listen to. It stands on the round table in the [listening corner](listening-corner.md), the room to the right of the shop.

## For the player

- Left: the listening corner, the same room as the scene, with the phonograph on the table and the window and lamps following the visitor's clock (evening sky and glowing lamps at night). Once a cylinder is chosen, it stands on the left of the picture, big, with a paper label (title and composer), so you see which music you put on; it trembles a little while it plays. Before that it says *Kies een cilinder uit de kist*. Right: *Nu speelt* (now playing) and *De cilinderkist* (the cylinder chest): one music cylinder per piece (`public/art/items/cylinder/`), each with a paper tag with the title and composer.
- Click a cylinder: its box opens (the open cylinder stays in the chest), the cylinder slides onto the gramophone lying on its side, and after a short spin-up the music plays with an old crackly sound. While it plays, a band of light runs over the cylinder so it looks like it's turning, a progress bar fills, and music notes float out of the horn.
- ■ stops the music; leaving the view stops it too.
- A composer card can open the gramophone with a cylinder already playing.
- Each piece has the same cylinder colour here as in the [sheet music cabinet](sheet-music.md).

## How it's built

`js/ui/gramophone.js`, `gramophoneView({ pieceId })`.

- Playback is `playPiece()` with `setGramophone(true)` from [audio](audio.md) (filtered sound + hiss + clicks).
- A 600 ms delay before the music imitates the cylinder getting up to speed.
- The cylinder colour comes from `cylinderColor(piece)` in `js/ui/library.js`, shared with the cabinet.
- The turning cylinder (a moving striped highlight over it), the cylinder sliding on, and the floating notes are CSS animations; each note gets a random drift and rotation.
- The picture is a `<canvas>` (1279 × 720, `object-fit: cover`) drawn by `drawCornerPicture()` from `js/corner.js`, the same function the [listening corner](listening-corner.md) scene uses, so the time of day matches; it is redrawn every 100 ms while the view is open (for the flickering lamps) and the timer stops in `destroy`. The chosen cylinder is the `.cover` figure on the left of it, beside the phonograph (`cover-in` pop-in animation, `cover-hum` while playing).

## Known limits / next steps

- It plays the melody-only data, the same as the piano. Real early recordings would make it a true listening corner.
- No volume control.
