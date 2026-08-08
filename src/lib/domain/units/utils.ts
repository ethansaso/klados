import Decimal from "decimal.js";
import type { CharacterUnitRequirement } from "./types";

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

/** Whether a numeric filter token names a unit its character can be measured in. */
export function unitFitsCharacter(
  unitId: number | undefined,
  unitFamilyId: number | undefined,
  /** 'undefined' is a fast-fail shortcut. */
  requirement: CharacterUnitRequirement | undefined,
): boolean {
  if (requirement === undefined) return false;

  if (!requirement.requiresUnit) return unitId === undefined;
  return (
    unitFamilyId !== undefined && unitFamilyId === requirement.unitFamilyId
  );
}
