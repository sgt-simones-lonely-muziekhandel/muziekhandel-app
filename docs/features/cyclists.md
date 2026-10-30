# Cyclists

People on old Dutch bikes ride past when the player stops doing anything, so the street feels alive.

## For the player

After about 4 seconds without input, a cyclist rides in from one side and out the other. Every 5–10 seconds another one may come, at most two at a time. As soon as the player moves or clicks, no new cyclists start (the ones on screen finish their ride).

## How it's built

`js/cyclist.js`, class `Cyclist`; spawning is in `Street.update()` (`js/street.js`).

- **Idle time** is tracked by the game (`game.idleTime`), reset on every key press and pointer press.
- **Spawning**: the cyclist starts just outside the visible area on the side it comes from and gets a random speed (150–220 px/s).
- **Riders**: each cyclist is, at random, the gentleman with the bowler hat (`public/art/characters/cyclist-man`) or the lady with the straw hat and the flower basket (`cyclist-woman`), built as cut-out puppets like the [player](player.md).
- **Rig** (`RIGS` in `js/cyclist.js`): laid out in the pixels of each rider's `full.webp`, so it could be lined up against the finished drawing.
  - The `bicycle` frame is placed by its bottom bracket, with a scale and a slight tilt; the wheel hubs are points of `bicycle.webp` (`rearHub`, `frontHub`) taken through that same transform, so the wheels always sit in the dropouts.
  - `wheel-1` / `wheel-2` turn around their hubs with the distance travelled; the `crank` turns around the bottom bracket, geared (0.45 turns per wheel turn).
  - Legs: two-bone IK from the hip to each pedal, bending the knee forward. Each leg piece is fitted with `bone()`: stretched along the bone to the right length, but only `s` times across it, so the shoes don't grow. The far leg is drawn darker and behind the frame.
  - The man: thighs, shins, torso (with both arms on the handlebar) and head.
  - The lady: a separate skirt, torso and head never looked like one person, so her whole body (hat, head, arms on the handlebar, the long skirt down to its hem) is cut in one piece out of her `full.webp`, along the outline `body.outline` (in `full.webp` pixels), by `cutOut()` on a cached canvas. Only her boots and stockings (`lower-leg-1/2`) move under the hem, on IK legs whose knees stay hidden under the skirt. Her bicycle is lined up on the hubs of the finished drawing (placed by the rear dropout, `bicycle.bb` gives the bottom bracket the pedals turn around), so the painted body sits on it exactly as drawn.
  - The pieces have small round joint marks painted on them; `patch` covers those with the colour next to them, on a cached canvas.
  - The body bobs a little with the pedals.
- **Size**: 200 world units high (the boy is 165), standing on the quay at y = 574, with a soft shadow; flipped for riders going left.
- They're removed once they're 400 px outside the view.

## Known limits / next steps

- A bike bell ("tring tring") when they pass would add a lot; it needs the audio to be started.
- The wheels are drawn flat, while the painted full drawings show them very slightly oval.
- The lady's skirt is part of her one-piece body, so it doesn't move with the knees (only the boots do).
