# Player character

The boy with the flat cap and backpack from the design guide. The same character walks on the street and in the shop.

## For the player

- ← → or A / D to walk; the boy turns to face where he's going.
- Click or tap a spot to walk there; click an object to walk to it and use it.
- Standing still, he breathes gently.

## How it's built

`js/boy.js`, class `Boy`, and the sprite sheet `assets/boy-walk.png`.

- **Sprite sheet**: 8 frames of 180 × 277 px in one row, cut from `docs/design/Eight-Frame Boy Walking Cycle.png` with the white background removed and every frame aligned on the feet and head (see [assets](assets.md)). The sprite faces right; facing left is a horizontal flip.
- **Movement**: `update(dt, input, minX, maxX)`. Keyboard input wins over a click target. `walkTo(x, onArrive)` walks to `x` and calls `onArrive` when there (used to open an object after walking to it). Walking into the edge of the scene also ends the walk, so `onArrive` still fires.
- **Animation speed** is tied to walking speed (one frame every 26 px), so the feet don't slide.
- **Draw**: `draw(ctx, footY, height)` draws a soft shadow and the frame, scaled to the height the scene asks for (175 on the street, 250 in the shop).

## Known limits / next steps

- There's no real standing pose: standing uses frame 1 of the walk. An idle sprite on white would fix this.
- No "enter the door" or "reach up to the shelf" animations.
