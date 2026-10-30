# Changelog

Newest first. Each entry links to the feature document it touches.

## 2026-10-30 — First playable version

Added:

- [Street](street.md) in Amsterdam around 1900, with canal crossing, houses and the music shop.
- [Real-time sky](sky.md) that follows the visitor's local time.
- [Cyclists](cyclists.md) who ride past while the player is idle.
- [Player character](player.md) from the 8-frame walk cycle.
- [Shop interior](shop.md) with five interactive objects.
- [Sheet music cabinet and viewer](sheet-music.md) with page flipping and Space-to-piano.
- [Piano](piano.md) with free play, *Luister* (listen) and *Speel mee* (play along), keyboard guide and MIDI input.
- [Audio](audio.md): Salamander Grand Piano via Tone.js, plus a gramophone sound.
- [Composers](composers.md): portrait wall, biography and family tree for six composers.
- [Gramophone](gramophone.md) record player.
- [Shopkeeper](shopkeeper.md) who greets and helps the player, with read-aloud.
- [Game shell](game-shell.md): title screen, scene switching, overlay stack, input.
- [Content data](content-data.md): six composers, five demo pieces.
- [Assets](assets.md) and `tools/build_assets.py` to rebuild them.

Fixes made while testing the first version:

- Shop scales to show the whole room on 16:9 screens instead of cutting off the gramophone.
- Hotspot labels no longer get cut off at the edge of the screen.
- Night window glow follows arched window tops.
- Piano view shows one line of music, so score and keyboard fit on one screen.
- Gramophone art is cropped to remove the Italian labels baked into the image.
- Shopkeeper's greeting is gender-neutral ("Zeg het maar!").
- Portrait-orientation hint on phones.
