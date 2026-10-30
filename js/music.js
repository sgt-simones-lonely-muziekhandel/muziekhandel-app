// Pitch/duration parsing, note colours and the computer-keyboard → piano mapping.

const LETTER_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = 'CDEFGAB';
const DURATIONS = { w: 4, 'h.': 3, h: 2, 'q.': 1.5, q: 1, '8.': 0.75, 8: 0.5, 16: 0.25 };

// One colour per note letter, also used on the piano keys.
export const NOTE_COLORS = {
  C: '#e0554a', D: '#ef8a34', E: '#e9c13e', F: '#69b456',
  G: '#36a89f', A: '#4b7fd1', B: '#9a66c8',
};
const SOLFEGE = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si' };

export const noteNames = { mode: 'letters' }; // 'letters' | 'solfege'

export function parsePitch(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error('Bad pitch ' + name);
  const [, letter, acc = '', o] = m;
  const oct = +o;
  return {
    name, letter, acc, oct,
    midi: 12 * (oct + 1) + LETTER_SEMI[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0),
    step: oct * 7 + LETTERS.indexOf(letter), // diatonic position, used for the staff
  };
}

export function midiInfo(midi) {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const n = names[midi % 12];
  return { midi, letter: n[0], acc: n.length > 1 ? '#' : '', oct: Math.floor(midi / 12) - 1, black: n.length > 1 };
}

export function labelFor(letter, acc = '') {
  const base = noteNames.mode === 'solfege' ? SOLFEGE[letter] : letter;
  return base + (acc === '#' ? '♯' : acc === 'b' ? '♭' : '');
}

export function parsePiece(piece) {
  if (piece._parsed) return piece._parsed;
  const tokens = piece.notes.trim().split(/\s+/).filter(t => t !== '|');
  const beatsPerMeasure = piece.time[0] * 4 / piece.time[1];
  let t = 0;
  const notes = tokens.map((tok, i) => {
    const [p, d] = tok.split(':');
    const dur = DURATIONS[d];
    if (dur == null) throw new Error(`Bad duration in ${piece.id}: ${tok}`);
    const n = { i, dur, start: t, rest: p === 'r', durToken: d };
    if (!n.rest) Object.assign(n, parsePitch(p));
    t += dur;
    return n;
  });
  const measures = [];
  let cur = [], acc = 0, cap = piece.pickup || beatsPerMeasure;
  for (const n of notes) {
    cur.push(n);
    n.measure = measures.length;
    acc += n.dur;
    if (acc >= cap - 1e-6) {
      measures.push(cur); cur = []; acc = 0; cap = beatsPerMeasure;
    }
  }
  if (cur.length) measures.push(cur);
  const secPerBeat = 60 / piece.tempo;
  piece._parsed = { piece, notes, measures, beatsPerMeasure, secPerBeat, totalBeats: t };
  return piece._parsed;
}

// Physical key positions (KeyboardEvent.code), so it works on QWERTY, QWERTZ and AZERTY alike.
// Top letter row = middle/high notes, bottom row = low notes; the digits above are the black keys.
export const KEYMAP = {
  KeyZ: 48, KeyS: 49, KeyX: 50, KeyD: 51, KeyC: 52, KeyV: 53, KeyG: 54, KeyB: 55, KeyH: 56,
  KeyN: 57, KeyJ: 58, KeyM: 59, Comma: 60, KeyL: 61, Period: 62, Semicolon: 63, Slash: 64,
  KeyQ: 60, Digit2: 61, KeyW: 62, Digit3: 63, KeyE: 64, KeyR: 65, Digit5: 66, KeyT: 67,
  Digit6: 68, KeyY: 69, Digit7: 70, KeyU: 71, KeyI: 72, Digit9: 73, KeyO: 74, Digit0: 75,
  KeyP: 76, BracketLeft: 77, Equal: 78, BracketRight: 79,
};
export const PIANO_LOW = 48;  // C3
export const PIANO_HIGH = 79; // G5

const DEFAULT_LABELS = {
  KeyZ: 'Z', KeyS: 'S', KeyX: 'X', KeyD: 'D', KeyC: 'C', KeyV: 'V', KeyG: 'G', KeyB: 'B', KeyH: 'H',
  KeyN: 'N', KeyJ: 'J', KeyM: 'M', Comma: ',', KeyL: 'L', Period: '.', Semicolon: ';', Slash: '/',
  KeyQ: 'Q', Digit2: '2', KeyW: 'W', Digit3: '3', KeyE: 'E', KeyR: 'R', Digit5: '5', KeyT: 'T',
  Digit6: '6', KeyY: 'Y', Digit7: '7', KeyU: 'U', KeyI: 'I', Digit9: '9', KeyO: 'O', Digit0: '0',
  KeyP: 'P', BracketLeft: '[', Equal: '=', BracketRight: ']',
};
export const keyLabels = { ...DEFAULT_LABELS };

// Show the letters printed on the user's own keyboard where the browser can tell us.
export async function loadKeyLabels() {
  try {
    const map = await navigator.keyboard?.getLayoutMap?.();
    if (!map) return;
    for (const code of Object.keys(DEFAULT_LABELS)) {
      const k = map.get(code);
      if (k) keyLabels[code] = k.toUpperCase();
    }
  } catch { /* not supported: keep QWERTY labels */ }
}

// The key we show on each piano key: top row from C4 up, bottom row below C4.
export function keyCodeForMidi(midi) {
  const codes = Object.keys(KEYMAP).filter(c => KEYMAP[c] === midi);
  if (!codes.length) return null;
  if (midi >= 60) return codes.find(c => !['Comma', 'KeyL', 'Period', 'Semicolon', 'Slash'].includes(c)) || codes[0];
  return codes[0];
}
