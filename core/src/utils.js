export const packColor = isLittleEndian() ? packColorLE : packColorBE;
export const unpackColor = isLittleEndian() ? unpackColorLE : unpackColorBE;

export function packColorLE(r, g, b, a = 0xFF) {
  return (a << 24 | b << 16 | g << 8 | r) >>> 0; // Convert to 32-bit unsigned integer
}

export function packColorBE(r, g, b, a = 0xFF) {
  return (r << 24 | g << 16 | b << 8 | a) >>> 0; // Convert to 32-bit unsigned integer
}

export function unpackColorLE(c) {
  return [c & 0xFF, (c >>> 8) & 0xFF, (c >>> 16) & 0xFF, (c >>> 24) & 0xFF];
}

export function unpackColorBE(c) {
  return [(c >>> 24) & 0xFF, (c >>> 16) & 0xFF, (c >>> 8) & 0xFF, c & 0xFF];
}

// Must be called multiple times, otherwise closure compiler will try to inline it with wrong result.
export function isLittleEndian() {
  const u16 = new Uint16Array([0x1234]);
  const u8 = new Uint8Array(u16.buffer);
  return u8[0] === 0x34;
}

export function formatSize(size) {
  if (typeof size !== 'number') {
    return undefined;
  }
  if (Math.abs(size) >= 1024 * 1024) {
    return ~~(size / (1024 * 1024)) + ' MB';
  }
  if (Math.abs(size) >= 1024) {
    return ~~(size / 1024) + ' KB';
  }
  return size + ' B';
}

export function roundUpToPowerOf2(number) {
  let result = 1;
  while (result < number) {
    result *= 2;
  }
  return result;
}