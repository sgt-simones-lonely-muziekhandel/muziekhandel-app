// De notenles: music theory for complete beginners, in nine short chapters. Each chapter is a few
// sentences in simple Dutch (Voorlezen reads them aloud) and something to try: a little keyboard,
// a staff to click on, a tune to listen to while the counting runs along. The notes look and sound
// as everywhere in the game (js/notation.js, the note colours, the piano samples).
import { frame, h, esc, speak, stopSpeaking, SPEAKER } from './ui.js';
import { parsePiece, midiInfo, labelFor, noteNames, NOTE_COLORS } from '../music.js';
import { renderPage } from '../notation.js';
import { strike, playPiece, audioState } from '../audio.js';

// --- the things to try

// A small keyboard from `lo` to `hi` (MIDI). Clicking a key plays it; `onPress(midi)` hears it too.
function miniKeys(lo, hi, { names = true, onPress } = {}) {
  const el = h('<div class="mk"></div>');
  const whites = [];
  for (let m = lo; m <= hi; m++) if (!midiInfo(m).black) whites.push(m);
  const ww = 100 / whites.length;
  const keys = new Map();
  for (let m = lo; m <= hi; m++) {
    const info = midiInfo(m);
    const k = h(`<button class="mk-key ${info.black ? 'b' : 'w'}" style="--c:${NOTE_COLORS[info.letter]}" aria-label="${labelFor(info.letter, info.acc)}${info.oct}">
      ${names ? `<span>${labelFor(info.letter, info.acc)}</span>` : ''}</button>`);
    if (info.black) {
      k.style.left = `${whites.filter(w => w < m).length * ww - ww * 0.31}%`;
      k.style.width = `${ww * 0.62}%`;
    } else k.style.width = `${ww}%`;
    k.onpointerdown = e => { e.preventDefault(); light(m); strike(m, 0.8); onPress?.(m); };
    keys.set(m, k);
    el.appendChild(k);
  }
  const light = (m, ms = 450, cls = 'lit') => {
    const k = keys.get(m);
    if (!k) return;
    k.classList.add(cls);
    clearTimeout(k.t);
    k.t = setTimeout(() => k.classList.remove(cls), ms);
  };
  el.light = light;
  el.keys = keys;
  return el;
}

// A line of music from a note string (the format of js/data.js). Click a note to hear it.
let lessonPieces = 0;
function staff(notes, { time = [4, 4], tempo = 90, bars = 4 } = {}) {
  const piece = { id: `les-${++lessonPieces}`, title: '', time, tempo, notes };
  const parsed = parsePiece(piece);
  const el = h('<div class="les-staff"></div>');
  const noteEls = renderPage(el, parsed, 0, 1, Math.max(bars, parsed.measures.length), 1000);
  noteEls.forEach((g, i) => {
    const n = parsed.notes[i];
    if (n.rest) return;
    g.style.cursor = 'pointer';
    g.addEventListener('pointerdown', () => { strike(n.midi, 0.7); mark(g); });
  });
  const mark = g => { g.classList.remove('hit'); void g.getBoundingClientRect(); g.classList.add('hit'); };
  el.parsed = parsed;
  el.noteEls = noteEls;
  return el;
}

// A button that plays a staff, lighting up each note as it sounds, with the beats counted
// out loud on the counter (1 2 3 4) when there is one.
function playButton(lesson, label, staffEl, counter) {
  const b = h(`<button class="btn brass small">▶ ${esc(label)}</button>`);
  b.onclick = () => lesson.play(staffEl, counter, b);
  return b;
}

const counterEl = () => h('<div class="les-count" aria-hidden="true"><b>1</b><b>2</b><b>3</b><b>4</b></div>');

// --- the chapters: a title, the words, and what to try

const CHAPTERS = [
  {
    title: 'Wat is een noot?',
    text: 'Een noot is één klank. Sommige klanken zijn laag, zoals een brommende beer. Andere zijn hoog, zoals een fluitend vogeltje. Op de piano zitten de lage noten links en de hoge noten rechts. Probeer het maar!',
    build(l) {
      const keys = miniKeys(48, 84, { names: false });
      const low = h('<button class="btn wood small">🐻 Laag</button>');
      const high = h('<button class="btn wood small">🐦 Hoog</button>');
      const run = h('<button class="btn brass small">▶ Van laag naar hoog</button>');
      low.onclick = () => { strike(48, 1); keys.light(48, 900); };
      high.onclick = () => { strike(84, 1); keys.light(84, 900); };
      run.onclick = () => {
        const whites = [...keys.keys.keys()].filter(m => !midiInfo(m).black);
        whites.forEach((m, i) => l.later(() => { strike(m, 0.4); keys.light(m, 300); }, i * 120));
      };
      return [keys, row(low, run, high)];
    },
  },
  {
    title: 'Zeven namen',
    text: 'Er zijn maar zeven namen voor de noten: C, D, E, F, G, A en B. In Frankrijk en Italië zingen ze do, re, mi, fa, sol, la, si. Na de B begint het gewoon opnieuw bij C, maar dan hoger. In dit spel heeft elke noot zijn eigen kleur: de C is rood, de D oranje, de E geel…',
    build() {
      const keys = miniKeys(60, 72);
      const tiles = h('<div class="les-tiles"></div>');
      ['C', 'D', 'E', 'F', 'G', 'A', 'B'].forEach((L, i) => {
        const m = [60, 62, 64, 65, 67, 69, 71][i];
        const t = h(`<button class="les-tile" style="--c:${NOTE_COLORS[L]}"><b>${labelFor(L)}</b></button>`);
        t.onclick = () => { strike(m, 0.8); keys.light(m, 700); };
        tiles.appendChild(t);
      });
      const names = h(`<button class="btn wood small">${noteNames.mode === 'letters' ? 'Zeg do re mi' : 'Zeg C D E'}</button>`);
      names.onclick = () => {
        noteNames.mode = noteNames.mode === 'letters' ? 'solfege' : 'letters';
        const fresh = this.build();
        tiles.replaceWith(fresh[0]); keys.replaceWith(fresh[1]); names.replaceWith(fresh[2]);
      };
      return [tiles, keys, names];
    },
  },
  {
    title: 'Witte en zwarte toetsen',
    text: 'Kijk goed naar de zwarte toetsen: ze staan in groepjes van twee en van drie. Daaraan herken je elke noot! De C is altijd de witte toets links van een groepje van twee zwarte. Kun jij alle C\'s vinden?',
    build() {
      const found = new Set();
      const say = h('<p class="les-goal">Zoek de C! <b>0 van 3</b> gevonden</p>');
      const keys = miniKeys(48, 83, { names: false, onPress: m => {
        if (m % 12 !== 0) { keys.light(m, 450, 'nope'); return; }
        found.add(m);
        keys.keys.get(m).classList.add('found');
        say.innerHTML = found.size < 3 ? `Zoek de C! <b>${found.size} van 3</b> gevonden` : '<b>Goed zo!</b> Alle C\'s gevonden. Zie je dat ze allemaal links van twee zwarte toetsen staan?';
      } });
      return [say, keys];
    },
  },
  {
    title: 'De notenbalk',
    text: 'Muziek schrijf je op vijf lijnen: de notenbalk. Een noot staat óp een lijn of tussen twee lijnen. Hoe hoger de noot op de balk staat, hoe hoger hij klinkt. Het krulletje vooraan is de solsleutel. De C onder de balk krijgt een eigen klein lijntje: dat is de middelste C, precies in het midden van de piano. Klik op de noten!',
    build(l) {
      const s = staff('C4:q D4:q E4:q F4:q | G4:q A4:q B4:q C5:q', { bars: 2, tempo: 100 });
      return [s, row(playButton(l, 'Speel de toonladder', s))];
    },
  },
  {
    title: 'Hoe lang duurt een noot?',
    text: 'Een noot kan kort of lang zijn. Tel maar mee: 1, 2, 3, 4. Een hele noot is een open bolletje zonder stok: die duurt 4 tellen. Een halve noot heeft een stok: 2 tellen. Een kwartnoot is dicht: 1 tel. Een achtste noot heeft een vlaggetje: een halve tel, dus twee achtsten passen in één tel. En een puntje achter een noot maakt hem de helft langer.',
    build(l) {
      const s = staff('C4:w | E4:h E4:h | G4:q G4:q G4:q G4:q | C5:8 C5:8 C5:8 C5:8 C5:8 C5:8 C5:8 C5:8', { tempo: 80 });
      const c = counterEl();
      return [s, row(playButton(l, 'Speel en tel mee', s, c), c)];
    },
  },
  {
    title: 'Even stil: de rust',
    text: 'Soms speel je even niets. Dat heet een rust. Ook een rust heeft een lengte, net als een noot: een kwartrust duurt 1 tel, een halve rust 2 tellen. Luister maar: tussen de noten blijft het stil.',
    build(l) {
      const s = staff('C4:q r:q E4:q r:q | G4:h r:h | E4:q E4:q r:q G4:q | C5:w', { tempo: 90 });
      const c = counterEl();
      return [s, row(playButton(l, 'Luister', s, c), c)];
    },
  },
  {
    title: 'Kruis ♯ en mol ♭',
    text: 'Een kruis ♯ voor een noot maakt hem een klein stapje hoger: je neemt de toets er vlak rechts naast, meestal een zwarte. Een mol ♭ maakt hem een stapje lager: de toets er vlak links naast. Dus C♯ en D♭ zijn dezelfde zwarte toets!',
    build() {
      const keys = miniKeys(60, 67);
      const btn = (label, m) => {
        const b = h(`<button class="btn wood small">${label}</button>`);
        b.onclick = () => { strike(m, 0.8); keys.light(m, 900); };
        return b;
      };
      return [keys, row(btn('C', 60), btn('C♯', 61), btn('D', 62), btn('D♭', 61), btn('E', 64), btn('E♭', 63))];
    },
  },
  {
    title: 'Maten en tellen',
    text: 'Muziek is verdeeld in stukjes die even lang zijn: de maten. Tussen twee maten staat een streep, de maatstreep. De twee cijfers vooraan vertellen hoeveel tellen er in elke maat zitten. Bij 4/4 tel je tot vier, zoals bij een mars. Bij 3/4 tel je tot drie, zoals bij een wals: één-twee-drie, één-twee-drie.',
    build(l) {
      const four = staff('C4:q E4:q G4:q E4:q | C4:q E4:q G4:h | G4:q F4:q E4:q D4:q | C4:w', { tempo: 100 });
      const three = staff('C4:h E4:q | G4:h E4:q | F4:q E4:q D4:q | C4:h.', { time: [3, 4], tempo: 120 });
      const c4 = counterEl(), c3 = counterEl();
      c3.lastChild.remove();
      return [four, row(playButton(l, 'Mars in 4/4', four, c4), c4), three, row(playButton(l, 'Wals in 3/4', three, c3), c3)];
    },
  },
  {
    title: 'Nu jij!',
    text: 'Je weet nu genoeg om te beginnen! Speel dit liedje: Altijd is Kortjakje ziek. Druk steeds op de toets die oplicht. Lukt het? Ga dan naar de piano, kies muziek en druk op Speel mee.',
    build(l) {
      const tune = [60, 60, 67, 67, 69, 69, 67];
      let at = 0;
      const say = h('<p class="les-goal">Druk op de toets die oplicht.</p>');
      const keys = miniKeys(60, 72, { onPress: m => {
        if (m !== tune[at]) { keys.light(m, 450, 'nope'); return; }
        at++;
        if (at < tune.length) return next();
        keys.keys.forEach(k => k.classList.remove('target'));
        say.innerHTML = '<b>Bravo!</b> Je hebt je eerste liedje gespeeld.';
        go.hidden = false;
      } });
      const next = () => {
        keys.keys.forEach(k => k.classList.remove('target'));
        keys.keys.get(tune[at]).classList.add('target');
      };
      next();
      const go = h('<button class="btn brass small" hidden>Naar de piano ›</button>');
      go.onclick = () => l.toPiano();
      return [say, keys, row(go)];
    },
  },
];

const row = (...els) => {
  const r = h('<div class="les-row"></div>');
  r.append(...els);
  return r;
};

export function lessonsView(ui) {
  const { el, body } = frame(ui, {
    title: 'De notenles',
    cls: 'lessons',
    wide: true,
    tip: 'Nog nooit muziek gelezen? Begin bij 1 en lees of luister. Bij elke les kun je zelf iets proberen: klik op de toetsen en de noten!',
  });
  body.appendChild(h(`
    <div class="les-grid">
      <ol class="les-list"></ol>
      <article class="les-page">
        <header class="les-head"><span class="les-no"></span><h3></h3>
          <button class="keeper-listen speak" title="Voorlezen">${SPEAKER}Voorlezen</button></header>
        <p class="les-text"></p>
        <div class="les-try"></div>
        <p class="les-hint" hidden>De piano wordt nog gestemd… even geduld, dan hoor je de noten.</p>
        <footer class="les-nav">
          <button class="btn wood small prev">‹ Vorige</button>
          <span class="les-pos"></span>
          <button class="btn brass small next">Volgende ›</button>
        </footer>
      </article>
    </div>`));
  const $ = s => body.querySelector(s);
  let at = 0, player = null, timers = [];
  const seen = new Set();

  const stop = () => {
    player?.stop(); player = null;
    timers.forEach(clearTimeout); timers = [];
    body.querySelectorAll('.les-count b').forEach(b => b.classList.remove('on'));
  };
  const lesson = {
    later(fn, ms) { timers.push(setTimeout(fn, ms)); },
    // back to the piano the lesson was opened from, with the tune on it, or a piano of its own
    toPiano() {
      ui.close();
      if (ui.top?.name === 'piano') ui.top.loadPiece('kortjakje');
      else ui.open('piano', { pieceId: 'kortjakje' });
    },
    // play a staff: its notes light up as they sound, the counter counts the beats of each bar
    play(staffEl, counter) {
      stop();
      if (!audioState.ready) { $('.les-hint').hidden = false; return; }
      const parsed = staffEl.parsed;
      const marks = () => staffEl.noteEls.forEach(g => g.classList.remove('active'));
      player = playPiece(parsed, {
        onNote(n) { marks(); staffEl.noteEls.get(n.i)?.classList.add('active'); },
        onEnd() { marks(); stop(); },
      });
      if (counter) {
        const beats = counter.children.length, spb = parsed.secPerBeat * 1000;
        const count = Math.round(parsed.totalBeats);
        for (let k = 0; k < count; k++) {
          lesson.later(() => {
            counter.querySelectorAll('b').forEach((b, i) => b.classList.toggle('on', i === k % beats));
          }, 150 + k * spb);
        }
        lesson.later(() => counter.querySelectorAll('b').forEach(b => b.classList.remove('on')), 150 + count * spb);
      }
    },
  };

  CHAPTERS.forEach((c, i) => {
    const li = h(`<li><button><span>${i + 1}</span>${esc(c.title)}</button></li>`);
    li.querySelector('button').onclick = () => show(i);
    $('.les-list').appendChild(li);
  });

  function show(i) {
    stop();
    stopSpeaking();
    at = Math.max(0, Math.min(CHAPTERS.length - 1, i));
    seen.add(at);
    const c = CHAPTERS[at];
    $('.les-no').textContent = at + 1;
    $('.les-head h3').textContent = c.title;
    $('.les-text').textContent = c.text;
    $('.les-hint').hidden = true;
    const box = $('.les-try');
    box.innerHTML = '';
    box.append(...c.build.call(c, lesson));
    $('.les-pos').textContent = `${at + 1} van ${CHAPTERS.length}`;
    $('.prev').disabled = at === 0;
    $('.next').disabled = at === CHAPTERS.length - 1;
    body.querySelectorAll('.les-list li').forEach((li, k) => {
      li.classList.toggle('on', k === at);
      li.classList.toggle('seen', seen.has(k) && k !== at);
    });
    $('.les-page').scrollTop = 0;
  }
  $('.prev').onclick = () => show(at - 1);
  $('.next').onclick = () => show(at + 1);
  $('.speak').onclick = e => speak(`${CHAPTERS[at].title}. ${CHAPTERS[at].text}`, null, e.currentTarget);
  show(0);

  return {
    el,
    onHide: stop,
    destroy() { stop(); stopSpeaking(); },
    onKey(e) {
      if (e.code === 'ArrowRight') { e.preventDefault(); show(at + 1); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
    },
  };
}
