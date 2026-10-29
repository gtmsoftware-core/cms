'use client';

import { useTransition } from 'react';
import { Button } from '@/presentation/ui';

export function SignOutButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(action)}>
      Sair
    </Button>
  );
}
