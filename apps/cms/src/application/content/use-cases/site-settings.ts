import {
  ContentConflictError,
  createContent,
  editContent,
  SITE_SETTINGS_SLUG,
  type ContentId,
  type ContentRepository,
} from '@/domain/content';
import type { Actor } from '@/domain/identity';
import { scopeOf, type SiteRepository } from '@/domain/sites';
import type { Clock } from '@/shared/clock';
import { newId } from '@/shared/ids';
import { authorizeSite } from '@/application/sites';
import { settingsEvent } from '@/application/webhooks';
import { defaultSiteSettings } from '../defaults';
import { toSiteSettings, type SiteSettingsDetail } from '../dto';
import type { UnitOfWork } from '../ports';
import { siteRefSchema, type SiteRef } from '../schemas/content-ref.schema';
import { saveSiteSettingsSchema, type SaveSiteSettingsInput } from '../schemas/site-settings.schema';

export type SiteSettingsDeps = Readonly<{ sites: SiteRepository; contents: ContentRepository; uow: UnitOfWork; clock: Clock }>;

export function makeGetSiteSettings({ sites, contents }: Pick<SiteSettingsDeps, 'sites' | 'contents'>) {
  return async function getSiteSettings(actor: Actor, input: SiteRef): Promise<SiteSettingsDetail> {
    const site = await authorizeSite(sites, actor, siteRefSchema.parse(input));
    const stored = await contents.findBySlug(scopeOf(site), 'site-settings', SITE_SETTINGS_SLUG);
    if (!stored) return { version: 0, settings: defaultSiteSettings(site.name) };
    return { version: stored.version, settings: toSiteSettings(stored) };
  };
}

/** Settings are always live: every save records `site.settings.updated` in the same transaction. */
export function makeSaveSiteSettings({ sites, uow, clock }: Omit<SiteSettingsDeps, 'contents'>) {
  return async function saveSiteSettings(actor: Actor, input: SaveSiteSettingsInput): Promise<SiteSettingsDetail> {
    const { version, settings, ...ref } = saveSiteSettingsSchema.parse(input);
    const scope = scopeOf(await authorizeSite(sites, actor, ref));
    const now = clock.now();

    const saved = await uow.transaction(async ({ contents, outbox }) => {
      const stored = await contents.findBySlug(scope, 'site-settings', SITE_SETTINGS_SLUG);
      if ((stored?.version ?? 0) !== version) throw new ContentConflictError();

      const next = stored
        ? editContent(stored, { slug: SITE_SETTINGS_SLUG, data: settings }, now)
        : createContent({
            id: newId('cnt') as ContentId,
            scope,
            type: 'site-settings',
            slug: SITE_SETTINGS_SLUG,
            status: 'published',
            data: settings,
            now,
          });
      await contents.save(scope, next);
      await outbox.add(scope, settingsEvent(next, now));
      return next;
    });
    return { version: saved.version, settings };
  };
}
