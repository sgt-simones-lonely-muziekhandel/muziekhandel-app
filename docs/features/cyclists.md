# Cyclists

People on old Dutch bikes ride past when the player stops doing anything, so the street feels alive.

## For the player

After about 4 seconds without input, a cyclist rides in from one side and out the other. Every 5–10 seconds another one may come, at most two at a time. As soon as the player moves or clicks, no new cyclists start (the ones on screen finish their ride).

## How it's built

`js/cyclist.js`, class `Cyclist`; spawning is in `Street.update()` (`js/street.js`).

- **Idle time** is tracked by the game (`game.idleTime`), reset on every key press and pointer press.
- **Spawning**: the cyclist starts just outside the visible area on the side it comes from and gets a random speed (150–220 px/s).
- **Looks**: four outfits in `KINDS`: a gentleman with a bowler hat, two ladies with long skirts and wide hats, and a baker with a cap. Some have a basket with flowers or bread.
- **Animation**, all drawn with canvas paths:
  - Wheels with 8 spokes rotate with the distance travelled.
  - The pedal crank turns with the wheels; each leg is placed with two-bone inverse kinematics (hip → knee → foot on the pedal), so the knees bend naturally.
  - The far leg is drawn first in a darker tone, then the bike, then the near leg and the body.
- Cyclists ride along the front edge of the quay (y = 574), in front of the boy, drawn at 1.3× so adults are taller than the boy.
- They're removed once they're 400 px outside the view.

## Known limits / next steps

- A bike bell ("tring tring") when they pass would add a lot; it needs the audio to be started.
- A painted cyclist sprite (4–6 frames on white) would match the art style better than the code drawing.
