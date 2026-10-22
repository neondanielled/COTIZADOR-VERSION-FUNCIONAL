export type StandardUnitOfMeasure =
  | 'metro_lineal'
  | 'metro_cuadrado'
  | 'unidad'
  | 'juego'
  | 'kilogramo'
  | 'litro'
  | 'personalizada';

export interface UnitDefinition {
  id: StandardUnitOfMeasure;
  label: string;
  abbreviation: string;
}

export const STANDARD_UNITS: UnitDefinition[] = [
  { id: 'metro_lineal', label: 'Metro lineal', abbreviation: 'm' },
  { id: 'metro_cuadrado', label: 'Metro cuadrado', abbreviation: 'm²' },
  { id: 'unidad', label: 'Unidad', abbreviation: 'u' },
  { id: 'juego', label: 'Juego / Kit', abbreviation: 'jgo' },
  { id: 'kilogramo', label: 'Kilogramo', abbreviation: 'kg' },
  { id: 'litro', label: 'Litro', abbreviation: 'L' },
  { id: 'personalizada', label: 'Otra unidad configurable', abbreviation: 'pers.' },
];

export const DEFAULT_MATERIAL_CATEGORIES = [
  'Neón LED Flex',
  'Acrílico',
  'Fuentes de alimentación',
  'Insumos',
] as const;

export interface Material {
  id: string;
  ownerUid: string; // Ready for Phase 4 user authentication isolation
  name: string; // Nombre del material (ej: "Neón LED Flex 6x12mm 12V")
  category: string; // Categoría (ej: "Neón LED Flex", "Acrílico", etc.)
  description?: string; // Descripción opcional
  price: number; // Precio unitario en ARS (>= 0)
  unit: StandardUnitOfMeasure; // Unidad de medida
  customUnitName?: string; // Si unit === 'personalizada'
  isActive: boolean; // Estado activo o inactivo
  createdAt: string;
  updatedAt: string;
}

export type MaterialFormData = Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>;
