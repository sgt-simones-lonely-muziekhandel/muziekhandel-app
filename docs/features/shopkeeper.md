# Shopkeeper (help)

The third object in the shop: Meneer Van der Velde, the friendly owner with the moustache. He's the game's help system.

## For the player

- **Greeting**: the first time the player enters the shop, he welcomes them.
- **Talking to him** (click him, or ↑ when standing at the counter, or the round **?** button top-right at any time): a dialogue box with his portrait, his answer typed out letter by letter, and five questions to choose from:

  | Question | What he explains | Button |
  |---|---|---|
  | *Wat kan ik hier doen?* | Everything in the shop | — |
  | *Hoe speel ik piano?* | Keys, *Speel mee*, plus the [keyboard guide](piano.md#the-keyboard-guide-the-picture-for-learners) | 🎹 Naar de piano |
  | *Waar is de bladmuziek?* | The cabinet, ← →, Space | 📜 Naar de kast |
  | *Wie zijn die mensen aan de muur?* | Composers | 🖼️ Naar de schilderijen |
  | *Mag ik muziek luisteren?* | The gramophone, in the listening corner to the right | 🎵 Naar de grammofoon |

  The button takes the player straight there.
- **🔊 Voorlezen** reads his answer aloud, for kids who can't read yet.
- **Tips in every view**: each view has his face in a medallion in the bottom-left corner with a **?**. Clicking it shows a short tip for that view, which can also be read aloud.

## How it's built

- `js/ui/keeper.js`: `keeperView({ greeting })`, the `TOPICS` list, the typewriter effect.
- `frame()` in `js/ui/ui.js` adds the tip medallion to any view that passes a `tip` text.
- `speak()` in `js/ui/ui.js` uses the browser's speech synthesis with a Dutch (`nl-NL`) voice when available, and strips emoji first.
- His answers describe the room as it is: the piano with the portraits above it, the cabinet right of the counter, the gramophone in the listening corner.
- In the shop he stands behind the counter (`public/art/characters/shopkeeper/full.webp`, see [shop](shop.md)). His face in the medallions is `public/art/characters/shopkeeper/head.webp`.

## Known limits / next steps

- He doesn't move yet. The separate body parts in `public/art/characters/shopkeeper/` could be rigged to make him wave, point at objects and "talk".
- Speech quality depends on the voices installed on the device.
- He could give hints based on what the player hasn't tried yet.
