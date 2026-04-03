export function drawDonut(canvas, items, total, colorByName) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) * 0.42;
  const innerR = outerR * 0.62;

  if (!total) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#e5e7eb';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    return;
  }

  let start = -Math.PI / 2;
  items.forEach((item) => {
    const val = Math.max(0, item.amount || 0);
    const end = start + (val / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, start, end);
    ctx.closePath();
    ctx.fillStyle = colorByName.get(item.name) || '#0f172a';
    ctx.fill();

    start = end;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
