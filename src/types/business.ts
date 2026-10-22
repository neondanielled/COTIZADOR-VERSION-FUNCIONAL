export interface PaymentMethodItem {
  id: string;
  name: string;
  enabled: boolean;
  isCustom: boolean;
  details?: string;
}

export interface BusinessProfile {
  id: string;
  ownerUid: string; // Ready for Phase 4 user authentication isolation
  tradeName: string; // Nombre comercial
  responsibleName: string; // Nombre del responsable
  whatsapp: string; // WhatsApp de contacto
  instagram: string; // @ de Instagram
  city: string; // Ciudad
  address: string; // Dirección del taller
  website?: string; // Sitio web opcional
  logoDataUrl?: string; // Logo o foto de perfil en Base64/DataURL
  depositPercentage: number; // Porcentaje de seña para iniciar fabricación (ej: 50%)
  commercialConditions: string; // Condiciones comerciales (validez, seña, garantía, tiempos)
  paymentMethods: PaymentMethodItem[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: 'transfer', name: 'Transferencia bancaria', enabled: true, isCustom: false },
  { id: 'credit_card', name: 'Tarjeta de crédito', enabled: true, isCustom: false },
  { id: 'debit_card', name: 'Tarjeta de débito', enabled: true, isCustom: false },
  { id: 'mercadopago', name: 'Mercado Pago', enabled: true, isCustom: false },
  { id: 'cash', name: 'Efectivo contra entrega', enabled: false, isCustom: false },
];

export const INITIAL_BUSINESS_PROFILE: BusinessProfile = {
  id: 'default_business',
  ownerUid: 'local_user',
  tradeName: '',
  responsibleName: '',
  whatsapp: '',
  instagram: '',
  city: '',
  address: '',
  website: '',
  logoDataUrl: '',
  depositPercentage: 50,
  commercialConditions: 'Presupuesto válido por 10 días corridos.\nSeña requerida del 50% para iniciar la fabricación y saldo contra entrega.\nTiempo estimado de fabricación: 7 a 10 días hábiles.\nGarantía de 6 meses sobre fuente de alimentación y tiras LED Neón.',
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
