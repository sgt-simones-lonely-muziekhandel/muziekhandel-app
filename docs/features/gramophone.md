# Gramophone

The fifth object in the shop: a brass-horned gramophone and a cabinet of records to listen to.

## For the player

- Left: the gramophone illustration. Right: *Nu speelt* (now playing) and *De platenkast* (the record cabinet) with one record per piece.
- Click a record: it starts spinning, after a short spin-up the music plays with an old crackly sound, a progress bar fills, and music notes float out of the horn.
- ■ stops the record; leaving the view stops it too.
- A composer card can open the gramophone with a record already playing.

## How it's built

`js/ui/gramophone.js`, `gramophoneView({ pieceId })`.

- Playback is `playPiece()` with `setGramophone(true)` from [audio](audio.md) (filtered sound + hiss + clicks).
- A 600 ms delay before the music imitates the record getting up to speed.
- Spinning records and floating notes are CSS animations; each note gets a random drift and rotation.
- Record label colours come from the piece title, so each record looks different but stays the same every visit.
- The image is `assets/gramophone-corner.jpg`, cropped from the reference art to remove its Italian text labels.

## Known limits / next steps

- It plays the melody-only data, the same as the piano. Real early recordings would make it a true listening corner.
- No volume control.
