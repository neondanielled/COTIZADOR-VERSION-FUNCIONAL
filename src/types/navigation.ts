export type NavigationSection =
  | 'dashboard'
  | 'business'
  | 'materials'
  | 'quote-builder'
  | 'quotes'
  | 'clients'
  | 'suppliers';

export interface SectionMeta {
  id: NavigationSection;
  label: string;
  shortLabel: string;
  description: string;
  phase: 1 | 2 | 3 | 4;
  isFullyImplementedInPhase1: boolean;
}

export const APP_SECTIONS: SectionMeta[] = [
  {
    id: 'dashboard',
    label: 'Panel principal',
    shortLabel: 'Panel',
    description: 'Resumen operativo del taller y estado del sistema',
    phase: 1,
    isFullyImplementedInPhase1: true,
  },
  {
    id: 'business',
    label: 'Mi negocio',
    shortLabel: 'Negocio',
    description: 'Datos comerciales, contacto, formas de pago y condiciones',
    phase: 1,
    isFullyImplementedInPhase1: true,
  },
  {
    id: 'materials',
    label: 'Materiales',
    shortLabel: 'Materiales',
    description: 'Catálogo de neón, acrílicos, fuentes e insumos con precios en ARS',
    phase: 1,
    isFullyImplementedInPhase1: true,
  },
  {
    id: 'quote-builder',
    label: 'Cotizador',
    shortLabel: 'Cotizador',
    description: 'Motor de cálculo de dimensiones, materiales, adicionales y precio de venta',
    phase: 2,
    isFullyImplementedInPhase1: true,
  },
  {
    id: 'quotes',
    label: 'Presupuestos',
    shortLabel: 'Presupuestos',
    description: 'Historial, estados y generación de presupuestos comerciales en PDF',
    phase: 3,
    isFullyImplementedInPhase1: true,
  },
  {
    id: 'clients',
    label: 'Clientes',
    shortLabel: 'Clientes',
    description: 'Directorio de clientes y registro de contactos del taller',
    phase: 3,
    isFullyImplementedInPhase1: true,
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    shortLabel: 'Proveedores',
    description: 'Agenda y lista de proveedores de planchas, neón e insumos',
    phase: 3,
    isFullyImplementedInPhase1: true,
  },
];
