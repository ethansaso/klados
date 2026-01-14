export type ParsedNumeric =
  | { kind: "none" }
  | {
      kind: "single";
      value: number;
      /** raw text like "cm", "mm", "µm" */
      unitText?: string;
    }
  | {
      kind: "range";
      min: number;
      max: number;
      /** raw text like "cm", "mm", "µm" */
      unitText?: string;
    };

const DASH_REGEX = /[–—]/g; // en/em dash → "-"
const MICRO_REGEX = /[µμ]/g; // normalize micro symbols

/**
 * Try to interpret the query as numeric (single or range),
 * with an optional trailing unit token.
 *
 * Supported patterns:
 * * "10"
 * * "10.5"
 * * "7-9"
 * * "7 - 9"
 * * "7–9"
 * * "10 cm"
 * * "7-9 µm"
 */
export function parseNumericQuery(raw: string): ParsedNumeric {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "none" };

  const normalized = trimmed.replace(DASH_REGEX, "-");

  const parts = normalized.split(/\s+/);
  let unitText: string | undefined;
  let numericPart = normalized;

  const last = parts[parts.length - 1];
  if (parts.length > 1 && /[a-zA-Zµμ%]+/.test(last)) {
    unitText = last;
    numericPart = parts.slice(0, -1).join(" ");
  }

  const rangeMatch = numericPart.match(
    /^\s*([+-]?\d+(\.\d+)?)\s*-\s*([+-]?\d+(\.\d+)?)\s*$/
  );
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[3]);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return { kind: "range", min, max, unitText };
    }
  }

  const singleMatch = numericPart.match(/^[+-]?\d+(\.\d+)?$/);
  if (singleMatch) {
    const value = Number(singleMatch[0]);
    if (!Number.isNaN(value)) {
      return { kind: "single", value, unitText };
    }
  }

  return { kind: "none" };
}

/**
 * Normalize raw unit tokens to a canonical lookup string.
 * No DB validation happens here -- just string input normalization.
 *
 * Examples:
 *  - "µm" / "μm" / "um" / "micron(s)" -> "um"
 *  - "%" / "percent" -> "%"
 *  - "inches" -> "in"
 */
export function normalizeUnitToken(unitText?: string): string | null {
  if (!unitText) return null;

  const raw0 = unitText.trim().toLowerCase();
  if (!raw0) return null;

  // normalize micro characters
  const raw = raw0.replace(MICRO_REGEX, "u");

  switch (raw) {
    case "um":
    case "micron":
    case "microns":
      return "um";
    case "mm":
    case "cm":
    case "m":
      return raw;

    case "in":
    case "inch":
    case "inches":
      return "in";
    case "ft":
    case "foot":
    case "feet":
      return "ft";

    case "%":
    case "percent":
      return "%";

    case "count":
      return "count";

    default:
      // TODO: pass through things like "cm2", "mm3", "in²" if they begin seeing use. Keeping simple for now (1/14/26).
      return raw;
  }
}
