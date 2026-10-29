import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signWebhook, WEBHOOK_HEADERS } from '../webhook';
import { createRevalidateHandler } from './revalidate-handler';

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock('next/cache', () => ({ revalidateTag }));

const secret = 'whsec_test';
const payload = {
  deliveryId: 'dlv_1',
  siteId: 'site_1',
  occurredAt: '2026-10-28T14:00:00.000Z',
  events: [{ type: 'content.updated', contentType: 'page', id: 'cnt_1', slug: 'servicos' }],
  tags: ['cms:site', 'cms:page:list', 'cms:page:servicos'],
};

function signedRequest(body: string, options: { secret?: string; timestamp?: number } = {}) {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
  return new Request('https://site.test/api/revalidate', {
    method: 'POST',
    body,
    headers: {
      [WEBHOOK_HEADERS.timestamp]: String(timestamp),
      [WEBHOOK_HEADERS.signature]: signWebhook(options.secret ?? secret, timestamp, body),
    },
  });
}

describe('createRevalidateHandler', () => {
  const POST = createRevalidateHandler({ secret });
  beforeEach(() => revalidateTag.mockClear());

  it('revalidates every tag of a signed payload with the max profile', async () => {
    const response = await POST(signedRequest(JSON.stringify(payload)));
    expect(response.status).toBe(200);
    expect(revalidateTag.mock.calls).toEqual(payload.tags.map((tag) => [tag, 'max']));
  });

  it('answers 401 to a wrong signature or an old timestamp', async () => {
    const body = JSON.stringify(payload);
    expect((await POST(signedRequest(body, { secret: 'whsec_other' }))).status).toBe(401);
    expect((await POST(signedRequest(body, { timestamp: 1 }))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('answers 400 to a signed but invalid payload', async () => {
    expect((await POST(signedRequest('{"tags":"x"}'))).status).toBe(400);
    expect((await POST(signedRequest('not json'))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
