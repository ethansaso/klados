/** Unset in local development, which leaves Sentry disabled. */
export const sentryDSN = import.meta.env.VITE_SENTRY_DSN;

/** Envelope endpoint for {@link sentryDSN}, used by the /monitoring tunnel. */
export const sentryIngestURL = sentryDSN ? toIngestURL(sentryDSN) : undefined;

/** `https://<key>@<host>/<project>` → `https://<host>/api/<project>/envelope/` */
function toIngestURL(dsn: string): string {
  const { protocol, host, pathname } = new URL(dsn);
  return `${protocol}//${host}/api${pathname}/envelope/`;
}
