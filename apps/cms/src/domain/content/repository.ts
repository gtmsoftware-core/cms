import type { SiteScope } from '@/domain/sites';
import type { Content, ContentId, ContentType } from './entities';

export interface ContentRepository {
  findById(scope: SiteScope, id: ContentId): Promise<Content | null>;
  findBySlug(scope: SiteScope, type: ContentType, slug: string): Promise<Content | null>;
  listByType(scope: SiteScope, type: ContentType): Promise<Content[]>;
  listPublished(scope: SiteScope, type: ContentType): Promise<Content[]>;
  findPublishedBySlug(scope: SiteScope, type: ContentType, slug: string): Promise<Content | null>;
  /**
   * Inserts version 1 or updates when the stored version is `content.version - 1`.
   * Throws ContentConflictError on a stale version and SlugAlreadyInUseError on a duplicate slug.
   */
  save(scope: SiteScope, content: Content): Promise<void>;
  /** Logical delete. Deleted content is invisible to every other method. */
  delete(scope: SiteScope, id: ContentId, at: Date): Promise<void>;
}
