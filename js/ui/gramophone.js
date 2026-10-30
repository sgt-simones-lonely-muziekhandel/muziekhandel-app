// The gramophone: pick a music cylinder (public/art/items/cylinder) and listen, with an
// old-fashioned crackly sound.
import { frame, h, esc } from './ui.js';
import { CYLINDER_ART, cylinderColor } from './library.js';
import { PIECES, pieceById, composerById } from '../data.js';
import { parsePiece } from '../music.js';
import { playPiece, setGramophone, audioState } from '../audio.js';
import { drawCornerPicture, CORNER_SIZE } from '../corner.js';
import { skyAt, currentHour } from '../sky.js';

export function gramophoneView(ui, { pieceId } = {}) {
  const { el, body } = frame(ui, {
    title: 'De grammofoon',
    cls: 'gramophone',
    wide: true,
    tip: 'Kies een cilinder uit de kist. De grammofoon draait hem rond en speelt de muziek, met het geknisper van vroeger!',
  });
  body.appendChild(h(`
    <div class="gramo-grid">
      <div class="gramo-scene">
        <canvas class="room" width="${CORNER_SIZE.w}" height="${CORNER_SIZE.h}" aria-label="De luisterhoek met de grammofoon"></canvas>
        <figure class="cover" hidden>
          <img class="cover-cyl" alt="">
          <figcaption><b class="cover-title"></b><span class="cover-comp"></span></figcaption>
        </figure>
        <p class="cover-empty">Kies een cilinder uit de kist</p>
        <div class="notes-out"></div>
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
  // the same room as the listening corner, with the window and lamps following the clock
  const room = $('.room').getContext('2d');
  const t0Room = performance.now();
  const drawRoom = () => drawCornerPicture(room, skyAt(currentHour()), (performance.now() - t0Room) / 1000);
  drawRoom();
  const roomTimer = setInterval(drawRoom, 100);
  let player = null, raf = 0, noteTimer = 0;

  const stop = () => {
    player?.stop(); player = null;
    cancelAnimationFrame(raf);
    clearInterval(noteTimer);
    setGramophone(false);
    el.classList.remove('playing');
    $('.stop').disabled = true;
    $('.progress i').style.width = '0';
    list.querySelectorAll('li.on').forEach(li => {
      li.classList.remove('on');
      li.querySelector('.cyl').src = `${CYLINDER_ART}${li.dataset.color}.webp`;
    });
  };

  const play = id => {
    stop();
    const piece = pieceById(id);
    const comp = composerById(piece.composer);
    $('.now-title').textContent = piece.title;
    $('.now-comp').textContent = comp.name;
    // the cylinder comes out of its box (the open one stays behind) and goes on the gramophone
    const color = cylinderColor(piece);
    const nowCyl = $('.now-cyl');
    nowCyl.src = `${CYLINDER_ART}${color}.webp`;
    nowCyl.hidden = false;
    $('.empty-mandrel').hidden = true;
    // the chosen cylinder is shown big in the picture, with its label, like the cover of the music
    const cover = $('.cover');
    cover.hidden = false;
    cover.querySelector('.cover-cyl').src = `${CYLINDER_ART}${color}.webp`;
    cover.querySelector('.cover-title').textContent = piece.title;
    cover.querySelector('.cover-comp').textContent = comp.name;
    $('.cover-empty').hidden = true;
    cover.classList.remove('show'); void cover.offsetWidth; cover.classList.add('show');
    const li = list.querySelector(`[data-id="${id}"]`);
    if (li) { li.classList.add('on'); li.querySelector('.cyl').src = `${CYLINDER_ART}open.webp`; }
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
    noteTimer = setInterval(() => {
      const n = h(`<span class="flying-note" style="--dx:${Math.random() * 120 - 30}px;--rot:${Math.random() * 40 - 20}deg">${['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)]}</span>`);
      $('.notes-out').appendChild(n);
      setTimeout(() => n.remove(), 3000);
    }, 450);
  };

  for (const p of PIECES) {
    const comp = composerById(p.composer);
    const color = cylinderColor(p);
    const li = h(`<li data-id="${p.id}" data-color="${color}"><button title="${esc(p.title)}">
      <img class="cyl" src="${CYLINDER_ART}${color}.webp" alt="">
      <span class="tube-label"><strong>${esc(p.title)}</strong><em>${esc(comp.short)}</em></span></button></li>`);
    li.querySelector('button').onclick = () => play(p.id);
    list.appendChild(li);
  }
  $('.stop').onclick = stop;
  if (pieceId) setTimeout(() => play(pieceId), 300);

  return {
    el,
    onHide: stop,
    destroy() { stop(); clearInterval(roomTimer); },
    onKey(e) { if (e.code === 'Space') { e.preventDefault(); player ? stop() : null; } },
  };
}
