export interface UploadArgs {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StorageAdapter {
  upload(args: UploadArgs): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
