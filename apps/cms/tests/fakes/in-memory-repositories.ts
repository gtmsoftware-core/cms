import type { UnitOfWork } from '@/application/content';
import type { UserAccounts } from '@/application/identity';
import {
  ContentConflictError,
  SlugAlreadyInUseError,
  type Content,
  type ContentRepository,
} from '@/domain/content';
import type { Actor, Membership, MembershipRepository, User, UserId, UserRepository } from '@/domain/identity';
import type { Site, SiteRepository } from '@/domain/sites';
import type { Tenant, TenantId, TenantRepository } from '@/domain/tenants';
import type { OutboxEvent, OutboxRepository } from '@/domain/webhooks';
import type { MediaRepository } from '@/domain/media';
import type { Clock } from '@/shared/clock';

export const fixedClock: Clock = { now: () => new Date('2026-01-01T00:00:00.000Z') };

export function inMemoryTenants(seed: Tenant[] = []): TenantRepository {
  const rows = new Map(seed.map((t) => [t.id, t]));
  return {
    findById: async (id) => rows.get(id) ?? null,
    findBySlug: async (slug) => [...rows.values()].find((t) => t.slug === slug) ?? null,
    listByIds: async (ids) => [...rows.values()].filter((t) => ids.includes(t.id)),
    listAll: async () => [...rows.values()],
    save: async (tenant) => void rows.set(tenant.id, tenant),
  };
}

export function inMemorySites(seed: Site[] = []): SiteRepository {
  const rows = new Map(seed.map((s) => [s.id, s]));
  return {
    findById: async ({ tenantId, siteId }) => {
      const site = rows.get(siteId);
      return site && site.tenantId === tenantId ? site : null;
    },
    listByTenant: async (tenantId) => [...rows.values()].filter((s) => s.tenantId === tenantId),
    findForApiKey: async (siteId) => rows.get(siteId) ?? null,
    save: async (_scope, site) => void rows.set(site.id, site),
  };
}

export function inMemoryIdentity(seedUsers: User[] = [], seedMemberships: Membership[] = []) {
  const users = new Map(seedUsers.map((u) => [u.id, u]));
  const memberships = [...seedMemberships];
  let sequence = 0;

  const userRepository: UserRepository = {
    findById: async (id) => users.get(id) ?? null,
    findByEmail: async (email) => [...users.values()].find((u) => u.email === email) ?? null,
  };
  const membershipRepository: MembershipRepository = {
    listByUser: async (userId) => memberships.filter((m) => m.userId === userId),
    listByTenant: async (tenantId) => memberships.filter((m) => m.tenantId === tenantId),
    save: async (membership) => {
      const index = memberships.findIndex((m) => m.userId === membership.userId && m.tenantId === membership.tenantId);
      if (index >= 0) memberships.splice(index, 1);
      memberships.push(membership);
    },
  };
  const accounts: UserAccounts = {
    register: async ({ email, name, isSuperadmin }) => {
      const id = `usr_fake${++sequence}` as UserId;
      users.set(id, { id, email, name, isSuperadmin });
      return id;
    },
  };
  return { users: userRepository, memberships: membershipRepository, accounts };
}

export const superadmin: Actor = { userId: 'usr_root' as UserId, isSuperadmin: true, memberships: [] };

export const editorOf = (tenantId: TenantId, userId = 'usr_editor'): Actor => ({
  userId: userId as UserId,
  isSuperadmin: false,
  memberships: [{ userId: userId as UserId, tenantId, role: 'editor' }],
});

export function inMemoryContents(): ContentRepository {
  const rows = new Map<string, Content & { deletedAt?: Date }>();
  const visible = (scope: { tenantId: string; siteId: string }) =>
    [...rows.values()].filter((c) => !c.deletedAt && c.tenantId === scope.tenantId && c.siteId === scope.siteId);

  return {
    findById: async (scope, id) => visible(scope).find((c) => c.id === id) ?? null,
    findBySlug: async (scope, type, slug) => visible(scope).find((c) => c.type === type && c.slug === slug) ?? null,
    listByType: async (scope, type) => visible(scope).filter((c) => c.type === type),
    listPublished: async (scope, type) => visible(scope).filter((c) => c.type === type && c.status === 'published'),
    findPublishedBySlug: async (scope, type, slug) =>
      visible(scope).find((c) => c.type === type && c.slug === slug && c.status === 'published') ?? null,
    save: async (scope, content) => {
      const stored = rows.get(content.id);
      if ((stored?.version ?? 0) !== content.version - 1) throw new ContentConflictError();
      const clash = visible(scope).find((c) => c.id !== content.id && c.type === content.type && c.slug === content.slug);
      if (clash) throw new SlugAlreadyInUseError(content.slug);
      rows.set(content.id, content);
    },
    delete: async (scope, id, at) => {
      const stored = visible(scope).find((c) => c.id === id);
      if (stored) rows.set(id, { ...stored, deletedAt: at });
    },
  };
}

/** Outbox kept in an array; `events` exposes what use cases recorded. */
export function inMemoryOutbox() {
  const events: OutboxEvent[] = [];
  const repository: OutboxRepository = {
    add: async (_scope, event) => void events.push(event),
    claimDue: async () => [],
    markDelivered: async () => undefined,
    recordFailure: async () => undefined,
    listFailed: async () => [],
    retryFailed: async () => 0,
  };
  return { events, repository };
}

/** No real transaction: enough for unit tests, where atomicity is covered by the integration tests. */
export const inMemoryUnitOfWork = (contents: ContentRepository, outbox: OutboxRepository): UnitOfWork => ({
  transaction: (work) => work({ contents, outbox, media: unusedMedia }),
});

const unused = () => Promise.reject(new Error('Media repository not used in this test'));
const unusedMedia: MediaRepository = { findById: unused, list: unused, save: unused, delete: unused };
