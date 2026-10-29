import { deliver } from '../../../_server/delivery';

export async function GET(request: Request, ctx: RouteContext<'/api/v1/sites/[siteId]/pages'>) {
  const { siteId } = await ctx.params;
  return deliver(request, siteId, (container, scope) => container.listPublishedPages(scope));
}
