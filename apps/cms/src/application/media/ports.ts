/** Where image files live: local disk in development, Cloudflare R2 in production. */
export interface MediaStorage {
  put(key: string, bytes: Uint8Array<ArrayBuffer>, mime: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Address the sites use to load the file. */
  publicUrl(key: string): string;
  /** Only storages served by the CMS itself (local disk) can read files back. */
  read?(key: string): Promise<Uint8Array<ArrayBuffer> | null>;
}
