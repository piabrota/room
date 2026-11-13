// The chart's mesh, stroked away from the page: 22 thousand triangles as one path take a browser
// from a few tenths of a second to several seconds, and on the page's own thread the room would
// stand still for as long, right after it shows. Here it is drawn on a canvas of its own, with
// nothing behind it, and sent back as a picture that src/grid.js lays over the chart's paper:
// the same strokes, the same colour, in the same place (src/chart.js).
import { strokeMesh } from './chart.js';

self.onmessage = ({ data: { W, H, lonlat, tris, bbox, style } }) => {
  try {
    const c = new OffscreenCanvas(W, H), ctx = c.getContext('2d');
    strokeMesh(ctx, { H, lonlat, tris, bbox, style });
    const bitmap = c.transferToImageBitmap();
    self.postMessage({ bitmap }, [bitmap]);
  } catch (e) { self.postMessage({ error: String(e) }); }
};
