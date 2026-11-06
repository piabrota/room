// Blosc (version 1) with LZ4, enough to read Copernicus Marine's ARCO zarr chunks in
// `just grid` without a native module: a 16-byte header, the start of each block, then per
// block one LZ4 stream per byte of the type (or one when the block is not split), and the
// byte shuffle undone. Written for this repository from the formats' public specifications.

// one LZ4 block from src[s, end) into dst at d
function lz4(src, s, end, dst, d) {
  while (s < end) {
    const tok = src[s++]; let lit = tok >> 4;
    if (lit === 15) { let b; do { b = src[s++]; lit += b; } while (b === 255); }
    dst.set(src.subarray(s, s + lit), d); s += lit; d += lit;
    if (s >= end) break;
    const off = src[s] | (src[s + 1] << 8); s += 2;
    let len = tok & 15;
    if (len === 15) { let b; do { b = src[s++]; len += b; } while (b === 255); }
    len += 4;
    for (let m = d - off, i = 0; i < len; i++) dst[d++] = dst[m++];
  }
  return d;
}

export function blosc(buf) {
  const u = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength), v = new DataView(u.buffer, u.byteOffset, u.byteLength);
  const flags = u[2], ts = u[3], nbytes = v.getUint32(4, true), bs = v.getUint32(8, true);
  const out = new Uint8Array(nbytes);
  if (flags & 2) { out.set(u.subarray(16, 16 + nbytes)); return out; } // stored as is
  if (flags >> 5 !== 1) throw new Error(`blosc: codec ${flags >> 5} is not lz4`);
  if (flags & 4) throw new Error('blosc: bit shuffle is not supported');
  const nblocks = Math.ceil(nbytes / bs), shuffle = (flags & 1) && ts > 1, split = !(flags & 0x10);
  const tmp = new Uint8Array(bs);
  for (let b = 0; b < nblocks; b++) {
    let s = v.getUint32(16 + b * 4, true);
    const size = Math.min(bs, nbytes - b * bs), last = b === nblocks - 1 && nbytes % bs;
    const streams = split && !last ? ts : 1, ssize = size / streams;
    const dst = shuffle ? tmp : out, d0 = shuffle ? 0 : b * bs;
    for (let k = 0; k < streams; k++) {
      const cs = v.getInt32(s, true); s += 4;
      if (cs === ssize) dst.set(u.subarray(s, s + cs), d0 + k * ssize); else lz4(u, s, s + cs, dst, d0 + k * ssize);
      s += cs;
    }
    if (shuffle) {
      const n = Math.floor(size / ts), o = b * bs;
      for (let i = 0; i < n; i++) for (let j = 0; j < ts; j++) out[o + i * ts + j] = tmp[j * n + i];
      for (let i = n * ts; i < size; i++) out[o + i] = tmp[i];
    }
  }
  return out;
}
