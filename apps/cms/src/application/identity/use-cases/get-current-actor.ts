import type { Actor, MembershipRepository, UserRepository } from '@/domain/identity';
import type { Authenticator } from '../ports';

export type GetCurrentActorDeps = Readonly<{
  authenticator: Authenticator;
  users: UserRepository;
  memberships: MembershipRepository;
}>;

export function makeGetCurrentActor({ authenticator, users, memberships }: GetCurrentActorDeps) {
  return async function getCurrentActor(): Promise<Actor | null> {
    const userId = await authenticator.currentUserId();
    const user = userId && (await users.findById(userId));
    if (!user) return null;
    return { userId: user.id, isSuperadmin: user.isSuperadmin, memberships: await memberships.listByUser(user.id) };
  };
}
