import type { TenantId } from '@/domain/tenants';
import type { Brand } from '@/shared/ids';

export type UserId = Brand<string, 'UserId'>;

export type Role = 'owner' | 'editor';

export type User = Readonly<{
  id: UserId;
  email: string;
  name: string;
  isSuperadmin: boolean;
}>;

export type Membership = Readonly<{
  userId: UserId;
  tenantId: TenantId;
  role: Role;
}>;

/** Who is performing an action. Built once per request from the session. */
export type Actor = Readonly<{
  userId: UserId;
  isSuperadmin: boolean;
  memberships: readonly Membership[];
}>;
