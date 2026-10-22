export type NeonTechnology = 'neon_comun' | 'neon_rgb' | 'neon_doble_pista';
export type InstallationEnvironment = 'interior' | 'exterior';

export interface QuotePowerSupplyItem {
  id: string;
  materialId: string;
  quantity: number;
}

export interface QuoteSupplyItem {
  id: string;
  materialId: string;
  quantity: number;
}

export interface QuoteAdditionalCostItem {
  id: string;
  description: string;
  amount: number;
}

export interface QuoteFormData {
  // A. Cliente y Cartel
  clientName: string;
  clientPhone: string;
  signDescription: string;
  widthCm: number | '';
  heightCm: number | '';
  installationType: InstallationEnvironment;
  notes: string;

  // B. Neón
  neonType: NeonTechnology;
  neonMaterialId: string;
  neonMeters: number | '';

  // C. Acrílico
  hasAcrylic: boolean;
  acrylicMaterialId: string;

  // D. Fuentes de alimentación
  powerSupplies: QuotePowerSupplyItem[];

  // E. Insumos
  supplies: QuoteSupplyItem[];

  // F. Mano de obra
  laborPercentage: number | '';

  // G. Estructura
  structureCost: number | '';

  // H. Envío
  shippingCost: number | '';

  // I. Insumos fijos de taller y Otros costos
  fixedWorkshopCost: number | '';
  additionalCosts: QuoteAdditionalCostItem[];

  // Multiplicador K
  multiplier: number;

  // Optional link to registered Client ID
  clientId?: string;
}

export interface MaterialCostDetail {
  materialId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isAvailable: boolean;
  warning?: string;
}

export interface QuoteCalculationResult {
  // Dimensiones calculadas
  widthCm: number;
  heightCm: number;
  acrylicAreaM2: number;

  // Desglose de materiales (M)
  neonDetail: MaterialCostDetail | null;
  acrylicDetail: MaterialCostDetail | null;
  powerSuppliesDetail: MaterialCostDetail[];
  suppliesDetail: MaterialCostDetail[];

  neonCost: number;
  acrylicCost: number;
  powerSuppliesCost: number;
  suppliesCost: number;
  materialsSubtotal: number; // M

  // Mano de obra (MO)
  laborPercentage: number;
  laborCost: number; // MO = M * (laborPercentage / 100)

  // Estructura (E)
  structureCost: number; // E

  // Insumos fijos y otros costos (I)
  fixedWorkshopCost: number;
  additionalCostsTotal: number;
  otherCostsTotal: number; // I = fixedWorkshopCost + additionalCostsTotal

  // Costo base
  baseCost: number; // Base = M + MO + E + I

  // Multiplicador (K) y Precio de venta
  multiplier: number; // K
  sellingPriceBeforeShipping: number; // Base * K
  monetaryMargin: number; // (Base * K) - Base

  // Envío (ENV) y Precio Final
  shippingCost: number; // ENV
  finalPrice: number; // (Base * K) + ENV

  // Advertencias de disponibilidad o configuración
  warnings: string[];
  isValidDimensions: boolean;
}

export type QuoteStatus = 'pendiente' | 'enviado' | 'aceptado' | 'rechazado';

export interface SavedQuoteMaterialSnapshot {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
}

export interface SavedQuote {
  id: string; // ID único interno
  quoteNumber: string; // Número único legible (ej: PR-0001)
  sequenceNumber: number; // Número secuencial no repetible
  ownerUid: string; // Preparado para aislamiento de usuario en Fase 4
  status: QuoteStatus; // Estado comercial
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Datos del cliente vinculados y congelados
  clientId?: string;
  clientSnapshot: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    address?: string;
  };

  // Copia congelada de datos comerciales del negocio al emitir
  businessSnapshot: {
    tradeName: string;
    responsibleName: string;
    whatsapp: string;
    instagram: string;
    city: string;
    address: string;
    website?: string;
    logoDataUrl?: string;
    depositPercentage?: number;
    commercialConditions: string;
    paymentMethods: Array<{ name: string; details?: string }>;
  };

  // Estado del formulario para reconstrucción editable
  formData: QuoteFormData;

  // Resultado de cálculo congelado (subtotales, base, precio final, margen)
  calculationResult: QuoteCalculationResult;

  // Snapshot de los materiales y precios vigentes al momento de la cotización
  materialsSnapshot: SavedQuoteMaterialSnapshot[];
}
