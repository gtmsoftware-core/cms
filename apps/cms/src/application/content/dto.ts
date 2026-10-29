import { pageSchema, siteSettingsSchema, type Page, type SiteSettings } from '@gtmsoftware-core/cms-sdk';
import type { Content, ContentStatus } from '@/domain/content';

export type PageSummary = Readonly<{
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  updatedAt: Date;
  publishedAt: Date | null;
}>;

export type PageDetail = Readonly<{
  id: string;
  status: ContentStatus;
  version: number;
  updatedAt: Date;
  publishedAt: Date | null;
  page: Page;
}>;

export type SiteSettingsDetail = Readonly<{
  /** 0 while the settings were never saved. */
  version: number;
  settings: SiteSettings;
}>;

/** The slug lives in its own column; the stored data holds the rest of the page. */
export const toPageData = ({ title, seo, blocks }: Page) => ({ title, seo, blocks });

/** Stored JSON is validated again on the way out, so the editor never receives malformed data. */
export const toPage = (content: Content): Page => pageSchema.parse({ ...content.data, slug: content.slug });

export const toPageSummary = (content: Content): PageSummary => ({
  id: content.id,
  title: toPage(content).title,
  slug: content.slug,
  status: content.status,
  updatedAt: content.updatedAt,
  publishedAt: content.publishedAt,
});

export const toPageDetail = (content: Content): PageDetail => ({
  id: content.id,
  status: content.status,
  version: content.version,
  updatedAt: content.updatedAt,
  publishedAt: content.publishedAt,
  page: toPage(content),
});

export const toSiteSettings = (content: Content): SiteSettings => siteSettingsSchema.parse(content.data);
