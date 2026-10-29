/** Human readable size, e.g. "1,2 MB". */
export function formatBytes(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

/** Mirrors MAX_MEDIA_BYTES from the domain, to warn before uploading. The server checks again. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
