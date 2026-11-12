// Draws the app icon as PNGs with no dependencies (a canister on haze). Run: node scripts/icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function png(size) {
  const px = Buffer.alloc(size * size * 4);
  const mix = (a, b, t) => a + (b - a) * t;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, i = (y * size + x) * 4;
    const d = Math.hypot(u - 0.3, v - 0.25);
    let r = mix(247, 188, Math.min(1, d)), g = mix(251, 210, Math.min(1, d)), b = mix(255, 232, Math.min(1, d));
    const inBody = u > 0.28 && u < 0.72 && v > 0.26 && v < 0.74;
    const inCap = (u > 0.23 && u < 0.29 || u > 0.71 && u < 0.77) && v > 0.29 && v < 0.71;
    if (inCap) { const s = 0.5 + 0.5 * Math.cos((v - 0.29) / 0.42 * Math.PI * 2); r = g = b = mix(110, 245, s); }
    if (inBody) { r = 23; g = 25; b = 28; if (v > 0.675 && v < 0.695) { r = 127; g = 169; b = 212; } }
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcT[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
for (const s of [192, 512]) writeFileSync(new URL(`../public/icon-${s}.png`, import.meta.url), png(s));
console.log("icons written");
