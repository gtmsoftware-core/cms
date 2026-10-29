import type { z } from 'zod';
import type { Page, SiteSettings } from './content-types';
import {
  API_VERSION,
  pageListResponseSchema,
  pageResponseSchema,
  settingsResponseSchema,
  type PageSummary,
} from './delivery';
import { tagsFor, type CmsResource } from './tags';

/** RequestInit plus the Next.js `next` option. Plain runtimes ignore it. */
type CmsFetchInit = RequestInit & { next?: { tags?: string[] } };

export type CmsFetch = (url: string, init: CmsFetchInit) => Promise<Response>;

export type CmsClientOptions = Readonly<{
  baseUrl: string;
  siteId: string;
  apiKey: string;
  /** Defaults to the global fetch. */
  fetch?: CmsFetch;
}>;

export class CmsApiError extends Error {
  override readonly name = 'CmsApiError';
  constructor(readonly status: number, path: string) {
    super(`CMS request failed with status ${status}: ${path}`);
  }
}

export type CmsClient = Readonly<{
  /** Site settings, or null while they were never saved. */
  getSettings(): Promise<SiteSettings | null>;
  /** Published pages only. */
  listPages(): Promise<PageSummary[]>;
  /** A published page, or null when it does not exist or is not published. */
  getPage(slug: string): Promise<Page | null>;
}>;

/**
 * Typed reader of the Content Delivery API. In Next.js the responses are cached with the tags from
 * `tagsFor`, so the webhook handler can revalidate exactly what changed.
 */
export function createCmsClient({ baseUrl, siteId, apiKey, fetch: doFetch = fetch }: CmsClientOptions): CmsClient {
  const root = `${baseUrl.replace(/\/+$/, '')}/api/${API_VERSION}/sites/${encodeURIComponent(siteId)}`;

  async function request<T>(path: string, schema: z.ZodType<T>, resource: CmsResource): Promise<T | null> {
    const response = await doFetch(`${root}${path}`, {
      headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json' },
      cache: 'force-cache',
      next: { tags: tagsFor(resource) },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new CmsApiError(response.status, path);
    return schema.parse(await response.json());
  }

  return {
    async getSettings() {
      const body = await request('/settings', settingsResponseSchema, { type: 'settings' });
      return body?.settings ?? null;
    },
    async listPages() {
      const body = await request('/pages', pageListResponseSchema, { type: 'page-list' });
      return body?.pages ?? [];
    },
    async getPage(slug) {
      const body = await request(`/pages/${encodeURIComponent(slug)}`, pageResponseSchema, { type: 'page', slug });
      return body?.page ?? null;
    },
  };
}
