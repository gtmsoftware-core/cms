import { AwsClient } from 'aws4fetch';
import type { MediaStorage } from '@/application/media';

export type R2Config = Readonly<{
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public address of the bucket (r2.dev subdomain or a custom domain). */
  publicUrl: string;
}>;

/** Production storage: Cloudflare R2 through its S3-compatible API, signed with SigV4. */
export function createR2MediaStorage(config: R2Config, fetchImpl: typeof fetch = fetch): MediaStorage {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  });
  const objectUrl = (key: string) => `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;

  async function send(method: 'PUT' | 'DELETE', key: string, init: RequestInit = {}) {
    const request = await client.sign(objectUrl(key), { method, ...init });
    const response = await fetchImpl(request);
    if (!response.ok && !(method === 'DELETE' && response.status === 404)) {
      throw new Error(`R2 ${method} failed with status ${response.status}`);
    }
  }

  return {
    put: (key, bytes, mime) =>
      send('PUT', key, {
        body: bytes,
        headers: { 'content-type': mime, 'cache-control': 'public, max-age=31536000, immutable' },
      }),
    delete: (key) => send('DELETE', key),
    publicUrl: (key) => `${config.publicUrl.replace(/\/+$/, '')}/${key}`,
  };
}
