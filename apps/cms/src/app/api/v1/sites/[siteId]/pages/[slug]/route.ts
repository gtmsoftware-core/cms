import { deliver } from '../../../../_server/delivery';

export async function GET(request: Request, ctx: RouteContext<'/api/v1/sites/[siteId]/pages/[slug]'>) {
  const { siteId, slug } = await ctx.params;
  return deliver(request, siteId, (container, scope) => container.getPublishedPage(scope, slug));
}
