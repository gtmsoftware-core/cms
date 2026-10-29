const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Reads string fields of an optional group (image, link) from an untyped form value. */
export function readGroup<K extends string>(value: unknown, keys: readonly K[]): Record<K, string> {
  const source = isRecord(value) ? value : {};
  const entries = keys.map((key) => [key, typeof source[key] === 'string' ? source[key] : '']);
  return Object.fromEntries(entries);
}

/** An optional group with every field empty is stored as null. */
export function toOptionalGroup<T extends Record<string, string>>(group: T): T | null {
  return Object.values(group).every((field) => field === '') ? null : group;
}
