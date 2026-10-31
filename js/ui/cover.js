// A drawn sheet-music cover for a real song whose scan has no printed cover of its own: an inline
// SVG in the style of the covers of the time (coloured board, gold frame, a cream cartouche with
// the title and the makers, an instrument in a burst of rays). No portrait: only the names.
// Being SVG it is sharp at every size, in the cabinet as on the desk.
import { esc } from './ui.js';

const W = 356, H = 498;
// old printing inks: burgundy, teal, ink blue, olive, plum, rust
const INKS = ['#6e2424', '#1d4a47', '#27365c', '#54461c', '#47284c', '#7f4116'];
const GOLD = '#d8b15a', CREAM = '#f3e6c4', BROWN = '#3a2410';

let drawn = 0; // every cover drawn gets its own gradient ids: a copy in a hidden view would break shared ones
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// Words into at most `max` lines of about `width` characters.
function wrap(text, width, max) {
  const lines = [];
  for (const word of text.split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  while (lines.length > max) lines.splice(-2, 2, lines.slice(-2).join(' '));
  return lines;
}

// The instruments, drawn in gold lines around (x, y), the middle of the body.
const EMBLEMS = {
  mandolin: (x, y, ink) => `
    <rect x="${x - 6}" y="${y - 118}" width="12" height="92" rx="2" fill="${ink}" stroke="${GOLD}" stroke-width="2.5"/>
    <path d="M${x - 11} ${y - 138} h22 l-4 22 h-14 z" fill="${ink}" stroke="${GOLD}" stroke-width="2.5"/>
    ${[-128, -121].map(dy => `<circle cx="${x - 15}" cy="${y + dy}" r="2.6" fill="${GOLD}"/><circle cx="${x + 15}" cy="${y + dy}" r="2.6" fill="${GOLD}"/>`).join('')}
    <path d="M${x} ${y - 36} C${x + 30} ${y - 36} ${x + 46} ${y} ${x + 44} ${y + 26} C${x + 42} ${y + 58} ${x + 22} ${y + 74} ${x} ${y + 74}
      C${x - 22} ${y + 74} ${x - 42} ${y + 58} ${x - 44} ${y + 26} C${x - 46} ${y} ${x - 30} ${y - 36} ${x} ${y - 36} z"
      fill="${ink}" stroke="${GOLD}" stroke-width="3"/>
    <path d="M${x - 30} ${y + 2} C${x - 20} ${y - 24} ${x + 20} ${y - 24} ${x + 30} ${y + 2}" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity=".6"/>
    <circle cx="${x}" cy="${y + 6}" r="11" fill="${BROWN}" stroke="${GOLD}" stroke-width="2"/>
    <circle cx="${x}" cy="${y + 6}" r="15" fill="none" stroke="${GOLD}" stroke-width="1" opacity=".7"/>
    <path d="M${x - 12} ${y + 46} h24" stroke="${GOLD}" stroke-width="3"/>
    ${[-3, -1, 1, 3].map(d => `<path d="M${x + d} ${y - 116} L${x + d * 1.6} ${y + 46}" stroke="${CREAM}" stroke-width=".7" opacity=".8"/>`).join('')}`,
  violin: (x, y, ink) => `
    <rect x="${x - 5}" y="${y - 112}" width="10" height="76" rx="2" fill="${ink}" stroke="${GOLD}" stroke-width="2.5"/>
    <circle cx="${x}" cy="${y - 124}" r="10" fill="${ink}" stroke="${GOLD}" stroke-width="2.5"/>
    <path d="M${x - 3} ${y - 124} a4 4 0 1 1 4 4" fill="none" stroke="${GOLD}" stroke-width="1.6"/>
    <path d="M${x} ${y - 46} C${x + 30} ${y - 46} ${x + 36} ${y - 22} ${x + 28} ${y - 6} C${x + 20} ${y + 6} ${x + 20} ${y + 14} ${x + 30} ${y + 24}
      C${x + 46} ${y + 42} ${x + 38} ${y + 76} ${x} ${y + 76}
      C${x - 38} ${y + 76} ${x - 46} ${y + 42} ${x - 30} ${y + 24} C${x - 20} ${y + 14} ${x - 20} ${y + 6} ${x - 28} ${y - 6}
      C${x - 36} ${y - 22} ${x - 30} ${y - 46} ${x} ${y - 46} z" fill="${ink}" stroke="${GOLD}" stroke-width="3"/>
    <path d="M${x - 14} ${y + 2} c-5 8 5 14 0 24 M${x + 14} ${y + 2} c5 8 -5 14 0 24" fill="none" stroke="${GOLD}" stroke-width="2"/>
    <path d="M${x - 10} ${y + 40} h20" stroke="${GOLD}" stroke-width="3"/>
    ${[-2.5, -0.8, 0.8, 2.5].map(d => `<path d="M${x + d} ${y - 110} L${x + d * 1.5} ${y + 40}" stroke="${CREAM}" stroke-width=".7" opacity=".8"/>`).join('')}
    <path d="M${x - 70} ${y + 64} L${x + 66} ${y - 92}" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${x - 66} ${y + 68} L${x + 70} ${y - 88}" stroke="${CREAM}" stroke-width="1" opacity=".7"/>`,
};

export function designedCover(piece, credit) {
  const ink = INKS[hash(piece.id) % INKS.length];
  const uid = `dc${++drawn}`;
  // "Louis Noiret · tekst Kees Pruis": the composer big, the other makers small under it
  const [main, ...more] = credit.split(' · ');
  const title = wrap(piece.title, 13, 3);
  const size = Math.min(38, 268 / (Math.max(...title.map(l => l.length)) * 0.5));
  const titleTop = Math.min(168 - (title.length - 1) * size * 0.55, 194 - (title.length - 1) * size * 1.08);
  const top = piece.series ? piece.series.split(' · ') : [piece.subtitle || ''];
  const cx = W / 2, ey = 374;

  // the cartouche: a rectangle with cut-in corners, like the label on the covers of the day
  const c = { l: 44, r: W - 44, t: 92, b: 268, k: 18 };
  const cartouche = `M${c.l + c.k} ${c.t} H${c.r - c.k} A${c.k} ${c.k} 0 0 0 ${c.r} ${c.t + c.k} V${c.b - c.k}
    A${c.k} ${c.k} 0 0 0 ${c.r - c.k} ${c.b} H${c.l + c.k} A${c.k} ${c.k} 0 0 0 ${c.l} ${c.b - c.k} V${c.t + c.k}
    A${c.k} ${c.k} 0 0 0 ${c.l + c.k} ${c.t} z`;
  const rays = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return `<path d="M${cx + Math.cos(a) * 54} ${ey + Math.sin(a) * 54} L${cx + Math.cos(a) * 190} ${ey + Math.sin(a) * 190}"
      stroke="${i % 2 ? GOLD : CREAM}" stroke-width="${i % 2 ? 1.2 : 5}" opacity="${i % 2 ? 0.35 : 0.09}"/>`;
  }).join('');
  const corner = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 30} V${y} H${x + sx * 30} M${x + sx * 7} ${y + sy * 7} l${sx * 9} ${sy * 9}"
    fill="none" stroke="${GOLD}" stroke-width="2.5"/><circle cx="${x + sx * 7}" cy="${y + sy * 7}" r="3.2" fill="${GOLD}"/>`;

  return `<svg class="designed-cover" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(piece.title)}">
    <defs>
      <radialGradient id="${uid}-glow" cx="50%" cy="35%" r="75%">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
      </radialGradient>
      <linearGradient id="${uid}-paper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f8eed4"/><stop offset="1" stop-color="#e9d7ae"/>
      </linearGradient>
      <clipPath id="${uid}-in"><rect x="20" y="20" width="${W - 40}" height="${H - 40}"/></clipPath>
    </defs>
    <rect width="${W}" height="${H}" rx="3" fill="${ink}"/>
    <g clip-path="url(#${uid}-in)">${rays}</g>
    <rect width="${W}" height="${H}" rx="3" fill="url(#${uid}-glow)"/>
    <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${GOLD}" stroke-width="3"/>
    <rect x="19" y="19" width="${W - 38}" height="${H - 38}" fill="none" stroke="${GOLD}" stroke-width="1"/>
    ${corner(26, 26, 1, 1)}${corner(W - 26, 26, -1, 1)}${corner(26, H - 26, 1, -1)}${corner(W - 26, H - 26, -1, -1)}
    <g font-family="'EB Garamond', Georgia, serif" text-anchor="middle" fill="${CREAM}">
      <text x="${cx}" y="54" font-size="12.5" letter-spacing="2.4" font-weight="700">${esc(top[0].toUpperCase())}</text>
      ${top[1] ? `<text x="${cx}" y="74" font-size="13" font-style="italic" fill="${GOLD}">— ${esc(top[1])} —</text>` : ''}
    </g>
    <path d="${cartouche}" fill="url(#${uid}-paper)" stroke="${GOLD}" stroke-width="4"/>
    <path d="${cartouche}" fill="none" stroke="${ink}" stroke-width="1.5" transform="translate(${cx} ${(c.t + c.b) / 2}) scale(.95) translate(${-cx} ${-(c.t + c.b) / 2})"/>
    <g text-anchor="middle">
      <g font-family="'Playfair Display', Didot, Georgia, serif" font-style="italic" font-weight="800" fill="${BROWN}" font-size="${size.toFixed(1)}">
        ${title.map((l, i) => `<text x="${cx}" y="${(titleTop + i * size * 1.08).toFixed(1)}">${esc(l)}</text>`).join('')}
      </g>
      <path d="M${cx - 50} 212 H${cx - 8} M${cx + 8} 212 H${cx + 50}" stroke="${ink}" stroke-width="1.5"/>
      <path d="M${cx} 206 l6 6 l-6 6 l-6 -6 z" fill="${ink}"/>
      <g font-family="'EB Garamond', Georgia, serif" fill="${ink}">
        <text x="${cx}" y="236" font-size="10.5" font-style="italic">muziek van</text>
        <text x="${cx}" y="253" font-size="15" font-weight="700" letter-spacing="1.6">${esc(main.toUpperCase())}</text>
      </g>
    </g>
    <circle cx="${cx}" cy="${ey}" r="50" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".55"/>
    <g transform="translate(${cx} ${ey}) scale(.72) translate(${-cx} ${-ey})">${(EMBLEMS[piece.emblem] || EMBLEMS.mandolin)(cx, ey, ink)}</g>
    <g font-family="'EB Garamond', Georgia, serif" text-anchor="middle" fill="${CREAM}">
      ${more.length ? `<text x="${cx}" y="${H - 46}" font-size="11.5" font-style="italic">${esc(more.join(' · '))}</text>` : ''}
      ${piece.place ? `<text x="${cx}" y="${H - 30}" font-size="10.5" letter-spacing="3" fill="${GOLD}">${esc(piece.place.toUpperCase())}</text>` : ''}
    </g>
  </svg>`;
}
