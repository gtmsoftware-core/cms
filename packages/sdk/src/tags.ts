export const CMS_TAGS = {
  site: () => 'cms:site',
  settings: () => 'cms:settings',
  pageList: () => 'cms:page:list',
  page: (slug: string) => `cms:page:${slug}`,
  collection: (name: string) => `cms:collection:${name}`,
} as const;

/** What a site reads from the CMS. Each resource maps to the cache tags it depends on. */
export type CmsResource =
  | Readonly<{ type: 'settings' }>
  | Readonly<{ type: 'page-list' }>
  | Readonly<{ type: 'page'; slug: string }>;

/**
 * The single source of cache tags. Sites tag their fetches with it and the CMS fills webhooks with it,
 * so both sides always agree. Every resource also carries the site-wide tag for a full revalidation.
 */
export function tagsFor(...resources: readonly CmsResource[]): string[] {
  const tags = new Set<string>([CMS_TAGS.site()]);
  for (const resource of resources) {
    if (resource.type === 'settings') tags.add(CMS_TAGS.settings());
    else if (resource.type === 'page-list') tags.add(CMS_TAGS.pageList());
    else tags.add(CMS_TAGS.page(resource.slug));
  }
  return [...tags];
}
