# Audio: sheet music → sound

**Owners:** Rei, Teo (backend)

Turns a piece of sheet music into notes and sound. The piano screen (front end) only listens for "note on" / "note off" events to light up keys and notes, so it doesn't need to know where the notes came from.

Planned files:

- `score.ts`: the `Score` type: notes with pitch, start time and duration. This is the hand-off format.
- `ScoreProvider.ts`: MusicXML (from OMR) → `Score`.
- `Player.ts`: plays a `Score` (e.g. a SoundFont piano) and emits note on/off events.
- `MidiInput.ts`: optional. Lets kids play along on their own keyboard via Web MIDI.
