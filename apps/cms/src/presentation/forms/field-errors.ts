import { get, type FieldErrors } from 'react-hook-form';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

function messageOf(value: unknown): string | undefined {
  return isRecord(value) && typeof value['message'] === 'string' ? value['message'] : undefined;
}

/** Error message at a dotted path such as `blocks.0.heading`. */
export function errorAt(errors: FieldErrors, path: string): string | undefined {
  return messageOf(get(errors, path));
}

/** Error of an array itself (for example "add at least one item"), not of its items. */
export function arrayErrorAt(errors: FieldErrors, path: string): string | undefined {
  const value: unknown = get(errors, path);
  return messageOf(isRecord(value) ? value['root'] : undefined) ?? messageOf(value);
}

/** Whether anything below the path failed validation (useful for nested JSON such as rich text). */
export function hasErrorAt(errors: FieldErrors, path: string): boolean {
  return get(errors, path) !== undefined;
}
