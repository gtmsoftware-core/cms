import { existsSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { GET as serveMedia } from '@/app/media/[...key]/route';
import type { Container } from '@/composition/container';
import { ForbiddenError, type Actor, type UserId } from '@/domain/identity';
import { MAX_MEDIA_BYTES, MediaNotFoundError, MediaTooLargeError, UnsafeSvgError, UnsupportedMediaTypeError } from '@/domain/media';
import { SiteNotFoundError } from '@/domain/sites';
import type { TenantId } from '@/domain/tenants';
import { createTestContainer } from './database';

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
const root: Actor = { userId: 'usr_root' as UserId, isSuperadmin: true, memberships: [] };

const keyOf = (url: string) => new URL(url).pathname.replace(/^\/media\//, '');
const serve = (key: string) => serveMedia(new Request('http://localhost/media'), { params: Promise.resolve({ key: key.split('/') }) });

/**
 * Media library: files under the tenant and site prefix, type judged by content, and the mandatory
 * isolation between tenants (AGENTS.md §6.2).
 */
describe('media', () => {
  let container: Container;
  let mediaDir: string;
  const ref = {} as Record<'a' | 'b', { tenantId: string; siteId: string }>;
  const editorOf = (key: 'a' | 'b'): Actor => {
    const userId = `usr_editor_${key}` as UserId;
    return { userId, isSuperadmin: false, memberships: [{ userId, tenantId: ref[key].tenantId as TenantId, role: 'editor' }] };
  };

  beforeEach(async () => {
    const setup = await createTestContainer();
    container = setup.container;
    mediaDir = setup.mediaDir;
    Object.assign(globalThis, { __cmsContainer: Promise.resolve(container) });
    for (const key of ['a', 'b'] as const) {
      const tenant = await container.createTenant(root, { name: `Cliente ${key}`, slug: `cliente-${key}` });
      const site = await container.createSite(root, { tenantId: tenant.id, name: `Site ${key}`, primaryDomain: '' });
      ref[key] = { tenantId: tenant.id, siteId: site.id };
    }
  });

  it('stores an upload under the tenant and site prefix and serves it locally', async () => {
    const uploaded = await container.uploadMedia(editorOf('a'), { ...ref.a, alt: 'Recepção', filename: 'foto.png', bytes: PNG });

    const key = keyOf(uploaded.url);
    expect(key).toMatch(new RegExp(`^${ref.a.tenantId}/${ref.a.siteId}/med_[0-9a-f]{32}\\.png$`));
    expect(uploaded).toMatchObject({ mime: 'image/png', size: PNG.byteLength, alt: 'Recepção', filename: 'foto.png' });
    expect(existsSync(path.join(mediaDir, key))).toBe(true);

    const response = await serve(key);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG);
  });

  it('judges the type by content and enforces the size limit', async () => {
    const pdf = new TextEncoder().encode('%PDF-1.7');
    await expect(container.uploadMedia(root, { ...ref.a, alt: '', filename: 'logo.png', bytes: pdf })).rejects.toThrow(
      UnsupportedMediaTypeError,
    );
    const svg = new TextEncoder().encode('<svg onload="alert(1)"></svg>');
    await expect(container.uploadMedia(root, { ...ref.a, alt: '', filename: 'logo.png', bytes: svg })).rejects.toThrow(UnsafeSvgError);
    const huge = new Uint8Array(MAX_MEDIA_BYTES + 1);
    huge.set(PNG);
    await expect(container.uploadMedia(root, { ...ref.a, alt: '', filename: 'big.png', bytes: huge })).rejects.toThrow(
      MediaTooLargeError,
    );
    expect(await container.listMedia(root, ref.a)).toEqual([]);
  });

  it('accepts a static SVG and serves it in a sandbox', async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><circle r="4" fill="#3ce11e"/></svg>');
    const uploaded = await container.uploadMedia(root, { ...ref.a, alt: 'Logo', filename: 'logo.svg', bytes: svg });

    expect(uploaded.mime).toBe('image/svg+xml');
    const response = await serve(keyOf(uploaded.url));
    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(response.headers.get('content-security-policy')).toContain('sandbox');
  });

  it('deletes the record and the file and records media.deleted for the whole site', async () => {
    const uploaded = await container.uploadMedia(root, { ...ref.a, alt: '', filename: 'foto.png', bytes: PNG });
    await container.deleteMedia(editorOf('a'), { ...ref.a, mediaId: uploaded.id });

    expect(await container.listMedia(root, ref.a)).toEqual([]);
    expect(existsSync(path.join(mediaDir, keyOf(uploaded.url)))).toBe(false);
    expect((await serve(keyOf(uploaded.url))).status).toBe(404);
    // No webhook configured: the event is consumed without sending, which proves it was recorded.
    expect(await container.dispatchDue()).toEqual({ delivered: 0, failed: 0, skipped: 1 });
  });

  it("keeps each tenant's library isolated", async () => {
    const ofB = await container.uploadMedia(editorOf('b'), { ...ref.b, alt: '', filename: 'b.png', bytes: PNG });
    const mixed = { tenantId: ref.a.tenantId, siteId: ref.b.siteId };

    await expect(container.listMedia(editorOf('a'), ref.b)).rejects.toThrow(ForbiddenError);
    await expect(container.listMedia(editorOf('a'), mixed)).rejects.toThrow(SiteNotFoundError);
    await expect(container.uploadMedia(editorOf('a'), { ...ref.b, alt: '', filename: 'x.png', bytes: PNG })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(container.deleteMedia(editorOf('a'), { ...ref.b, mediaId: ofB.id })).rejects.toThrow(ForbiddenError);
    await expect(container.deleteMedia(editorOf('a'), { ...ref.a, mediaId: ofB.id })).rejects.toThrow(MediaNotFoundError);

    expect((await container.listMedia(editorOf('b'), ref.b)).map((m) => m.id)).toEqual([ofB.id]);
  });

  it('refuses keys outside the generated format (path traversal)', async () => {
    for (const key of ['../../.env.local', `${ref.a.tenantId}/../secret.png`, 'drizzle/0000_init.sql', 'a.png']) {
      expect((await serve(key)).status).toBe(404);
    }
  });
});
