# Prologue: where and when you are

The short film that plays when the game starts, before the [future street](future-street.md). It tells the player where they are (Amsterdam), when (the year 2126), and why the city is flooded, in the same slow anime style as the [story](story.md): painted shots that drift and zoom, dissolve into each other, with captions on paper strips.

The tone is calm and a little sad, never scary: nobody gets hurt, the people *moved to higher ground*, and it ends on hope (a boy still searching for the music).

## For the player

1. **Amsterdam today** (*Amsterdam, 2026. Een stad vol water, fietsen… en muziek.*): the same canal as in the game, on a fresh morning: people on bikes, a boat with a Dutch flag, the music shop with guitars in the window. The camera pans slowly along it; birds fly over.
2. **The map** (*De aarde werd steeds warmer. Het ijs smolt en de zee steeg.* / *Het water kwam steeds verder het land in.*): an old map of the Netherlands. A year counter top right counts from 2026 to 2126 while the sea creeps in from the coast over the low west and north; the weather grows darker and it starts to rain.
3. **The year 2126** (*Het jaar 2126. De mensen zijn vertrokken naar hoger land.* / *De lucht is vies van stormen en branden. Wie naar buiten gaat, draagt een masker.* / *De stad is stil — er klinkt geen muziek meer. Maar één jongen is nog op zoek…*): the camera tilts down from the storm to the flooded street. Grey smoke drifts through, lightning flashes in the distance, and the boy in his gas mask appears on the quay. Then the picture dissolves into the playable [future street](future-street.md).

A click, tap, or ↑ / Enter / Space jumps to the next shot. The whole prologue takes about 32 seconds.

## How it's built

`js/prologue.js`, class `Prologue`, registered as the scene `prologue`; it is the first scene (`game.scene` in `js/main.js`), so the title screen's Start button plays it. Like the story it extends `Film` from `js/film.js` (timeline, dissolves, captions, rain, dust: see [story](story.md)) and ends with `game.goTo('future', { dissolve })`.

Art from `public/art/intro/`: `today-street` (made as an edit of `past-street`, so the shop, lamp and bridge line up), `map-now` and `map-flooded` (the second is an edit of the first: the same map with water), and from the story `future-street`, `future-frame` and `kid-back/future`.

- **Today**: `today-street` with a slow pan, soft sun beams, floating light and a few birds drawn as ink strokes (`this.birds`).
- **Map**: `map-now` is drawn, then `map-flooded` on top through a mask: a soft radial gradient centred on the sea (`SEA`) that grows inland over about 8 seconds (`destination-in` on a separate canvas `this.flood`, at the screen's real pixel size). Because the two maps only differ where the water is, only the water seems to move. The year (`YEAR_FROM` → `YEAR_TO`) follows the same progress, on a paper strip top right in EB Garamond (`yearPlaque()`). A dark tint and rain grow with it.
- **Future**: `future-street` tilts down (zoom and focus move from the sky to the quay over 9 s); the vines of `future-frame` in front; smoke as big soft grey clouds drifting slowly (`drawSmoke()`, thicker from the second caption); rain; two distant lightning flashes; the boy fades in at `KID_AT` (pinned to the painting with `boyFromBehind()`).

## Testing

`?autostart` plays the prologue; `?autostart&scene=future` skips it.

## Known limits / next steps

- No sound yet: a calm city in shot 1, rain and wind later.
- The captions could be read aloud like the shopkeeper's texts, for kids who can't read yet.
