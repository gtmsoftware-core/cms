import { createHash, timingSafeEqual } from 'node:crypto';
import { getContainer } from '@/composition/container';

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Sweep for pending and retryable webhooks (Vercel Cron or an external scheduler). */
export async function GET(request: Request) {
  const container = await getContainer();
  const presented = digest(request.headers.get('authorization') ?? '');
  if (!timingSafeEqual(presented, digest(`Bearer ${container.cronSecret}`))) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  return Response.json(await container.dispatchDue(), { headers: { 'cache-control': 'no-store' } });
}
