// The coast's triangle mesh as the chart on the wall shows it (src/grid.js, `chartTexture`): one
// path for every triangle, stroked once, so lines that cross are not painted twice. The page
// draws it this way when it must, and src/chart.worker.js draws it this way off the page's thread.
export function strokeMesh(ctx, { H, lonlat, tris, bbox, style }) {
  const [w, s, , nn] = bbox, x0 = 440, y0 = 160, h = H - 200, sc = h / (nn - s);
  const px = (i) => x0 + (lonlat[i * 2] - w) * sc * Math.cos(-15 * Math.PI / 180), py = (i) => y0 + (nn - lonlat[i * 2 + 1]) * sc;
  ctx.strokeStyle = style.color; ctx.lineWidth = style.width; ctx.beginPath();
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c2] = [tris[t], tris[t + 1], tris[t + 2]];
    ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.lineTo(px(c2), py(c2)); ctx.closePath();
  }
  ctx.stroke();
}
