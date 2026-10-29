import type { TenantId } from '@/domain/tenants';
import type { Membership, User, UserId } from './entities';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface MembershipRepository {
  listByUser(userId: UserId): Promise<Membership[]>;
  listByTenant(tenantId: TenantId): Promise<Membership[]>;
  save(membership: Membership): Promise<void>;
}
