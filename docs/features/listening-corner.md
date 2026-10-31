# Listening corner

A small room to the right of the shop, where the [gramophone](gramophone.md) stands. The player gets there by walking on to the right past the sheet-music cabinet.

## For the player

- A cosy corner: a big window over the canal, a chest full of cylinders, the brass gramophone on its own cabinet, and a green armchair.
- **Gramophone** (*Grammofoon*) and the **crate** (*Cilinders*) both open the gramophone, where you pick a music cylinder and listen.
- **Back to the shop**: keep walking left, or click the left edge (*Terug naar de winkel*). The boy comes back in at the right side of the shop.
- Objects get a paper label like in the shop (no glowing outline); ↑ / Enter / E / Space uses the nearest one.

## How it's built

`js/corner.js`, class `Corner`, scene name `corner`.

- **Background**: `public/art/closeups/gramophone-corner.webp` (1672 × 941), drawn at 720 units high, so the room is 1279 units wide. The scene sets `fitWidth` to that width, so on most screens the whole corner is visible.
- **Gramophone**: `public/art/shop/gramophone.webp` (594 × 1024) is a cylinder phonograph on its own cabinet, drawn whole, 270 units wide, with its feet on the floor between the chest and the armchair (`GRAMO`, bottom at y = 610) and a soft shadow under it.
- **Boy**: drawn bigger than in the shop (360 units high, feet at y = 706) because the corner is a close-up. He can walk from x = 60 to 260 units before the right edge (the armchair).
- **Hotspots** (`HOTSPOTS`): same format and helpers as the shop (`js/hotspots.js`).
- **Picture**: `drawCornerPicture(ctx, sky, time)` draws the room, the phonograph and the time of day.
- **Time of day** (`drawNight`): the painting is in daylight, so by the visitor's clock ([sky](sky.md)) the window panes are multiplied with the real sky colours, the room gets a dark blue tint, and once the street lamps are on, the two lamps seen through the window and a soft warm light over the gramophone glow. The boy is darkened a little, as in the shop. Test with `?uur=21`.
- **Scene changes**: in `update`, holding ← at the left edge calls `game.goTo('shop')`; the shop's right edge calls `game.goTo('corner')`.

## Known limits / next steps

- The crate in the painting holds records, while the game uses cylinders; the art could be repainted with cylinders.
- Nothing turns on the gramophone in the scene itself, only in the overlay.
- The armchair could be a place to sit and listen.
