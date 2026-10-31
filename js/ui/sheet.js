// Reading a piece: a sheet-music book lying on a wooden desk. It starts closed (it has just flown
// here from the cabinet, see library.js). Pages turn from right to left around the spine like a
// real book. A real song (js/som-scores.js) is only its original: the pages of the scan, nothing
// added (its notes in the game's colours are on the piano); its first page (the printed cover, or
// for the album's tunes the album's cover) lies on top, and a song whose scan has no cover is bound
// in the cover drawn for it in the cabinet (js/ui/cover.js), so the book that flew here is the one
// that opens. A composer's piece is a drawn book: its cover, the title page
// (items/sheet-music/cover-inside) and the engraved music. Every page bends while it turns: each
// leaf is cut into strips that curl one after the other (`setCurl`), with light and shade on the
// paper and a shadow cast on the page underneath (a cover is board: it hardly bends); a page can be
// dragged with the mouse or a finger, and its corner lifts when pointed at.
// ← → or a click on a page flip; Enter (or Space) takes the piece to the piano, on top of the book, so Terug
// comes back to this page.
import { frame, h, esc } from './ui.js';
import { coverHtml, SHEET_ART } from './library.js';
import { pieceById, creditFor } from '../data.js';
import { parsePiece } from '../music.js';
import { renderPage, pageCount } from '../notation.js';
import { rustle } from '../audio.js';

// A portrait page holds 4 lines of 2 bars, engraved narrow so the notes come out big.
const SYSTEMS = 4, PER_SYSTEM = 2, STAFF_W = 560;
// a bending page: strips per leaf, how far it bends (degrees) and how long a whole turn takes
const STRIPS = 18, BEND = 70, CURL_MS = 950;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Size and place of one page on the desk, in cqw of the full-screen stage (100 × 56.25).
export const PAGE = { w: 44 * 566 / 768, h: 44, top: 6.1 };

// Where the closed book's cover is on screen (px), for the flight from the cabinet.
export function closedCoverRect() {
  const W = innerWidth, H = innerHeight;
  const sw = Math.min(W, H * 1672 / 941), cq = sw / 100;
  const top = (H - sw * 941 / 1672) / 2;
  return { left: W / 2 - PAGE.w / 2 * cq, top: top + PAGE.top * cq, width: PAGE.w * cq, height: PAGE.h * cq };
}

export function sheetView(ui, { pieceId, noFade = false, fromPiano = false }) {
  const piece = pieceById(pieceId);
  const parsed = parsePiece(piece);
  const composer = creditFor(piece);
  const musicPages = pageCount(parsed, SYSTEMS, PER_SYSTEM);

  const { el, body } = frame(ui, {
    title: 'Bladmuziek',
    cls: `sheet ${noFade ? 'no-zoom' : ''}`,
    full: true,
    tip: 'Sla het boek open: klik op de rechterbladzijde of druk op →. Met ← blader je terug. Druk op Enter om dit stuk op de piano te spelen.',
  });

  // The pages in reading order. A real song: the pages of the original scan; when the second page
  // isn't the one printed on the back of the first (an album's tune after the album's cover), that
  // back stays blank paper.
  const scans = piece.scans;
  const scanUrls = scans ? scans.pages.map(k => `${scans.dir}page-${k}.webp`) : [];
  if (scans && scans.pages.length > 1 && scans.pages[1] !== scans.pages[0] + 1) scanUrls.splice(1, 0, null);
  const maker = composer.id
    ? `<button class="composer-link">${esc(composer.name)}<span>${esc(composer.years)}</span></button>`
    : `<span class="composer-link plain">${esc(composer.name)}</span>`;
  const pages = scans ? scanUrls.map((url, i) => (url
    ? `<figure class="scan-page"><img src="${url}" alt="Bladzijde ${i + 1} van het origineel" draggable="false"></figure>`
    : '<div class="blank-page"></div>')) : [
    `<img class="tp-img" src="${SHEET_ART}cover-inside.webp" alt="">
     <div class="tp-text">
       <h3>${esc(piece.title)}</h3>
       ${piece.subtitle ? `<p class="tp-sub">${esc(piece.subtitle)}</p>` : ''}
       <span class="tp-rule"></span>
       <small>muziek van</small>
       ${maker}
     </div>`,
    ...Array.from({ length: musicPages }, (_, i) => `
      <div class="music-page">
        <header class="mp-head"><b>${esc(piece.title)}</b><i>${esc(composer.name)}</i></header>
        <div class="mp-staff" data-page="${i}"></div>
        <footer class="mp-no">${i + 1}</footer>
      </div>`),
  ];
  // A leaf is one sheet of paper: its front is a right-hand page, its back the left-hand page you see
  // after turning it. Leaf 0 is the cover (unless the scan's first page is one), its back the endpaper.
  const leafData = scans?.cover ? [] : [{
    cls: 'cover-leaf', front: coverHtml(piece, composer), back: scans ? '<div class="blank-page"></div>' : '<div class="endpaper"></div>',
  }];
  for (let p = 0; p < pages.length; p += 2) leafData.push({ cls: 'paper-leaf', front: pages[p], back: pages[p + 1] || '' });
  const n = leafData.length;
  // the last leaf is only turned if there is something on its back
  const maxTurn = pages.length % 2 === 0 ? n : n - 1;
  // The bending copy of a leaf, made the first time it is needed: nested strips, each hinged on the
  // one before, showing its slice of a copy of the front and (turned around) of the back.
  const buildCurl = leaf => {
    if (leaf.curlStrips) return;
    const [front, back] = [...leaf.querySelectorAll(':scope > .face')].map(f => f.innerHTML);
    const face = (html, col, cls) => `<i class="${cls}" style="--col:${col}"><div class="slice">${html}</div></i>`;
    let inner = '';
    for (let k = STRIPS - 1; k >= 0; k--) inner = `<div class="strip">${face(front, k, 'sf')}${face(back, STRIPS - 1 - k, 'sb')}${inner}</div>`;
    leaf.insertAdjacentHTML('beforeend', `<div class="curl" style="--strips:${STRIPS}">${inner}</div>`);
    leaf.curlStrips = [...leaf.querySelectorAll('.strip')];
  };

  body.appendChild(h(`
    <div class="book-wrap">
      <div class="book closed ${scans ? 'scanned' : ''}">
        <div class="book-back">${scans ? '<div class="blank-page"></div>' : '<div class="endpaper"></div>'}</div>
        ${leafData.map(l => `
          <div class="leaf ${l.cls}">
            <div class="face front">${l.front}</div>
            <div class="face back">${l.back}</div>
          </div>`).join('')}
        <div class="cast"></div>
      </div>
      <button class="turn-btn prev" title="Terug bladeren (←)">‹</button>
      <button class="turn-btn next" title="Verder bladeren (→)">›</button>
      <p class="open-hint">Klik op het boek om het open te slaan</p>
      <button class="btn brass play">Speel op de piano <kbd>Enter</kbd></button>
    </div>`));

  const book = body.querySelector('.book');
  const leaves = [...body.querySelectorAll('.leaf')];
  body.querySelectorAll('.mp-staff').forEach(host => renderPage(host, parsed, +host.dataset.page, SYSTEMS, PER_SYSTEM, STAFF_W));

  // `turned` leaves lie on the left. Unturned leaves stack with the first on top, turned ones with
  // the last turned on top: a tiny z offset per leaf, depending on its side, keeps that order.
  let turned = 0;
  const place = () => {
    leaves.forEach((leaf, i) => {
      const left = i < turned;
      leaf.classList.toggle('turned', left);
      leaf.style.setProperty('--z', `${(left ? i + 1 : n - i) * 0.5}px`);
    });
    // closed, the cover sits in the middle; open, the spine does
    book.classList.toggle('closed', turned === 0);
    body.querySelector('.open-hint').classList.toggle('gone', turned > 0);
    body.querySelector('.prev').disabled = turned === 0;
    body.querySelector('.next').disabled = turned >= maxTurn;
    // get the pages that can turn next ready to bend, once the browser has a moment
    setTimeout(() => [leaves[turned], leaves[turned - 1]].forEach(l => l && buildCurl(l)), 60);
  };
  // ---- the bending page ----
  const cast = body.querySelector('.cast');
  // Bend leaf `leaf` to `t` (0 flat on the right … 1 flat on the left); `dir` -1 when it is being
  // turned back, so its free edge leads the other way. The edge lifts first and the part at the
  // spine follows, so the page rolls over like paper held by its corner.
  const setCurl = (leaf, t, dir) => {
    // a cover is board, not paper: it barely bends
    const bend = (leaf.classList.contains('cover-leaf') ? BEND * 0.12 : BEND) * Math.sin(Math.PI * t), base = 180 * ease(t);
    buildCurl(leaf);
    const strips = leaf.curlStrips;
    let prev = 0, sum = 0;
    strips.forEach((st, k) => {
      const along = k / (STRIPS - 1);
      let a = Math.max(0, Math.min(180, base + bend * (along - 0.5)));
      if (dir < 0) a = 180 - a;
      st.style.transform = `rotateY(${-(a - prev)}deg)`;
      // light: full when flat, darker as the strip stands up
      st.style.setProperty('--sh', (0.42 * Math.sin(a * Math.PI / 180)).toFixed(3));
      prev = a; sum += a;
    });
    // the shadow it throws on the page it is uncovering, strongest mid-turn
    const mid = sum / STRIPS, span = Math.abs(Math.cos(mid * Math.PI / 180));
    cast.style.opacity = (0.55 * Math.sin(Math.PI * Math.min(1, t))).toFixed(3);
    cast.classList.toggle('left', mid > 90);
    cast.style.setProperty('--span', `${(span * 100).toFixed(1)}%`);
  };
  let active = null; // { leaf, dir, t, raf }
  let drag = null, peek = null;
  const startCurl = (leaf, dir) => {
    leaf.classList.add('curling');
    leaf.style.setProperty('--z', `${n + 2}px`);
    active = { leaf, dir, t: 0, raf: 0 };
    setCurl(leaf, 0, dir);
    return active;
  };
  const endCurl = done => {
    const { leaf, dir } = active;
    cancelAnimationFrame(active.raf);
    active = null;
    if (done) turned += dir;
    leaf.classList.remove('curling');
    cast.style.opacity = 0;
    place();
  };
  // run the active curl to `to` (1 = turned over, 0 = back where it was)
  const settle = (to, ms = CURL_MS) => {
    const a = active, from = a.t, t0 = performance.now(), dur = Math.max(160, ms * Math.abs(to - from));
    cancelAnimationFrame(a.raf);
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      // a page already moving keeps its speed; one starting from rest eases in
      a.t = from + (to - from) * (from > 0.02 && from < 0.98 ? 1 - (1 - k) ** 2 : k);
      setCurl(a.leaf, a.t, a.dir);
      if (k < 1) a.raf = requestAnimationFrame(step);
      else if (to === 0 || to === 1) endCurl(to === 1);
    };
    a.raf = requestAnimationFrame(step);
  };
  // a whole turn from rest: map the eased time onto t linearly (setCurl already eases)
  const curlTurn = d => {
    const leaf = leaves[d > 0 ? turned : turned - 1];
    const a = startCurl(leaf, d), t0 = performance.now();
    rustle(CURL_MS / 1000 * 0.8);
    if (turned === 0 || (d < 0 && turned === 1)) book.classList.toggle('closed', d < 0);
    const step = now => {
      a.t = Math.min(1, (now - t0) / CURL_MS);
      setCurl(leaf, a.t, d);
      if (a.t < 1) a.raf = requestAnimationFrame(step);
      else endCurl(true);
    };
    a.raf = requestAnimationFrame(step);
  };

  // a page still moving lands at once; a lifted corner drops back
  const land = () => {
    if (active) { const done = active.leaf !== peek; setCurl(active.leaf, done ? 1 : 0, active.dir); endCurl(done); }
    peek = null;
  };
  const turn = d => {
    // a page still moving lands first; a lifted corner drops back
    land();
    const t = Math.max(0, Math.min(maxTurn, turned + d));
    if (t === turned) return;
    curlTurn(d);
  };
  place();

  // opened from the piano (its Bladmuziek button), the piano is still underneath
  const toPiano = () => (fromPiano ? ui.close() : ui.open('piano', { pieceId }));
  body.querySelector('.prev').onclick = () => turn(-1);
  body.querySelector('.next').onclick = () => turn(1);
  body.querySelector('.play').onclick = toPiano;
  if (composer.id) body.querySelector('.composer-link').onclick = e => { e.stopPropagation(); ui.open('composer', { composerId: composer.id }); };
  // Drag a page over (mouse or finger): it follows the pointer and, let go, finishes the turn if it
  // got past a third of the way (or was flicked), else falls back. A click without moving turns it.
  // Pointing at the outer edge of a page lifts its corner a little.
  const pageW = () => book.getBoundingClientRect().width / 2;
  const unpeek = () => {
    if (!peek) return;
    if (active?.leaf === peek) settle(0, 1400);
    peek = null;
  };
  book.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return; // the composer's name on the title page
    const leaf = e.target.closest('.leaf'), i = leaves.indexOf(leaf);
    const d = i === turned ? 1 : i === turned - 1 ? -1 : 0;
    if (!d || (d > 0 && turned >= maxTurn)) return;
    e.preventDefault();
    if (active && active.leaf !== leaf) land();
    peek = null;
    drag = { leaf, d, x0: e.clientX, moved: false, lastX: e.clientX, lastT: performance.now(), v: 0 };
    book.setPointerCapture(e.pointerId);
  });
  book.addEventListener('pointermove', e => {
    if (!drag) {
      // peek: the corner of the right page lifts when pointed at its outer quarter
      if (active && active.leaf !== peek) return;
      const r = book.getBoundingClientRect();
      const leaf = leaves[turned];
      const near = !book.classList.contains('closed') && turned < maxTurn && e.clientX > r.right - r.width * 0.12;
      if (near && !peek) {
        peek = leaf;
        startCurl(leaf, 1); settle(0.05, 6000);
      } else if (!near) unpeek();
      return;
    }
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      if (!active) startCurl(drag.leaf, drag.d);
      cancelAnimationFrame(active.raf);
      drag.t0 = active.t;
      rustle(0.6);
      if (turned === 0 || (drag.d < 0 && turned === 1)) book.classList.toggle('closed', drag.d < 0);
    }
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
    drag.lastX = e.clientX; drag.lastT = now;
    // across the whole spread (two page widths) is a whole turn
    active.t = Math.max(0, Math.min(1, drag.t0 + (-dx * drag.d) / (pageW() * 1.7)));
    setCurl(active.leaf, active.t, active.dir);
  });
  const release = e => {
    if (!drag) return;
    const { moved, d, v } = drag;
    drag = null;
    if (!moved) { if (active) { cancelAnimationFrame(active.raf); setCurl(active.leaf, 0, active.dir); endCurl(false); } turn(d); return; }
    const flick = -v * d > 0.5, back = v * d > 0.5;
    const to = !back && (flick || active.t > 0.33) ? 1 : 0;
    if (to === 0 && (turned === 0 || (d < 0 && turned === 1))) book.classList.toggle('closed', d > 0);
    settle(to);
  };
  book.addEventListener('pointerup', release);
  book.addEventListener('pointercancel', release);
  book.addEventListener('pointerleave', () => { if (!drag) unpeek(); });

  return {
    el,
    pieceId,
    onKey(e) {
      if (e.code === 'ArrowLeft') { e.preventDefault(); turn(-1); }
      if (e.code === 'ArrowRight') { e.preventDefault(); turn(1); }
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) toPiano(); }
    },
  };
}
