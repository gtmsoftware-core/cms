import type { ErrorResponse } from '@gtmsoftware-core/cms-sdk';
import { getContainer, type Container } from '@/composition/container';

const HEADERS = { 'cache-control': 'no-store' } as const;

/** Delivery errors by name. The same 401 covers every key problem, so callers learn nothing extra. */
const ERRORS: Readonly<Record<string, { status: number; body: ErrorResponse; headers?: Record<string, string> }>> = {
  InvalidApiKeyError: { status: 401, body: { error: 'unauthorized' }, headers: { 'www-authenticate': 'Bearer' } },
  DeliveryRateLimitedError: { status: 429, body: { error: 'rate_limited' }, headers: { 'retry-after': '60' } },
  DeliveryNotFoundError: { status: 404, body: { error: 'not_found' } },
};

type SiteScope = Awaited<ReturnType<Container['authenticateSite']>>;
type Read = (container: Container, scope: SiteScope) => Promise<unknown>;

/** Authenticates the API key for the site in the path, then runs a read inside that site's scope. */
export async function deliver(request: Request, siteId: string, read: Read): Promise<Response> {
  const container = await getContainer();
  try {
    const scope = await container.authenticateSite({ siteId, authorization: request.headers.get('authorization') ?? '' });
    return Response.json(await read(container, scope), { headers: HEADERS });
  } catch (error) {
    const known = error instanceof Error ? ERRORS[error.name] : undefined;
    if (!known) throw error;
    return Response.json(known.body, { status: known.status, headers: { ...HEADERS, ...known.headers } });
  }
}
