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
      /** null when only an upper bound was given (e.g. "< 3 cm") */
      min: number | null;
      /** null when only a lower bound was given (e.g. "> 3 cm") */
      max: number | null;
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
 * * "10cm"
 * * "7-9µm"
 * * "<3", "< 3", "<=3", "<= 3 cm"  (upper-bound only)
 * * ">3", "> 3", ">=3", ">= 3 cm"  (lower-bound only)
 * * "≤3µm", "≥ 3 cm"               (unicode operators)
 */
export function parseNumericQuery(raw: string): ParsedNumeric {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "none" };

  const normalized = trimmed.replace(DASH_REGEX, "-");

  const parts = normalized.split(/\s+/);
  let unitText: string | undefined;
  let numericPart = normalized;

  // Check both that there are multiple parts and that the last part looks like a unit.
  // Require the token to START with a letter/% so "3cm" is never misidentified as a unit.
  const last = parts.at(-1);
  if (parts.length > 1 && last && /^[a-zA-Zµμ%]/.test(last)) {
    unitText = last;
    numericPart = parts.slice(0, -1).join(" ");
  }

  // Also handle units attached directly to numbers (e.g. "3-18cm", "42mm")
  if (!unitText) {
    const attachedMatch = numericPart.match(/^(.*\d)([a-zA-Zµμ%]+)$/);
    if (attachedMatch) {
      numericPart = attachedMatch[1]!.trim();
      unitText = attachedMatch[2];
    }
  }

  // One-sided bound: <3, <=3, >3, >=3, ≤3, ≥3 (with optional surrounding spaces)
  const boundMatch = numericPart.match(
    /^\s*(<=|>=|≤|≥|<|>)\s*([+-]?\d+(\.\d+)?)\s*$/,
  );
  if (boundMatch) {
    const op = boundMatch[1]!;
    const value = Number(boundMatch[2]);
    if (!Number.isNaN(value)) {
      const isUpper = op === "<" || op === "<=" || op === "≤";
      return {
        kind: "range",
        min: isUpper ? null : value,
        max: isUpper ? value : null,
        unitText,
      };
    }
  }

  const rangeMatch = numericPart.match(
    /^\s*([+-]?\d+(\.\d+)?)\s*-\s*([+-]?\d+(\.\d+)?)\s*$/,
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

  // Normalize micro characters (µ and μ)
  const raw = raw0.replace(MICRO_REGEX, "u");

  // Strip trailing 's' for plurals (but not for single-char units like "m")
  const singular = raw.length > 2 && raw.endsWith("s") ? raw.slice(0, -1) : raw;

  switch (singular) {
    // LENGTH
    case "nm":
    case "nanometer":
    case "nanometre":
      return "nm";

    case "u":
    case "um":
    case "micron":
    case "micrometer":
    case "micrometre":
      return "um";

    case "mm":
    case "millimeter":
    case "millimetre":
      return "mm";

    case "cm":
    case "centimeter":
    case "centimetre":
      return "cm";

    case "m":
    case "meter":
    case "metre":
      return "m";

    case "in":
    case "inch":
    case "inche": // "inches" -> "inche" after strip
      return "in";

    case "ft":
    case "foot":
    case "feet":
      return "ft";

    // AREA
    case "nm2":
    case "nm²":
      return "nm2";

    case "um2":
    case "um²":
      return "um2";

    case "mm2":
    case "mm²":
      return "mm2";

    case "cm2":
    case "cm²":
      return "cm2";

    case "m2":
    case "m²":
      return "m2";

    case "in2":
    case "in²":
      return "in2";

    case "ft2":
    case "ft²":
      return "ft2";

    // WEIGHT
    case "mg":
    case "milligram":
    case "milligramme":
      return "mg";

    case "g":
    case "gram":
    case "gramme":
      return "g";

    case "kg":
    case "kilogram":
    case "kilogramme":
      return "kg";

    case "lb":
    case "pound":
      return "lb";

    case "oz":
    case "ounce":
      return "oz";

    // ANGLE
    case "deg":
    case "degree":
    case "°":
      return "deg";

    // DIMENSIONLESS - no units, pass through for DB lookup
    default:
      return raw;
  }
}
