import type { ContentRepository } from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import { authorizeSite } from '@/application/sites';
import { toPageSummary, type PageSummary } from '../dto';
import { siteRefSchema, type SiteRef } from '../schemas/content-ref.schema';

export type ListPagesDeps = Readonly<{ sites: SiteRepository; contents: ContentRepository }>;

export function makeListPages({ sites, contents }: ListPagesDeps) {
  return async function listPages(actor: Actor, input: SiteRef): Promise<PageSummary[]> {
    const ref = siteRefSchema.parse(input);
    const site = await authorizeSite(sites, actor, ref);
    const pages = await contents.listByType(scopeOf(site), 'page');
    return pages.map(toPageSummary);
  };
}
