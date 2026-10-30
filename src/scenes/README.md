# Scenes

**Owners:** Amber, Antonio (front end)

One Phaser scene per view:

| Scene | What happens |
|---|---|
| `BootScene` | Load art (from `public/art/manifest.json`) and data |
| `FutureStreetScene` | Opening: flooded street, find the box |
| `TimeTravelScene` | The transition into the past |
| `PastStreetScene` | Walk along the canal to the shop door |
| `ShopScene` | The hub: walk around, talk to the shopkeeper, click objects |
| `PianoScene` | Hear the piece, see the keys and notes, play along |
| `CabinetScene` | Browse sheet music |
| `WorkScene` | One piece: title page, score, people on it |
| `GalleryScene` / `PersonScene` | Composer portraits and life stories, links to their works |
| `GramophoneScene` | Listen to a piece |

Split the scenes between you so you rarely edit the same file.
