import { BusinessProfile } from '../types/business';
import { Material, MaterialFormData } from '../types/material';

export interface IBusinessRepository {
  /**
   * Retrieves the current business profile.
   * In Phase 4, ownerUid will isolate records per Firebase user.
   */
  getProfile(ownerUid?: string): Promise<BusinessProfile>;

  /**
   * Saves or updates the business profile.
   */
  saveProfile(profile: Partial<BusinessProfile>, ownerUid?: string): Promise<BusinessProfile>;

  /**
   * Resets profile to default state if requested.
   */
  resetProfile(ownerUid?: string): Promise<BusinessProfile>;
}

export interface IMaterialRepository {
  /**
   * Retrieves all materials registered for the given user.
   */
  getAll(ownerUid?: string): Promise<Material[]>;

  /**
   * Retrieves a single material by its ID.
   */
  getById(id: string, ownerUid?: string): Promise<Material | null>;

  /**
   * Creates a new material.
   */
  create(data: MaterialFormData, ownerUid?: string): Promise<Material>;

  /**
   * Updates an existing material.
   */
  update(id: string, updates: Partial<MaterialFormData>, ownerUid?: string): Promise<Material>;

  /**
   * Deletes a material by ID.
   */
  delete(id: string, ownerUid?: string): Promise<boolean>;

  /**
   * Gets all available categories (predefined + custom).
   */
  getCategories(ownerUid?: string): Promise<string[]>;

  /**
   * Adds a new category to the repository.
   */
  addCategory(category: string, ownerUid?: string): Promise<string[]>;

  /**
   * Deletes a category if not in use.
   */
  deleteCategory(category: string, ownerUid?: string): Promise<string[]>;
}

export interface IQuoteRepository {
  getAll(ownerUid?: string): Promise<import('../types/quote').SavedQuote[]>;
  getById(id: string, ownerUid?: string): Promise<import('../types/quote').SavedQuote | null>;
  create(
    data: Omit<import('../types/quote').SavedQuote, 'id' | 'quoteNumber' | 'sequenceNumber' | 'createdAt' | 'updatedAt' | 'ownerUid'>,
    ownerUid?: string
  ): Promise<import('../types/quote').SavedQuote>;
  update(
    id: string,
    updates: Partial<import('../types/quote').SavedQuote>,
    ownerUid?: string
  ): Promise<import('../types/quote').SavedQuote>;
  delete(id: string, ownerUid?: string): Promise<boolean>;
  duplicate(id: string, ownerUid?: string): Promise<import('../types/quote').SavedQuote>;
  updateStatus(
    id: string,
    status: import('../types/quote').QuoteStatus,
    ownerUid?: string
  ): Promise<import('../types/quote').SavedQuote>;
}

export interface IClientRepository {
  getAll(ownerUid?: string): Promise<import('../types/client').Client[]>;
  getById(id: string, ownerUid?: string): Promise<import('../types/client').Client | null>;
  create(data: import('../types/client').ClientFormData, ownerUid?: string): Promise<import('../types/client').Client>;
  update(
    id: string,
    updates: Partial<import('../types/client').ClientFormData>,
    ownerUid?: string
  ): Promise<import('../types/client').Client>;
  delete(id: string, ownerUid?: string): Promise<boolean>;
}

export interface ISupplierRepository {
  getAll(ownerUid?: string): Promise<import('../types/supplier').Supplier[]>;
  getById(id: string, ownerUid?: string): Promise<import('../types/supplier').Supplier | null>;
  create(
    data: import('../types/supplier').SupplierFormData,
    ownerUid?: string
  ): Promise<import('../types/supplier').Supplier>;
  update(
    id: string,
    updates: Partial<import('../types/supplier').SupplierFormData>,
    ownerUid?: string
  ): Promise<import('../types/supplier').Supplier>;
  delete(id: string, ownerUid?: string): Promise<boolean>;
}
