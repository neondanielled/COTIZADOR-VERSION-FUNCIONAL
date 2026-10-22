export interface Supplier {
  id: string;
  ownerUid: string; // Prepared for Phase 4 user isolation
  tradeName: string; // Nombre comercial del proveedor (obligatorio)
  contactPerson?: string; // Nombre del contacto o vendedor
  whatsapp: string; // WhatsApp de contacto
  email?: string; // Correo electrónico opcional
  website?: string; // Sitio web o red social opcional
  suppliedCategories: string[]; // Rubros suministrados (ej: Neón LED, Acrílico, etc.)
  notes?: string; // Observaciones comerciales
  createdAt: string;
  updatedAt: string;
}

export type SupplierFormData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>;
