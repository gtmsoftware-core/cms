import { describe, expect, it } from 'vitest';
import type { TenantId } from '@/domain/tenants';
import { assertCanAccessTenant, assertSuperadmin, canAccessTenant } from './authorization';
import type { Actor, UserId } from './entities';
import { ForbiddenError } from './errors';

const tenantA = 'tnt_a' as TenantId;
const tenantB = 'tnt_b' as TenantId;
const userId = 'usr_1' as UserId;
const editorOfA: Actor = { userId, isSuperadmin: false, memberships: [{ userId, tenantId: tenantA, role: 'editor' }] };
const root: Actor = { userId, isSuperadmin: true, memberships: [] };

describe('tenant authorization', () => {
  it('lets members access only their own tenant', () => {
    expect(canAccessTenant(editorOfA, tenantA)).toBe(true);
    expect(canAccessTenant(editorOfA, tenantB)).toBe(false);
    expect(() => assertCanAccessTenant(editorOfA, tenantB)).toThrow(ForbiddenError);
  });

  it('lets superadmins access any tenant', () => {
    expect(canAccessTenant(root, tenantB)).toBe(true);
  });

  it('restricts superadmin-only actions', () => {
    expect(() => assertSuperadmin(editorOfA)).toThrow(ForbiddenError);
    expect(() => assertSuperadmin(root)).not.toThrow();
  });
});
