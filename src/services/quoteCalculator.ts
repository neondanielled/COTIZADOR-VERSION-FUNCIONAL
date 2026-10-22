import { Material } from '../types/material';
import {
  QuoteFormData,
  QuoteCalculationResult,
  MaterialCostDetail,
} from '../types/quote';

/**
 * Pure calculation service for Cotizador Neón.
 * Centralizes all mathematical and business rules without UI coupling.
 */
export function calculateQuote(
  form: QuoteFormData,
  materialsList: Material[]
): QuoteCalculationResult {
  const materialsMap = new Map<string, Material>(materialsList.map((m) => [m.id, m]));
  const warnings: string[] = [];

  // 1. Dimensiones y Superficie de Acrílico
  const widthCm = typeof form.widthCm === 'number' && form.widthCm > 0 ? form.widthCm : 0;
  const heightCm = typeof form.heightCm === 'number' && form.heightCm > 0 ? form.heightCm : 0;
  const isValidDimensions = widthCm > 0 && heightCm > 0;

  // Fórmula geométrica: (ancho en cm / 100) * (alto en cm / 100)
  const acrylicAreaM2 = isValidDimensions ? (widthCm / 100) * (heightCm / 100) : 0;

  // 2. Costo de Neón
  let neonDetail: MaterialCostDetail | null = null;
  let neonCost = 0;
  const neonMeters = typeof form.neonMeters === 'number' && form.neonMeters > 0 ? form.neonMeters : 0;

  if (form.neonMaterialId) {
    const neonMat = materialsMap.get(form.neonMaterialId);
    if (!neonMat) {
      warnings.push('El material de neón seleccionado ya no existe en el catálogo.');
      neonDetail = {
        materialId: form.neonMaterialId,
        name: 'Material no encontrado',
        unit: 'm',
        unitPrice: 0,
        quantity: neonMeters,
        subtotal: 0,
        isAvailable: false,
        warning: 'Material eliminado o no disponible',
      };
    } else {
      if (!neonMat.isActive) {
        warnings.push(`El material de neón "${neonMat.name}" está inactivo.`);
      }
      neonCost = neonMeters * neonMat.price;
      neonDetail = {
        materialId: neonMat.id,
        name: neonMat.name,
        unit: 'm',
        unitPrice: neonMat.price,
        quantity: neonMeters,
        subtotal: neonCost,
        isAvailable: neonMat.isActive,
        warning: !neonMat.isActive ? 'Material inactivo' : undefined,
      };
    }
  }

  // 3. Costo de Acrílico
  let acrylicDetail: MaterialCostDetail | null = null;
  let acrylicCost = 0;

  if (form.hasAcrylic && form.acrylicMaterialId && isValidDimensions) {
    const acrylicMat = materialsMap.get(form.acrylicMaterialId);
    if (!acrylicMat) {
      warnings.push('El acrílico seleccionado ya no existe en el catálogo.');
      acrylicDetail = {
        materialId: form.acrylicMaterialId,
        name: 'Acrílico no encontrado',
        unit: 'm²',
        unitPrice: 0,
        quantity: acrylicAreaM2,
        subtotal: 0,
        isAvailable: false,
        warning: 'Material eliminado o no disponible',
      };
    } else {
      if (!acrylicMat.isActive) {
        warnings.push(`El acrílico "${acrylicMat.name}" está inactivo.`);
      }
      acrylicCost = acrylicAreaM2 * acrylicMat.price;
      acrylicDetail = {
        materialId: acrylicMat.id,
        name: acrylicMat.name,
        unit: 'm²',
        unitPrice: acrylicMat.price,
        quantity: acrylicAreaM2,
        subtotal: acrylicCost,
        isAvailable: acrylicMat.isActive,
        warning: !acrylicMat.isActive ? 'Material inactivo' : undefined,
      };
    }
  }

  // 4. Costo de Fuentes de Alimentación
  const powerSuppliesDetail: MaterialCostDetail[] = [];
  let powerSuppliesCost = 0;

  for (const item of form.powerSupplies) {
    if (!item.materialId || item.quantity <= 0) continue;
    const mat = materialsMap.get(item.materialId);
    if (!mat) {
      warnings.push('Una de las fuentes seleccionadas ya no existe en el catálogo.');
      powerSuppliesDetail.push({
        materialId: item.materialId,
        name: 'Fuente no encontrada',
        unit: 'u',
        unitPrice: 0,
        quantity: item.quantity,
        subtotal: 0,
        isAvailable: false,
        warning: 'Fuente eliminada',
      });
    } else {
      if (!mat.isActive) {
        warnings.push(`La fuente "${mat.name}" está inactiva.`);
      }
      const subtotal = item.quantity * mat.price;
      powerSuppliesCost += subtotal;
      powerSuppliesDetail.push({
        materialId: mat.id,
        name: mat.name,
        unit: 'u',
        unitPrice: mat.price,
        quantity: item.quantity,
        subtotal,
        isAvailable: mat.isActive,
        warning: !mat.isActive ? 'Inactiva' : undefined,
      });
    }
  }

  // 5. Costo de Insumos Detallados
  const suppliesDetail: MaterialCostDetail[] = [];
  let suppliesCost = 0;

  for (const item of form.supplies) {
    if (!item.materialId || item.quantity <= 0) continue;
    const mat = materialsMap.get(item.materialId);
    if (!mat) {
      warnings.push('Uno de los insumos seleccionados ya no existe en el catálogo.');
      suppliesDetail.push({
        materialId: item.materialId,
        name: 'Insumo no encontrado',
        unit: 'u',
        unitPrice: 0,
        quantity: item.quantity,
        subtotal: 0,
        isAvailable: false,
        warning: 'Insumo eliminado',
      });
    } else {
      if (!mat.isActive) {
        warnings.push(`El insumo "${mat.name}" está inactivo.`);
      }
      const subtotal = item.quantity * mat.price;
      suppliesCost += subtotal;
      suppliesDetail.push({
        materialId: mat.id,
        name: mat.name,
        unit: mat.unit,
        unitPrice: mat.price,
        quantity: item.quantity,
        subtotal,
        isAvailable: mat.isActive,
        warning: !mat.isActive ? 'Inactivo' : undefined,
      });
    }
  }

  // M = Subtotal de materiales
  const materialsSubtotal = neonCost + acrylicCost + powerSuppliesCost + suppliesCost;

  // 6. Mano de Obra (MO)
  const laborPercentage =
    typeof form.laborPercentage === 'number' && form.laborPercentage >= 0
      ? form.laborPercentage
      : 0;
  const laborCost = materialsSubtotal * (laborPercentage / 100);

  // 7. Estructura (E)
  const structureCost =
    typeof form.structureCost === 'number' && form.structureCost > 0
      ? form.structureCost
      : 0;

  // 8. Insumos Fijos del Taller y Otros Costos (I)
  const fixedWorkshopCost =
    typeof form.fixedWorkshopCost === 'number' && form.fixedWorkshopCost > 0
      ? form.fixedWorkshopCost
      : 0;

  const additionalCostsTotal = form.additionalCosts.reduce((acc, item) => {
    return acc + (item.amount > 0 ? item.amount : 0);
  }, 0);

  const otherCostsTotal = fixedWorkshopCost + additionalCostsTotal;

  // Costo Base = M + MO + E + I
  const baseCost = materialsSubtotal + laborCost + structureCost + otherCostsTotal;

  // 9. Multiplicador de Ganancia (K)
  const multiplier = form.multiplier > 0 ? form.multiplier : 2;
  const sellingPriceBeforeShipping = baseCost * multiplier;
  const monetaryMargin = sellingPriceBeforeShipping - baseCost;

  // 10. Envío (ENV) y Precio Final al Cliente
  const shippingCost =
    typeof form.shippingCost === 'number' && form.shippingCost > 0
      ? form.shippingCost
      : 0;
  const finalPrice = sellingPriceBeforeShipping + shippingCost;

  return {
    widthCm,
    heightCm,
    acrylicAreaM2,
    neonDetail,
    acrylicDetail,
    powerSuppliesDetail,
    suppliesDetail,
    neonCost,
    acrylicCost,
    powerSuppliesCost,
    suppliesCost,
    materialsSubtotal,
    laborPercentage,
    laborCost,
    structureCost,
    fixedWorkshopCost,
    additionalCostsTotal,
    otherCostsTotal,
    baseCost,
    multiplier,
    sellingPriceBeforeShipping,
    monetaryMargin,
    shippingCost,
    finalPrice,
    warnings,
    isValidDimensions,
  };
}
