import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { getContainer } from '@/composition/container';

/** Current actor, resolved once per request. Always dynamic: never touches the database at build time. */
export const getActor = cache(async () => {
  await connection();
  return (await getContainer()).getCurrentActor();
});

export async function requireActor() {
  const actor = await getActor();
  if (!actor) redirect('/login');
  return actor;
}
