// A small SVG engraver for single-line treble melodies, big and colourful for kids.
import { NOTE_COLORS, labelFor } from './music.js';

const S = 10;               // staff line spacing
const SYS_H = 150;          // height of one system
const WIDTH = 1000;
const E4 = 30;              // diatonic step of the bottom staff line

const MEASURES_PER_SYSTEM = 4;
const perPage = systems => MEASURES_PER_SYSTEM * systems;

export const pageCount = (parsed, systems = 2) => Math.ceil(parsed.measures.length / perPage(systems));
export const pageOfNote = (parsed, note, systems = 2) => Math.floor(note.measure / perPage(systems));

const weight = n => 22 + 26 * Math.sqrt(n.dur);
const yOf = (y0, step) => y0 + 4 * S - (step - E4) * (S / 2);

function flag(x, y, up, count) {
  let d = '';
  for (let k = 0; k < count; k++) {
    const o = k * 9;
    d += up
      ? `M${x},${y + o} c2,9 14,12 10,27 c2,-11 -4,-16 -10,-19 z`
      : `M${x},${y - o} c2,-9 14,-12 10,-27 c2,11 -4,16 -10,19 z`;
  }
  return `<path class="flag" d="${d}"/>`;
}

function noteSvg(n, x, y0) {
  const col = n.rest ? '#4a3626' : NOTE_COLORS[n.letter];
  let s = `<g class="note${n.rest ? ' rest' : ''}" data-i="${n.i}">`;
  s += `<rect class="hl-box" x="${x - 18}" y="${y0 - 26}" width="36" height="${SYS_H - 22}" rx="12" fill="${col}"/>`;
  const dotted = [1.5, 3, 0.75].includes(n.dur);
  if (n.rest) {
    const mid = y0 + 2 * S;
    if (n.dur >= 4) s += `<rect x="${x - 7}" y="${y0 + S}" width="14" height="6" class="ink"/>`;
    else if (n.dur >= 2) s += `<rect x="${x - 7}" y="${mid - 6}" width="14" height="6" class="ink"/>`;
    else {
      const glyph = n.dur >= 1 ? '\u{1D13D}' : n.dur >= 0.5 ? '\u{1D13E}' : '\u{1D13F}';
      s += `<text class="music ink" x="${x}" y="${mid}" font-size="40" text-anchor="middle" dominant-baseline="middle">${glyph}</text>`;
    }
    if (dotted) s += `<circle class="ink" cx="${x + 12}" cy="${mid - 5}" r="2.6"/>`;
    return s + '</g>';
  }
  const y = yOf(y0, n.step);
  // ledger lines
  for (let st = E4 - 2; st >= n.step; st -= 2) s += `<line class="ledger" x1="${x - 12}" x2="${x + 12}" y1="${yOf(y0, st)}" y2="${yOf(y0, st)}"/>`;
  for (let st = E4 + 10; st <= n.step; st += 2) s += `<line class="ledger" x1="${x - 12}" x2="${x + 12}" y1="${yOf(y0, st)}" y2="${yOf(y0, st)}"/>`;
  const up = n.step < E4 + 4; // below the middle line: stem up
  const open = n.dur >= 2;
  if (n.dur < 4) {
    const sx = up ? x + 6 : x - 6;
    s += `<line class="stem" x1="${sx}" x2="${sx}" y1="${y}" y2="${up ? y - 35 : y + 35}"/>`;
    const flags = n.dur <= 0.25 ? 2 : n.dur < 1 ? 1 : 0;
    if (flags) s += flag(sx, up ? y - 35 : y + 35, up, flags);
  }
  s += `<ellipse class="head${open ? ' open' : ''}" cx="${x}" cy="${y}" rx="7" ry="5.2" transform="rotate(-20 ${x} ${y})" style="--c:${col}"/>`;
  if (n.acc) s += `<text class="acc ink" x="${x - 19}" y="${y + 6}" font-size="20" text-anchor="middle">${n.acc === '#' ? '♯' : '♭'}</text>`;
  if (dotted) {
    const onLine = (n.step - E4) % 2 === 0;
    s += `<circle class="ink" cx="${x + 13}" cy="${onLine ? y - 5 : y}" r="2.6"/>`;
  }
  const ly = y0 + 4 * S + 52;
  s += `<circle class="lbl-bg" cx="${x}" cy="${ly}" r="13" fill="${col}"/>`;
  s += `<text class="lbl" x="${x}" y="${ly + 1}" text-anchor="middle" dominant-baseline="middle">${labelFor(n.letter, n.acc)}</text>`;
  return s + '</g>';
}

/** Render one page of the piece into `host`. Returns a lookup from note index to its <g>. */
export function renderPage(host, parsed, page, systemsPerPage = 2) {
  const { measures, piece } = parsed;
  const first = page * perPage(systemsPerPage);
  const pageMeasures = measures.slice(first, first + perPage(systemsPerPage));
  const systems = [];
  for (let k = 0; k < pageMeasures.length; k += MEASURES_PER_SYSTEM) systems.push(pageMeasures.slice(k, k + MEASURES_PER_SYSTEM));

  const H = systemsPerPage * SYS_H + 10;
  let svg = `<svg class="staff-svg" viewBox="0 0 ${WIDTH} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  systems.forEach((sys, si) => {
    const y0 = 34 + si * SYS_H;
    const showTime = si === 0;
    let x = showTime ? 110 : 76;
    for (let l = 0; l < 5; l++) svg += `<line class="staff-line" x1="10" x2="${WIDTH - 10}" y1="${y0 + l * S}" y2="${y0 + l * S}"/>`;
    svg += `<text class="music ink clef" x="16" y="${y0 + 3 * S}" font-size="44">\u{1D11E}</text>`;
    if (showTime) {
      svg += `<text class="timesig" x="84" y="${y0 + 18}" text-anchor="middle">${piece.time[0]}</text>`;
      svg += `<text class="timesig" x="84" y="${y0 + 38}" text-anchor="middle">${piece.time[1]}</text>`;
    }
    svg += `<text class="mnum" x="${x - 4}" y="${y0 - 10}">${first + si * MEASURES_PER_SYSTEM + 1}</text>`;
    // a short last system keeps the spacing of a full one
    const wSys = sys.map(m => m.reduce((a, n) => a + weight(n), 0) + 18);
    const full = Math.max(MEASURES_PER_SYSTEM, sys.length);
    const avg = wSys.reduce((a, b) => a + b, 0) / sys.length;
    const total = wSys.reduce((a, b) => a + b, 0) + (full - sys.length) * avg;
    const scale = (WIDTH - 12 - x) / total;
    sys.forEach((m, mi) => {
      let nx = x + 16 * scale;
      for (const n of m) {
        const w = weight(n) * scale;
        svg += noteSvg(n, nx + 8, y0);
        nx += w;
      }
      x += wSys[mi] * scale;
      const last = first + si * MEASURES_PER_SYSTEM + mi === measures.length - 1;
      if (last) {
        svg += `<line class="bar" x1="${x - 7}" x2="${x - 7}" y1="${y0}" y2="${y0 + 4 * S}"/>`;
        svg += `<rect class="ink" x="${x - 4}" y="${y0}" width="5" height="${4 * S}"/>`;
      } else {
        svg += `<line class="bar" x1="${x}" x2="${x}" y1="${y0}" y2="${y0 + 4 * S}"/>`;
      }
    });
  });
  svg += '</svg>';
  host.innerHTML = svg;
  const els = new Map();
  host.querySelectorAll('.note').forEach(g => els.set(+g.dataset.i, g));
  return els;
}
