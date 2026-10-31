// Portrait gallery on the empty wall close-up (public/art/closeups/gallery-wall): the four makers of
// the game as oil paintings, opening a card with all four. The composer card (portrait, biography
// and music) is still opened from a composer's sheet music.
import { frame, h, esc, speak, SPEAKER } from './ui.js';
import { CYLINDER_ART, cylinderColor, coverFor } from './library.js';
import { TEAM, composerById, piecesBy, portraitOf, NO_PORTRAIT } from '../data.js';
import { FRAME_TYPES, FRAME_SRC, TEAM_FRAME } from '../frames.js';

// Where the frames hang on the close-up (1672 × 941): centre x, top y and height, in image pixels.
// One row of four between the pillars, under the picture lamp and above the wainscot.
const BG_W = 1672, BG_H = 941;
const HANG = [
  { cx: 362, top: 170, h: 380 }, { cx: 676, top: 150, h: 400 },
  { cx: 996, top: 150, h: 400 }, { cx: 1310, top: 170, h: 380 },
];
const TILT = [-1.2, 0.8, -0.6, 1];
const pct = (v, of) => `${v / of * 100}%`;
// a portrait that won't load becomes the silhouette
const FALLBACK = `this.onerror = null; this.src = '${NO_PORTRAIT}'`;

export function galleryView(ui) {
  const { el, stage } = frame(ui, {
    title: 'De makers',
    cls: 'gallery',
    wide: true,
    closeup: 'public/art/closeups/gallery-wall.webp',
    full: true,
    tip: 'Dit zijn de mensen die dit spel hebben gemaakt, geschilderd in kleren van vroeger. Klik op een schilderij om ze allemaal te zien.',
  });
  TEAM.forEach((m, i) => {
    const spot = HANG[i % HANG.length];
    const t = FRAME_TYPES[TEAM_FRAME[m.id]];
    const w = spot.h * t.w / t.h;
    const [l, tp, r, b] = t.inner;
    const label = m.name || 'Een van de makers';
    const f = h(`
      <button class="gframe" title="${esc(label)}" style="--tilt:${TILT[i % TILT.length]}deg">
        <img class="face ${t.oval ? 'oval' : ''}" src="${m.portrait}" alt="${esc(label)}"
          style="left:${pct(l, t.w)};top:${pct(tp, t.h)};width:${pct(r - l, t.w)};height:${pct(b - tp, t.h)}">
        <img class="gilt-frame" src="${FRAME_SRC(TEAM_FRAME[m.id])}" alt="">
        ${m.name ? `<span class="wall-plaque">${esc(m.name)}</span>` : ''}
      </button>`);
    Object.assign(f.style, {
      left: pct(spot.cx - w / 2, BG_W), top: pct(spot.top, BG_H),
      width: pct(w, BG_W), height: pct(spot.h, BG_H),
    });
    f.onclick = () => ui.open('team');
    stage.appendChild(f);
  });
  return { el };
}

// The makers of the game, all four together on a paper card.
export function teamView(ui) {
  const { el, body } = frame(ui, {
    title: 'De makers van dit spel',
    cls: 'team',
    wide: true,
    tip: 'Deze mensen hebben Muziekhandel Simone gemaakt.',
  });
  body.appendChild(h(`
    <div class="team-card">
      <p class="team-intro">Op deze schilderijen staan de makers van dit spel. Zij hebben de winkel, de piano, de muziek en het verhaal voor jou gemaakt. Ze hebben zich laten schilderen in kleren van vroeger.</p>
      <ul class="team-list">
        ${TEAM.map(m => `
          <li>
            <span class="gilt"><img src="${m.portrait}" alt="${esc(m.name || 'Een van de makers')}"></span>
            ${m.name ? `<div class="plaque"><b>${esc(m.name)}</b></div>` : ''}
          </li>`).join('')}
      </ul>
    </div>`));
  return { el };
}

export function composerView(ui, { composerId }) {
  const c = composerById(composerId);
  const pieces = piecesBy(c.id);
  const { el, body } = frame(ui, {
    title: c.name,
    cls: 'composer',
    wide: true,
    tip: 'Links zie je het schilderij, rechts het verhaal van de componist. Klik op Voorlezen om het te horen. Onderaan staat zijn muziek: luister ernaar op de grammofoon, of bekijk de bladmuziek.',
  });

  body.appendChild(h(`
    <div class="composer-grid">
      <div class="composer-portrait">
        <span class="gilt big"><img src="${portraitOf(c)}" alt="${esc(c.name)}" onerror="${FALLBACK}"></span>
        <div class="plaque"><b>${esc(c.name)}</b><small>${esc(c.years)} · ${esc(c.title)}</small></div>
      </div>
      <div class="bio paper-inner">
        <div class="bio-head"><h3>Het verhaal van ${esc(c.short)}</h3><button class="keeper-listen speak">${SPEAKER}Voorlezen</button></div>
        <p>${esc(c.bio)}</p>
        <p class="fact"><b>Wist je dat?</b> ${esc(c.fact)}</p>
        <p class="dates"><b>Geboren:</b> ${esc(c.born)} &nbsp; <b>Gestorven:</b> ${esc(c.died)}</p>
      </div>
      <section class="composer-music">
        <h3 class="hand">Muziek van ${esc(c.short)}</h3>
        <ul class="music-list"></ul>
      </section>
    </div>`));

  // each piece in the shop: its cylinder and its sheet-music cover, to listen or to read
  const list = body.querySelector('.music-list');
  for (const p of pieces) {
    const li = h(`
      <li class="music-card">
        <img class="mc-cyl" src="${CYLINDER_ART}${cylinderColor(p)}.webp" alt="">
        <div class="mc-text"><b>${esc(p.title)}</b>${p.subtitle ? `<small>${esc(p.subtitle)}</small>` : ''}</div>
        <div class="mc-actions">
          <button class="btn brass small listen">Luister</button>
          <button class="btn wood small read"><img src="${coverFor(p)}" alt="">Bladmuziek</button>
        </div>
      </li>`);
    li.querySelector('.listen').onclick = () => ui.open('gramophone', { pieceId: p.id });
    li.querySelector('.read').onclick = () => ui.open('sheet', { pieceId: p.id });
    list.appendChild(li);
  }
  if (!pieces.length) list.appendChild(h('<li class="music-none">Van deze componist heeft de winkel nog geen muziek. Vraag het Meneer Simone later nog eens!</li>'));
  body.querySelector('.speak').onclick = () => speak(`${c.name}. ${c.bio} Wist je dat? ${c.fact}`);

  return { el };
}
