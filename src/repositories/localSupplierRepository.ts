import { Supplier, SupplierFormData } from '../types/supplier';
import { ISupplierRepository } from './interfaces';

const STORAGE_SUPPLIERS_KEY_PREFIX = 'cotizador_neon_suppliers_v1';

export class LocalSupplierRepository implements ISupplierRepository {
  private cache: Map<string, Supplier[]> = new Map();

  private getKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_SUPPLIERS_KEY_PREFIX}_${ownerUid}`;
  }

  async getAll(ownerUid: string = 'local_user'): Promise<Supplier[]> {
    const key = this.getKey(ownerUid);
    if (this.cache.has(key)) {
      return [...this.cache.get(key)!];
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.cache.set(key, []);
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.cache.set(key, parsed);
        return [...parsed];
      }
      this.cache.set(key, []);
      return [];
    } catch (error) {
      console.error('Error al leer proveedores desde localStorage:', error);
      if (this.cache.has(key)) {
        return [...this.cache.get(key)!];
      }
      return [];
    }
  }

  async getById(id: string, ownerUid: string = 'local_user'): Promise<Supplier | null> {
    const list = await this.getAll(ownerUid);
    return list.find((s) => s.id === id) || null;
  }

  async create(data: SupplierFormData, ownerUid: string = 'local_user'): Promise<Supplier> {
    const trimmedTradeName = data.tradeName.trim();
    if (!trimmedTradeName) {
      throw new Error('El nombre comercial del proveedor es obligatorio.');
    }

    const currentList = await this.getAll(ownerUid);
    const now = new Date().toISOString();

    const newSupplier: Supplier = {
      ...data,
      tradeName: trimmedTradeName,
      contactPerson: data.contactPerson?.trim() || undefined,
      whatsapp: data.whatsapp.trim(),
      email: data.email?.trim() || undefined,
      website: data.website?.trim() || undefined,
      suppliedCategories: Array.isArray(data.suppliedCategories) ? data.suppliedCategories : [],
      notes: data.notes?.trim() || undefined,
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerUid,
      createdAt: now,
      updatedAt: now,
    };

    const updatedList = [newSupplier, ...currentList];
    const key = this.getKey(ownerUid);

    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      this.cache.set(key, updatedList);
      return { ...newSupplier };
    } catch (error) {
      console.error('Error al guardar proveedor en localStorage:', error);
      throw new Error('No se pudo guardar el proveedor en el almacenamiento local.');
    }
  }

  async update(
    id: string,
    updates: Partial<SupplierFormData>,
    ownerUid: string = 'local_user'
  ): Promise<Supplier> {
    const currentList = await this.getAll(ownerUid);
    const index = currentList.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error('El proveedor que intenta editar no fue encontrado.');
    }

    const current = currentList[index];
    const newName = updates.tradeName !== undefined ? updates.tradeName.trim() : current.tradeName;
    if (!newName) {
      throw new Error('El nombre del proveedor no puede estar vacío.');
    }

    const updatedSupplier: Supplier = {
      ...current,
      ...updates,
      tradeName: newName,
      contactPerson: updates.contactPerson !== undefined ? updates.contactPerson?.trim() || undefined : current.contactPerson,
      whatsapp: updates.whatsapp !== undefined ? updates.whatsapp.trim() : current.whatsapp,
      email: updates.email !== undefined ? updates.email?.trim() || undefined : current.email,
      website: updates.website !== undefined ? updates.website?.trim() || undefined : current.website,
      suppliedCategories: updates.suppliedCategories !== undefined ? updates.suppliedCategories : current.suppliedCategories,
      notes: updates.notes !== undefined ? updates.notes?.trim() || undefined : current.notes,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...currentList];
    updatedList[index] = updatedSupplier;
    const key = this.getKey(ownerUid);

    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      this.cache.set(key, updatedList);
      return { ...updatedSupplier };
    } catch (error) {
      console.error('Error al actualizar proveedor en localStorage:', error);
      throw new Error('No se pudo actualizar el proveedor en el almacenamiento local.');
    }
  }

  async delete(id: string, ownerUid: string = 'local_user'): Promise<boolean> {
    const currentList = await this.getAll(ownerUid);
    const filtered = currentList.filter((s) => s.id !== id);

    if (filtered.length === currentList.length) {
      throw new Error('El proveedor a eliminar no fue encontrado.');
    }

    const key = this.getKey(ownerUid);
    try {
      localStorage.setItem(key, JSON.stringify(filtered));
      this.cache.set(key, filtered);
      return true;
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      throw new Error('No se pudo eliminar el proveedor del almacenamiento local.');
    }
  }
}
