import type { Role } from '@/domain/identity';

export type MemberSummary = Readonly<{ userId: string; email: string; name: string; role: Role }>;
