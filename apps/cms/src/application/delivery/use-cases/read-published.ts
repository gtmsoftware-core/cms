import {
  pageListResponseSchema,
  pageResponseSchema,
  settingsResponseSchema,
  type PageListResponse,
  type PageResponse,
  type SettingsResponse,
} from '@gtmsoftware-core/cms-sdk';
import { SITE_SETTINGS_SLUG, type ContentRepository } from '@/domain/content';
import { toPage, toSiteSettings } from '@/application/content';
import type { SiteScope } from '@/domain/sites';
import { DeliveryNotFoundError } from '../errors';

export type ReadPublishedDeps = Readonly<{ contents: ContentRepository }>;

/*
 * Read side of the Content Delivery API. The scope comes from authenticateSite, never from the request.
 * Responses are validated with the SDK schemas before they leave the CMS.
 */

export function makeListPublishedPages({ contents }: ReadPublishedDeps) {
  return async function listPublishedPages(scope: SiteScope): Promise<PageListResponse> {
    const pages = await contents.listPublished(scope, 'page');
    return pageListResponseSchema.parse({
      pages: pages.map((content) => ({
        slug: content.slug,
        title: toPage(content).title,
        updatedAt: content.updatedAt.toISOString(),
      })),
    });
  };
}

export function makeGetPublishedPage({ contents }: ReadPublishedDeps) {
  return async function getPublishedPage(scope: SiteScope, slug: string): Promise<PageResponse> {
    const content = await contents.findPublishedBySlug(scope, 'page', slug);
    if (!content) throw new DeliveryNotFoundError();
    return pageResponseSchema.parse({ page: toPage(content), updatedAt: content.updatedAt.toISOString() });
  };
}

export function makeGetPublishedSettings({ contents }: ReadPublishedDeps) {
  return async function getPublishedSettings(scope: SiteScope): Promise<SettingsResponse> {
    const content = await contents.findPublishedBySlug(scope, 'site-settings', SITE_SETTINGS_SLUG);
    if (!content) throw new DeliveryNotFoundError();
    return settingsResponseSchema.parse({ settings: toSiteSettings(content), updatedAt: content.updatedAt.toISOString() });
  };
}
