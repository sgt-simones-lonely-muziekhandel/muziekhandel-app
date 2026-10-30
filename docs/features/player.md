# Player character

The boy with the flat cap, jacket and backpack (`public/art/characters/kid-past/`). The same character walks on the street, in the shop and in the listening corner.

## For the player

- ← → or A / D to walk; the boy turns to face where he's going.
- Click or tap a spot to walk there; click an object to walk to it and use it.
- Walking: his legs swing and bend at the knee, his arms swing the other way, he leans forward a little and his body rides up and down on the foot that's on the ground. Starting and stopping blend smoothly, and when he stops his feet come together.
- Standing still, he stands with his feet a little apart (near foot forward) and breathes gently: chest, head and arms move a little.

## How it's built

`js/boy.js`, class `Boy`. The boy is a cut-out puppet (like a paper doll with split pins), posed in code every frame.

- **Pieces** (`PARTS`): `head`, `torso`, `upper-arm-1/2`, `lower-arm-1/2`, `upper-leg-1/2`, `lower-leg-1/2`. The `1` pieces are the near arm and leg, the `2` pieces the far ones. For each piece the joints were measured in its own pixels: `pivot` (the rivet hole it hangs from), `end` (where the next piece hangs: elbow, knee), and for the shoes `soles` (heel, middle, toe). On the torso: `neck`, `shoulder`, `hipFront`, `hipBack`.
- **Skeleton**: hips → upper leg → lower leg, shoulder → upper arm → lower arm, neck → head. Each upper piece is already drawn at a slant in its picture; that `rest` angle is measured once from `pivot` → `end` and taken off, so a pose angle of 0 means "hanging straight down".
- **Walk cycle** (`pose()`): one `phase` angle drives everything. Each hip swings ±26°; the knee bends up to 46° while that leg swings forward; the arms swing ±22° opposite to the legs, with a bent elbow. `phase` moves with the distance walked (one full cycle per 0.72 × the boy's height), so the feet don't slide. `stride` (0–1) eases in and out, so the swing grows and shrinks instead of snapping.
- **Standing pose**: as `stride` goes to 0, the near leg turns 10° forward and the far leg 9° back, so the feet stand apart instead of on top of each other.
- **Walking on the spot**: `march(dt)` keeps the walk cycle going without moving (used while stepping through the shop door).
- **Standing on the ground**: after posing, the lowest heel/middle/toe point of either shoe is put on the floor line. That gives the natural up-and-down of the body for free.
- **Draw order**: far arm, far leg, near leg, torso, head, near arm. The far arm and leg are darkened a little (a cached tinted copy) so the body looks round.
- **Movement**: `update(dt, input, minX, maxX)`. Keyboard input wins over a click target. `walkTo(x, onArrive)` walks to `x` and calls `onArrive` when there. Walking into the edge of the scene also ends the walk, so `onArrive` still fires.
- **Draw**: `draw(ctx, footY, height)` draws a soft shadow and the puppet scaled to the height the scene asks for (165 on the street, 235 in the shop, 360 in the listening corner). The pieces face right; facing left is a horizontal flip.

If a piece of art is replaced, measure its joints again and update `PARTS`.

## Known limits / next steps

- No "enter the door", "reach up to the shelf" or "sit down" animations yet; the puppet makes them easy to add as extra poses.
- `characters/kid-future/` has the same pieces for a second character; `PARTS` would only need its own joint numbers.
