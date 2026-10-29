'use client';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/ui';

export const ROLE_LABELS = { owner: 'Responsável', editor: 'Editor' } as const;
type Role = keyof typeof ROLE_LABELS;

export function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="role">Papel</Label>
      <Select value={value} onValueChange={(next) => onChange(next === 'owner' ? 'owner' : 'editor')}>
        <SelectTrigger id="role" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <SelectItem key={role} value={role}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
