import crypto from "node:crypto";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { db } from "../../db/client";
import { renderVariants } from "../../src/lib/domain/media/renderVariants";
import {
  selectMediaByContentHashes,
  selectSourceInatIdsByMediaIds,
  setMediaStorage,
} from "../../src/lib/domain/media/repo";
import type { MediaDTO } from "../../src/lib/domain/media/types";
import {
  INAT_API_URL,
  INAT_OPEN_DATA_HOST,
  mediumToOpenDataOriginalUrl,
} from "../../src/lib/external/inat";
import {
  fetchWikimediaImportUrl,
  WIKIMEDIA_IMPORT_WIDTH,
} from "../../src/lib/external/wikimedia";
import { storage } from "../../src/lib/storage";
import { mediaVariantKeys } from "../../src/lib/storage/mediaSizes";
import { SUPPORTED_IMAGE_TYPES } from "../../src/lib/storage/utils";
import { StopError } from "./stopError";
import type { Task } from "./task";

/*
 * Replaces small imported copies (e.g. iNat's 500px `medium`) with the source's
 * full-size file, keeping the same media row. Follows iNaturalist's and
 * Wikimedia's published limits: see the KLADOS-170 notes for the rules.
 */

type Source =
  { kind: "inat"; photoId: number } | { kind: "wikimedia"; fileTitle: string };

type Ledger = z.infer<typeof ledgerSchema>;

const USER_AGENT = "Klados/1.0 (https://klados.bio)";
/** In the working directory; delete it to retry rows it records as handled. */
const LEDGER_PATH = ".media-refetch-ledger.json";
/** iNat's `original` long edge. */
const INAT_FULL_EDGE = 2048;
/** `/taxa/{ids}` accepts at most 30 IDs. */
const INAT_TAXA_PER_REQUEST = 30;
const API_GAP_MS = 1_000;
const DOWNLOAD_GAP_MS = 2_000;
const REQUEST_TIMEOUT_MS = 60_000;
const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;
/** Well under iNat's 5 GB/hour and 24 GB/day media limits. */
const HOURLY_BYTE_BUDGET = 1_000_000_000;
const DAILY_BYTE_BUDGET = 5_000_000_000;
/** Allowed aspect-ratio drift from rounding in our smaller copy. */
const ASPECT_TOLERANCE = 0.01;
/** Rough size of a 2048px JPEG, for dry-run estimates only. */
const ASSUMED_BYTES_PER_PHOTO = 1_000_000;
const INAT_PHOTO_SOURCE = /^https:\/\/www\.inaturalist\.org\/photos\/(\d+)$/;
const WIKIMEDIA_FILE_SOURCE =
  /^https:\/\/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)$/;

const ledgerSchema = z.object({
  /** Every download, for the rolling byte budget. */
  downloads: z.array(z.object({ at: z.number(), bytes: z.number() })),
  /** Finished rows by database, then media ID; re-runs skip these. */
  outcomes: z.record(z.string(), z.record(z.string(), z.string())),
});

const inatTaxaResponseSchema = z.object({
  results: z.array(
    z.object({
      taxon_photos: z
        .array(
          z.object({
            photo: z.object({ id: z.number(), medium_url: z.string() }),
          }),
        )
        .optional(),
    }),
  ),
});

const contentTypeSchema = z.enum(SUPPORTED_IMAGE_TYPES);
const pace = {
  api: createPacer(API_GAP_MS),
  download: createPacer(DOWNLOAD_GAP_MS),
};

export function createRefetchTask(): Task {
  const ledger = loadLedger();
  const outcomes = (ledger.outcomes[databaseTarget()] ??= {});
  // Filled by `prepare`: iNat photo ID → `medium_url`.
  const inatPhotoUrls = new Map<number, string>();
  let inatIdsByMedia = new Map<number, number[]>();

  const skip = (row: MediaDTO, reason: string) =>
    finish(ledger, outcomes, row, `skipped (${reason})`);

  return {
    question: "Re-fetch these photos from iNaturalist / Wikimedia?",
    select: (rows) =>
      rows.filter((row) => {
        const source = sourceOf(row);
        return (
          source &&
          Math.max(row.width, row.height) < fullEdgeOf(source) &&
          !(row.id in outcomes)
        );
      }),
    describe: (row) =>
      `${describeSource(sourceOf(row)!)}, now ${row.width}x${row.height}`,
    summarize: async (rows) => {
      const inatRows = rows.filter((r) => sourceOf(r)?.kind === "inat");
      const idsByMedia = await selectSourceInatIdsByMediaIds(
        db,
        inatRows.map((r) => r.id),
      );
      const taxa = new Set([...idsByMedia.values()].flat());
      const unlinked = inatRows.filter((r) => !idsByMedia.has(r.id)).length;
      const apiCalls =
        Math.ceil(taxa.size / INAT_TAXA_PER_REQUEST) +
        (rows.length - inatRows.length);
      return [
        `iNat: ${inatRows.length} row(s) across ${taxa.size} taxa; ${unlinked} have no linked taxon with an iNat ID and will be skipped.`,
        `Wikimedia: ${rows.length - inatRows.length} row(s).`,
        `Planned: ${apiCalls} API call(s), up to ${rows.length} download(s), roughly ${Math.round((rows.length * ASSUMED_BYTES_PER_PHOTO) / 1e6)} MB, at least ${Math.ceil((rows.length * DOWNLOAD_GAP_MS) / 60_000)} min.`,
      ];
    },
    prepare: async (rows) => {
      const inatRows = rows.filter((r) => sourceOf(r)?.kind === "inat");
      inatIdsByMedia = await selectSourceInatIdsByMediaIds(
        db,
        inatRows.map((r) => r.id),
      );
      const taxonIds = [...new Set([...inatIdsByMedia.values()].flat())];
      for (let i = 0; i < taxonIds.length; i += INAT_TAXA_PER_REQUEST) {
        const ids = taxonIds.slice(i, i + INAT_TAXA_PER_REQUEST);
        const res = await guardedFetch(
          `${INAT_API_URL}/taxa/${ids.join(",")}`,
          pace.api,
        );
        if (!res.ok) throw new StopError(`iNat taxa lookup: ${res.status}`);
        const { results } = inatTaxaResponseSchema.parse(await res.json());
        for (const { taxon_photos } of results) {
          for (const { photo } of taxon_photos ?? []) {
            inatPhotoUrls.set(photo.id, photo.medium_url);
          }
        }
      }
      console.log(
        `Looked up ${taxonIds.length} iNat taxa (${inatPhotoUrls.size} photos).`,
      );
    },
    apply: async (row) => {
      const source = sourceOf(row)!;

      let url: string;
      if (source.kind === "inat") {
        if (!inatIdsByMedia.has(row.id)) {
          return skip(row, "no linked taxon with an iNat ID");
        }
        const mediumUrl = inatPhotoUrls.get(source.photoId);
        if (!mediumUrl) return skip(row, "not among its taxa's iNat photos");
        const originalUrl = mediumToOpenDataOriginalUrl(mediumUrl);
        if (!originalUrl) {
          return skip(
            row,
            new URL(mediumUrl).hostname === INAT_OPEN_DATA_HOST
              ? `unrecognized photo URL ${mediumUrl}`
              : "not on the iNat Open Data host",
          );
        }
        url = originalUrl;
      } else {
        try {
          url = await fetchWikimediaImportUrl(source.fileTitle, (u) =>
            guardedFetch(u, pace.api),
          );
        } catch (err) {
          if (err instanceof StopError) throw err;
          return skip(row, err instanceof Error ? err.message : String(err));
        }
      }

      await waitForByteBudget(ledger);
      const res = await guardedFetch(url, pace.download);
      if (!res.ok) return skip(row, `download returned ${res.status}`);
      const contentType = contentTypeSchema.safeParse(
        res.headers.get("content-type")?.split(";")[0]?.trim(),
      );
      if (!contentType.success) return skip(row, "unsupported content type");
      const body = Buffer.from(await res.arrayBuffer());
      recordDownload(ledger, body.length);

      const contentHash = crypto
        .createHash("sha256")
        .update(body)
        .digest("hex");
      if (contentHash === row.contentHash) {
        return finish(ledger, outcomes, row, "unchanged");
      }
      const twin = (await selectMediaByContentHashes([contentHash])).get(
        contentHash,
      );
      if (twin) return skip(row, `same file as media #${twin.id}`);

      const storageKey = `media/${uuidv4()}`;
      const rendered = await renderVariants({
        storageKey,
        contentType: contentType.data,
        body,
      });
      const drift =
        Math.abs(row.width / row.height - rendered.width / rendered.height) /
        (rendered.width / rendered.height);
      if (drift > ASPECT_TOLERANCE) {
        return skip(
          row,
          `${rendered.width}x${rendered.height} doesn't match ${row.width}x${row.height}`,
        );
      }

      try {
        await Promise.all(
          rendered.files.map((file) =>
            storage.upload({
              key: file.key,
              body: file.body,
              contentType: file.contentType,
            }),
          ),
        );
        await setMediaStorage(db, row.id, {
          storageKey,
          width: rendered.width,
          height: rendered.height,
          contentHash,
        });
      } catch (err) {
        // Nothing points at the new files yet, so drop them.
        await deleteKeys(rendered.files.map((f) => f.key));
        throw err;
      }
      await deleteKeys(mediaVariantKeys(row));

      return finish(
        ledger,
        outcomes,
        row,
        `updated ${row.width}x${row.height} → ${rendered.width}x${rendered.height}`,
      );
    },
  };
}

function sourceOf(row: MediaDTO): Source | null {
  const inat = INAT_PHOTO_SOURCE.exec(row.source);
  if (inat) return { kind: "inat", photoId: Number(inat[1]) };
  const commons = WIKIMEDIA_FILE_SOURCE.exec(row.source);
  if (commons) {
    return { kind: "wikimedia", fileTitle: decodeURIComponent(commons[1]!) };
  }
  return null;
}

function fullEdgeOf(source: Source): number {
  return source.kind === "inat" ? INAT_FULL_EDGE : WIKIMEDIA_IMPORT_WIDTH;
}

function describeSource(source: Source): string {
  return source.kind === "inat"
    ? `iNat photo ${source.photoId}`
    : `Commons ${source.fileTitle}`;
}

/** Resolves once at least `gapMs` has passed since the previous call. */
function createPacer(gapMs: number): () => Promise<void> {
  let last = 0;
  return async () => {
    // Re-checked because timers can fire slightly early.
    let wait = last + gapMs - Date.now();
    while (wait > 0) {
      await sleep(wait);
      wait = last + gapMs - Date.now();
    }
    last = Date.now();
  };
}

/** ! Throws {@link StopError} on 429, 403, or 5xx, per both sites' policies. */
async function guardedFetch(
  url: string,
  pacer: () => Promise<void>,
): Promise<Response> {
  await pacer();
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 429 || res.status === 403 || res.status >= 500) {
    throw new StopError(
      `${res.status} from ${new URL(url).host}; stopping without retrying.`,
    );
  }
  return res;
}

async function waitForByteBudget(ledger: Ledger): Promise<void> {
  for (;;) {
    const now = Date.now();
    const lastHour = ledger.downloads.filter((d) => now - d.at < HOUR_MS);
    const lastDay = ledger.downloads.filter((d) => now - d.at < DAY_MS);
    const resumeAt =
      totalBytes(lastHour) >= HOURLY_BYTE_BUDGET
        ? lastHour[0]!.at + HOUR_MS
        : totalBytes(lastDay) >= DAILY_BYTE_BUDGET
          ? lastDay[0]!.at + DAY_MS
          : null;
    if (resumeAt === null) return;
    console.log(
      `Byte budget reached; pausing until ${new Date(resumeAt).toLocaleTimeString()}.`,
    );
    await sleep(resumeAt - now);
  }
}

function totalBytes(downloads: Ledger["downloads"]): number {
  return downloads.reduce((sum, d) => sum + d.bytes, 0);
}

function recordDownload(ledger: Ledger, bytes: number): void {
  const now = Date.now();
  ledger.downloads = ledger.downloads.filter((d) => now - d.at < DAY_MS);
  ledger.downloads.push({ at: now, bytes });
  saveLedger(ledger);
}

function finish(
  ledger: Ledger,
  outcomes: Record<string, string>,
  row: MediaDTO,
  outcome: string,
): string {
  outcomes[row.id] = outcome;
  saveLedger(ledger);
  return outcome;
}

/** Outcomes are per database, so a local test run can't hide prod rows. */
function databaseTarget(): string {
  const url = new URL(
    process.env.DATABASE_URL || "postgres://127.0.0.1:5434/taxokeys",
  );
  return `${url.hostname}:${url.port}${url.pathname}`;
}

function loadLedger(): Ledger {
  if (!fs.existsSync(LEDGER_PATH)) return { downloads: [], outcomes: {} };
  return ledgerSchema.parse(JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8")));
}

function saveLedger(ledger: Ledger): void {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger));
}

/** Best effort: leftovers are unreferenced files, not broken rows. */
async function deleteKeys(keys: string[]): Promise<void> {
  const results = await Promise.allSettled(keys.map((k) => storage.delete(k)));
  for (const [i, r] of results.entries()) {
    if (r.status === "rejected") console.warn(`  couldn't delete ${keys[i]}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
