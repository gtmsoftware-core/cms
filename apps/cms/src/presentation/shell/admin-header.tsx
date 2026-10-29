import Link from 'next/link';
import type { ReactNode } from 'react';

export function AdminHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Painel
        </Link>
        {children}
      </div>
    </header>
  );
}
