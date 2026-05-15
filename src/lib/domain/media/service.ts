import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../../../db/client";
import { storage } from "../../storage";
import { bulkInsertMedia, selectMediaByContentHashes } from "./repo";
import type { InsertMediaArgs, MediaDTO } from "./types";
import { extFromContentType } from "./utils";
import type { MediaMeta, SupportedImageType } from "./validation";

export type UploadMediaInput = MediaMeta & {
  body: Buffer;
  contentType: SupportedImageType;
  uploadedBy?: string;
};

/**
 * Uploads one or more media files, deduplicating by content hash. Process for each input item:
 *
 * 1) Computes a SHA-256 hash of the body
 * 2) If a media row with that hash already exists, return w/o insert
 * 3) Otherwise, upload to storage under UUID-based key and insert a new media row
 *
 * Guarantees order of items.
 */
export async function uploadMedia(
  inputs: UploadMediaInput[],
): Promise<MediaDTO[]> {
  if (inputs.length === 0) return [];

  const hashes = inputs.map((item) =>
    crypto.createHash("sha256").update(item.body).digest("hex"),
  );
  const existing = await selectMediaByContentHashes(hashes);

  // Determine which inputs are genuinely new.
  type NewItem = { index: number; hash: string; input: UploadMediaInput };
  const newItems: NewItem[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const hash = hashes[i]!;
    const input = inputs[i]!;
    if (!existing.has(hash)) {
      newItems.push({ index: i, hash, input });
    }
  }

  // Upload new files to storage and build insert args.
  const insertArgs: InsertMediaArgs[] = [];
  const storageKeys: string[] = [];

  await Promise.all(
    newItems.map(async ({ input, hash }) => {
      const ext = extFromContentType(input.contentType);
      const key = `media/${uuidv4()}.${ext}`;
      await storage.upload({
        key,
        body: input.body,
        contentType: input.contentType,
      });
      // Keep parallel-safe ordering by pushing after upload.
      insertArgs.push({
        storageKey: key,
        contentType: input.contentType,
        contentHash: hash,
        title: input.title,
        license: input.license,
        owner: input.owner,
        source: input.source,
        uploadedBy: input.uploadedBy,
      });
      storageKeys.push(key);
    }),
  );

  // Insert all new rows in one statement.
  const inserted = await db.transaction((tx) =>
    bulkInsertMedia(tx, insertArgs),
  );

  // Build a lookup of newly inserted rows by content hash.
  const insertedByHash = new Map<string, MediaDTO>(
    inserted.map((row) => [row.contentHash!, row]),
  );

  // Merge: return one MediaDTO per original input, in order.
  return hashes.map((hash) => {
    const row = existing.get(hash) ?? insertedByHash.get(hash);
    if (!row)
      throw new Error(`Media row missing for hash ${hash} after upload`);
    return row;
  });
}
