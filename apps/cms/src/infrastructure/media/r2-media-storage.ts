import { AwsClient } from 'aws4fetch';
import { MediaStorageError, type MediaStorage } from '@/application/media';

export type R2Config = Readonly<{
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public address of the bucket (r2.dev subdomain or a custom domain). */
  publicUrl: string;
}>;

/** S3 error code from the XML body (e.g. AccessDenied), safe to log: it carries no credentials. */
async function errorCodeOf(response: Response): Promise<string> {
  const body = await response.text().catch(() => '');
  return /<Code>([^<]+)<\/Code>/.exec(body)?.[1] ?? '';
}

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
    const signed = await client.sign(objectUrl(key), { method, ...init });
    // Sends the original body, not the signed Request: its body is a stream, so the fetch
    // patched by Next.js uploads it chunked, without the Content-Length that R2 requires (411).
    const response = await fetchImpl(signed.url, { method, headers: signed.headers, body: init.body ?? null });
    if (!response.ok && !(method === 'DELETE' && response.status === 404)) {
      const error = new MediaStorageError(`R2 ${method} failed with status ${response.status} ${await errorCodeOf(response)}`.trim());
      console.error(error.message);
      throw error;
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
