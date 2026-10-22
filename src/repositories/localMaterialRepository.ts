import {
  DEFAULT_MATERIAL_CATEGORIES,
  Material,
  MaterialFormData,
} from '../types/material';
import { IMaterialRepository } from './interfaces';

const STORAGE_MATERIALS_KEY_PREFIX = 'cotizador_neon_materials_v1';
const STORAGE_CATEGORIES_KEY_PREFIX = 'cotizador_neon_categories_v1';

export class LocalMaterialRepository implements IMaterialRepository {
  private materialsCache: Map<string, Material[]> = new Map();
  private categoriesCache: Map<string, string[]> = new Map();

  private getMaterialsKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_MATERIALS_KEY_PREFIX}_${ownerUid}`;
  }

  private getCategoriesKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_CATEGORIES_KEY_PREFIX}_${ownerUid}`;
  }

  async getCategories(ownerUid: string = 'local_user'): Promise<string[]> {
    const key = this.getCategoriesKey(ownerUid);
    if (this.categoriesCache.has(key)) {
      return [...this.categoriesCache.get(key)!];
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        const defaults = [...DEFAULT_MATERIAL_CATEGORIES];
        this.categoriesCache.set(key, defaults);
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.categoriesCache.set(key, parsed);
        return [...parsed];
      }
      const defaults = [...DEFAULT_MATERIAL_CATEGORIES];
      this.categoriesCache.set(key, defaults);
      return defaults;
    } catch (error) {
      console.error('Error al leer categorías desde el almacenamiento local:', error);
      return [...DEFAULT_MATERIAL_CATEGORIES];
    }
  }

  async addCategory(category: string, ownerUid: string = 'local_user'): Promise<string[]> {
    const trimmed = category.trim();
    if (!trimmed) {
      throw new Error('El nombre de la categoría no puede estar vacío.');
    }
    const current = await this.getCategories(ownerUid);
    if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return current; // Ya existe
    }

    const updated = [...current, trimmed];
    const key = this.getCategoriesKey(ownerUid);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      this.categoriesCache.set(key, updated);
      return updated;
    } catch (error) {
      console.error('Error al guardar la nueva categoría:', error);
      throw new Error('No se pudo guardar la nueva categoría.');
    }
  }

  async deleteCategory(category: string, ownerUid: string = 'local_user'): Promise<string[]> {
    const materials = await this.getAll(ownerUid);
    const isInUse = materials.some((m) => m.category === category);
    if (isInUse) {
      throw new Error(`La categoría "${category}" no puede eliminarse porque está siendo utilizada por uno o más materiales.`);
    }

    const current = await this.getCategories(ownerUid);
    const updated = current.filter((c) => c !== category);
    const key = this.getCategoriesKey(ownerUid);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      this.categoriesCache.set(key, updated);
      return updated;
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw new Error('No se pudo eliminar la categoría.');
    }
  }

  async getAll(ownerUid: string = 'local_user'): Promise<Material[]> {
    const key = this.getMaterialsKey(ownerUid);
    if (this.materialsCache.has(key)) {
      return [...this.materialsCache.get(key)!];
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Return empty array (user creates real materials with real prices)
        this.materialsCache.set(key, []);
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.materialsCache.set(key, parsed);
        return [...parsed];
      }
      this.materialsCache.set(key, []);
      return [];
    } catch (error) {
      console.error('Error al leer materiales desde el almacenamiento local:', error);
      if (this.materialsCache.has(key)) {
        return [...this.materialsCache.get(key)!];
      }
      return [];
    }
  }

  async getById(id: string, ownerUid: string = 'local_user'): Promise<Material | null> {
    const list = await this.getAll(ownerUid);
    return list.find((m) => m.id === id) || null;
  }

  async create(data: MaterialFormData, ownerUid: string = 'local_user'): Promise<Material> {
    this.validateFormData(data);

    const list = await this.getAll(ownerUid);

    // Check for accidental duplicate name in the same category
    const duplicate = list.find(
      (m) =>
        m.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        m.category.trim().toLowerCase() === data.category.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Ya existe un material llamado "${data.name}" en la categoría "${data.category}".`);
    }

    const newMaterial: Material = {
      ...data,
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [newMaterial, ...list];
    const key = this.getMaterialsKey(ownerUid);

    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      this.materialsCache.set(key, updatedList);
      return { ...newMaterial };
    } catch (error) {
      console.error('Error al guardar material en localStorage:', error);
      throw new Error('No se pudo guardar el material en el almacenamiento local.');
    }
  }

  async update(id: string, updates: Partial<MaterialFormData>, ownerUid: string = 'local_user'): Promise<Material> {
    const list = await this.getAll(ownerUid);
    const index = list.findIndex((m) => m.id === id);

    if (index === -1) {
      throw new Error('El material que intenta actualizar no fue encontrado.');
    }

    const current = list[index];
    const mergedData: MaterialFormData = {
      name: updates.name !== undefined ? updates.name : current.name,
      category: updates.category !== undefined ? updates.category : current.category,
      price: updates.price !== undefined ? updates.price : current.price,
      unit: updates.unit !== undefined ? updates.unit : current.unit,
      description: updates.description !== undefined ? updates.description : current.description,
      customUnitName: updates.customUnitName !== undefined ? updates.customUnitName : current.customUnitName,
      isActive: updates.isActive !== undefined ? updates.isActive : current.isActive,
    };

    this.validateFormData(mergedData);

    // Check if new name collides with another material
    const duplicate = list.find(
      (m) =>
        m.id !== id &&
        m.name.trim().toLowerCase() === mergedData.name.trim().toLowerCase() &&
        m.category.trim().toLowerCase() === mergedData.category.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Ya existe otro material registrado con el nombre "${mergedData.name}" en la misma categoría.`);
    }

    const updatedItem: Material = {
      ...current,
      ...mergedData,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...list];
    updatedList[index] = updatedItem;

    const key = this.getMaterialsKey(ownerUid);
    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      this.materialsCache.set(key, updatedList);
      return { ...updatedItem };
    } catch (error) {
      console.error('Error al actualizar material en localStorage:', error);
      throw new Error('No se pudo actualizar el material en el almacenamiento local.');
    }
  }

  async delete(id: string, ownerUid: string = 'local_user'): Promise<boolean> {
    const list = await this.getAll(ownerUid);
    const filtered = list.filter((m) => m.id !== id);

    if (filtered.length === list.length) {
      throw new Error('El material a eliminar no existe.');
    }

    const key = this.getMaterialsKey(ownerUid);
    try {
      localStorage.setItem(key, JSON.stringify(filtered));
      this.materialsCache.set(key, filtered);
      return true;
    } catch (error) {
      console.error('Error al eliminar material en localStorage:', error);
      throw new Error('No se pudo eliminar el material del almacenamiento local.');
    }
  }

  private validateFormData(data: MaterialFormData): void {
    if (!data.name || !data.name.trim()) {
      throw new Error('El nombre del material es obligatorio.');
    }
    if (!data.category || !data.category.trim()) {
      throw new Error('La categoría del material es obligatoria.');
    }
    if (typeof data.price !== 'number' || isNaN(data.price)) {
      throw new Error('El precio unitario debe ser un valor numérico válido.');
    }
    if (data.price < 0) {
      throw new Error('El precio del material no puede ser negativo.');
    }
    if (!data.unit) {
      throw new Error('La unidad de medida debe estar definida.');
    }
    if (data.unit === 'personalizada' && (!data.customUnitName || !data.customUnitName.trim())) {
      throw new Error('Debe indicar el nombre de la unidad de medida personalizada.');
    }
  }
}
