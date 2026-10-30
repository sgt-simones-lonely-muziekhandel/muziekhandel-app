# Story: the time travel

The short film between the [future street](future-street.md) and the [street](street.md) in the past. It plays after the boy opens the crate, and feels like the opening of an anime: three painted shots that drift and zoom slowly, dissolve softly into each other, and keep small things moving.

## For the player

1. **The crate** (*Tussen de puinhopen staat een oude kist…*): seen from above in the rubble and rain, closed, golden light through the cracks. The camera pushes in slowly; a golden flash, and the crate lies open with the sheet music and the cylinders.
2. **The tube** (*Hij maakt een rol open… en de muziek begint.*): the boy's hands come in from the bottom-left corner, as if we look through his eyes, and lift a cylinder tube into view. The lid wobbles, pops off and tumbles away; golden light pours out of the tube, with sheets of music and notes spiralling up. Everything blooms into gold.
3. **The time travel** (*…en de wereld verandert…* / *…naar het verleden.*): out of the gold, the flooded street with the boy seen from behind, standing on the quay. A swirl of light sweeps across from right to left, and behind it the same street appears in the past, in the sun: the bridge whole, boats on the water, and the boy's grey jacket turned brown. Sheets of music fly along with the swirl. Then the camera drifts slowly towards the setting sun while the light grows warmer, as if looking ahead to a better time, and the picture dissolves into the [street](street.md), where the game continues.

The boy is seen from behind in the story and has no walk for that, so he only stands and breathes. A click, tap, or ↑ / Enter / Space jumps to the next shot. The whole story takes about 23 seconds.

## How it's built

`js/story.js`, class `Story`, registered as the scene `story`. Everything is drawn in screen space (the scene has `width = 1`, so the camera doesn't move) from the art in `public/art/intro/` (see the [design guide](../design/README.md)).

- **Timeline**: `SHOTS` lists the shots with their length (`dur`) and captions (`[from, to, text]`). Each shot starts `XF` (1.6 s) before the previous one ends, and fades in over it during that time (a cross-dissolve). The story fades in from black over `EDGE` (1.6 s). `T` is the time since the story began; at the end, `game.goTo('street', { dissolve: OUT })` cross-fades the last picture into the street over `OUT` (2.8 s) instead of going through black (see [game shell](game-shell.md)).
- **Shots** are methods with the same name (`crate`, `tube`, `travel`), called with the time inside the shot. Each draws its painting with `cover()` (covers the screen, zoomed around a point), with a slow zoom and drift eased in and out (`ease()`).
- **Crate**: `crate-closed` → `crate-open` at 3.15 s, hidden by a golden flash (the two paintings don't line up exactly). A warm glow breathes over the crate; light rain on top.
- **Tube**: `hands-tube` rises from the bottom-left corner (the sleeves run off the left and bottom edges) and bobs gently. `TUBE_TOP` is the opening of the tube in that picture; the `tube-lid` sits on it, wobbles, then flies off on a curve, spinning and fading. `light-burst` grows out of the opening (additive). The end blooms into gold, which carries over into the next shot.
- **Time travel**: the swirl's x position (`sx`) moves from right to left. Left of it the future is drawn (`future-street`, `kid-back/future`, the dark `future-frame` vines in front and rain), right of it the past (`past-street`, `kid-back/past`, sun beams, floating light). The two street paintings line up, so the change looks like the same place turning into another time. The `swirl` is drawn twice (one mirrored and fainter), swaying, with a soft column of light over the seam. The boy is pinned to the painting at `KID_AT` (on the quay bottom left, solid ground in both paintings; `cover()` returns where the painting went), so he stays on the ground while the camera moves. After the swirl the camera drifts and zooms towards `SUN` and a warm glow grows over the sunset.
- **Living details**: sheets of music and notes (`intro/flying/*`) are particles that spiral out of the tube and fly along with the swirl, turning in the air; specks of dust float in the light (`drawMotes()`); rain falls in the future shots; captions are on the paper strip (`public/art/ui/paper-strip.webp`) in the handwritten font, bottom right (clear of the boy and the hands), fading in and out.

## Testing

`?autostart&scene=story` starts the story directly.

## Known limits / next steps

- No sound yet: the cylinder's first notes when the lid comes off, and a whoosh with the swirl, would add a lot.
- The captions are fixed Dutch text in `SHOTS`; they could be read aloud like the shopkeeper's texts.
- The boy from behind is a single picture, so he can't walk in the story; that would need a back-view walk (separate legs).
