// The gramophone: pick a record and listen, with an old-fashioned crackly sound.
import { frame, h, esc } from './ui.js';
import { PIECES, pieceById, composerById } from '../data.js';
import { parsePiece } from '../music.js';
import { playPiece, setGramophone, audioState } from '../audio.js';

export function gramophoneView(ui, { pieceId } = {}) {
  const { el, body } = frame(ui, {
    title: 'De grammofoon',
    cls: 'gramophone',
    wide: true,
    tip: 'Kies een plaat uit de platenkast. De grammofoon speelt hem af, met het geknisper van vroeger!',
  });
  body.appendChild(h(`
    <div class="gramo-grid">
      <div class="gramo-scene">
        <img src="assets/gramophone-corner.jpg" alt="Een koperen grammofoon op een houten kastje">
        <div class="notes-out"></div>
      </div>
      <div class="gramo-side">
        <div class="now paper-inner">
          <div class="record"><div class="record-label"></div></div>
          <div class="now-text">
            <small>Nu speelt</small>
            <b class="now-title">— kies een plaat —</b>
            <span class="now-comp"></span>
            <div class="progress"><i></i></div>
          </div>
          <button class="btn brass round stop" title="Stop" disabled>■</button>
        </div>
        <h3 class="hand">De platenkast</h3>
        <ul class="records"></ul>
      </div>
    </div>`));

  const $ = s => body.querySelector(s);
  const list = $('.records');
  let player = null, raf = 0, noteTimer = 0;

  const stop = () => {
    player?.stop(); player = null;
    cancelAnimationFrame(raf);
    clearInterval(noteTimer);
    setGramophone(false);
    el.classList.remove('playing');
    $('.stop').disabled = true;
    $('.progress i').style.width = '0';
    list.querySelectorAll('li').forEach(li => li.classList.remove('on'));
  };

  const play = id => {
    stop();
    const piece = pieceById(id);
    const comp = composerById(piece.composer);
    $('.now-title').textContent = piece.title;
    $('.now-comp').textContent = comp.name;
    $('.record-label').style.setProperty('--hue', (piece.title.length * 37) % 360);
    list.querySelector(`[data-id="${id}"]`)?.classList.add('on');
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
    const li = h(`<li data-id="${p.id}"><button><span class="mini-record" style="--hue:${(p.title.length * 37) % 360}"></span>
      <span><b>${esc(p.title)}</b><small>${esc(comp.name)}</small></span><span class="play-ico">▶</span></button></li>`);
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
