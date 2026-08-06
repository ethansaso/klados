import Decimal from "decimal.js";

/**
 * `scale` is the size of one display unit expressed in base units, so cm has a
 * scale of 0.01 against a metre base. Both directions follow from that.
 *
 * These were previously inverted. The round trip still produced the original
 * number, so displays looked correct, but stored values were not in a common
 * base: 5 cm stored as 500 while the identical 50 mm stored as 50000, making
 * any comparison between taxa recorded in different units wrong.
 */

/**
 * Convert a value from SI base units to display units.
 * Formula: displayValue = siValue / scale
 */
export function convertFromSI(siValue: number, scale?: string): number {
  const siDecimal = new Decimal(siValue);
  const scaleDecimal = new Decimal(scale ?? "1.0");
  return siDecimal.dividedBy(scaleDecimal).toNumber();
}

/**
 * Convert a value from display units to SI base units.
 * Formula: siValue = displayValue * scale
 */
export function convertToSI(displayValue: number, scale?: string): number {
  const displayDecimal = new Decimal(displayValue);
  const scaleDecimal = new Decimal(scale ?? "1.0");
  return displayDecimal.times(scaleDecimal).toNumber();
}
