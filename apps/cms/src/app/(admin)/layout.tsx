import type { ReactNode } from 'react';
import { SignOutButton } from '@/presentation/identity';
import { AdminHeader } from '@/presentation/shell';
import { requireActor } from '../_server/session';
import { signOutAction } from './actions';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireActor();
  return (
    <>
      <AdminHeader>
        <SignOutButton action={signOutAction} />
      </AdminHeader>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">{children}</main>
    </>
  );
}
