/**
 * Utilities for formatting Argentine Pesos (ARS) and numbers.
 */

export function formatARS(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0,00';
  }

  // Argentina format: thousands separated by '.', decimals separated by ','
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseARSInput(value: string): number {
  if (!value) return 0;
  // Replace comma with dot if user typed standard comma for decimals
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
