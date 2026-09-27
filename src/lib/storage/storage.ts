export interface UploadArgs {
  key: string;
  body: Buffer;
  contentType: string;
  /** Passed through as Cache-Control header. */
  cacheControl?: string;
}

export interface StorageAdapter {
  upload(args: UploadArgs): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
