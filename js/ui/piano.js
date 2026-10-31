// The piano: free play, or load a piece and listen / play along with the lit-up notes.
// Full screen on the close-up of the piano (public/art/closeups/piano.webp): the music stands on
// the blank sheet on the music desk, the keys sit in the key slot, the buttons on the wood.
import { frame, h, esc } from './ui.js';
import { pieceById, creditFor } from '../data.js';
import {
  parsePiece, midiInfo, labelFor, noteNames, NOTE_COLORS,
  KEYMAP, keyLabels, keyCodeForMidi, PIANO_LOW, PIANO_HIGH, KEYS_LOW, KEYS_HIGH, MAX_SHIFT,
} from '../music.js';
import { renderPage, pageOfNote } from '../notation.js';
import { noteOn, noteOff, playPiece, audioState, onAudioReady } from '../audio.js';
import { skyAt, currentHour } from '../sky.js';

export function keyboardGuide() {
  // A picture of the computer keyboard with the piano notes painted on the keys.
  const rows = [
    { offset: 0.5, keys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'] },
    { offset: 1, keys: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'] },
    { offset: 1.3, keys: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'] },
    { offset: 1.8, keys: ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'] },
  ];
  const fallback = { Digit1: '1', Digit4: '4', Digit8: '8', Minus: '-', KeyA: 'A', KeyF: 'F', KeyK: 'K' };
  const cap = code => {
    const midi = KEYMAP[code];
    const label = keyLabels[code] || fallback[code] || '';
    if (midi == null) return `<span class="gk off">${esc(label)}</span>`;
    const info = midiInfo(midi);
    const black = info.black;
    return `<span class="gk ${black ? 'black' : 'white'}" style="--c:${NOTE_COLORS[info.letter]}">
      <b>${esc(label)}</b><i>${labelFor(info.letter, info.acc)}</i></span>`;
  };
  return h(`
    <div class="kb-guide">
      <div class="kb-rows">
        ${rows.map(r => `<div class="kb-row" style="--off:${r.offset}">${r.keys.map(cap).join('')}</div>`).join('')}
      </div>
      <ol class="kb-steps">
        <li><span class="step-ico white"></span><span><b>Letters</b> zijn de <b>witte</b> toetsen.</span></li>
        <li><span class="step-ico black"></span><span><b>Cijfers</b> en de toetsen ertussen zijn de <b>zwarte</b> toetsen.</span></li>
        <li><span class="step-ico"><kbd>Q</kbd></span><span>Bovenste rij (Q W E…) = <b>hoge</b> noten. Onderste rij (Z X C…) = <b>lage</b> noten.</span></li>
        <li><span class="step-ico"><kbd>←</kbd><kbd>→</kbd></span><span>Met <b>←</b> en <b>→</b> schuif je het toetsenbord een <b>octaaf</b> lager of hoger. Zo kun je alle 88 toetsen spelen.</span></li>
        <li><span class="step-ico"><kbd>Shift</kbd></span><span>Houd <b>Shift</b> ingedrukt voor het <b>pedaal</b>: de noten klinken dan door.</span></li>
        <li><span class="step-ico glow"></span><span>Kies <b>Speel mee</b>: de noot die oplicht op het blad, licht ook op de piano op. Druk op die toets!</span></li>
      </ol>
    </div>`);
}

const SYSTEMS = 2; // lines of music on the sheet

export function pianoView(ui, { pieceId } = {}) {
  const { el, body } = frame(ui, {
    title: 'De piano',
    cls: 'piano',
    closeup: 'public/art/closeups/piano.webp',
    full: true,
    tip: 'Speel met je toetsenbord, je muis of je vinger. Met ← en → ga je een octaaf lager of hoger, met Shift trap je het pedaal in. Kies bladmuziek en druk op "Speel mee": druk dan steeds op de toets die oplicht.',
  });

  body.appendChild(h(`
    <div class="piano-wrap">
      <div class="candle" style="left:7.54%"><span class="candle-glow"></span><span class="flame"></span></div>
      <div class="candle" style="left:92.05%"><span class="candle-glow"></span><span class="flame"></span></div>
      <div class="night-shade"></div>
      <div class="score"><div class="staff-host"></div><p class="score-hint">Kies bladmuziek, of speel maar!</p></div>
      <div class="piano-bar">
        <button class="btn wood choose">Kies muziek</button>
        <button class="btn wood read" hidden title="Bekijk de bladmuziek van dit stuk">Bladmuziek</button>
        <span class="piece-name"></span>
        <span class="spacer"></span>
        <button class="btn brass listen" hidden>Luister</button>
        <button class="btn brass follow" hidden>Speel mee</button>
        <button class="btn wood slow" hidden title="Langzamer luisteren">Langzaam</button>
        <button class="btn wood names" title="Notennamen: letters of do-re-mi">C D E</button>
        <button class="btn wood lesson-btn" title="Leer hoe noten werken">Notenles</button>
        <button class="btn wood guide-btn">Hulp</button>
      </div>
      <div class="status"></div>
      <div class="piano-body">
        <div class="keys"></div>
        <div class="piano-foot">
          <div class="octave">
            <button class="btn wood small oct-down" title="Een octaaf lager (←)"><span class="ico">‹</span> Lager</button>
            <span class="oct-range"></span>
            <button class="btn wood small oct-up" title="Een octaaf hoger (→)">Hoger <span class="ico">›</span></button>
          </div>
          <button class="pedal" title="Pedaal: houd Shift ingedrukt, of klik om het vast te zetten"><span class="pedal-foot"></span><span class="pedal-label">Pedaal</span></button>
        </div>
      </div>
      <div class="guide-pop paper" hidden></div>
      <div class="celebrate paper" hidden></div>
    </div>`));

  const $ = s => body.querySelector(s);
  const keysEl = $('.keys');
  // In the evening the candles on the piano burn (by the visitor's real clock, like the shop lamps).
  const sky = skyAt(currentHour());
  $('.piano-wrap').classList.toggle('night', sky.lampsOn);
  $('.piano-wrap').style.setProperty('--dark', sky.dark.toFixed(2));
  const statusEl = $('.status');
  const keyEls = new Map();

  // --- build the keyboard
  const whites = [];
  for (let m = PIANO_LOW; m <= PIANO_HIGH; m++) if (!midiInfo(m).black) whites.push(m);
  const ww = 100 / whites.length;
  let shift = 0; // octave shift of the computer keyboard
  const buildKeys = () => {
    keysEl.innerHTML = '';
    keyEls.clear();
    const lo = KEYS_LOW + shift * 12, hi = KEYS_HIGH + shift * 12;
    for (let m = PIANO_LOW; m <= PIANO_HIGH; m++) {
      const info = midiInfo(m);
      const code = keyCodeForMidi(m, shift);
      const inWin = m >= lo && m <= hi;
      const k = h(`<div class="key ${info.black ? 'black' : 'white'} ${inWin ? 'inwin' : ''}" style="--c:${NOTE_COLORS[info.letter]}">
        <span class="kname">${labelFor(info.letter, info.acc)}</span>
        ${code ? `<span class="kcap">${esc(keyLabels[code])}</span>` : ''}
      </div>`);
      if (info.black) {
        const before = whites.filter(w => w < m).length;
        k.style.left = `calc(${before * ww}% - ${ww * 0.31}%)`;
        k.style.width = `${ww * 0.62}%`;
      } else k.style.width = `${ww}%`;
      k.addEventListener('pointerdown', e => { e.preventDefault(); k.setPointerCapture?.(e.pointerId); press(m); });
      k.addEventListener('pointerup', () => release(m));
      k.addEventListener('pointercancel', () => release(m));
      k.addEventListener('lostpointercapture', () => release(m));
      keysEl.appendChild(k);
      keyEls.set(m, k);
      held.has(m) && k.classList.add('down');
    }
    // brass bar over the keys the computer keyboard plays now
    const first = whites.indexOf(Math.max(lo, PIANO_LOW) + (midiInfo(Math.max(lo, PIANO_LOW)).black ? 1 : 0));
    const last = whites.indexOf(Math.min(hi, PIANO_HIGH) - (midiInfo(Math.min(hi, PIANO_HIGH)).black ? 1 : 0));
    const bar = h('<div class="kb-window"></div>');
    Object.assign(bar.style, { left: `${first * ww}%`, width: `${(last - first + 1) * ww}%` });
    keysEl.appendChild(bar);
    $('.oct-range').textContent = `${noteLabel(Math.max(lo, PIANO_LOW))} – ${noteLabel(Math.min(hi, PIANO_HIGH))}`;
    $('.oct-down').disabled = shift <= -MAX_SHIFT;
    $('.oct-up').disabled = shift >= MAX_SHIFT;
  };
  const noteLabel = m => { const i = midiInfo(m); return labelFor(i.letter, i.acc) + i.oct; };

  // --- state
  let parsed = null, page = -1, noteEls = new Map();
  let mode = 'free';           // free | listen | follow
  let player = null, idx = 0, mistakes = 0, slow = false;
  let along = 0;               // free play: the next note of the piece on the desk
  const held = new Set();
  const codeNotes = new Map(); // computer key → the note it started, so a shift while holding still releases it
  let pedal = false, pedalLatched = false;
  const sustained = new Set();
  buildKeys();

  function setShift(s) {
    s = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, s));
    if (s === shift) return;
    shift = s;
    buildKeys();
    if (mode === 'follow') nextTarget();
  }

  // Sustain pedal: released notes keep sounding until the pedal comes up.
  function setPedal(on) {
    if (pedal === on) return;
    pedal = on;
    $('.pedal').classList.toggle('down', on);
    if (!on) {
      sustained.forEach(m => { if (!held.has(m)) noteOff(m); });
      sustained.clear();
    }
  }

  const setStatus = t => { statusEl.textContent = t; };

  // A little light note that floats up from a key when it sounds.
  const spark = midi => {
    const k = keyEls.get(midi);
    if (!k) return;
    const sp = h(`<span class="spark" style="--c:${k.style.getPropertyValue('--c')};--dx:${(Math.random() * 2 - 1).toFixed(2)}">${Math.random() < 0.5 ? '♪' : '♫'}</span>`);
    sp.style.left = `${k.offsetLeft + k.offsetWidth / 2}px`;
    sp.addEventListener('animationend', () => sp.remove());
    keysEl.appendChild(sp);
  };

  const showPage = p => {
    if (!parsed || p === page) return;
    page = p;
    noteEls = renderPage($('.staff-host'), parsed, page, SYSTEMS);
  };
  const clearMarks = () => {
    keyEls.forEach(k => k.classList.remove('target', 'active', 'accomp', 'good', 'wrong'));
    noteEls.forEach(g => g.classList.remove('active'));
  };
  // a short glow on a note of the sheet, in its colour
  const flash = g => {
    if (!g) return;
    g.classList.remove('hit'); void g.getBoundingClientRect(); g.classList.add('hit');
    clearTimeout(g.hitTimer);
    g.hitTimer = setTimeout(() => g.classList.remove('hit'), 700);
  };
  const markNote = (n, cls = 'active') => {
    showPage(pageOfNote(parsed, n, SYSTEMS));
    noteEls.forEach(g => g.classList.remove('active'));
    noteEls.get(n.i)?.classList.add(cls);
  };

  let pieceIdNow = null;
  function loadPiece(id) {
    stopAll();
    pieceIdNow = id;
    const piece = pieceById(id);
    parsed = parsePiece(piece);
    page = -1;
    along = 0;
    $('.score-hint').hidden = true;
    $('.piece-name').innerHTML = `<b>${esc(piece.title)}</b> · ${esc(creditFor(piece).short)}`;
    ['.read', '.listen', '.follow', '.slow'].forEach(s => { $(s).hidden = false; });
    showPage(0);
    setStatus('Druk op Luister om het stuk te horen, of op Speel mee om het zelf te spelen.');
  }

  function stopAll() {
    player?.stop(); player = null;
    mode = 'free';
    along = 0;
    clearMarks();
    noteEls.forEach(g => g.classList.remove('done'));
    $('.listen').classList.remove('on');
    $('.follow').classList.remove('on');
    $('.celebrate').hidden = true;
  }

  function listen() {
    if (mode === 'listen') { stopAll(); setStatus(''); return; }
    stopAll();
    if (!audioState.ready) { setStatus('De piano wordt nog gestemd… even geduld!'); return; }
    mode = 'listen';
    $('.listen').classList.add('on');
    const hint = 'Luister en kijk mee: elke toets die klinkt, licht op. De melodie staat op het blad.';
    setStatus(parsed.offset ? 'Eerst speelt de piano een inleiding. Kijk naar de toetsen!' : hint);
    // every key that sounds lights up: the melody in its full colour, the accompaniment softer
    const lit = new Map();
    player = playPiece(parsed, {
      tempoScale: slow ? 0.65 : 1,
      onNote(n) {
        if (n.i === 0 && parsed.offset) setStatus(hint);
        markNote(n);
      },
      onKey(midi, on, part) {
        const id = `${part}${midi}`, count = (lit.get(id) || 0) + (on ? 1 : -1);
        lit.set(id, count);
        keyEls.get(midi)?.classList.toggle(part === 'melody' ? 'active' : 'accomp', count > 0);
        if (on && part === 'melody') spark(midi);
      },
      onEnd() { stopAll(); setStatus('Klaar! Probeer het nu zelf met Speel mee.'); },
    });
  }

  function follow() {
    if (mode === 'follow') { stopAll(); setStatus(''); return; }
    stopAll();
    mode = 'follow';
    idx = 0; mistakes = 0;
    $('.follow').classList.add('on');
    setStatus('Druk op de toets die oplicht!');
    nextTarget();
  }

  function nextTarget() {
    const notes = parsed.notes;
    while (idx < notes.length && (notes[idx].rest || notes[idx].tied)) idx++;
    keyEls.forEach(k => k.classList.remove('target'));
    if (idx >= notes.length) return finish();
    const n = notes[idx];
    markNote(n);
    // slide the computer keyboard along when the note is out of its reach
    let s = shift;
    while (n.midi < KEYS_LOW + s * 12 && s > -MAX_SHIFT) s--;
    while (n.midi > KEYS_HIGH + s * 12 && s < MAX_SHIFT) s++;
    if (s !== shift) { shift = s; buildKeys(); }
    const k = keyEls.get(n.midi);
    k?.classList.add('target');
    const code = keyCodeForMidi(n.midi, shift);
    setStatus(`Speel ${labelFor(n.letter, n.acc)}${code ? ` — toets ${keyLabels[code]}` : ''}`);
  }

  function finish() {
    const stars = mistakes <= 2 ? 3 : mistakes <= 6 ? 2 : 1;
    mode = 'free';
    $('.follow').classList.remove('on');
    const c = $('.celebrate');
    c.innerHTML = `<div class="stars">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
      <h3>${stars === 3 ? 'Prachtig gespeeld!' : stars === 2 ? 'Goed gedaan!' : 'Je hebt het hele stuk gespeeld!'}</h3>
      <p>${mistakes === 0 ? 'Geen enkele fout!' : `${mistakes} ${mistakes === 1 ? 'foutje' : 'foutjes'} — oefening baart kunst.`}</p>
      <div class="row"><button class="btn brass again">Nog een keer</button>
      <button class="btn wood other">Ander stuk</button></div>`;
    c.hidden = false;
    c.querySelector('.again').onclick = follow;
    c.querySelector('.other').onclick = () => { c.hidden = true; ui.open('library', { forPiano: true }); };
    setStatus('');
  }

  // Free play with a piece on the desk: the sheet plays along. The next note of the piece, when it's
  // played, turns green and the sheet moves on (turning the page when needed); any other key makes
  // that note glow wherever it is on the page, so every key shows where it is written.
  function playAlong(midi) {
    const notes = parsed.notes;
    const skip = () => { while (along < notes.length && (notes[along].rest || notes[along].tied)) along++; };
    skip();
    const n = notes[along];
    if (n && n.midi === midi) {
      showPage(pageOfNote(parsed, n, SYSTEMS));
      const g = noteEls.get(n.i);
      g?.classList.add('done');
      flash(g);
      along++;
      skip();
      if (along >= notes.length) {
        setStatus('Je hebt het hele stuk gespeeld! Speel het gerust nog eens.');
        along = 0;
        setTimeout(() => { if (mode === 'free') { noteEls.forEach(e => e.classList.remove('done')); showPage(0); } }, 1500);
      }
      return;
    }
    for (const [i, g] of noteEls) if (notes[i]?.midi === midi) flash(g);
  }

  function press(midi) {
    if (held.has(midi)) return;
    held.add(midi);
    if (sustained.delete(midi)) noteOff(midi);
    noteOn(midi);
    const k = keyEls.get(midi);
    k?.classList.add('down');
    spark(midi);
    if (!audioState.ready) setStatus('De piano wordt nog gestemd… even geduld!');
    if (mode === 'free' && parsed) playAlong(midi);
    if (mode === 'follow') {
      const n = parsed.notes[idx];
      if (n && midi === n.midi) {
        noteEls.get(n.i)?.classList.add('done');
        k?.classList.add('good');
        setTimeout(() => k?.classList.remove('good'), 250);
        idx++;
        nextTarget();
      } else {
        mistakes++;
        k?.classList.remove('wrong'); void k?.offsetWidth; k?.classList.add('wrong');
      }
    }
  }

  function release(midi) {
    if (!held.delete(midi)) return;
    if (pedal) sustained.add(midi);
    else noteOff(midi);
    keyEls.get(midi)?.classList.remove('down');
  }

  // --- toolbar
  $('.choose').onclick = () => { stopAll(); ui.open('library', { forPiano: true }); };
  // Back to the book: when the piano was opened from this piece's book, that book is still open
  // underneath (at the same page), otherwise it opens on top of the piano.
  $('.read').onclick = () => {
    stopAll();
    const below = ui.stack[ui.stack.length - 2];
    if (below?.name === 'sheet' && below.pieceId === pieceIdNow) ui.close();
    else ui.open('sheet', { pieceId: pieceIdNow, fromPiano: true });
  };
  $('.oct-down').onclick = () => setShift(shift - 1);
  $('.oct-up').onclick = () => setShift(shift + 1);
  $('.pedal').onclick = () => { pedalLatched = !pedalLatched; setPedal(pedalLatched); };
  $('.lesson-btn').onclick = () => { stopAll(); ui.open('lessons'); };
  $('.listen').onclick = listen;
  $('.follow').onclick = follow;
  $('.slow').onclick = () => { slow = !slow; $('.slow').classList.toggle('on', slow); };
  $('.names').onclick = () => {
    noteNames.mode = noteNames.mode === 'letters' ? 'solfege' : 'letters';
    $('.names').innerHTML = `${noteNames.mode === 'letters' ? 'C D E' : 'do re mi'}`;
    buildKeys();
    if (parsed) { const p = page; page = -1; showPage(p); }
    if (mode === 'follow') nextTarget();
  };
  const guidePop = $('.guide-pop');
  $('.guide-btn').onclick = () => {
    if (guidePop.hidden) {
      guidePop.innerHTML = '<h3>Zo speel je piano met je toetsenbord</h3>';
      guidePop.appendChild(keyboardGuide());
      const close = h('<button class="btn brass small">Begrepen!</button>');
      close.onclick = () => { guidePop.hidden = true; };
      guidePop.appendChild(close);
    }
    guidePop.hidden = !guidePop.hidden;
  };

  // A real (USB/MIDI) piano keyboard, when the browser supports it.
  let midiAccess = null;
  const onMidi = e => {
    const [st, note, vel] = e.data;
    const cmd = st & 0xf0;
    if (cmd === 0x90 && vel > 0) press(note);
    else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) release(note);
    else if (cmd === 0xb0 && note === 64) setPedal(vel >= 64 || pedalLatched); // sustain pedal
  };
  if (navigator.requestMIDIAccess) {
    const midiBtn = h('<button class="btn wood midi" title="Sluit een echte piano of keyboard aan via USB">MIDI</button>');
    midiBtn.onclick = () => navigator.requestMIDIAccess().then(acc => {
      midiAccess = acc;
      const hook = () => acc.inputs.forEach(i => { i.onmidimessage = onMidi; });
      hook();
      acc.onstatechange = hook;
      midiBtn.classList.add('on');
      setStatus(acc.inputs.size ? 'Je keyboard is aangesloten. Speel maar!' : 'Geen keyboard gevonden. Sluit er een aan via USB.');
    }).catch(() => setStatus('Je browser geeft geen toegang tot MIDI.'));
    $('.guide-btn').before(midiBtn);
  }

  if (pieceId) loadPiece(pieceId);
  else setStatus('Speel maar! Of kies bladmuziek om mee te spelen.');
  onAudioReady(() => { if (!parsed && mode === 'free') setStatus('De piano is gestemd. Speel maar!'); });

  return {
    el,
    loadPiece,
    onHide() { stopAll(); held.forEach(release); codeNotes.clear(); pedalLatched = false; setPedal(false); },
    onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { setPedal(true); return; }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (!e.repeat) setShift(shift + (e.code === 'ArrowLeft' ? -1 : 1));
        return;
      }
      if (KEYMAP[e.code] != null) {
        e.preventDefault();
        const midi = KEYMAP[e.code] + shift * 12;
        if (e.repeat || codeNotes.has(e.code) || midi < PIANO_LOW || midi > PIANO_HIGH) return;
        codeNotes.set(e.code, midi);
        press(midi);
        return;
      }
      if (e.code === 'Space' && parsed) { e.preventDefault(); mode === 'follow' ? stopAll() : listen(); }
    },
    onKeyUp(e) {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { if (!e.shiftKey) setPedal(pedalLatched); return; }
      const midi = codeNotes.get(e.code);
      if (midi != null) { codeNotes.delete(e.code); release(midi); }
    },
    destroy() {
      stopAll();
      held.forEach(m => noteOff(m));
      sustained.forEach(m => noteOff(m));
      midiAccess?.inputs.forEach(i => { i.onmidimessage = null; });
    },
  };
}
