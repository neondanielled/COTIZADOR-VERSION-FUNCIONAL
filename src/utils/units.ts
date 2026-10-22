import { STANDARD_UNITS, StandardUnitOfMeasure } from '../types/material';

export function getUnitLabel(unit: StandardUnitOfMeasure, customUnitName?: string): string {
  if (unit === 'personalizada' && customUnitName) {
    return customUnitName;
  }
  const found = STANDARD_UNITS.find((u) => u.id === unit);
  return found ? found.label : unit;
}

export function getUnitAbbreviation(unit: StandardUnitOfMeasure, customUnitName?: string): string {
  if (unit === 'personalizada' && customUnitName) {
    return customUnitName;
  }
  const found = STANDARD_UNITS.find((u) => u.id === unit);
  return found ? found.abbreviation : unit;
}
