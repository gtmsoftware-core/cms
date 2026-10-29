/** The file storage (R2) refused or failed the operation; the detail goes to the server log only. */
export class MediaStorageError extends Error {
  override readonly name = 'MediaStorageError';
}
