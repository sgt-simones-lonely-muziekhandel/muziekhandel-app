// Sky colours that follow the visitor's real local time. ?uur=21.5 in the URL overrides it for testing.

const KEYS = [
  // hour, top, horizon, darkness (0 = full day, 1 = deep night)
  [0, '#0b1026', '#1d2546', 1],
  [5, '#141a38', '#2e3560', 0.9],
  [6.3, '#3f5f93', '#f0a978', 0.45],
  [7.5, '#6a9fd3', '#f3d9b4', 0.12],
  [10, '#5b9bd5', '#d4eaf6', 0],
  [16, '#5f97cc', '#e6dcc2', 0],
  [18.3, '#4a6d9c', '#f2b26a', 0.15],
  [19.6, '#2f3463', '#d8735a', 0.45],
  [20.8, '#171c3d', '#3b3a62', 0.8],
  [22, '#0b1026', '#1d2546', 1],
  [24, '#0b1026', '#1d2546', 1],
];

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};

export function currentHour() {
  const forced = new URLSearchParams(location.search).get('uur');
  if (forced != null && !isNaN(+forced)) return ((+forced % 24) + 24) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export function skyAt(hour) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= hour) i++;
  const [h0, t0, b0, d0] = KEYS[i], [h1, t1, b1, d1] = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (hour - h0) / (h1 - h0)));
  const dark = d0 + (d1 - d0) * t;
  // sun from about 6:30 to 20:00, moon the rest of the time
  const dayT = (hour - 6.3) / (20.2 - 6.3);
  const nightT = ((hour - 20.2 + 24) % 24) / (24 - (20.2 - 6.3));
  return {
    top: mix(t0, t1, t),
    horizon: mix(b0, b1, t),
    dark,
    sun: dayT > -0.05 && dayT < 1.05 ? dayT : null,
    moon: dayT <= 0 || dayT >= 1 ? nightT : null,
    lampsOn: dark > 0.3,
    painted: paintedWeight(hour),
  };
}

// How much of the painted sunset sky (public/art/past-street/sky.webp) to show.
function paintedWeight(h) {
  const ramp = (a, b) => Math.min(1, Math.max(0, (h - a) / (b - a)));
  const dusk = ramp(17.3, 18.5) * (1 - ramp(20.4, 21.4));
  const dawn = 0.8 * ramp(5.4, 6.3) * (1 - ramp(7.2, 8.2));
  return Math.max(dusk, dawn);
}

export function hourLabel(hour) {
  if (hour < 6) return 'nacht';
  if (hour < 12) return 'ochtend';
  if (hour < 18) return 'middag';
  if (hour < 22) return 'avond';
  return 'nacht';
}
