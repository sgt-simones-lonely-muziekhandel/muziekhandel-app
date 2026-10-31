// Portrait gallery on the empty wall close-up (public/art/closeups/gallery-wall): the composers,
// without name plaques, ten to a wall, each opening a card with the portrait, the biography and the
// composer's music. On the wainscot below, two buttons sort them and filter them on the kind of
// music they wrote. (The paintings on the shop wall itself are the team, see js/shop.js.) We have no portraits of the composers, so
// every one is the standard silhouette (portraitOf() gives NO_PORTRAIT).
import { frame, h, esc, speak, SPEAKER } from './ui.js';
import { CYLINDER_ART, cylinderColor, coverFor } from './library.js';
import { COMPOSERS, MUSIC_KINDS, composerById, piecesBy, portraitOf, NO_PORTRAIT } from '../data.js';
import { FRAME_TYPES, FRAME_SRC, COMPOSER_FRAME } from '../frames.js';

// Where the frames hang on the close-up (1672 × 941): two rows of five between the pillars, under
// the picture lamp and above the wainscot; centre x and top y in image pixels, all as high. More
// than ten composers (after sorting and filtering) hang on more walls, walked with the arrows.
const BG_W = 1672, BG_H = 941;
const COLS = [252, 544, 836, 1128, 1420], ROWS = [116, 384], FRAME_H = 196;
const PER_WALL = COLS.length * ROWS.length;
const TILT = [-1.2, 0.8, -0.4, 1, -0.8, 0.5, -1, 0.6, 0.3, -0.6];
const pct = (v, of) => `${v / of * 100}%`;
// a portrait that won't load becomes the silhouette
const FALLBACK = `this.onerror = null; this.src = '${NO_PORTRAIT}'`;
// a composer without a frame of their own gets one in turn
const FRAME_NAMES = Object.keys(FRAME_TYPES);
const frameOf = (c, i) => COMPOSER_FRAME[c.id] || FRAME_NAMES[i % FRAME_NAMES.length];
const born = c => parseInt(c.years, 10) || 0;

// The order and the filters on the wainscot; remembered for the next visit.
const SORTS = [
  { id: 'az', label: 'A – Z', by: (a, b) => a.short.localeCompare(b.short, 'nl') },
  { id: 'old', label: 'Oud → nieuw', by: (a, b) => born(a) - born(b) },
  { id: 'new', label: 'Nieuw → oud', by: (a, b) => born(b) - born(a) },
];
const choice = { sort: 'az', music: null, wall: 0 };

export function galleryView(ui) {
  const { el, stage } = frame(ui, {
    title: 'De componisten',
    cls: 'gallery',
    wide: true,
    closeup: 'public/art/closeups/gallery-wall.webp',
    full: true,
    tip: 'Dit zijn beroemde componisten: mensen die muziek bedenken en opschrijven. Klik op een schilderij om hun verhaal te lezen en hun muziek te horen. Onderaan kun je ze sorteren, of alleen de componisten laten zien van één soort muziek.',
  });

  // The controls on the wainscot: two brass buttons, Sorteer and Muziek, each showing what is
  // chosen; pressed, its options fold open above it. Only the kinds some composer has.
  const used = (kinds, key) => kinds.filter(k => COMPOSERS.some(c => c[key]?.includes(k)));
  const MENUS = [
    { key: 'sort', label: 'Sorteer', options: SORTS.map(o => [o.id, o.label]) },
    { key: 'music', label: 'Muziek', options: [[null, 'Alles'], ...used(MUSIC_KINDS, 'music').map(k => [k, k])] },
  ];
  const bar = h(`
    <div class="wall-filters" style="left:${pct(110, BG_W)};right:${pct(110, BG_W)};top:${pct(690, BG_H)};bottom:${pct(60, BG_H)}">
      ${MENUS.map(m => `
        <div class="wf-menu" data-key="${m.key}">
          <button class="wf-open" aria-haspopup="true" aria-expanded="false">
            <span class="wf-label">${m.label}</span><b class="wf-value"></b><span class="caret" aria-hidden="true">▾</span>
          </button>
          <div class="wf-list" role="menu" aria-label="${m.label}" hidden>
            ${m.options.map(([id, text]) => `<button class="wf-chip" role="menuitemradio" data-key="${m.key}" data-id="${id ?? ''}">${esc(text)}</button>`).join('')}
          </div>
        </div>`).join('')}
    </div>`);
  stage.appendChild(bar);

  // One menu open at a time. In it ↑ ↓ move between the options and Enter picks one; a click
  // elsewhere, Esc or Backspace fold it up again (and only that, the wall stays).
  let open = null;
  const onMenuKey = e => {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault(); e.stopImmediatePropagation();
      const chips = [...open.querySelectorAll('.wf-chip')], k = chips.indexOf(document.activeElement);
      chips[(k + (e.code === 'ArrowDown' ? 1 : -1) + chips.length) % chips.length].focus();
      return;
    }
    if (!['Escape', 'Backspace'].includes(e.code)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const was = open;
    openMenu(null);
    was?.querySelector('.wf-open').focus();
  };
  const onMenuDown = e => { if (!e.target.closest('.wf-menu')) openMenu(null); };
  const openMenu = menu => {
    if (open) {
      open.classList.remove('open');
      open.querySelector('.wf-list').hidden = true;
      open.querySelector('.wf-open').setAttribute('aria-expanded', false);
    }
    open = menu === open ? null : menu;
    removeEventListener('keydown', onMenuKey, true);
    removeEventListener('pointerdown', onMenuDown, true);
    if (!open) return;
    open.classList.add('open');
    const list = open.querySelector('.wf-list');
    list.hidden = false;
    open.querySelector('.wf-open').setAttribute('aria-expanded', true);
    list.querySelectorAll('.wf-chip').forEach((b, k) => b.animate(
      [{ opacity: 0, translate: '0 .8cqw' }, { opacity: 1, translate: '0 0' }],
      { duration: 180, delay: k * 25, easing: 'ease-out', fill: 'backwards' }));
    (list.querySelector('.wf-chip.on') || list.querySelector('.wf-chip')).focus({ preventScroll: true });
    addEventListener('keydown', onMenuKey, true);
    addEventListener('pointerdown', onMenuDown, true);
  };
  stage.insertAdjacentHTML('beforeend', `
    <p class="wall-empty" hidden>Geen componist past hierbij. Kies iets anders.</p>
    <button class="cab-nav prev" title="Vorige muur (←)">‹</button>
    <button class="cab-nav next" title="Volgende muur (→)">›</button>
    <div class="cab-sign wall-sign" hidden><span class="cab-dots"></span></div>`);
  const $ = q => stage.querySelector(q);

  const shown = () => COMPOSERS
    .filter(c => !choice.music || c.music?.includes(choice.music))
    .sort(SORTS.find(o => o.id === choice.sort).by);

  // Hang the composers of the wall in view; they come in one after the other. `from` is the side a
  // new wall comes from (-1 left, 1 right), 0 when the choice changed.
  const hang = (from = 0) => {
    const list = shown(), walls = Math.max(1, Math.ceil(list.length / PER_WALL));
    choice.wall = Math.min(choice.wall, walls - 1);
    stage.querySelectorAll('.gframe').forEach(f => f.remove());
    const here = list.slice(choice.wall * PER_WALL, (choice.wall + 1) * PER_WALL);
    here.forEach((c, k) => {
      const i = COMPOSERS.indexOf(c), name = frameOf(c, i), t = FRAME_TYPES[name];
      const w = FRAME_H * t.w / t.h;
      const [l, tp, r, b] = t.inner;
      const f = h(`
        <button class="gframe" aria-label="${esc(c.name)}" style="--tilt:${TILT[i % TILT.length]}deg">
          <img class="face ${t.oval ? 'oval' : ''}" src="${portraitOf(c)}" alt="" onerror="${FALLBACK}"
            style="left:${pct(l, t.w)};top:${pct(tp, t.h)};width:${pct(r - l, t.w)};height:${pct(b - tp, t.h)}">
          <img class="gilt-frame" src="${FRAME_SRC(name)}" alt="">
        </button>`);
      // a row that isn't full is centred on the wall
      const row = Math.floor(k / COLS.length), inRow = Math.min(COLS.length, here.length - row * COLS.length);
      const step = COLS[1] - COLS[0], cx = COLS[0] + (k % COLS.length + (COLS.length - inRow) / 2) * step, top = ROWS[row];
      Object.assign(f.style, { left: pct(cx - w / 2, BG_W), top: pct(top, BG_H), width: pct(w, BG_W), height: pct(FRAME_H, BG_H) });
      f.onclick = () => ui.open('composer', { composerId: c.id });
      stage.insertBefore(f, bar);
      // (only once the wall is on screen: the first hanging happens before the view is added, and an
      // animation started on an element that isn't in the page yet stays stuck, invisible)
      if (stage.isConnected) {
        f.animate([{ opacity: 0, translate: `${from * 3}cqw -1cqw` }, { opacity: 1, translate: '0 0' }],
          { duration: 320, delay: k * 35, easing: 'cubic-bezier(.25, .8, .25, 1)', fill: 'backwards' });
      }
    });
    $('.wall-empty').hidden = list.length > 0;
    $('.cab-nav.prev').disabled = choice.wall === 0;
    $('.cab-nav.next').disabled = choice.wall >= walls - 1;
    $('.wall-sign').hidden = walls < 2;
    $('.cab-dots').innerHTML = Array.from({ length: walls }, (_, k) => `<i class="${k === choice.wall ? 'on' : ''}"></i>`).join('');
    bar.querySelectorAll('.wf-chip').forEach(b => {
      const on = (choice[b.dataset.key] ?? '') === b.dataset.id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on);
    });
    // each button shows what is chosen; a filter in use is lit
    bar.querySelectorAll('.wf-menu').forEach(m => {
      m.querySelector('.wf-value').textContent = m.querySelector('.wf-chip.on')?.textContent || '';
      m.classList.toggle('active', m.dataset.key !== 'sort' && !!choice[m.dataset.key]);
    });
  };
  bar.addEventListener('click', e => {
    const opener = e.target.closest('.wf-open');
    if (opener) { openMenu(opener.closest('.wf-menu')); return; }
    const b = e.target.closest('.wf-chip');
    if (!b) return;
    choice[b.dataset.key] = b.dataset.id || null;
    choice.wall = 0;
    openMenu(null);
    hang();
  });
  const go = d => {
    const walls = Math.ceil(shown().length / PER_WALL);
    if (choice.wall + d < 0 || choice.wall + d >= walls) return;
    choice.wall += d;
    hang(d);
  };
  $('.cab-nav.prev').onclick = () => go(-1);
  $('.cab-nav.next').onclick = () => go(1);
  hang();

  return {
    el,
    onHide: () => openMenu(null),
    destroy: () => openMenu(null),
    onKey(e) {
      if (open) return;
      if (e.code === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); go(-1); }
    },
  };
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
  body.querySelector('.speak').onclick = e => speak(`${c.name}. ${c.bio} Wist je dat? ${c.fact}`, null, e.currentTarget);

  return { el };
}
