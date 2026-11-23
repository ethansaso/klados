import type { MediaDTO } from "../../src/lib/domain/media/types";

/** One mode of the media backfill script. */
export type Task = {
  /** Shown before the y/N prompt. */
  question: string;
  /** Which rows the task applies to, oldest first. */
  select: (rows: MediaDTO[]) => MediaDTO[];
  /** Short dry-run description of what would happen to a row. */
  describe: (row: MediaDTO) => string;
  /** Extra dry-run lines about the selected rows as a whole. */
  summarize?: (rows: MediaDTO[]) => Promise<string[]>;
  /** Runs once after confirmation, before the first `apply`. */
  prepare?: (rows: MediaDTO[]) => Promise<void>;
  /** Does the work; returns a short log line. */
  apply: (row: MediaDTO) => Promise<string>;
};
