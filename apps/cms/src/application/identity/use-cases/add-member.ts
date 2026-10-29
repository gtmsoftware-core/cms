import { assertSuperadmin, type Actor, type MembershipRepository, type UserRepository } from '@/domain/identity';
import { TenantNotFoundError, type TenantId, type TenantRepository } from '@/domain/tenants';
import type { MemberSummary } from '../dto';
import { PasswordRequiredError } from '../errors';
import type { UserAccounts } from '../ports';
import { addMemberSchema, type AddMemberInput } from '../schemas/add-member.schema';

export type AddMemberDeps = Readonly<{
  tenants: TenantRepository;
  users: UserRepository;
  memberships: MembershipRepository;
  accounts: UserAccounts;
}>;

export function makeAddMember({ tenants, users, memberships, accounts }: AddMemberDeps) {
  return async function addMember(actor: Actor, input: AddMemberInput): Promise<MemberSummary> {
    const data = addMemberSchema.parse(input);
    assertSuperadmin(actor);

    const tenant = await tenants.findById(data.tenantId as TenantId);
    if (!tenant) throw new TenantNotFoundError();

    const existing = await users.findByEmail(data.email);
    if (!existing && data.password === '') throw new PasswordRequiredError();
    const userId =
      existing?.id ??
      (await accounts.register({ email: data.email, name: data.name, password: data.password, isSuperadmin: false }));

    await memberships.save({ userId, tenantId: tenant.id, role: data.role });
    return { userId, email: data.email, name: existing?.name ?? data.name, role: data.role };
  };
}
