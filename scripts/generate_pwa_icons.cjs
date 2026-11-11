const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw pixel data: 1 byte filter per row + width * 4 bytes RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.44 : 0.42);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    raw[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: Neomorphic soft grey-slate #e4ebf5
      let r = 228, g = 235, b = 245, a = 255;

      if (dist <= radius) {
        // Soft extruded disc
        const angle = Math.atan2(dy, dx);
        // directional lighting from top-left
        const light = -Math.cos(angle + Math.PI / 4);
        const shade = Math.min(255, Math.max(0, 230 + Math.round(light * 25)));
        r = shade;
        g = Math.min(255, shade + 5);
        b = Math.min(255, shade + 15);

        // Draw inner bell & clock silhouette in sky blue #0284c7 to #38bdf8
        const inBellBody = (Math.abs(dx) <= (radius * 0.42 * (1 + (dy / radius) * 0.8))) &&
          dy >= -radius * 0.35 && dy <= radius * 0.28;
        
        const inTopHammer = dist <= radius * 0.16 && dy <= -radius * 0.3;
        const inLeftBell = Math.hypot(dx + radius * 0.45, dy + radius * 0.4) <= radius * 0.18;
        const inRightBell = Math.hypot(dx - radius * 0.45, dy + radius * 0.4) <= radius * 0.18;

        if (inBellBody || inTopHammer || inLeftBell || inRightBell) {
          // Alarm Bell Color
          r = 2;
          g = 132;
          b = 199;

          // Checkmark highlight in the center
          const isCheck1 = (x - cx >= -radius * 0.15 && x - cx <= 0 && Math.abs((y - cy) - (x - cx) - radius * 0.08) < radius * 0.04);
          const isCheck2 = (x - cx >= 0 && x - cx <= radius * 0.22 && Math.abs((y - cy) + (x - cx) - radius * 0.08) < radius * 0.04);

          if (isCheck1 || isCheck2) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = createChunk('IDAT', compressed);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const outDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180));
console.log('PWA icons successfully generated in /public!');
