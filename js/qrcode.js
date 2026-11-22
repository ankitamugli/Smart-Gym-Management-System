/* ==========================================================================
   FORMA – qrcode.js
   Small dependency-free QR Code generator (byte mode, versions 1–10,
   error correction L or M). Works offline, no CDN needed.
   Written for this project following the public QR Code Model 2 specification
   (ISO/IEC 18004). Max payload ≈ 213 bytes at level M (version 10).

   QR.encode('text', 'M')                 -> { size, modules:boolean[][] }
   QR.toCanvas(canvas, 'text', {scale:8, margin:2, ecc:'M'})
   To use a different library later (qrcode.js, qrcode-generator…), replace the
   calls to QR.toCanvas in js/checkin.js.
   ========================================================================== */
const QR = (() => {
  const ECC_PER_BLOCK = { L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18], M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26] };
  const NUM_BLOCKS = { L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4], M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5] };
  const FORMAT_BITS = { L: 1, M: 0 };
  const MAX_VER = 10;

  const rawModules = v => {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  };
  const dataCodewords = (v, ecc) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[ecc][v] * NUM_BLOCKS[ecc][v];

  function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function rsDivisor(deg) { const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1; for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gfMul(root, 2); } return r; }
  function rsRemainder(data, div) { const r = new Array(div.length).fill(0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); } return r; }

  const utf8 = s => Array.from(new TextEncoder().encode(s));

  function makeCodewords(bytes, ver, ecc) {
    const bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(4, 4); push(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => push(b, 8));
    const cap = dataCodewords(ver, ecc) * 8;
    push(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let pad = 0xEC; data.length < cap / 8; pad ^= 0xEC ^ 0x11) data.push(pad);
    // split into blocks, add Reed–Solomon ECC, interleave
    const nb = NUM_BLOCKS[ecc][ver], eccLen = ECC_PER_BLOCK[ecc][ver], raw = Math.floor(rawModules(ver) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb); const div = rsDivisor(eccLen); const blocks = []; let k = 0;
    for (let i = 0; i < nb; i++) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1)); k += dat.length;
      const e = rsRemainder(dat, div); if (i < nShort) dat.push(0); blocks.push(dat.concat(e));
    }
    const out = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) out.push(b[i]); });
    return out;
  }

  function alignPositions(ver) {
    if (ver === 1) return []; const n = Math.floor(ver / 7) + 2; const size = ver * 4 + 17;
    const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2; const r = [6];
    for (let pos = size - 7; r.length < n; pos -= step) r.splice(1, 0, pos); return r;
  }

  function build(codewords, ver, ecc) {
    const size = ver * 4 + 17;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, v) => { mod[y][x] = v; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const ap = alignPositions(ver);
    ap.forEach((ay, i) => ap.forEach((ax, j) => { if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    const formatBits = m => {
      const data = FORMAT_BITS[ecc] << 3 | m; let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = (data << 10 | rem) ^ 0x5412; const b = i => ((bits >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, b(i)); set(8, 7, b(6)); set(8, 8, b(7)); set(7, 8, b(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, b(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, b(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, b(i)); set(8, size - 8, true);
    };
    formatBits(0);
    if (ver >= 7) { let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25); const bits = ver << 12 | rem; for (let i = 0; i < 18; i++) { const v = ((bits >>> i) & 1) !== 0, a = size - 11 + i % 3, b = Math.floor(i / 3); set(a, b, v); set(b, a, v); } }
    // zig-zag data placement
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && i < codewords.length * 8) { mod[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const applyMask = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; };
    const penalty = () => {
      let p = 0;
      for (let pass = 0; pass < 2; pass++) for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { const cur = pass ? mod[b][a] : mod[a][b], prev = pass ? mod[b - 1][a] : mod[a][b - 1]; if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
      const dark = mod.reduce((s, row) => s + row.filter(Boolean).length, 0); p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10; return p;
    };
    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++) { applyMask(m); formatBits(m); const p = penalty(); if (p < bestP) { best = m; bestP = p; } applyMask(m); }
    applyMask(best); formatBits(best);
    return { size, modules: mod };
  }

  function encode(text, ecc = 'M') {
    const bytes = utf8(String(text)); if (!ECC_PER_BLOCK[ecc]) ecc = 'M';
    for (let v = 1; v <= MAX_VER; v++) { const cap = dataCodewords(v, ecc) * 8; const need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8; if (need <= cap) return build(makeCodewords(bytes, v, ecc), v, ecc); }
    throw new Error('Text is too long for this QR generator (limit about 200 characters).');
  }

  function toCanvas(canvas, text, opts = {}) {
    const { scale = 8, margin = 2, ecc = 'M', dark = '#0f1b2d', light = '#ffffff' } = opts;
    const qr = encode(text, ecc); const px = (qr.size + margin * 2) * scale;
    canvas.width = px; canvas.height = px; const c = canvas.getContext('2d');
    c.fillStyle = light; c.fillRect(0, 0, px, px); c.fillStyle = dark;
    qr.modules.forEach((row, y) => row.forEach((on, x) => { if (on) c.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale); }));
    return qr;
  }
  return { encode, toCanvas };
})();
