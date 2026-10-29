export type Brand<T, B extends string> = T & { readonly __brand: B };

export function newId<P extends string>(prefix: P): `${P}_${string}` {
  return `${prefix}_${globalThis.crypto.randomUUID().replaceAll('-', '')}`;
}
