import type { ContentRepository } from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import { authorizeSite } from '@/application/sites';
import { toPageDetail, type PageDetail } from '../dto';
import { loadContent } from '../load-content';
import { contentRefSchema, type ContentRef } from '../schemas/content-ref.schema';

export type GetPageDeps = Readonly<{ sites: SiteRepository; contents: ContentRepository }>;

export function makeGetPage({ sites, contents }: GetPageDeps) {
  return async function getPage(actor: Actor, input: ContentRef): Promise<PageDetail> {
    const { contentId, ...ref } = contentRefSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));
    return toPageDetail(await loadContent(contents, scope, 'page', contentId));
  };
}
