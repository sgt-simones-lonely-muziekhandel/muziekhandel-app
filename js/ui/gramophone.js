// The gramophone: pick a music cylinder (public/art/items/cylinder) and listen, with an
// old-fashioned crackly sound.
import { frame, h, esc } from './ui.js';
import { CYLINDER_ART, cylinderColor } from './library.js';
import { PIECES, pieceById, creditFor } from '../data.js';
import { parsePiece } from '../music.js';
import { playPiece, setGramophone, audioState } from '../audio.js';

export function gramophoneView(ui, { pieceId } = {}) {
  const { el, body } = frame(ui, {
    title: 'De grammofoon',
    cls: 'gramophone',
    wide: true,
    hideTitle: true,
    tip: 'Kies een cilinder uit de kist. De grammofoon draait hem rond en speelt de muziek, met het geknisper van vroeger!',
  });
  body.appendChild(h(`
    <div class="gramo-grid">
      <div class="gramo-scene">
        <figure class="cover" hidden>
          <div class="cover-stand"><img class="cover-cyl" alt=""><img class="cover-lid" alt=""></div>
          <figcaption><b class="cover-title"></b><span class="cover-comp"></span></figcaption>
        </figure>
        <p class="cover-empty">Kies een cilinder uit de kist</p>
      </div>
      <div class="gramo-side">
        <div class="now paper-inner">
          <div class="mandrel"><img class="now-cyl" alt="" hidden><span class="empty-mandrel"></span></div>
          <div class="now-text">
            <small>Nu speelt</small>
            <b class="now-title">— kies een cilinder —</b>
            <span class="now-comp"></span>
            <div class="progress"><i></i></div>
          </div>
          <button class="btn brass round stop" title="Stop" disabled>■</button>
        </div>
        <h3 class="hand">De cilinderkist</h3>
        <ul class="cylinders"></ul>
      </div>
    </div>`));

  const $ = s => body.querySelector(s);
  const list = $('.cylinders');
  $('.now-cyl').addEventListener('animationend', e => { if (e.animationName === 'put-on') e.target.classList.remove('put'); });
  let player = null, raf = 0;

  // A box in the chest opens: it gives a little jump, the lid (`<colour>-lid`) pops off, flies up
  // and lands leaning against the box, which now shows the wax cylinder inside (`<colour>-open`).
  // Closing runs it back: the lid flies onto the box and it is the closed box again.
  const LID_REST = 'translate(40px, 58px) rotate(14deg)';
  const openBox = li => {
    const cyl = li.querySelector('.cyl'), lid = li.querySelector('.lid');
    li.classList.add('on');
    cyl.animate([{ transform: 'none' }, { transform: 'translateY(-7px) rotate(-3deg)' }, { transform: 'translateY(1px) rotate(2deg)' }, { transform: 'none' }],
      { duration: 380, easing: 'ease-out' });
    clearTimeout(li.swap);
    li.swap = setTimeout(() => {
      cyl.src = `${CYLINDER_ART}${li.dataset.color}-open.webp`;
      cyl.classList.add('opened');
      lid.getAnimations().forEach(a => a.cancel());
      lid.animate([
        { opacity: 1, transform: 'translate(0, 0) rotate(0) scaleY(.75)', easing: 'cubic-bezier(.2, .8, .4, 1)' },
        { opacity: 1, transform: 'translate(14px, -46px) rotate(-18deg)', offset: 0.38, easing: 'cubic-bezier(.5, 0, .9, .5)' },
        { opacity: 1, transform: 'translate(40px, 62px) rotate(20deg)', offset: 0.85, easing: 'ease-out' },
        { opacity: 1, transform: LID_REST },
      ], { duration: 820, fill: 'forwards' });
    }, 180);
  };
  const closeBox = li => {
    const cyl = li.querySelector('.cyl'), lid = li.querySelector('.lid');
    li.classList.remove('on');
    clearTimeout(li.swap);
    if (!cyl.classList.contains('opened')) return;
    lid.getAnimations().forEach(a => a.cancel());
    lid.animate([
      { opacity: 1, transform: LID_REST, easing: 'cubic-bezier(.2, .8, .4, 1)' },
      { opacity: 1, transform: 'translate(16px, -30px) rotate(-10deg)', offset: 0.55, easing: 'ease-in' },
      { opacity: 1, transform: 'translate(0, 0) rotate(0) scaleY(.75)' },
    ], { duration: 480 }).onfinish = () => {
      cyl.src = `${CYLINDER_ART}${li.dataset.color}.webp`;
      cyl.classList.remove('opened');
    };
  };

  const stop = () => {
    player?.stop(); player = null;
    cancelAnimationFrame(raf);
    setGramophone(false);
    el.classList.remove('playing');
    $('.stop').disabled = true;
    $('.progress i').style.width = '0';
    list.querySelectorAll('li.on').forEach(closeBox);
  };

  const play = id => {
    stop();
    const piece = pieceById(id);
    const comp = creditFor(piece);
    $('.now-title').textContent = piece.title;
    $('.now-comp').textContent = comp.name;
    // the cylinder comes out of its box (the open one stays behind) and goes on the gramophone
    const color = cylinderColor(piece);
    const nowCyl = $('.now-cyl');
    nowCyl.src = `${CYLINDER_ART}${color}.webp`;
    nowCyl.hidden = false;
    $('.empty-mandrel').hidden = true;
    // the chosen cylinder stands big in the spotlight, opened, its lid beside it, with its label
    const cover = $('.cover');
    cover.hidden = false;
    cover.querySelector('.cover-cyl').src = `${CYLINDER_ART}${color}-open.webp`;
    cover.querySelector('.cover-lid').src = `${CYLINDER_ART}${color}-lid.webp`;
    cover.querySelector('.cover-title').textContent = piece.title;
    cover.querySelector('.cover-comp').textContent = comp.name;
    $('.cover-empty').hidden = true;
    cover.classList.remove('show'); void cover.offsetWidth; cover.classList.add('show');
    const li = list.querySelector(`[data-id="${id}"]`);
    if (li) openBox(li);
    // the wax cylinder goes onto the gramophone once the lid is off
    nowCyl.style.animationDelay = li ? '.75s' : '0s';
    nowCyl.classList.remove('put'); void nowCyl.offsetWidth; nowCyl.classList.add('put');
    if (!audioState.ready) { $('.now-comp').textContent = 'De grammofoon wordt nog opgewonden… probeer het zo nog eens.'; return; }
    setGramophone(true);
    el.classList.add('playing');
    $('.stop').disabled = false;
    const t0 = performance.now();
    // the record needs a moment to get up to speed
    setTimeout(() => {
      if (!el.classList.contains('playing')) return;
      player = playPiece(parsePiece(piece), { onEnd: stop });
      const dur = player.duration * 1000;
      const tick = () => {
        $('.progress i').style.width = `${Math.min(100, (performance.now() - t0 - 600) / dur * 100)}%`;
        raf = requestAnimationFrame(tick);
      };
      tick();
    }, 600);
  };

  for (const p of PIECES) {
    const comp = creditFor(p);
    const color = cylinderColor(p);
    const li = h(`<li data-id="${p.id}" data-color="${color}"><button title="${esc(p.title)}">
      <span class="cyl-box"><img class="cyl" src="${CYLINDER_ART}${color}.webp" alt=""><img class="lid" src="${CYLINDER_ART}${color}-lid.webp" alt=""></span>
      <span class="tube-label"><strong>${esc(p.title)}</strong><em>${esc(comp.short)}</em></span></button></li>`);
    li.querySelector('button').onclick = () => play(p.id);
    list.appendChild(li);
  }
  $('.stop').onclick = stop;
  if (pieceId) setTimeout(() => play(pieceId), 300);

  return {
    el,
    onHide: stop,
    destroy: stop,
    onKey(e) { if (e.code === 'Space') { e.preventDefault(); player ? stop() : null; } },
  };
}
