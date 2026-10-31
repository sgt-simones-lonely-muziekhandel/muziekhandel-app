# Shopkeeper (help)

The third object in the shop: Meneer Simone, the friendly owner with the moustache. He's the game's help system.

## For the player

- **Greeting**: the first time the player enters the shop, he welcomes them.
- **Talking to him** (click him, or ↑ when standing at the counter, or the round **?** button top-right at any time): a sheet of old paper a little above the middle of the screen (not at the bottom edge). On the left his portrait; his **mouth moves while his answer appears letter by letter** in a speech bubble next to him (with a little tail pointing at him), and stops at every full stop and comma. Now and then he blinks. A click on the text shows it all at once. Under a dashed line, *Vraag het maar…* and the five questions, written on the paper like lines in a notebook (ink text, a brass dot, a thin line under each; the chosen question is marked). The dialog is wide (up to 1180 px) so every answer fits without scrolling, also the longest one with the keyboard guide: inside the dialog the guide's keys are sized to the screen height (`clamp(30px, 5vh, 46px)`) and its six rules sit in two columns. On low or narrow screens (≤ 780 px high or ≤ 1100 px wide) the text, rules and questions get a little smaller. Checked at 1024×768, 1280×720, 1366×768, 1400×800, 1440×900 and 1920×1080. Only on phones can an answer still be longer than the bubble; then it scrolls inside it (no scrollbar) with a soft fade at the bottom.

  | Question | What he explains | Button |
  |---|---|---|
  | *Wat kan ik hier doen?* | Everything in the shop | — |
  | *Hoe speel ik piano?* | Keys, *Speel mee*, plus the [keyboard guide](piano.md#the-keyboard-guide-the-picture-for-learners) | Naar de piano |
  | *Ik weet nog niks van muziek. Help!* | The [notenles](lessons.md), step by step | Naar de notenles |
  | *Waar is de bladmuziek?* | The cabinet, ← →, Space | Naar de kast |
  | *Wie zijn die mensen aan de muur?* | Composers | Naar de schilderijen |
  | *Mag ik muziek luisteren?* | The gramophone, in the listening corner to the right | Naar de grammofoon |

  The button takes the player straight there.
- **Voorlezen** (a speaker icon under his name) reads his answer aloud, for kids who can't read yet; his mouth moves while the voice speaks. While it reads, the button says **Stoppen**.
- **Tips in every view**: each view has his face in a medallion in the bottom-left corner with a **?**. The medallion stays still in its place (it used to bob up and down). Clicking it shows a short tip for that view, typed out while the face in the medallion talks; it can also be read aloud.

## How it's built

- `js/ui/keeper.js`: `keeperView({ greeting })`, the `TOPICS` list and the dialog. The speech bubble gets `.more` (a `mask-image` fade) while it can still scroll down, checked on scroll and with a `ResizeObserver`.
- **Close button**: a round brass ✕ on the paper's top-right corner (`.keeper-close`), clear of the speech bubble; it turns a quarter on hover.
- **Talking face** (`js/ui/ui.js`): every `.keeper-face` shows `head.webp`; `.talking` swaps in `head-talk.webp` (mouth open) and `.blink` `head-blink.webp` (same framing, so nothing jumps). `talk(face)` opens and closes the mouth at an irregular speaking rhythm until stopped; a shared timer blinks faces that aren't talking. `typeText(p, text, face)` writes the text with `talk()` running, pausing (mouth shut) after `.` `!` `?` and `,`. Letters are due at fixed times (28 ms each), so a busy frame makes it catch up instead of slowing down. `speak(text, face)` also talks while the voice speaks (`onstart` / `onend`).
- `frame()` in `js/ui/ui.js` adds the tip medallion to any view that passes a `tip` text.
- `speak(text, face, button)` uses the browser's speech synthesis. It picks the most natural Dutch voice there is (`pickVoice()`, again when the browser's voices arrive late): neural *Natural*/*Online* voices (Edge) first, then Google's (Chrome), then *Premium*/*Enhanced*/Siri voices (macOS, iOS), then any Dutch voice, nl-NL before nl-BE. Before, it took the first Dutch voice, or none when the list wasn't loaded yet (a robotic default reading Dutch). The robotic voices read at 0.9× speed, the natural ones at 0.97×. Text is read a sentence at a time: it sounds less run-on, and Chrome doesn't cut off long texts. Emoji are stripped first.
- **Stopping**: with `button`, the *Voorlezen* button is a toggle: while reading it says *Stoppen* (a stop square), pressed again it stops. `stopSpeaking()` stops the voice and the talking face and puts the button back; it runs whenever a view opens or closes, when a tip closes, when a lesson turns its page and when the tab is hidden. Each reading has its own token, so a cancelled reading that ends a moment late can't stop the next one.
- His answers describe the room as it is: the piano with the portraits above it, the cabinet right of the counter, the gramophone in the listening corner.
- In the shop he stands behind the counter (`public/art/characters/shopkeeper/full.webp`, see [shop](shop.md)). His face in the medallions and the dialog is `public/art/characters/shopkeeper/head.webp` (with `head-talk` / `head-blink`).

## Known limits / next steps

- Only his face moves. `public/art/characters/shopkeeper/` also has body parts and `head-smile` / `head-surprised`, so he could be built as a puppet like the [boy](player.md) behind the counter: waving, smiling at a finished piece.
- Speech quality depends on the voices installed on the device.
- He could give hints based on what the player hasn't tried yet.
