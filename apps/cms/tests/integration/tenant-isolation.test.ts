import { beforeAll, describe, expect, it } from 'vitest';
import type { Container } from '@/composition/container';
import { ForbiddenError, type Actor, type UserId } from '@/domain/identity';
import { SiteNotFoundError, type SiteId } from '@/domain/sites';
import { TenantNotFoundError, type TenantId } from '@/domain/tenants';
import { createDrizzleSiteRepository } from '@/infrastructure/sites';
import { createTestContainer } from './database';

/**
 * Mandatory isolation tests (AGENTS.md §6.2): a user of tenant A never reaches tenant B data.
 * Runs against a real Postgres (PGlite) through the production composition.
 */
describe('tenant isolation', () => {
  let container: Container;
  let siteRepository: ReturnType<typeof createDrizzleSiteRepository>;
  let editorOfA: Actor;
  const ids = {} as Record<'tenantA' | 'tenantB' | 'siteA' | 'siteB', string>;

  beforeAll(async () => {
    const setup = await createTestContainer();
    container = setup.container;
    siteRepository = createDrizzleSiteRepository(setup.db);

    const rootId = await container.createSuperadmin({ email: 'root@cms.dev', name: 'Root', password: 'senha-do-root-123' });
    const root: Actor = { userId: rootId, isSuperadmin: true, memberships: [] };

    const tenantA = await container.createTenant(root, { name: 'Clínica A', slug: 'clinica-a' });
    const tenantB = await container.createTenant(root, { name: 'Oficina B', slug: 'oficina-b' });
    const siteA = await container.createSite(root, { tenantId: tenantA.id, name: 'Site A', primaryDomain: 'a.com.br' });
    const siteB = await container.createSite(root, { tenantId: tenantB.id, name: 'Site B', primaryDomain: '' });
    Object.assign(ids, { tenantA: tenantA.id, tenantB: tenantB.id, siteA: siteA.id, siteB: siteB.id });

    const member = await container.addMember(root, {
      tenantId: tenantA.id,
      email: 'editora@clinica-a.com',
      name: 'Editora A',
      role: 'editor',
      password: 'senha-da-editora-123',
    });
    editorOfA = {
      userId: member.userId as UserId,
      isSuperadmin: false,
      memberships: [{ userId: member.userId as UserId, tenantId: tenantA.id as TenantId, role: 'editor' }],
    };
  });

  it('lists only the tenants the user belongs to', async () => {
    const tenants = await container.listTenants(editorOfA);
    expect(tenants.map((t) => t.slug)).toEqual(['clinica-a']);
  });

  it('hides another tenant looked up by slug', async () => {
    await expect(container.getTenantBySlug(editorOfA, 'oficina-b')).rejects.toThrow(TenantNotFoundError);
  });

  it("does not list another tenant's sites or members", async () => {
    await expect(container.listSites(editorOfA, ids.tenantB)).rejects.toThrow(ForbiddenError);
    await expect(container.listMembers(editorOfA, ids.tenantB)).rejects.toThrow(ForbiddenError);
  });

  it("does not read another tenant's site, even mixing its own tenant id with a foreign site id", async () => {
    await expect(container.getSite(editorOfA, ids.tenantB, ids.siteB)).rejects.toThrow(SiteNotFoundError);
    await expect(container.getSite(editorOfA, ids.tenantA, ids.siteB)).rejects.toThrow(SiteNotFoundError);
    await expect(container.getSite(editorOfA, ids.tenantA, ids.siteA)).resolves.toMatchObject({ name: 'Site A' });
  });

  it('cannot create or change tenants, sites or members', async () => {
    await expect(container.createTenant(editorOfA, { name: 'Novo cliente', slug: 'novo-cliente' })).rejects.toThrow(ForbiddenError);
    await expect(
      container.createSite(editorOfA, { tenantId: ids.tenantB, name: 'Invasor', primaryDomain: '' }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      container.addMember(editorOfA, { tenantId: ids.tenantB, email: 'x@x.com', name: 'Invasor', role: 'owner', password: '' }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('scopes repository reads and writes by tenant and site', async () => {
    const foreignScope = { tenantId: ids.tenantA as TenantId, siteId: ids.siteB as SiteId };
    expect(await siteRepository.findById(foreignScope)).toBeNull();

    const siteB = await siteRepository.findById({ tenantId: ids.tenantB as TenantId, siteId: ids.siteB as SiteId });
    expect(siteB).not.toBeNull();
    await expect(siteRepository.save(foreignScope, { ...siteB!, name: 'Sequestrado' })).rejects.toThrow();
  });
});
