/** Each zoom-0 title covers 180° of longitude */
export const TILE_COLUMNS = [0, 1] as const;
/** Density renders distribution, basemap renders background */
const DENSITY_BASE = "https://api.gbif.org/v2/map/occurrence/density/0";
const CAPABILITIES_URL =
  "https://api.gbif.org/v2/map/occurrence/density/capabilities.json";
/** Larger means smaller hexes (more per tile) */
const HEX_PER_TILE = 60;
const USER_AGENT = "Klados/1.0 (https://klados.bio; admin@klados.bio)";
const REQUEST_TIMEOUT_MS = 15_000;

const requestInit = (): RequestInit => ({
  headers: { "User-Agent": USER_AGENT },
  signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
});

function densityTileUrl(gbifId: number, column: number): string {
  return (
    `${DENSITY_BASE}/${column}/0@2x.png?taxonKey=${gbifId}` +
    `&style=classic.poly&bin=hex&hexPerTile=${HEX_PER_TILE}&srs=EPSG:4326`
  );
}

/** Fetches singular image for GBIF density map. Call for each {@link TILE_COLUMNS}. */
export async function fetchDensityTile(
  gbifId: number,
  column: number,
): Promise<Buffer> {
  const res = await fetch(densityTileUrl(gbifId, column), requestInit());
  if (!res.ok) {
    throw new Error(`GBIF tile ${column} for ${gbifId}: HTTP ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/** Fetches simple count of occurences for a given GBIF taxon ID. Returns null if failed. */
export async function fetchOccurrenceTotal(
  gbifId: number,
): Promise<number | null> {
  try {
    const res = await fetch(
      `${CAPABILITIES_URL}?taxonKey=${gbifId}`,
      requestInit(),
    );
    if (!res.ok) return null;

    const body: unknown = await res.json();
    const total = (body as { total?: unknown }).total;
    return typeof total === "number" ? total : null;
  } catch {
    return null;
  }
}
