import { describe, expect, it } from 'vitest';
import { detectImageType } from './entities';

const bytes = (...values: (number | string)[]) =>
  Uint8Array.from(values.flatMap((value) => (typeof value === 'string' ? [...value].map((c) => c.charCodeAt(0)) : [value])));

describe('detectImageType', () => {
  it('recognizes images by their magic numbers', () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe('image/jpeg');
    expect(detectImageType(bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe('image/png');
    expect(detectImageType(bytes('GIF89a'))?.mime).toBe('image/gif');
    expect(detectImageType(bytes('RIFF', 0, 0, 0, 0, 'WEBPVP8 '))?.mime).toBe('image/webp');
    expect(detectImageType(bytes(0, 0, 0, 0x1c, 'ftypavif'))?.mime).toBe('image/avif');
    expect(detectImageType(bytes('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg">'))?.mime).toBe('image/svg+xml');
  });

  it('rejects anything else, whatever the file name says', () => {
    expect(detectImageType(bytes('%PDF-1.7'))).toBeNull();
    expect(detectImageType(bytes('<script>alert(1)</script>'))).toBeNull();
    expect(detectImageType(bytes('<html><svg></svg></html>'))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});
