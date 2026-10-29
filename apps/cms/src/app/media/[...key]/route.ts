import { getContainer } from '@/composition/container';

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
};

/** Serves the local media library in development. With R2 configured, files are served by the bucket. */
export async function GET(_request: Request, ctx: RouteContext<'/media/[...key]'>) {
  const { key } = await ctx.params;
  const storageKey = key.join('/');
  const read = (await getContainer()).readLocalMedia;
  const bytes = read ? await read(storageKey) : null;
  const mime = MIME_BY_EXTENSION[storageKey.split('.').pop() ?? ''];
  if (!bytes || !mime) return new Response('Not found', { status: 404 });

  return new Response(bytes, {
    headers: {
      'content-type': mime,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      // Even if an SVG is opened directly, nothing in it can run or load: no scripts, no requests.
      'content-security-policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
