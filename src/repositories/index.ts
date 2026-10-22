import {
  IBusinessRepository,
  IMaterialRepository,
  IQuoteRepository,
  IClientRepository,
  ISupplierRepository,
} from './interfaces';
import { LocalBusinessRepository } from './localBusinessRepository';
import { LocalMaterialRepository } from './localMaterialRepository';
import { LocalQuoteRepository } from './localQuoteRepository';
import { LocalClientRepository } from './localClientRepository';
import { LocalSupplierRepository } from './localSupplierRepository';

/**
 * Repository providers.
 * During Phase 1-3, these use local persistence (localStorage with safe fallbacks and sequence counters).
 * In Phase 4, these can be replaced by Firestore implementations seamlessly.
 */
export const businessRepository: IBusinessRepository = new LocalBusinessRepository();
export const materialRepository: IMaterialRepository = new LocalMaterialRepository();
export const quoteRepository: IQuoteRepository = new LocalQuoteRepository();
export const clientRepository: IClientRepository = new LocalClientRepository();
export const supplierRepository: ISupplierRepository = new LocalSupplierRepository();

export * from './interfaces';
export * from './localBusinessRepository';
export * from './localMaterialRepository';
export * from './localQuoteRepository';
export * from './localClientRepository';
export * from './localSupplierRepository';
