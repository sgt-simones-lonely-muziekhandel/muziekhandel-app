// The piano: free play, or load a piece and listen / play along with the lit-up notes.
import { frame, h, esc } from './ui.js';
import { pieceById, composerById } from '../data.js';
import {
  parsePiece, midiInfo, labelFor, noteNames, NOTE_COLORS,
  KEYMAP, keyLabels, keyCodeForMidi, PIANO_LOW, PIANO_HIGH,
} from '../music.js';
import { renderPage, pageOfNote } from '../notation.js';
import { noteOn, noteOff, playPiece, audioState, onAudioReady } from '../audio.js';

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
        <li><span class="step-ico">⬆</span><span>Bovenste rij (Q W E…) = <b>hoge</b> noten. Onderste rij (Z X C…) = <b>lage</b> noten.</span></li>
        <li><span class="step-ico">✨</span><span>Kies <b>Speel mee</b>: de noot die oplicht op het blad, licht ook op de piano op. Druk op die toets!</span></li>
      </ol>
    </div>`);
}

export function pianoView(ui, { pieceId } = {}) {
  const { el, body } = frame(ui, {
    title: 'De piano',
    cls: 'piano',
    wide: true,
    tip: 'Speel met je toetsenbord, je muis of je vinger. Kies bladmuziek en druk op "Speel mee": druk dan steeds op de toets die oplicht. Met "Luister" speelt de piano het stuk eerst voor.',
  });

  body.appendChild(h(`
    <div class="piano-wrap">
      <div class="piano-bar">
        <button class="btn wood choose"><span class="ico">📜</span> Kies bladmuziek</button>
        <span class="piece-name"></span>
        <span class="spacer"></span>
        <button class="btn brass listen" hidden><span class="ico">👂</span> Luister</button>
        <button class="btn brass follow" hidden><span class="ico">🎯</span> Speel mee</button>
        <button class="btn wood slow" hidden title="Langzamer luisteren"><span class="ico">🐢</span> Langzaam</button>
        <button class="btn wood names" title="Notennamen: letters of do-re-mi"><span class="ico">🔤</span> C D E</button>
        <button class="btn wood guide-btn"><span class="ico">❓</span> Hulp</button>
      </div>
      <div class="score paper-inner" hidden><div class="staff-host"></div></div>
      <div class="status"></div>
      <div class="piano-body">
        <div class="piano-lid"><span>Van der Velde · Amsterdam</span></div>
        <div class="keys"></div>
      </div>
      <div class="guide-pop paper" hidden></div>
      <div class="celebrate paper" hidden></div>
    </div>`));

  const $ = s => body.querySelector(s);
  const keysEl = $('.keys');
  const statusEl = $('.status');
  const keyEls = new Map();

  // --- build the keyboard
  const whites = [];
  for (let m = PIANO_LOW; m <= PIANO_HIGH; m++) if (!midiInfo(m).black) whites.push(m);
  const ww = 100 / whites.length;
  const buildKeys = () => {
    keysEl.innerHTML = '';
    keyEls.clear();
    for (let m = PIANO_LOW; m <= PIANO_HIGH; m++) {
      const info = midiInfo(m);
      const code = keyCodeForMidi(m);
      const k = h(`<div class="key ${info.black ? 'black' : 'white'}" style="--c:${NOTE_COLORS[info.letter]}">
        <span class="kname">${labelFor(info.letter, info.acc)}${!info.black && info.letter === 'C' ? `<sub>${info.oct}</sub>` : ''}</span>
        ${code ? `<span class="kcap">${esc(keyLabels[code])}</span>` : ''}
      </div>`);
      if (info.black) {
        const before = whites.filter(w => w < m).length;
        k.style.left = `calc(${before * ww}% - ${ww * 0.31}%)`;
        k.style.width = `${ww * 0.62}%`;
      } else k.style.width = `${ww}%`;
      if (m === 60) k.classList.add('middle-c');
      k.addEventListener('pointerdown', e => { e.preventDefault(); k.setPointerCapture?.(e.pointerId); press(m); });
      k.addEventListener('pointerup', () => release(m));
      k.addEventListener('pointercancel', () => release(m));
      k.addEventListener('lostpointercapture', () => release(m));
      keysEl.appendChild(k);
      keyEls.set(m, k);
    }
  };
  buildKeys();

  // --- state
  let parsed = null, page = -1, noteEls = new Map();
  let mode = 'free';           // free | listen | follow
  let player = null, idx = 0, mistakes = 0, slow = false;
  const held = new Set();

  const setStatus = t => { statusEl.textContent = t; };

  const showPage = p => {
    if (!parsed || p === page) return;
    page = p;
    noteEls = renderPage($('.staff-host'), parsed, page, 1);
  };
  const clearMarks = () => {
    keyEls.forEach(k => k.classList.remove('target', 'active', 'good', 'wrong'));
    noteEls.forEach(g => g.classList.remove('active'));
  };
  const markNote = (n, cls = 'active') => {
    showPage(pageOfNote(parsed, n, 1));
    noteEls.forEach(g => g.classList.remove('active'));
    noteEls.get(n.i)?.classList.add(cls);
  };

  function loadPiece(id) {
    stopAll();
    const piece = pieceById(id);
    parsed = parsePiece(piece);
    page = -1;
    $('.score').hidden = false;
    $('.piece-name').innerHTML = `<b>${esc(piece.title)}</b> · ${esc(composerById(piece.composer).short)}`;
    ['.listen', '.follow', '.slow'].forEach(s => { $(s).hidden = false; });
    showPage(0);
    setStatus('Druk op 👂 Luister om het stuk te horen, of op 🎯 Speel mee om het zelf te spelen.');
  }

  function stopAll() {
    player?.stop(); player = null;
    mode = 'free';
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
    setStatus('Luister en kijk mee: de noot die klinkt, licht op.');
    let lastKey = null;
    player = playPiece(parsed, {
      tempoScale: slow ? 0.65 : 1,
      onNote(n) {
        lastKey?.classList.remove('active');
        markNote(n);
        if (!n.rest) { lastKey = keyEls.get(n.midi); lastKey?.classList.add('active'); }
      },
      onEnd() { stopAll(); setStatus('Klaar! Probeer het nu zelf met 🎯 Speel mee.'); },
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
    while (idx < notes.length && notes[idx].rest) idx++;
    keyEls.forEach(k => k.classList.remove('target'));
    if (idx >= notes.length) return finish();
    const n = notes[idx];
    markNote(n);
    const k = keyEls.get(n.midi);
    k?.classList.add('target');
    const code = keyCodeForMidi(n.midi);
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
      <div class="row"><button class="btn brass again"><span class="ico">↺</span> Nog een keer</button>
      <button class="btn wood other"><span class="ico">📜</span> Ander stuk</button></div>`;
    c.hidden = false;
    c.querySelector('.again').onclick = follow;
    c.querySelector('.other').onclick = () => { c.hidden = true; ui.open('library', { forPiano: true }); };
    setStatus('');
  }

  function press(midi) {
    if (held.has(midi)) return;
    held.add(midi);
    noteOn(midi);
    const k = keyEls.get(midi);
    k?.classList.add('down');
    if (!audioState.ready) setStatus('De piano wordt nog gestemd… even geduld!');
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
    noteOff(midi);
    keyEls.get(midi)?.classList.remove('down');
  }

  // --- toolbar
  $('.choose').onclick = () => { stopAll(); ui.open('library', { forPiano: true }); };
  $('.listen').onclick = listen;
  $('.follow').onclick = follow;
  $('.slow').onclick = () => { slow = !slow; $('.slow').classList.toggle('on', slow); };
  $('.names').onclick = () => {
    noteNames.mode = noteNames.mode === 'letters' ? 'solfege' : 'letters';
    $('.names').innerHTML = `<span class="ico">🔤</span> ${noteNames.mode === 'letters' ? 'C D E' : 'do re mi'}`;
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
  };
  if (navigator.requestMIDIAccess) {
    const midiBtn = h('<button class="btn wood midi" title="Sluit een echte piano of keyboard aan via USB"><span class="ico">🔌</span> MIDI</button>');
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
    onHide() { stopAll(); held.forEach(release); },
    onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const midi = KEYMAP[e.code];
      if (midi != null) {
        e.preventDefault();
        if (!e.repeat) press(midi);
        return;
      }
      if (e.code === 'Space' && parsed) { e.preventDefault(); mode === 'follow' ? stopAll() : listen(); }
    },
    onKeyUp(e) {
      const midi = KEYMAP[e.code];
      if (midi != null) release(midi);
    },
    destroy() {
      stopAll();
      held.forEach(m => noteOff(m));
      midiAccess?.inputs.forEach(i => { i.onmidimessage = null; });
    },
  };
}
