import type { SiteScope } from '@/domain/sites';
import type { Brand } from '@/shared/ids';

export type ContentId = Brand<string, 'ContentId'>;

export type ContentType = 'page' | 'site-settings';

export type ContentStatus = 'draft' | 'published';

/** Block data validated by the application against the SDK schemas. The domain treats it as opaque. */
export type ContentData = Readonly<Record<string, unknown>>;

export type Content = Readonly<{
  id: ContentId;
  tenantId: SiteScope['tenantId'];
  siteId: SiteScope['siteId'];
  type: ContentType;
  slug: string;
  status: ContentStatus;
  data: ContentData;
  /** Incremented on every change; used for optimistic concurrency. */
  version: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

/** The site settings singleton is stored with this fixed slug. */
export const SITE_SETTINGS_SLUG = 'site-settings';

export type NewContent = Readonly<{
  id: ContentId;
  scope: SiteScope;
  type: ContentType;
  slug: string;
  data: ContentData;
  status: ContentStatus;
  now: Date;
}>;

export function createContent({ id, scope, type, slug, data, status, now }: NewContent): Content {
  return {
    id,
    tenantId: scope.tenantId,
    siteId: scope.siteId,
    type,
    slug,
    status,
    data,
    version: 1,
    publishedAt: status === 'published' ? now : null,
    createdAt: now,
    updatedAt: now,
  };
}

const nextVersion = (content: Content, now: Date) => ({ version: content.version + 1, updatedAt: now });

export function editContent(content: Content, changes: Readonly<{ slug: string; data: ContentData }>, now: Date): Content {
  return { ...content, ...changes, ...nextVersion(content, now) };
}

export function publishContent(content: Content, now: Date): Content {
  return { ...content, status: 'published', publishedAt: now, ...nextVersion(content, now) };
}

export function unpublishContent(content: Content, now: Date): Content {
  return { ...content, status: 'draft', publishedAt: null, ...nextVersion(content, now) };
}

/** Saving published content changes what the public sees right away. */
export const isLive = (content: Content): boolean => content.status === 'published';
