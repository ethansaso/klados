import "dotenv/config";
import fs from "node:fs";
import { parseArgs } from "node:util";
import z from "zod";
import { db, pool } from "../db/client";
import { renderVariants } from "../src/lib/domain/media/renderVariants";
import { selectAllMedia, setMediaStorage } from "../src/lib/domain/media/repo";
import type { MediaDTO } from "../src/lib/domain/media/types";
import { storage } from "../src/lib/storage";
import { storageEnv } from "../src/lib/storage/env";
import { isVectorMedia } from "../src/lib/storage/mediaSizes";
import {
  extFromContentType,
  SUPPORTED_IMAGE_TYPES,
} from "../src/lib/storage/utils";
import { createRefetchTask } from "./media/refetchSources";
import { StopError } from "./media/stopError";
import type { Task } from "./media/task";
import { askYesNo } from "./utils/askYesNo";

/*
 * Converts media rows from the old single-file layout (`media/abc.jpg`) to
 * stored sizes (`media/abc/{size}.webp`): writes every size, then points the
 * row at the new base key and records its dimensions. Rows already converted
 * (dimensions set) are skipped, so the script is resumable.
 *
 * Old files are kept until `--delete-sources`, which deletes them for every
 * converted row. Nothing references them after conversion.
 *
 * `--refetch` replaces small iNat/Wikimedia copies with full-size files; see
 * ./media/refetchSources.ts.
 *
 *   npm run media:backfill -- [--dry-run] [--limit N] [--delete-sources | --refetch]
 */

type Options = {
  dryRun: boolean;
  limit: number | undefined;
  deleteSources: boolean;
  refetch: boolean;
};

/** Created in the working directory; delete it by hand if a crash leaves it. */
const LOCK_PATH = ".media-backfill.lock";

const CONVERT: Task = {
  question: "Write sizes and repoint these rows?",
  select: (rows) => rows.filter((row) => row.width === null),
  describe: (row) => `${row.storageKey} → ${baseKeyOf(row.storageKey)}`,
  apply: convertRow,
};

const DELETE_SOURCES: Task = {
  question: "Permanently delete these old files?",
  // SVGs are stored at their old key, so there's nothing to delete.
  select: (rows) =>
    rows.filter((row) => row.width !== null && !isVectorMedia(row)),
  describe: (row) => `delete ${sourceKeyOf(row)}`,
  apply: async (row) => {
    await storage.delete(sourceKeyOf(row));
    return `deleted ${sourceKeyOf(row)}`;
  },
};

const contentTypeSchema = z.enum(SUPPORTED_IMAGE_TYPES);

function parseOptions(): Options {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      limit: { type: "string" },
      "delete-sources": { type: "boolean", default: false },
      refetch: { type: "boolean", default: false },
    },
  });
  if (values["delete-sources"] && values.refetch) {
    throw new Error("Pass at most one of --delete-sources and --refetch.");
  }

  const limit = values.limit === undefined ? undefined : Number(values.limit);
  if (limit !== undefined && !(Number.isInteger(limit) && limit > 0)) {
    throw new Error(`--limit must be a positive integer, got ${values.limit}`);
  }
  return {
    dryRun: values["dry-run"],
    limit,
    deleteSources: values["delete-sources"],
    refetch: values.refetch,
  };
}

/** `media/abc.jpg` → `media/abc`. */
function baseKeyOf(storageKey: string): string {
  return storageKey.replace(/\.[^./]+$/, "");
}

/** A converted row's old single-file key, `media/abc` → `media/abc.jpg`. */
function sourceKeyOf(row: MediaDTO): string {
  const ext = extFromContentType(contentTypeSchema.parse(row.contentType));
  return `${row.storageKey}.${ext}`;
}

function describeTarget(): string {
  const url = new URL(
    process.env.DATABASE_URL || "postgres://127.0.0.1:5434/taxokeys",
  );
  return `database ${url.hostname}:${url.port}${url.pathname}, storage driver "${storageEnv.STORAGE_DRIVER}"`;
}

async function convertRow(row: MediaDTO): Promise<string> {
  const storageKey = baseKeyOf(row.storageKey);
  const rendered = await renderVariants({
    storageKey,
    contentType: row.contentType,
    body: await storage.download(row.storageKey),
  });

  await Promise.all(
    rendered.files
      // An SVG's stored key is its old key.
      .filter((file) => file.key !== row.storageKey)
      .map((file) =>
        storage.upload({
          key: file.key,
          body: file.body,
          contentType: file.contentType,
        }),
      ),
  );
  // Only after every file is written, so a failed row stays unconverted.
  await setMediaStorage(db, row.id, { ...rendered, storageKey });

  return `${rendered.width}x${rendered.height}, ${rendered.files.length} file(s)`;
}

async function run(task: Task, { dryRun, limit }: Options): Promise<boolean> {
  const pending = task.select(await selectAllMedia(db));
  const rows = pending.slice(0, limit);

  console.log(`Target: ${describeTarget()}`);
  console.log(`${pending.length} row(s) pending; processing ${rows.length}.`);
  if (rows.length === 0) return true;

  if (dryRun) {
    for (const row of rows) console.log(`  #${row.id} ${task.describe(row)}`);
    for (const line of (await task.summarize?.(rows)) ?? []) console.log(line);
    console.log("Dry run: no files were read or written, no rows updated.");
    return true;
  }

  if (!(await askYesNo(`${task.question} (y/N) `))) {
    console.log("Aborted.");
    return true;
  }
  await task.prepare?.(rows);

  const failures: string[] = [];
  let attempted = 0;
  for (const [i, row] of rows.entries()) {
    attempted++;
    const prefix = `[${i + 1}/${rows.length}] #${row.id} ${row.storageKey}`;
    try {
      console.log(`${prefix}: ${await task.apply(row)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`#${row.id} ${row.storageKey}: ${message}`);
      console.error(`${prefix}: FAILED ${message}`);
      if (err instanceof StopError) {
        console.error("Stopped the whole run.");
        break;
      }
    }
  }

  const notAttempted = rows.length - attempted;
  console.log(
    `Done: ${attempted - failures.length} succeeded, ${failures.length} failed` +
      (notAttempted ? `, ${notAttempted} not attempted.` : "."),
  );
  for (const failure of failures) console.error(`  ${failure}`);
  return failures.length === 0;
}

async function main() {
  const options = parseOptions();
  const task = options.refetch
    ? createRefetchTask()
    : options.deleteSources
      ? DELETE_SOURCES
      : CONVERT;

  let lock: number;
  try {
    lock = fs.openSync(LOCK_PATH, "wx");
  } catch {
    throw new Error(
      `${LOCK_PATH} exists: another backfill is running, or a previous one crashed (then delete it).`,
    );
  }

  try {
    const ok = await run(task, options);
    if (!ok) process.exitCode = 1;
  } finally {
    fs.closeSync(lock);
    fs.rmSync(LOCK_PATH);
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
