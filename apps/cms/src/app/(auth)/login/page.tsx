import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/presentation/identity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/ui';
import { getActor } from '../../_server/session';
import { signInAction } from './actions';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage() {
  if (await getActor()) redirect('/');

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar no painel</CardTitle>
          <CardDescription>Use o e-mail e a senha que você recebeu.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm action={signInAction} />
        </CardContent>
      </Card>
    </main>
  );
}
