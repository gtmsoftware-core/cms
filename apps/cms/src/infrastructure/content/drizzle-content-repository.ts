import { and, asc, eq, isNull } from 'drizzle-orm';
import {
  ContentConflictError,
  SlugAlreadyInUseError,
  type Content,
  type ContentId,
  type ContentRepository,
} from '@/domain/content';
import type { SiteScope } from '@/domain/sites';
import { tables, type Executor } from '@/infrastructure/db';

type ContentRow = typeof tables.contents.$inferSelect;

const toContent = (row: ContentRow): Content => ({
  id: row.id as ContentId,
  tenantId: row.tenantId as Content['tenantId'],
  siteId: row.siteId as Content['siteId'],
  type: row.type,
  slug: row.slug,
  status: row.status,
  data: row.data,
  version: row.version,
  publishedAt: row.publishedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const UNIQUE_VIOLATION = '23505';

/** Postgres errors arrive wrapped by Drizzle; the driver error is in `cause`. */
function isUniqueViolation(error: unknown): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('code' in current && current.code === UNIQUE_VIOLATION) return true;
  }
  return false;
}

export function createDrizzleContentRepository(db: Executor): ContentRepository {
  const { contents } = tables;
  const inScope = (scope: SiteScope) =>
    and(eq(contents.tenantId, scope.tenantId), eq(contents.siteId, scope.siteId), isNull(contents.deletedAt));

  async function write(scope: SiteScope, content: Content): Promise<number> {
    if (content.version === 1) {
      await db.insert(contents).values(content);
      return 1;
    }
    const { id, slug, status, data, version, publishedAt, updatedAt } = content;
    const updated = await db
      .update(contents)
      .set({ slug, status, data, version, publishedAt, updatedAt })
      .where(and(inScope(scope), eq(contents.id, id), eq(contents.version, version - 1)))
      .returning({ id: contents.id });
    return updated.length;
  }

  return {
    async findById(scope, id) {
      const [row] = await db.select().from(contents).where(and(inScope(scope), eq(contents.id, id))).limit(1);
      return row ? toContent(row) : null;
    },
    async findBySlug(scope, type, slug) {
      const [row] = await db
        .select()
        .from(contents)
        .where(and(inScope(scope), eq(contents.type, type), eq(contents.slug, slug)))
        .limit(1);
      return row ? toContent(row) : null;
    },
    async listByType(scope, type) {
      const rows = await db
        .select()
        .from(contents)
        .where(and(inScope(scope), eq(contents.type, type)))
        .orderBy(asc(contents.slug));
      return rows.map(toContent);
    },
    async listPublished(scope, type) {
      const rows = await db
        .select()
        .from(contents)
        .where(and(inScope(scope), eq(contents.type, type), eq(contents.status, 'published')))
        .orderBy(asc(contents.slug));
      return rows.map(toContent);
    },
    async findPublishedBySlug(scope, type, slug) {
      const [row] = await db
        .select()
        .from(contents)
        .where(and(inScope(scope), eq(contents.type, type), eq(contents.slug, slug), eq(contents.status, 'published')))
        .limit(1);
      return row ? toContent(row) : null;
    },
    async save(scope, content) {
      if (content.tenantId !== scope.tenantId || content.siteId !== scope.siteId) {
        throw new Error('Content does not belong to the given scope');
      }
      try {
        if ((await write(scope, content)) === 0) throw new ContentConflictError();
      } catch (error) {
        if (isUniqueViolation(error)) throw new SlugAlreadyInUseError(content.slug);
        throw error;
      }
    },
    async delete(scope, id, at) {
      await db
        .update(contents)
        .set({ deletedAt: at, updatedAt: at })
        .where(and(inScope(scope), eq(contents.id, id)));
    },
  };
}
