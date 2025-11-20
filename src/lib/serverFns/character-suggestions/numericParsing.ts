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

  // Normalize dash characters.
  const normalized = trimmed.replace(DASH_REGEX, "-");

  // Split on whitespace to peel off an optional unit token.
  const parts = normalized.split(/\s+/);
  let unitText: string | undefined;
  let numericPart = normalized;

  // If last token has letters (incl. µ), treat as unit text.
  const last = parts[parts.length - 1];
  if (parts.length > 1 && /[a-zA-Zµμ%]+/.test(last)) {
    unitText = last;
    numericPart = parts.slice(0, -1).join(" ");
  }

  // Try a range: "a-b" or "a - b"
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

  // Try a single number: "a"
  const singleMatch = numericPart.match(/^[+-]?\d+(\.\d+)?$/);
  if (singleMatch) {
    const value = Number(singleMatch[0]);
    if (!Number.isNaN(value)) {
      return { kind: "single", value, unitText };
    }
  }

  // Not a numeric-ish query.
  return { kind: "none" };
}

/**
 * Naively maps raw unit text from the query to a canonical unit label.
 * String-based, case insensitive.
 */
export function resolveRequestedUnit(unitText?: string): string | null {
  if (!unitText) return null;
  const raw = unitText.trim().toLowerCase();

  switch (raw) {
    case "um":
    case "µm":
    case "micron":
    case "microns":
      return "um";
    case "mm":
      return "mm";
    case "cm":
      return "cm";
    case "m":
      return "m";
    case "count":
      return "count";
    case "%":
    case "percent":
      return "percent";
    default:
      return null;
  }
}
