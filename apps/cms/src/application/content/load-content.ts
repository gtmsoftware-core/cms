import {
  ContentConflictError,
  ContentNotFoundError,
  type Content,
  type ContentId,
  type ContentRepository,
  type ContentType,
} from '@/domain/content';
import type { SiteScope } from '@/domain/sites';

export async function loadContent(
  contents: ContentRepository,
  scope: SiteScope,
  type: ContentType,
  id: string,
): Promise<Content> {
  const content = await contents.findById(scope, id as ContentId);
  if (!content || content.type !== type) throw new ContentNotFoundError();
  return content;
}

/** Fails early when the editor holds an old version; the repository checks again atomically. */
export function assertVersion(content: Content, version: number): void {
  if (content.version !== version) throw new ContentConflictError();
}
