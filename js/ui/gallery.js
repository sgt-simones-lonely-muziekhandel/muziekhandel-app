// Portrait gallery on the empty wall close-up (public/art/closeups/gallery-wall), and a composer
// card with biography and family tree.
import { frame, h, esc, speak } from './ui.js';
import { COMPOSERS, composerById, piecesBy } from '../data.js';
import { FRAME_TYPES, FRAME_SRC, COMPOSER_FRAME } from '../frames.js';

// Where the frames hang on the close-up (1672 × 941): centre x, top y and height, in image pixels.
// Two rows of three between the pillars, under the picture lamp and above the wainscot.
const BG_W = 1672, BG_H = 941;
const HANG = [
  { cx: 420, top: 120, h: 210 }, { cx: 836, top: 104, h: 226 }, { cx: 1252, top: 120, h: 210 },
  { cx: 420, top: 392, h: 214 }, { cx: 836, top: 386, h: 220 }, { cx: 1252, top: 400, h: 200 },
];
const pct = (v, of) => `${v / of * 100}%`;

export function galleryView(ui) {
  const { el, stage } = frame(ui, {
    title: 'De componisten',
    cls: 'gallery',
    wide: true,
    closeup: 'public/art/closeups/gallery-wall.webp',
    full: true,
    tip: 'Dit zijn beroemde componisten: mensen die muziek bedenken en opschrijven. Klik op een schilderij om hun verhaal en hun familie te zien.',
  });
  COMPOSERS.forEach((c, i) => {
    const spot = HANG[i % HANG.length];
    const t = FRAME_TYPES[COMPOSER_FRAME[c.id]];
    const w = spot.h * t.w / t.h;
    const [l, tp, r, b] = t.inner;
    const f = h(`
      <button class="gframe" title="${esc(c.name)}" style="--tilt:${[-1.2, 0.8, -0.4, 1, -0.8, 0.5][i % 6]}deg">
        <img class="face ${t.oval ? 'oval' : ''}" src="${c.portrait}" alt="${esc(c.name)}"
          style="left:${pct(l, t.w)};top:${pct(tp, t.h)};width:${pct(r - l, t.w)};height:${pct(b - tp, t.h)}">
        <img class="gilt-frame" src="${FRAME_SRC(COMPOSER_FRAME[c.id])}" alt="">
        <span class="wall-plaque">${esc(c.short)}</span>
      </button>`);
    Object.assign(f.style, {
      left: pct(spot.cx - w / 2, BG_W), top: pct(spot.top, BG_H),
      width: pct(w, BG_W), height: pct(spot.h, BG_H),
    });
    f.onclick = () => ui.open('composer', { composerId: c.id });
    stage.appendChild(f);
  });
  return { el };
}

const silhouette = g => g === 'f'
  ? `<svg viewBox="0 0 60 70" class="sil"><circle cx="30" cy="12" r="8"/><circle cx="30" cy="27" r="13"/><path d="M8 70c0-18 9-28 22-28s22 10 22 28z"/></svg>`
  : `<svg viewBox="0 0 60 70" class="sil"><path d="M16 28c0-10 6-17 14-17s14 7 14 17c0 3 2 5 2 8h-4c0 4-5 8-12 8s-12-4-12-8h-4c0-3 2-5 2-8z"/><path d="M6 70c0-17 10-26 24-26s24 9 24 26z"/></svg>`;

function person(p, cls = '', img = null) {
  return h(`
    <div class="person ${cls}">
      <div class="oval">${img ? `<img src="${img}" alt="">` : silhouette(p.g)}</div>
      <div class="ribbon"><b>${esc(p.name)}</b><span>${esc(p.role)}</span><small>${esc(p.years)}</small></div>
    </div>`);
}

export function composerView(ui, { composerId }) {
  const c = composerById(composerId);
  const pieces = piecesBy(c.id);
  const { el, body } = frame(ui, {
    title: c.name,
    cls: 'composer',
    wide: true,
    tip: 'Links zie je het schilderij, rechts de familie: bovenaan de ouders, in het midden broers, zussen en de componist zelf, onderaan de kinderen. Klik op Voorlezen om het verhaal te horen.',
  });

  body.appendChild(h(`
    <div class="composer-grid">
      <div class="composer-portrait">
        <span class="gilt big"><img src="${c.portrait}" alt="${esc(c.name)}"></span>
        <div class="plaque"><b>${esc(c.name)}</b><small>${esc(c.years)} · ${esc(c.title)}</small></div>
      </div>
      <div class="tree-wrap">
        <h3 class="hand">De familie van ${esc(c.short)}</h3>
        <div class="tree"><svg class="branches"></svg></div>
      </div>
      <div class="bio paper-inner">
        <div class="bio-head"><h3>${esc(c.name)} — zijn verhaal</h3><button class="btn wood small speak">Voorlezen</button></div>
        <p>${esc(c.bio)}</p>
        <p class="fact"><b>Wist je dat?</b> ${esc(c.fact)}</p>
        <p class="dates"><b>Geboren:</b> ${esc(c.born)} &nbsp; <b>Gestorven:</b> ${esc(c.died)}</p>
        <div class="bio-pieces"></div>
      </div>
    </div>`));

  const bp = body.querySelector('.bio-pieces');
  if (pieces.length) {
    bp.appendChild(h('<b>Bladmuziek in de winkel:</b>'));
    for (const p of pieces) {
      const b = h(`<button class="btn wood small">${esc(p.title)}</button>`);
      b.onclick = () => ui.open('sheet', { pieceId: p.id });
      bp.appendChild(b);
      const g = h(`<button class="btn wood small">Luister</button>`);
      g.onclick = () => ui.open('gramophone', { pieceId: p.id });
      bp.appendChild(g);
    }
  } else {
    bp.appendChild(h('<i>Van deze componist heeft de winkel nog geen bladmuziek. Vraag het Meneer Van der Velde later nog eens!</i>'));
  }
  body.querySelector('.speak').onclick = () => speak(`${c.name}. ${c.bio} Wist je dat? ${c.fact}`);

  // --- family tree
  const T = c.tree;
  const tree = body.querySelector('.tree');
  const svg = tree.querySelector('.branches');
  const row = cls => { const r = h(`<div class="tree-row ${cls}"></div>`); tree.appendChild(r); return r; };
  const nodes = { gp: [], parents: [], siblings: [], self: null, spouses: [], children: [] };
  if (T.grandparents?.length) { const r = row('gp'); T.grandparents.forEach(p => { const n = person(p, 'small'); r.appendChild(n); nodes.gp.push(n); }); }
  if (T.parents.length) { const r = row('parents'); T.parents.forEach(p => { const n = person(p); r.appendChild(n); nodes.parents.push(n); }); }
  const mid = row('middle');
  const half = Math.ceil(T.siblings.length / 2);
  T.siblings.slice(0, half).forEach(p => { const n = person(p, 'small'); mid.appendChild(n); nodes.siblings.push(n); });
  nodes.self = person({ name: c.name, role: 'Componist', years: c.years.replace(/ /g, ''), g: 'm' }, 'self', c.portrait);
  mid.appendChild(nodes.self);
  T.spouses.forEach(p => { const n = person(p, 'small spouse'); mid.appendChild(n); nodes.spouses.push(n); });
  T.siblings.slice(half).forEach(p => { const n = person(p, 'small'); mid.appendChild(n); nodes.siblings.push(n); });
  if (T.children.length) { const r = row('children'); T.children.forEach(p => { const n = person(p, 'small'); r.appendChild(n); nodes.children.push(n); }); }
  if (T.childrenNote) tree.appendChild(h(`<p class="tree-note hand">${esc(T.childrenNote)}</p>`));

  const drawBranches = () => {
    const box = tree.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const pt = (n, side) => {
      const r = n.querySelector('.oval').getBoundingClientRect();
      const x = r.left + r.width / 2 - box.left;
      if (side === 'top') return [x, r.top - box.top];
      if (side === 'bottom') return [x, n.getBoundingClientRect().bottom - box.top];
      if (side === 'left') return [r.left - box.left, r.top + r.height / 2 - box.top];
      return [r.right - box.left, r.top + r.height / 2 - box.top];
    };
    let d = '';
    const fork = (from, targets) => {
      if (!targets.length) return;
      const [fx, fy] = from;
      const tops = targets.map(t => pt(t, 'top'));
      const yBar = fy + (Math.min(...tops.map(t => t[1])) - fy) * 0.5;
      d += `M${fx},${fy} L${fx},${yBar} `;
      for (const [tx, ty] of tops) d += `M${fx},${yBar} C${fx},${yBar + 8} ${tx},${yBar - 8} ${tx},${yBar + 4} L${tx},${ty} `;
    };
    if (nodes.gp.length && nodes.parents.length) fork(pt(nodes.gp[0], 'bottom'), [nodes.parents[0]]);
    if (nodes.parents.length) {
      const a = pt(nodes.parents[0], 'right');
      const b = nodes.parents[1] ? pt(nodes.parents[1], 'left') : a;
      if (nodes.parents[1]) d += `M${a[0]},${a[1]} L${b[0]},${b[1]} `;
      fork([(a[0] + b[0]) / 2, a[1]], [...nodes.siblings, nodes.self]);
    }
    let couple = pt(nodes.self, 'bottom');
    if (nodes.spouses.length) {
      const s = pt(nodes.self, 'right');
      for (const sp of nodes.spouses) { const e = pt(sp, 'left'); d += `M${s[0]},${s[1]} L${e[0]},${e[1]} `; }
      const e = pt(nodes.spouses[0], 'left');
      couple = [(s[0] + e[0]) / 2, s[1]];
    }
    fork(couple, nodes.children);
    svg.innerHTML = `<path d="${d}" class="branch-shadow"/><path d="${d}" class="branch"/>`;
    if (nodes.spouses.length) {
      const s = pt(nodes.self, 'right'), e = pt(nodes.spouses[0], 'left');
      svg.innerHTML += `<text x="${(s[0] + e[0]) / 2}" y="${s[1] - 6}" class="ring" text-anchor="middle">♥</text>`;
    }
  };
  const ro = new ResizeObserver(drawBranches);
  ro.observe(tree);
  tree.querySelectorAll('img').forEach(i => i.addEventListener('load', drawBranches));

  return { el, onShow: () => requestAnimationFrame(drawBranches), destroy: () => ro.disconnect() };
}
