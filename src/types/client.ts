export interface Client {
  id: string;
  ownerUid: string; // Prepared for Phase 4 user isolation
  name: string; // Nombre o razón social (obligatorio)
  whatsapp: string; // Teléfono / WhatsApp
  email?: string; // Correo electrónico opcional
  city?: string; // Ciudad / Localidad opcional
  address?: string; // Dirección física opcional
  notes?: string; // Observaciones del cliente
  createdAt: string;
  updatedAt: string;
}

export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>;
