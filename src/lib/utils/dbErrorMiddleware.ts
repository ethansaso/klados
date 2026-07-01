import { createMiddleware } from "@tanstack/react-start";

type PgDatabaseError = {
  code: string;
  message: string;
  detail?: string;
  constraint?: string;
};

function isPgDatabaseError(e: unknown): e is PgDatabaseError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as Record<string, unknown>).code === "string" &&
    /^[0-9A-Z]{5}$/.test((e as PgDatabaseError).code)
  );
}

// ? Drizzle wraps pg errors in its own "Failed query: ..." Error, preserving original as `cause`.
function extractPgError(e: unknown): PgDatabaseError | null {
  if (isPgDatabaseError(e)) return e;
  if (
    e instanceof Error &&
    isPgDatabaseError((e as unknown as { cause?: unknown }).cause)
  ) {
    return (e as unknown as { cause: PgDatabaseError }).cause;
  }
  return null;
}

const PG_ERROR_MESSAGES: Record<string, string> = {
  "23505": "An item with that value already exists.",
  "23503": "This action would violate a relationship constraint.",
  "23502": "A required field is missing a value.",
  "23514": "A value failed a check constraint.",
  "22001": "A value is too long for its field.",
  "42P01": "Database table not found.",
  "08006": "Database connection failure.",
  "40001": "Transaction conflict — please try again.",
  "40P01": "Deadlock detected — please try again.",
};

/**
 * TanStack Start middleware that intercepts Drizzle/pg errors and re-throws
 * them as plain Error instances with readable messages, so they survive the
 * server -> client RPC serialization boundary intact.
 */
export const dbErrorMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    try {
      return await next();
    } catch (e) {
      const pg = extractPgError(e);
      if (pg) {
        const friendly = PG_ERROR_MESSAGES[pg.code];
        if (friendly) throw new Error(friendly, { cause: e });
        // Unrecognized pg error: log full detail server-side, send nothing useful to the client.
        console.error("[db] Unhandled pg error", {
          code: pg.code,
          message: pg.message,
          detail: pg.detail,
        });
        throw new Error("An unexpected database error occurred.", { cause: e });
      }
      throw e;
    }
  },
);
