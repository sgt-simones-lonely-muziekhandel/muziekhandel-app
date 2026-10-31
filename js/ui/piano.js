// The piano: free play, or load a piece and learn it the way a piano teacher would: listen to it,
// find the notes (Speel mee: the piano waits for each note, the accompaniment answers), then play it
// in time (In de maat: count-in, metronome, the accompaniment runs and every note is judged early,
// on time or late). Practise slower and a few bars at a time (Oefenen), and the stars you earn are
// kept per piece and per stretch.
// Full screen on the close-up of the piano (public/art/closeups/piano.webp): the music stands on
// the blank sheet on the music desk, the keys sit in the key slot, the buttons on the wood.
import { frame, h, esc } from './ui.js';
import { pieceById, creditFor } from '../data.js';
import {
  parsePiece, midiInfo, labelFor, NOTE_COLORS,
  KEYMAP, keyLabels, keyCodeForMidi, PIANO_LOW, PIANO_HIGH, KEYS_LOW, KEYS_HIGH, MIN_SHIFT, MAX_SHIFT,
} from '../music.js';
import { renderPage, pageOfNote } from '../notation.js';
import { noteOn, noteOff, playPiece, audioState, audioNow, onAudioReady, setInstrument } from '../audio.js';
import { INSTRUMENTS, instrumentById } from '../instruments.js';
import { skyAt, currentHour } from '../sky.js';

export function keyboardGuide() {
  // A picture of the computer keyboard with the piano notes painted on the keys.
  const rows = [
    { offset: 0, keys: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'] },
    { offset: 0.3, keys: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Backslash'] },
  ];
  const fallback = {};
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
        <li><span class="step-ico white"></span><span>De middelste rij (<b>A S D …</b>) zijn de <b>witte</b> toetsen.</span></li>
        <li><span class="step-ico black"></span><span>De rij erboven (<b>W E T Y U …</b>) zijn de <b>zwarte</b> toetsen. Q, R, I en È zijn stil: daar heeft de piano geen zwarte toets.</span></li>
        <li><span class="step-ico"><kbd>←</kbd><kbd>→</kbd></span><span>Met <b>←</b> en <b>→</b> schuif je het toetsenbord een <b>octaaf</b> lager of hoger. Zo kun je alle 88 toetsen spelen.</span></li>
        <li><span class="step-ico"><kbd>Spatie</kbd></span><span>Houd de <b>spatiebalk</b> ingedrukt voor het <b>pedaal</b>: de noten klinken dan door.</span></li>
        <li><span class="step-ico"><kbd>Enter</kbd></span><span>Met <b>Enter</b> druk je op <b>Luister</b>: de piano speelt het liedje voor (nog eens Enter: stop).</span></li>
        <li><span class="step-ico glow"></span><span>Kies <b>Speel mee</b>: de noot die oplicht op het blad, licht ook op de piano op. Druk op die toets!</span></li>
      </ol>
    </div>`);
}

const SYSTEMS = 2; // lines of music on the sheet
const SECTION_BARS = 4; // a stretch to practise: one line of the sheet
const TEMPOS = [0.5, 0.6, 0.7, 0.8, 0.9, 1];

// The stars earned, per piece and per stretch ('all' or the stretch's first bar), for Speel mee
// (`follow`) and In de maat (`rhythm`). Kept in this browser only.
const PROGRESS_KEY = 'muziekhandel.piano.progress';
const loadProgress = () => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch { return {}; } };
function saveStars(pieceId, part, kind, stars) {
  const all = loadProgress();
  const p = ((all[pieceId] ??= {})[part] ??= {});
  if ((p[kind] || 0) >= stars) return;
  p[kind] = stars;
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(all)); } catch { /* private mode: not kept */ }
}
const starsOf = (pieceId, part, kind) => loadProgress()[pieceId]?.[part]?.[kind] || 0;
const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

export function pianoView(ui, { pieceId } = {}) {
  const { el, body } = frame(ui, {
    title: 'De piano',
    cls: 'piano',
    closeup: 'public/art/closeups/piano.webp',
    full: true,
    tip: 'Zo leer je een liedje: 1. Luister. 2. Speel mee: de piano wacht tot je de toets speelt die oplicht. 3. In de maat: de piano telt af en speelt mee, en jij speelt op tijd. Met Oefenen kies je een stukje en speel je langzamer. Met ← en → ga je een octaaf lager of hoger, met de spatiebalk trap je het pedaal in, met Enter luister je.',
  });

  body.appendChild(h(`
    <div class="piano-wrap">
      <div class="candle" style="left:7.54%"><span class="candle-glow"></span><span class="flame"></span></div>
      <div class="candle" style="left:92.05%"><span class="candle-glow"></span><span class="flame"></span></div>
      <div class="night-shade"></div>
      <div class="score"><div class="staff-host"></div><div class="desk-welcome">
          <p class="dw-title hand">Wat wil je doen?</p>
          <button class="dw-choice learn"><b>Een liedje leren</b><span>Kies bladmuziek: de piano laat je zien welke toetsen je moet spelen.</span></button>
          <div class="dw-choice free"><b>Gewoon spelen</b><span>Druk op de toetsen, met je muis, je vinger of je toetsenbord, en speel wat je wilt!</span></div>
        </div><div class="count-in" hidden></div></div>
      <div class="piano-bar">
        <button class="btn wood choose">Kies muziek</button>
        <button class="btn wood read" hidden title="Bekijk de bladmuziek van dit stuk">Bladmuziek</button>
        <span class="piece-name"></span>
        <span class="spacer"></span>
        <button class="btn brass listen" hidden>Luister</button>
        <button class="btn brass follow" hidden title="De piano wacht tot je de goede toets speelt">Speel mee</button>
        <button class="btn brass rhythm" hidden title="Speel op tijd mee: de piano telt af en speelt de begeleiding">In de maat</button>
        <button class="btn wood practice-btn" hidden title="Kies een stukje, het tempo en meer">Oefenen</button>
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
          <button class="btn wood small instr-btn" title="Klik hier en kies een ander instrument: viool, fluit, trompet, harp…"><span class="ico">♫</span><span class="instr-text"><small>Instrument</small><b class="instr-name">Piano</b></span><span class="caret">▾</span></button>
          <button class="pedal" title="Pedaal: houd de spatiebalk ingedrukt, of klik om het vast te zetten"><span class="pedal-foot"></span><span class="pedal-label">Pedaal</span></button>
        </div>
      </div>
      <div class="guide-pop paper" hidden></div>
      <div class="instr-pop paper" hidden>
        <h3 class="hand">Op welk instrument wil je spelen?</h3>
        <div class="instr-families"></div>
      </div>
      <div class="practice-pop paper" hidden></div>
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
    $('.oct-down').disabled = shift <= MIN_SHIFT;
    $('.oct-up').disabled = shift >= MAX_SHIFT;
  };
  const noteLabel = m => { const i = midiInfo(m); return labelFor(i.letter, i.acc) + i.oct; };

  // --- state
  let parsed = null, page = -1, noteEls = new Map();
  let mode = 'free';           // free | listen | follow | rhythm
  let player = null, idx = 0, mistakes = 0;
  // practice settings: tempo, which stretch (-1: the whole piece), repeat it, accompaniment in
  // Speel mee, metronome
  let tempo = 1, section = -1, loop = false, withAccomp = true, metro = false;
  let sections = [];
  let wrongInRow = 0;
  const later = [];            // timers of accompaniment answering in Speel mee
  const answering = new Set(); // its keys sounding now
  // stop the accompaniment's answer: pending notes don't come, sounding ones stop
  const hush = () => {
    later.splice(0).forEach(clearTimeout);
    answering.forEach(m => { if (!held.has(m)) noteOff(m); keyEls.get(m)?.classList.remove('accomp'); });
    answering.clear();
  };
  let along = 0;               // free play: the next note of the piece on the desk
  const held = new Set();
  const codeNotes = new Map(); // computer key → the note it started, so a shift while holding still releases it
  let pedal = false, pedalLatched = false;
  const sustained = new Set();
  buildKeys();

  function setShift(s) {
    s = Math.max(MIN_SHIFT, Math.min(MAX_SHIFT, s));
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
    // the notes outside the stretch being practised fade back
    if (section >= 0) for (const [i, g] of noteEls) g.classList.toggle('out', !inStretch(parsed.notes[i]));
  };
  // the stretch being practised, in beats of the melody
  const stretch = () => (section < 0 ? { from: 0, to: Infinity } : sections[section]);
  const inStretch = n => { const r = stretch(); return n.start >= r.from - 1e-6 && n.start < r.to - 1e-6; };
  const playable = n => n && !n.rest && !n.tied;
  const partKey = () => (section < 0 ? 'all' : `m${sections[section].bar}`);
  const clearMarks = () => {
    keyEls.forEach(k => k.classList.remove('target', 'next', 'active', 'accomp', 'good', 'wrong'));
    noteEls.forEach(g => g.classList.remove('active', 'next'));
  };
  // a word floating up from a key: Goed!, Te vroeg, Te laat
  const say = (midi, text, cls) => {
    const k = keyEls.get(midi);
    if (!k) return;
    const w = h(`<span class="key-word ${cls}">${esc(text)}</span>`);
    w.style.left = `${k.offsetLeft + k.offsetWidth / 2}px`;
    w.addEventListener('animationend', () => w.remove());
    keysEl.appendChild(w);
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
    $('.desk-welcome').hidden = true;
    // the stretches to practise: every line of the sheet (four bars)
    sections = [];
    for (let b = 0; b < parsed.measures.length; b += SECTION_BARS) {
      const first = parsed.measures[b][0], lastBar = parsed.measures[Math.min(b + SECTION_BARS, parsed.measures.length) - 1];
      const last = lastBar[lastBar.length - 1];
      if (parsed.measures.slice(b, b + SECTION_BARS).flat().some(playable)) {
        sections.push({ bar: b + 1, from: first.start, to: last.start + last.dur, label: `Maat ${b + 1}–${Math.min(b + SECTION_BARS, parsed.measures.length)}` });
      }
    }
    section = -1;
    $('.practice-pop').hidden = true;
    ['.read', '.listen', '.follow', '.rhythm', '.practice-btn'].forEach(s => { $(s).hidden = false; });
    showName();
    showPage(0);
    setStatus('Begin met Luister. Speel dan mee: de piano wacht op jou. Kun je het? Probeer het dan In de maat!');
  }
  // the piece's name, with the stretch and tempo being practised
  function showName() {
    const piece = parsed.piece;
    const extra = [section >= 0 ? sections[section].label : '', tempo < 1 ? `${Math.round(tempo * 100)}%` : ''].filter(Boolean);
    $('.piece-name').innerHTML = `<b>${esc(piece.title)}</b> · ${esc(creditFor(piece).short)}${extra.length ? ` <span class="practising">${esc(extra.join(' · '))}</span>` : ''}`;
  }
  const firstPage = () => {
    const n = parsed.notes.find(inStretch);
    return n ? pageOfNote(parsed, n, SYSTEMS) : 0;
  };

  function stopAll() {
    player?.stop(); player = null;
    hush();
    clearInterval(judgeTimer);
    mode = 'free';
    along = 0;
    clearMarks();
    noteEls.forEach(g => g.classList.remove('done', 'early', 'late', 'missed'));
    ['.listen', '.follow', '.rhythm'].forEach(s => $(s).classList.remove('on'));
    $('.celebrate').hidden = true;
    $('.count-in').hidden = true;
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
    if (section >= 0) setStatus(`Luister naar ${sections[section].label.toLowerCase()}${loop ? ' (steeds opnieuw)' : ''}.`);
    player = playPiece(parsed, {
      ...stretch(),
      tempoScale: tempo,
      metronome: metro,
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
      onEnd() {
        stopAll();
        if (loop) { listen(); return; }
        setStatus('Klaar! Probeer het nu zelf met Speel mee: de piano wacht op jou.');
      },
    });
  }

  function follow() {
    if (mode === 'follow') { stopAll(); setStatus(''); return; }
    stopAll();
    mode = 'follow';
    idx = parsed.notes.findIndex(inStretch);
    mistakes = 0; wrongInRow = 0;
    $('.follow').classList.add('on');
    setStatus('Druk op de toets die oplicht! De piano wacht op je.');
    nextTarget();
  }

  // the next note to play from note index i on, inside the stretch (or -1)
  const nextPlayable = i => {
    const notes = parsed.notes;
    while (i < notes.length && inStretch(notes[i]) && !playable(notes[i])) i++;
    return i < notes.length && inStretch(notes[i]) ? i : -1;
  };

  function nextTarget() {
    const notes = parsed.notes;
    keyEls.forEach(k => k.classList.remove('target', 'next'));
    noteEls.forEach(g => g.classList.remove('next'));
    const i = idx < 0 ? -1 : nextPlayable(idx);
    if (i < 0) return finish('follow');
    idx = i;
    const n = notes[idx];
    markNote(n);
    // the note after it shows faintly, so the hand can get ready
    const j = nextPlayable(idx + 1);
    if (j >= 0) {
      noteEls.get(notes[j].i)?.classList.add('next');
      if (notes[j].midi !== n.midi) keyEls.get(notes[j].midi)?.classList.add('next');
    }
    // slide the computer keyboard along when the note is out of its reach
    let s = shift;
    while (n.midi < KEYS_LOW + s * 12 && s > MIN_SHIFT) s--;
    while (n.midi > KEYS_HIGH + s * 12 && s < MAX_SHIFT) s++;
    if (s !== shift) { shift = s; buildKeys(); }
    const k = keyEls.get(n.midi);
    k?.classList.add('target');
    const code = keyCodeForMidi(n.midi, shift);
    setStatus(`Speel ${labelFor(n.letter, n.acc)}${code ? ` — toets ${keyLabels[code]}` : ''}`);
  }

  // The end of a run: stars, what went well, and the next step a teacher would give.
  function finish(kind, result = {}) {
    const stars = kind === 'follow'
      ? (mistakes <= 2 ? 3 : mistakes <= 6 ? 2 : 1)
      : (result.score >= 0.85 ? 3 : result.score >= 0.6 ? 2 : 1);
    clearInterval(judgeTimer);
    mode = 'free';
    ['.follow', '.rhythm'].forEach(s => $(s).classList.remove('on'));
    $('.count-in').hidden = true;
    keyEls.forEach(k => k.classList.remove('target', 'next'));
    saveStars(pieceIdNow, partKey(), kind, stars);
    const what = section >= 0 ? `${sections[section].label.toLowerCase()}` : 'het hele stuk';
    const detail = kind === 'follow'
      ? (mistakes === 0 ? 'Geen enkele fout!' : `${mistakes} ${mistakes === 1 ? 'foutje' : 'foutjes'}: oefening baart kunst.`)
      : `<span class="res good">${result.good} op tijd</span> <span class="res ok">${result.early} te vroeg</span> <span class="res ok">${result.late} te laat</span> <span class="res miss">${result.missed} gemist</span>`;
    // the next step: the same in time, faster, the next stretch, or the whole piece
    const steps = [];
    if (kind === 'follow' && stars >= 2) steps.push(['rhythm', 'Nu in de maat']);
    if (kind === 'rhythm' && stars === 3 && tempo < 1) steps.push(['faster', `Sneller (${Math.round(Math.min(1, tempo + 0.1) * 100)}%)`]);
    if (stars >= 2 && section >= 0 && section < sections.length - 1) steps.push(['nextpart', `Volgend stukje: ${sections[section + 1].label}`]);
    if (stars >= 2 && section >= 0 && section === sections.length - 1) steps.push(['whole', 'Nu het hele stuk']);
    const tip = kind === 'rhythm' && stars < 3
      ? (result.early > result.late + 1 ? 'Je speelt soms te vroeg: wacht op de tik van de metronoom.' : result.late > result.early + 1 ? 'Je bent soms te laat: probeer het eens langzamer (Oefenen).' : result.missed > 2 ? 'Probeer het eerst langzamer, of oefen de noten met Speel mee.' : '')
      : '';
    const c = $('.celebrate');
    c.innerHTML = `<div class="stars">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
      <h3>${stars === 3 ? 'Prachtig gespeeld!' : stars === 2 ? 'Goed gedaan!' : `Je hebt ${what} gespeeld!`}</h3>
      <p class="detail">${detail}</p>
      ${tip ? `<p class="tip">${esc(tip)}</p>` : ''}
      <div class="row"><button class="btn brass again">Nog een keer</button>
      ${steps.map(([id, label]) => `<button class="btn brass step" data-step="${id}">${esc(label)}</button>`).join('')}
      <button class="btn wood other">Ander stuk</button></div>`;
    c.hidden = false;
    c.querySelector('.again').onclick = () => (kind === 'follow' ? follow() : rhythm());
    c.querySelectorAll('.step').forEach(b => {
      b.onclick = () => {
        const st = b.dataset.step;
        if (st === 'faster') setTempo(tempo + 0.1);
        if (st === 'nextpart') setSection(section + 1);
        if (st === 'whole') setSection(-1);
        (st === 'rhythm' || kind === 'rhythm') ? rhythm() : follow();
      };
    });
    c.querySelector('.other').onclick = () => { c.hidden = true; ui.open('library', { forPiano: true }); };
    setStatus('');
  }

  // Speel mee, with the accompaniment: once the right note is played, the accompaniment from that
  // note up to the next one sounds, at the practice tempo, so the song grows under your fingers.
  function answer(n) {
    if (!withAccomp || !parsed.accomp.length) return;
    const j = nextPlayable(n.i + 1);
    const off = parsed.offset, spb = parsed.secPerBeat / tempo;
    const from = off + n.start, to = off + (j >= 0 ? parsed.notes[j].start : stretch().to === Infinity ? n.start + n.dur : stretch().to);
    for (const a of parsed.accomp) {
      if (a.start < from - 1e-6 || a.start >= to - 1e-6) continue;
      const k = keyEls.get(a.midi);
      later.push(setTimeout(() => { noteOn(a.midi, 0.38); answering.add(a.midi); k?.classList.add('accomp'); }, (a.start - from) * spb * 1000));
      later.push(setTimeout(() => { answering.delete(a.midi); if (!held.has(a.midi)) noteOff(a.midi); k?.classList.remove('accomp'); }, (a.start - from + a.dur * 0.95) * spb * 1000));
    }
  }

  // In de maat: the piano counts in a bar, then plays the accompaniment (and the metronome, when on)
  // in time. The player plays the melody; each note is judged on time, early, late or missed.
  let judgeTimer = 0;
  function rhythm() {
    if (mode === 'rhythm') { stopAll(); setStatus(''); return; }
    stopAll();
    if (!audioState.ready) { setStatus('De piano wordt nog gestemd… even geduld!'); return; }
    mode = 'rhythm';
    $('.rhythm').classList.add('on');
    mistakes = 0;
    const spb = parsed.secPerBeat / tempo;
    const good = Math.max(0.09, 0.2 * spb), ok = Math.max(0.2, 0.5 * spb);
    const todo = parsed.notes.filter(n => inStretch(n) && playable(n)).map(n => ({ n, judged: false }));
    const result = { good: 0, early: 0, late: 0, missed: 0, total: todo.length };
    const counter = $('.count-in');
    showPage(firstPage());
    setStatus('Luister naar de tikken en tel mee…');
    const lit = new Map();
    player = playPiece(parsed, {
      ...stretch(),
      tempoScale: tempo,
      countIn: Math.min(4, Math.round(parsed.beatsPerMeasure)) || 4,
      metronome: metro,
      melody: 0,
      onBeat({ count }) {
        if (count == null) { counter.hidden = true; return; }
        counter.hidden = false;
        counter.textContent = count;
        counter.classList.remove('beat'); void counter.offsetWidth; counter.classList.add('beat');
      },
      onNote(n) {
        counter.hidden = true;
        if (n.i === parsed.notes.find(inStretch)?.i) setStatus('Speel nu mee, op de maat!');
        markNote(n);
        keyEls.forEach(k => k.classList.remove('target', 'next'));
        if (!playable(n)) return;
        keyEls.get(n.midi)?.classList.add('target');
        const j = nextPlayable(n.i + 1);
        if (j >= 0 && parsed.notes[j].midi !== n.midi) keyEls.get(parsed.notes[j].midi)?.classList.add('next');
      },
      onKey(midi, on) {
        const count = (lit.get(midi) || 0) + (on ? 1 : -1);
        lit.set(midi, count);
        keyEls.get(midi)?.classList.toggle('accomp', count > 0);
      },
      onEnd() {
        const r = result;
        r.missed += todo.filter(t => !t.judged).length;
        r.score = r.total ? Math.max(0, (r.good + 0.6 * (r.early + r.late)) / r.total - 0.03 * mistakes) : 0;
        // repeating: again until it's three stars
        if (loop && r.score < 0.85) { stopAll(); rhythm(); return; }
        finish('rhythm', r);
      },
    });
    // a note nobody played in time is missed
    judgeTimer = setInterval(() => {
      const now = audioNow();
      for (const t of todo) {
        if (t.judged || player.timeOf(t.n) + ok > now) continue;
        t.judged = true;
        result.missed++;
        noteEls.get(t.n.i)?.classList.add('missed');
      }
    }, 60);
    // judge a key: the nearest note of that pitch not judged yet, if it is near enough in time
    rhythm.judge = midi => {
      const now = audioNow();
      let best = null;
      for (const t of todo) {
        if (t.judged || t.n.midi !== midi) continue;
        const dt = now - player.timeOf(t.n);
        if (Math.abs(dt) <= ok && (!best || Math.abs(dt) < Math.abs(best.dt))) best = { t, dt };
      }
      if (!best) return false;
      best.t.judged = true;
      const g = noteEls.get(best.t.n.i);
      if (Math.abs(best.dt) <= good) { result.good++; g?.classList.add('done'); say(midi, 'Goed!', 'good'); }
      else if (best.dt < 0) { result.early++; g?.classList.add('early'); say(midi, 'Te vroeg', 'early'); }
      else { result.late++; g?.classList.add('late'); say(midi, 'Te laat', 'late'); }
      return true;
    };
  }

  // Free play with a piece on the desk: the sheet plays along. The next note of the piece, when it's
  // played, turns green and the sheet moves on (turning the page when needed); any other key makes
  // that note glow wherever it is on the page, so every key shows where it is written.
  function playAlong(midi) {
    const notes = parsed.notes;
    const skip = () => { while (along < notes.length && (notes[along].rest || notes[along].tied || !inStretch(notes[along]))) along++; };
    if (section >= 0 && along < notes.findIndex(inStretch)) along = notes.findIndex(inStretch);
    skip();
    const n = notes[along];
    if (n && n.midi === midi) {
      showPage(pageOfNote(parsed, n, SYSTEMS));
      const g = noteEls.get(n.i);
      g?.classList.add('done');
      flash(g);
      along++;
      skip();
      if (along >= notes.length || !inStretch(notes[along])) {
        setStatus(section >= 0 ? `Je hebt ${sections[section].label.toLowerCase()} gespeeld! Nog eens?` : 'Je hebt het hele stuk gespeeld! Speel het gerust nog eens.');
        along = 0;
        setTimeout(() => { if (mode === 'free') { noteEls.forEach(e => e.classList.remove('done')); showPage(firstPage()); } }, 1500);
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
        wrongInRow = 0;
        hush();
        answer(n);
        idx++;
        nextTarget();
      } else {
        mistakes++;
        wrongInRow++;
        k?.classList.remove('wrong'); void k?.offsetWidth; k?.classList.add('wrong');
        // after a few tries a teacher helps: higher or lower, and which key
        if (n && wrongInRow >= 2) {
          const code = keyCodeForMidi(n.midi, shift);
          setStatus(`${midi < n.midi ? 'Iets hoger!' : 'Iets lager!'} Zoek de ${labelFor(n.letter, n.acc)}${code ? `: toets ${keyLabels[code]}` : ''}. Hij licht op.`);
        }
      }
    }
    if (mode === 'rhythm' && !rhythm.judge?.(midi)) {
      mistakes++;
      k?.classList.remove('wrong'); void k?.offsetWidth; k?.classList.add('wrong');
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
  $('.rhythm').onclick = rhythm;

  // Oefenen: the practice card — tempo, which stretch, and a few switches
  const practicePop = $('.practice-pop');
  function setTempo(t) {
    tempo = TEMPOS.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
    showName();
    if (!practicePop.hidden) drawPractice();
  }
  function setSection(k) {
    stopAll();
    section = k;
    page = -1;
    along = 0;
    showName();
    showPage(firstPage());
    if (!practicePop.hidden) drawPractice();
  }
  function drawPractice() {
    const stars = (part, kind) => { const n = starsOf(pieceIdNow, part, kind); return n ? `<i class="pstars ${kind}" title="${kind === 'follow' ? 'Speel mee' : 'In de maat'}">${kind === 'follow' ? '♪' : '♩'} ${starText(n)}</i>` : ''; };
    const chip = (k, label, part) => `<button class="psec ${section === k ? 'on' : ''}" data-k="${k}"><b>${esc(label)}</b>${stars(part, 'follow')}${stars(part, 'rhythm')}</button>`;
    const toggle = (id, on, label) => `<button class="ptoggle ${on ? 'on' : ''}" data-t="${id}"><span class="box">${on ? '✓' : ''}</span>${esc(label)}</button>`;
    practicePop.innerHTML = `
      <h3 class="hand">Oefenen</h3>
      <div class="prow"><span class="plabel">Tempo</span>
        <button class="btn wood small pslower" ${tempo <= TEMPOS[0] ? 'disabled' : ''} title="Langzamer">−</button>
        <b class="ptempo">${Math.round(tempo * 100)}%</b>
        <button class="btn wood small pfaster" ${tempo >= 1 ? 'disabled' : ''} title="Sneller">+</button>
        <span class="pnote">${tempo < 1 ? 'Langzaam oefenen is slim: daarna gaat het vanzelf sneller.' : 'Het echte tempo.'}</span></div>
      <div class="prow wrap"><span class="plabel">Welk stukje?</span>
        <div class="psecs">${chip(-1, 'Het hele stuk', 'all')}${sections.map((sec, k) => chip(k, sec.label, `m${sec.bar}`)).join('')}</div></div>
      <div class="prow"><span class="plabel">Extra</span>
        ${toggle('loop', loop, 'Herhalen')}
        ${parsed.accomp.length ? toggle('accomp', withAccomp, 'Begeleiding bij Speel mee') : ''}
        ${toggle('metro', metro, 'Metronoom')}</div>
      <div class="row"><button class="btn brass pdone">Klaar</button></div>`;
    practicePop.querySelector('.pslower').onclick = () => setTempo(tempo - 0.1);
    practicePop.querySelector('.pfaster').onclick = () => setTempo(tempo + 0.1);
    practicePop.querySelectorAll('.psec').forEach(b => { b.onclick = () => setSection(+b.dataset.k); });
    practicePop.querySelectorAll('.ptoggle').forEach(b => {
      b.onclick = () => {
        const t = b.dataset.t;
        if (t === 'loop') loop = !loop;
        if (t === 'accomp') withAccomp = !withAccomp;
        if (t === 'metro') metro = !metro;
        drawPractice();
      };
    });
    practicePop.querySelector('.pdone').onclick = () => { practicePop.hidden = true; };
  }
  $('.practice-btn').onclick = () => {
    guidePop.hidden = true; instrPop.hidden = true;
    if (practicePop.hidden) drawPractice();
    practicePop.hidden = !practicePop.hidden;
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
    instrPop.hidden = true;
    practicePop.hidden = true;
    guidePop.hidden = !guidePop.hidden;
  };

  // Other instruments: the keys (and Luister, Speel mee) can sound like a violin, a harp, a tuba…
  // Grouped by family, as in an orchestra. The choice holds while the piano is open.
  let instrument = 'piano';
  const instrPop = $('.instr-pop');
  const families = [...new Set(INSTRUMENTS.map(i => i.family))];
  for (const fam of families) {
    const group = h(`<section class="instr-family"><h4>${esc(fam)}</h4><div></div></section>`);
    for (const inst of INSTRUMENTS.filter(i => i.family === fam)) {
      const b = h(`<button class="instr" data-id="${inst.id}">${esc(inst.name)}</button>`);
      b.onclick = () => chooseInstrument(inst.id);
      group.querySelector('div').appendChild(b);
    }
    $('.instr-families').appendChild(group);
  }
  const markInstrument = () => {
    instrPop.querySelectorAll('.instr').forEach(b => b.classList.toggle('on', b.dataset.id === instrument));
    $('.instr-name').textContent = instrumentById(instrument).name;
  };
  function chooseInstrument(id) {
    instrPop.hidden = true;
    if (!audioState.ready) { setStatus('De piano wordt nog gestemd… even geduld!'); return; }
    stopAll();
    const inst = instrumentById(id);
    instrument = id;
    markInstrument();
    $('.instr-btn').classList.add('loading');
    setStatus(id === 'piano' ? 'Je speelt weer op de piano.' : `De ${inst.name.toLowerCase()} wordt gestemd…`);
    setInstrument(id).then(() => {
      if (instrument !== id) return;
      $('.instr-btn').classList.remove('loading');
      if (id !== 'piano') setStatus(`Je speelt nu op de ${inst.name.toLowerCase()}! Probeer maar.`);
    }).catch(() => {
      if (instrument !== id) return;
      $('.instr-btn').classList.remove('loading');
      instrument = 'piano';
      markInstrument();
      setInstrument('piano').catch(() => {});
      setStatus(`De ${inst.name.toLowerCase()} kon niet geladen worden (geen internet?). Je speelt op de piano.`);
    });
  }
  markInstrument();
  $('.instr-btn').onclick = () => {
    guidePop.hidden = true; practicePop.hidden = true; instrPop.hidden = !instrPop.hidden; };

  if (pieceId) loadPiece(pieceId);
  else setStatus('Speel wat je wilt, of kies bladmuziek om een liedje te leren.');
  onAudioReady(() => { if (!parsed && mode === 'free') setStatus('De piano is gestemd. Speel wat je wilt, of kies bladmuziek!'); });
  $('.dw-choice.learn').onclick = () => ui.open('library', { forPiano: true });

  return {
    el,
    loadPiece,
    // the other views (gramophone, lessons) play the piano; the chosen instrument comes back here
    onHide() { stopAll(); held.forEach(release); codeNotes.clear(); pedalLatched = false; setPedal(false); if (audioState.ready) setInstrument('piano').catch(() => {}); },
    onShow() { if (instrument !== 'piano' && audioState.ready) setInstrument(instrument).catch(() => {}); },
    onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); setPedal(true); return; }
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
      if (e.code === 'Enter' && parsed) { e.preventDefault(); if (e.repeat) return; mode === 'follow' || mode === 'rhythm' ? stopAll() : listen(); }
    },
    onKeyUp(e) {
      if (e.code === 'Space') { setPedal(pedalLatched); return; }
      const midi = codeNotes.get(e.code);
      if (midi != null) { codeNotes.delete(e.code); release(midi); }
    },
    destroy() {
      stopAll();
      if (audioState.ready) setInstrument('piano').catch(() => {});
      held.forEach(m => noteOff(m));
      sustained.forEach(m => noteOff(m));
    },
  };
}
