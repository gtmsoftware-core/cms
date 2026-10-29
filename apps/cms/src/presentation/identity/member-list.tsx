import type { MemberSummary } from '@/application/identity';
import { ROLE_LABELS } from './role-select';

export function MemberList({ members }: { members: readonly MemberSummary[] }) {
  if (members.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma pessoa com acesso ainda.</p>;
  }
  return (
    <ul className="divide-y">
      {members.map((member) => (
        <li key={member.userId} className="flex items-center justify-between py-3 text-sm">
          <span>
            <span className="font-medium">{member.name}</span>
            <span className="text-muted-foreground block">{member.email}</span>
          </span>
          <span className="text-muted-foreground">{ROLE_LABELS[member.role]}</span>
        </li>
      ))}
    </ul>
  );
}
