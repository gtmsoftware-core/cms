import { describe, expect, it } from 'vitest';
import { createR2MediaStorage } from './r2-media-storage';

const config = {
  accountId: 'acc123',
  accessKeyId: 'AKIDEXAMPLE',
  secretAccessKey: 'secret',
  bucket: 'cms-media',
  publicUrl: 'https://media.exemplo.com/',
};

describe('R2 media storage', () => {
  it('sends signed S3 requests to the account endpoint', async () => {
    const requests: Request[] = [];
    const storage = createR2MediaStorage(config, async (input) => {
      requests.push(input instanceof Request ? input : new Request(input));
      return new Response(null, { status: 200 });
    });

    await storage.put('tnt_1/site_1/med_1.png', new Uint8Array([1, 2, 3]), 'image/png');
    await storage.delete('tnt_1/site_1/med_1.png');

    expect(requests.map((r) => [r.method, r.url])).toEqual([
      ['PUT', 'https://acc123.r2.cloudflarestorage.com/cms-media/tnt_1/site_1/med_1.png'],
      ['DELETE', 'https://acc123.r2.cloudflarestorage.com/cms-media/tnt_1/site_1/med_1.png'],
    ]);
    expect(requests[0]?.headers.get('authorization')).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\//);
    expect(requests[0]?.headers.get('content-type')).toBe('image/png');
    expect(storage.publicUrl('tnt_1/site_1/med_1.png')).toBe('https://media.exemplo.com/tnt_1/site_1/med_1.png');
  });

  it('fails loudly when R2 refuses the upload', async () => {
    const storage = createR2MediaStorage(config, async () => new Response(null, { status: 403 }));
    await expect(storage.put('k', new Uint8Array([1]), 'image/png')).rejects.toThrow('R2 PUT failed with status 403');
  });
});
