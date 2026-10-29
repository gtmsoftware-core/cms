import { and, desc, eq } from 'drizzle-orm';
import type { Media, MediaId, MediaRepository } from '@/domain/media';
import type { SiteScope } from '@/domain/sites';
import { tables, type Executor } from '@/infrastructure/db';

type MediaRow = typeof tables.media.$inferSelect;

const toMedia = (row: MediaRow): Media => ({
  id: row.id as MediaId,
  tenantId: row.tenantId as Media['tenantId'],
  siteId: row.siteId as Media['siteId'],
  storageKey: row.storageKey,
  mime: row.mime,
  size: row.size,
  alt: row.alt,
  filename: row.filename,
  createdAt: row.createdAt,
});

export function createDrizzleMediaRepository(db: Executor): MediaRepository {
  const { media } = tables;
  const inScope = (scope: SiteScope) => and(eq(media.tenantId, scope.tenantId), eq(media.siteId, scope.siteId));

  return {
    async findById(scope, id) {
      const [row] = await db.select().from(media).where(and(inScope(scope), eq(media.id, id))).limit(1);
      return row ? toMedia(row) : null;
    },
    async list(scope) {
      const rows = await db.select().from(media).where(inScope(scope)).orderBy(desc(media.createdAt));
      return rows.map(toMedia);
    },
    async save(scope, item) {
      if (item.tenantId !== scope.tenantId || item.siteId !== scope.siteId) {
        throw new Error('Media does not belong to the given scope');
      }
      await db.insert(media).values(item);
    },
    async delete(scope, id) {
      await db.delete(media).where(and(inScope(scope), eq(media.id, id)));
    },
  };
}
