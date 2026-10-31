// Reading a piece: a sheet-music book lying on a wooden desk. It starts closed, showing the piece's
// cover (it has just flown here from the cabinet, see library.js). Pages turn from right to left
// around the spine like a real book: the cover first, then the title page
// (items/sheet-music/cover-inside, the same for every piece, only the title and composer change),
// then the music. A real song (js/som-scores.js) is only its original: the printed cover and the
// pages of the scan (its notes in the game's colours are on the piano). ← → or a click on a page
// flip; Space takes the piece to the piano, on top of the book, so Terug comes back to this page.
import { frame, h, esc } from './ui.js';
import { coverHtml, SHEET_ART } from './library.js';
import { pieceById, creditFor } from '../data.js';
import { parsePiece } from '../music.js';
import { renderPage, pageCount } from '../notation.js';

// A portrait page holds 4 lines of 2 bars, engraved narrow so the notes come out big.
const SYSTEMS = 4, PER_SYSTEM = 2, STAFF_W = 560;
const TURN_MS = 1050;

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
    tip: 'Sla het boek open: klik op de rechterbladzijde of druk op →. Met ← blader je terug. Druk op de spatiebalk om dit stuk op de piano te spelen.',
  });

  // The pages in reading order: the title page and the music, or for a real song the pages of the
  // original scan (without its first page when that is already the cover).
  const scans = piece.scans;
  const scanPages = scans ? scans.pages.slice(scans.cover ? 1 : 0) : [];
  const maker = composer.id
    ? `<button class="composer-link">${esc(composer.name)}<span>${esc(composer.years)}</span></button>`
    : `<span class="composer-link plain">${esc(composer.name)}</span>`;
  const pages = scans ? scanPages.map((k, i) => `
      <figure class="scan-page">
        <img src="${scans.dir}page-${k}.webp" alt="Bladzijde ${k} van het origineel" ${i > 1 ? 'loading="lazy"' : ''}>
        <figcaption>Uit de collectie van SOM · ${i + 1} van ${scanPages.length}</figcaption>
      </figure>`) : [
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
  // after turning it. Leaf 0 is the cover, its back the endpaper.
  const leafData = [{ cls: 'cover-leaf', front: coverHtml(piece, composer), back: '<div class="endpaper"></div>' }];
  for (let p = 0; p < pages.length; p += 2) leafData.push({ cls: 'paper-leaf', front: pages[p], back: pages[p + 1] || '' });
  const n = leafData.length;
  // the last leaf is only turned if there is something on its back
  const maxTurn = pages.length % 2 === 0 ? n : n - 1;

  body.appendChild(h(`
    <div class="book-wrap">
      <div class="book closed">
        <div class="book-back"><div class="endpaper"></div></div>
        ${leafData.map(l => `
          <div class="leaf ${l.cls}">
            <div class="face front">${l.front}</div>
            <div class="face back">${l.back}</div>
          </div>`).join('')}
      </div>
      <button class="turn-btn prev" title="Terug bladeren (←)">‹</button>
      <button class="turn-btn next" title="Verder bladeren (→)">›</button>
      <p class="open-hint">Klik op het boek om het open te slaan</p>
      <button class="btn brass play">Speel op de piano <kbd>spatie</kbd></button>
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
  };
  const turn = d => {
    const t = Math.max(0, Math.min(maxTurn, turned + d));
    if (t === turned) return;
    const leaf = leaves[d > 0 ? turned : t];
    turned = t;
    // light and shade run over the page while it's in the air
    leaf.classList.remove('turning'); void leaf.offsetWidth; leaf.classList.add('turning');
    clearTimeout(leaf.turnTimer);
    leaf.turnTimer = setTimeout(() => leaf.classList.remove('turning'), TURN_MS);
    place();
  };
  place();

  // opened from the piano (its Bladmuziek button), the piano is still underneath
  const toPiano = () => (fromPiano ? ui.close() : ui.open('piano', { pieceId }));
  body.querySelector('.prev').onclick = () => turn(-1);
  body.querySelector('.next').onclick = () => turn(1);
  body.querySelector('.play').onclick = toPiano;
  if (composer.id) body.querySelector('.composer-link').onclick = e => { e.stopPropagation(); ui.open('composer', { composerId: composer.id }); };
  // a click on the right-hand page turns forward, on the left-hand page back
  leaves.forEach((leaf, i) => {
    leaf.onclick = () => { if (i === turned) turn(1); else if (i === turned - 1) turn(-1); };
  });

  return {
    el,
    pieceId,
    onKey(e) {
      if (e.code === 'ArrowLeft') { e.preventDefault(); turn(-1); }
      if (e.code === 'ArrowRight') { e.preventDefault(); turn(1); }
      if (e.code === 'Space') { e.preventDefault(); toPiano(); }
    },
  };
}
