// Reading a piece: flip pages with ← →, Space takes it to the piano. The book opens with the cover
// of the piece swinging open onto the title page (items/sheet-music/cover-inside, the same for every
// piece, only the title and composer change); the music starts on the next page.
import { frame, h, esc } from './ui.js';
import { coverHtml, SHEET_ART } from './library.js';
import { pieceById, composerById } from '../data.js';
import { parsePiece } from '../music.js';
import { renderPage, pageCount } from '../notation.js';

export function sheetView(ui, { pieceId }) {
  const piece = pieceById(pieceId);
  const parsed = parsePiece(piece);
  const composer = composerById(piece.composer);
  const pages = pageCount(parsed) + 1; // page 0 is the title page
  let page = 0;

  const { el, body } = frame(ui, {
    title: 'Bladmuziek',
    cls: 'sheet',
    wide: true,
    tip: 'Dit is het titelblad. Blader met de pijltjes ← en → naar de muziek. Druk op de spatiebalk om dit stuk op de piano te spelen. Elke noot heeft een eigen kleur, net als de toetsen van de piano!',
  });
  body.appendChild(h(`
    <div class="sheet-wrap sheet-in">
      <div class="title-page">
        <img src="${SHEET_ART}cover-inside.webp" alt="">
        <div class="tp-text">
          <h3>${esc(piece.title)}</h3>
          ${piece.subtitle ? `<p class="tp-sub">${esc(piece.subtitle)}</p>` : ''}
          <span class="tp-rule"></span>
          <small>muziek van</small>
          <button class="composer-link">${esc(composer.name)} <span>(${esc(composer.years)})</span></button>
        </div>
        <div class="book-cover">${coverHtml(piece, composer)}</div>
      </div>
      <article class="sheet-page" hidden>
        <div class="sheet-title">
          <h3>${esc(piece.title)}</h3>
          <p class="sheet-sub">${esc(composer.name)}</p>
        </div>
        <div class="staff-host"></div>
        <div class="page-no"></div>
      </article>
      <nav class="sheet-nav">
        <button class="btn wood prev"><span class="ico">‹</span> Vorige</button>
        <button class="btn brass play">Speel op de piano <kbd>spatie</kbd></button>
        <button class="btn wood next">Volgende <span class="ico">›</span></button>
      </nav>
    </div>`));
  const host = body.querySelector('.staff-host');
  const article = body.querySelector('.sheet-page');
  const titlePage = body.querySelector('.title-page');
  const cover = body.querySelector('.book-cover');
  cover.addEventListener('animationend', () => cover.remove());
  titlePage.addEventListener('animationend', e => {
    if (e.animationName === 'book-in') body.querySelector('.sheet-wrap').classList.remove('sheet-in');
  });

  const show = (dir = 0) => {
    titlePage.hidden = page !== 0;
    article.hidden = page === 0;
    if (page > 0) {
      renderPage(host, parsed, page - 1);
      body.querySelector('.page-no').textContent = `blad ${page} van ${pages - 1}`;
    }
    body.querySelector('.prev').disabled = page === 0;
    body.querySelector('.next').disabled = page === pages - 1;
    if (dir) {
      const shown = page === 0 ? titlePage : article;
      shown.classList.remove('turn-l', 'turn-r');
      void shown.offsetWidth;
      shown.classList.add(dir > 0 ? 'turn-r' : 'turn-l');
    }
  };
  const flip = d => {
    const p = Math.max(0, Math.min(pages - 1, page + d));
    if (p !== page) { page = p; show(d); }
  };
  const toPiano = () => ui.replace('piano', { pieceId });

  body.querySelector('.prev').onclick = () => flip(-1);
  body.querySelector('.next').onclick = () => flip(1);
  body.querySelector('.play').onclick = toPiano;
  body.querySelector('.composer-link').onclick = () => ui.open('composer', { composerId: composer.id });
  show();

  return {
    el,
    onKey(e) {
      if (e.code === 'ArrowLeft') { e.preventDefault(); flip(-1); }
      if (e.code === 'ArrowRight') { e.preventDefault(); flip(1); }
      if (e.code === 'Space') { e.preventDefault(); toPiano(); }
    },
  };
}
