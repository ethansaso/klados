import fs from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter, UploadArgs } from "./storage";

const uploadDir = path.resolve("./uploads");

function assertSafeKey(key: string): void {
  const normalized = path.normalize(key);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
}

export class LocalStorage implements StorageAdapter {
  async upload({ key, body }: UploadArgs): Promise<{ url: string }> {
    assertSafeKey(key);
    const filePath = path.join(uploadDir, key);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);

    return {
      url: `/uploads/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await fs.rm(path.join(uploadDir, key), { force: true, recursive: false });
  }

  getUrl(key: string): string {
    assertSafeKey(key);
    return `/uploads/${key}`;
  }
}
