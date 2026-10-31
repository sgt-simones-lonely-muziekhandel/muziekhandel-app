// Walking along a row of pages in a close-up: the cabinets of sheet music, the walls of portraits.
// The player goes from one to the next with the arrows (or ← →, or a swipe); both slide sideways
// together, quick and simple. A page is filled (`fill(i, page)`) the first time it is reached, and
// the one after it straight away, so the next one is usually ready before the player gets there.
// With many pages the sign under them shows only the name, not a dot per page.
import { h } from './ui.js';

const MAX_DOTS = 12;

export function pager(stage, { count, cls, what, label, fill, start = 0, onMove }) {
  const pages = Array.from({ length: count }, () => h(`<section class="${cls}" hidden></section>`));
  stage.append(...pages);
  const filled = new Set();
  const ready = i => {
    if (i < 0 || i >= count || filled.has(i)) return;
    filled.add(i);
    fill(i, pages[i]);
  };
  let current = Math.max(0, Math.min(start, count - 1)), moving = false;
  pages[current].hidden = false;
  ready(current); ready(current + 1);

  if (count > 1) {
    stage.insertAdjacentHTML('beforeend', `
      <button class="cab-nav prev" title="Vorige ${what} (←)">‹</button>
      <button class="cab-nav next" title="Volgende ${what} (→)">›</button>
      <div class="cab-sign"><b></b>${count <= MAX_DOTS ? `<span class="cab-dots">${pages.map(() => '<i></i>').join('')}</span>` : ''}</div>`);
  }
  const sign = () => {
    if (count < 2) return;
    stage.querySelector('.cab-sign b').textContent = label(current);
    stage.querySelectorAll('.cab-dots i').forEach((d, k) => d.classList.toggle('on', k === current));
    stage.querySelector('.cab-nav.prev').disabled = current === 0;
    stage.querySelector('.cab-nav.next').disabled = current === count - 1;
  };
  sign();
  const go = d => {
    const to = current + d;
    if (moving || to < 0 || to >= count) return;
    moving = true;
    ready(to); ready(to + d);
    const from = pages[current], next = pages[to];
    next.hidden = false;
    const timing = { duration: 420, easing: 'cubic-bezier(.25, .8, .25, 1)', fill: 'forwards' };
    const away = d > 0 ? -100 : 100;
    from.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${away}%)` }], timing);
    next.animate([{ transform: `translateX(${-away}%)` }, { transform: 'translateX(0)' }], timing).finished.then(() => {
      from.hidden = true;
      from.getAnimations().forEach(a => a.cancel());
      next.getAnimations().forEach(a => a.cancel());
      moving = false;
    });
    current = to;
    onMove?.(current);
    sign();
  };
  if (count > 1) {
    stage.querySelector('.cab-nav.prev').onclick = () => go(-1);
    stage.querySelector('.cab-nav.next').onclick = () => go(1);
    // a swipe across the stage walks along too
    let sx = null;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    stage.addEventListener('pointerup', e => {
      if (sx == null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
    });
  }
  return {
    get moving() { return moving; },
    onKey(e) {
      if (e.code === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); go(-1); }
    },
  };
}
