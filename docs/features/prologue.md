# Prologue: where and when you are

The short film that plays when the game starts, before the [future street](future-street.md). It tells the player where they are (Middelburg), when (the year 2126), and why the city is flooded, in the same slow anime style as the [story](story.md): painted shots that drift and zoom and slowly dissolve into each other, with captions on paper strips. **Overslaan** (top left, where the help button usually is) or Esc skips it.

The tone is calm and a little sad, never scary: nobody gets hurt, the people *moved to higher ground*, and it ends on hope (a boy still searching for the music).

## For the player

1. **Middelburg today** (*Middelburg, 2026. Een stad vol water, fietsen… en muziek.*): the same canal as in the game, on a fresh morning: people on bikes, a boat with a Dutch flag, the music shop with guitars in the window. The camera pans slowly along it; birds fly over.
2. **The map** (*De aarde werd steeds warmer. Het ijs smolt en de zee steeg.* / *Het water kwam steeds verder het land in.*): an old map of the Netherlands. A year counter top right counts from 2026 to 2126 while the sea creeps in from the coast over the low west and north; the weather grows darker and it starts to rain.
3. **The year 2126** (*Het jaar 2126. De mensen zijn vertrokken naar hoger land.* / *De lucht is vies van stormen en branden. Wie naar buiten gaat, draagt een masker.* / *De stad is stil — er klinkt geen muziek meer. Maar één jongen is nog op zoek…*): the camera tilts down from the storm to the flooded street. Grey smoke drifts through, lightning flashes in the distance, and the boy in his gas mask appears on the quay. Then the picture dissolves into the playable [future street](future-street.md).

Made for young kids: when a caption has come in, the film waits until the player **clicks or taps**; after a moment a pulsing brass ▶ on the caption shows that they can go on. Then the caption fades and the film continues (the next thing, like the sea rising on the map, happens only after the click). While it waits, the picture keeps living (rain, dust, breathing, a gentle sway). Keys and clicks without a caption don't skip anything, so little kids can't skip by accident. Without the reading time the prologue takes about 40 seconds.

## How it's built

`js/prologue.js`, class `Prologue`, registered as the scene `prologue`; it is the first scene (`game.scene` in `js/main.js`), so the title screen's Start button plays it. Like the story it extends `Film` from `js/film.js` (timeline, dissolves, captions, rain, dust: see [story](story.md)) and ends with `game.goTo('future', { dissolve })`.
- **Dissolves**: the shots fade slowly into each other (`Film`'s dissolve). `Film` can also *wipe* shots in behind a seam of golden light with a cascade of notes (`wipe: true`, `drawWiped()`); the prologue used that for a while but is back to plain dissolves, so the swirl stays special to the time travel in the [story](story.md).
- **Captions in cascade**: the paper strip slides in from the right and its words follow one by one from left to right (`WORD_GAP` 0.07 s apart), each dropping into place; timed on the live clock, so a long caption finishes even while the story waits.
- **Overslaan**: `Film.skip()` goes straight to `next` (fade through black). While a film is on, `#game.in-film` hides the help button and shows `#btn-skip`; Esc does the same (`game.back()`). The [story](story.md) has it too.

Art from `public/art/intro/`: `today-street` (made as an edit of `past-street`, so the shop, lamp and bridge line up), `map-now` and `map-flooded` (the second is an edit of the first: the same map with water), and from the story `future-street`, `future-frame` and `kid-back/future`.

- **Today**: `today-street` with a slow pan, soft sun beams, floating light and a few birds drawn as ink strokes (`this.birds`).
- **Beats**: `FLOOD` (the sea rises after the first map caption), `TILT` (the camera coming down in shot 3), `BOY` (the boy appears after the smoke caption).
- **Map**: `map-now` is drawn, then `map-flooded` on top through a mask: a soft radial gradient centred on the sea (`SEA`) that grows inland over about 8 seconds (`destination-in` on a separate canvas `this.flood`, at the screen's real pixel size). Because the two maps only differ where the water is, only the water seems to move. The year (`YEAR_FROM` → `YEAR_TO`) follows the same progress, on a paper strip top right in EB Garamond (`yearPlaque()`). A dark tint and rain grow with it.
- **Future**: `future-street` tilts down (zoom and focus move from the sky to the quay over `TILT`, 7 s); the vines of `future-frame` in front; smoke as big soft grey clouds drifting slowly (`drawSmoke()`, thicker from the second caption); rain; two distant lightning flashes; the boy fades in at `KID_AT` (pinned to the painting with `boyFromBehind()`).

## Testing

`?autostart` plays the prologue; `?autostart&scene=future` skips it.

## Known limits / next steps

- No sound yet: a calm city in shot 1, rain and wind later.
- The captions could be read aloud like the shopkeeper's texts, for kids who can't read yet.
