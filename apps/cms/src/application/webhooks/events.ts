import { tagsFor, type CmsResource } from '@gtmsoftware-core/cms-sdk';
import type { Content } from '@/domain/content';
import type { Media } from '@/domain/media';
import type { SiteScope } from '@/domain/sites';
import { createOutboxEvent, type OutboxEvent, type OutboxEventId, type OutboxEventType } from '@/domain/webhooks';
import { newId } from '@/shared/ids';

type PageEventType = Extract<OutboxEventType, `content.${string}`>;

/**
 * Event for a page change. Tags cover the page list, the page itself and, after a slug change,
 * the old address too, so it stops serving stale content.
 */
export function pageEvent(type: PageEventType, page: Content, now: Date, previousSlug?: string): OutboxEvent {
  const resources: CmsResource[] = [{ type: 'page-list' }, { type: 'page', slug: page.slug }];
  if (previousSlug && previousSlug !== page.slug) resources.push({ type: 'page', slug: previousSlug });
  return createOutboxEvent({
    id: newId('evt') as OutboxEventId,
    scope: { tenantId: page.tenantId, siteId: page.siteId },
    type,
    payload: { contentType: 'page', id: page.id, slug: page.slug, tags: tagsFor(...resources) },
    now,
  });
}

export function settingsEvent(settings: Content, now: Date): OutboxEvent {
  return createOutboxEvent({
    id: newId('evt') as OutboxEventId,
    scope: { tenantId: settings.tenantId, siteId: settings.siteId },
    type: 'site.settings.updated',
    payload: { contentType: 'site-settings', id: settings.id, tags: tagsFor({ type: 'settings' }) },
    now,
  });
}

/** "Revalidar site inteiro": only the site-wide tag. */
export function siteRevalidatedEvent(scope: SiteScope, now: Date): OutboxEvent {
  return createOutboxEvent({
    id: newId('evt') as OutboxEventId,
    scope,
    type: 'site.revalidated',
    payload: { tags: tagsFor() },
    now,
  });
}

/** A deleted image may be used by any page or the settings, so the whole site is revalidated. */
export function mediaDeletedEvent(media: Media, now: Date): OutboxEvent {
  return createOutboxEvent({
    id: newId('evt') as OutboxEventId,
    scope: { tenantId: media.tenantId, siteId: media.siteId },
    type: 'media.deleted',
    payload: { id: media.id, tags: tagsFor() },
    now,
  });
}
