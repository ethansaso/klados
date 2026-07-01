import { storageEnv } from "./env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { StorageAdapter } from "./storage";

export const storage: StorageAdapter =
  storageEnv.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
