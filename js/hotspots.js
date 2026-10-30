// Interactive spots in an indoor scene: find what was clicked or what the boy stands next to,
// and draw the gold outline and the paper label. Used by the shop and the listening corner.
// A hotspot is { id, label, rects: [[x, y, w, h], …], stands: [x, …], action(game), faceLeft? }:
// one stand (where the boy walks to) per rectangle; `faceLeft` turns him round before acting (doors on the left).

const INK = '#1d1510';

export function hitSpot(spots, wx, wy) {
  for (const h of spots) {
    const i = h.rects.findIndex(([x, y, w, hh]) => wx >= x && wx <= x + w && wy >= y && wy <= y + hh);
    if (i >= 0) return { spot: h, stand: h.stands[i] };
  }
  return null;
}

export function nearestSpot(spots, boyX, range = 80) {
  let best = null, bd = range;
  for (const h of spots) for (const s of h.stands) {
    const d = Math.abs(boyX - s);
    if (d < bd) { bd = d; best = h; }
  }
  return best;
}

// Click: walk to the spot and use it, or just walk there.
export function clickSpots(scene, spots, wx, wy, minX, maxX) {
  const hit = hitSpot(spots, wx, wy);
  if (hit) {
    scene.boy.walkTo(hit.stand, () => {
      if (hit.spot.faceLeft) scene.boy.dir = -1;
      hit.spot.action(scene.game);
    });
  } else {
    scene.boy.walkTo(Math.max(minX, Math.min(maxX, wx)));
  }
}

// Warm pulsing dashed outline around a spot.
export function drawOutline(ctx, spot, time) {
  const pulse = 0.55 + 0.45 * Math.sin(time * 4);
  ctx.save();
  ctx.shadowColor = 'rgba(255,214,120,0.9)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = `rgba(255,214,120,${0.5 + pulse * 0.4})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -time * 20;
  for (const [x, y, w, h] of spot.rects) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.stroke(); }
  ctx.restore();
}

// Paper label above a spot; "↑" when the boy can use it with the keyboard.
export function drawLabel(ctx, spot, time, worldW, withKey) {
  const [rx, ry, rw] = spot.rects[0];
  const text = (withKey ? '↑ ' : '') + spot.label;
  ctx.font = '800 19px "Nunito Sans", sans-serif';
  const w = ctx.measureText(text).width + 34;
  const x = Math.max(w / 2 + 8, Math.min(worldW - w / 2 - 8, rx + rw / 2));
  const y = Math.max(40, ry - 26);
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 3) * 3);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -19); ctx.lineTo(w / 2, -20); ctx.lineTo(w / 2 + 2, 19); ctx.lineTo(9, 20); ctx.lineTo(0, 31); ctx.lineTo(-9, 20); ctx.lineTo(-w / 2 - 1, 19);
  ctx.closePath();
  ctx.fillStyle = '#f4e9d7'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}
