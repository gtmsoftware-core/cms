import { revalidateTag } from 'next/cache';
import { verifyWebhookSignature, WEBHOOK_HEADERS, webhookPayloadSchema } from '../webhook';

export type RevalidateHandlerOptions = Readonly<{
  /** CMS_WEBHOOK_SECRET of the site. */
  secret: string;
  /**
   * How long stale content may be served after a change. 'max' (default) serves the old version to the
   * first visitor while revalidating; `{ expire: 0 }` forces the next request to wait for fresh data.
   */
  profile?: string | { expire?: number };
}>;

/**
 * Route handler for `app/api/revalidate/route.ts` in the site:
 * `export const POST = createRevalidateHandler({ secret: process.env.CMS_WEBHOOK_SECRET! })`.
 */
export function createRevalidateHandler({ secret, profile = 'max' }: RevalidateHandlerOptions) {
  if (!secret) throw new Error('createRevalidateHandler: CMS_WEBHOOK_SECRET is missing');

  return async function POST(request: Request): Promise<Response> {
    const rawBody = await request.text();
    const verified = verifyWebhookSignature({
      secret,
      rawBody,
      timestamp: request.headers.get(WEBHOOK_HEADERS.timestamp),
      signature: request.headers.get(WEBHOOK_HEADERS.signature),
    });
    if (!verified.ok) return Response.json({ error: 'invalid_signature' }, { status: 401 });

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: 'invalid_payload' }, { status: 400 });
    }
    const payload = webhookPayloadSchema.safeParse(json);
    if (!payload.success) return Response.json({ error: 'invalid_payload' }, { status: 400 });

    for (const tag of payload.data.tags) revalidateTag(tag, profile);
    return Response.json({ revalidated: payload.data.tags });
  };
}
