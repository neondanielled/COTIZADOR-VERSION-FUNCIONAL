import { Client, ClientFormData } from '../types/client';
import { IClientRepository } from './interfaces';

const STORAGE_CLIENTS_KEY_PREFIX = 'cotizador_neon_clients_v1';

export class LocalClientRepository implements IClientRepository {
  private cache: Map<string, Client[]> = new Map();

  private getKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_CLIENTS_KEY_PREFIX}_${ownerUid}`;
  }

  async getAll(ownerUid: string = 'local_user'): Promise<Client[]> {
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
      console.error('Error al leer clientes desde localStorage:', error);
      if (this.cache.has(key)) {
        return [...this.cache.get(key)!];
      }
      return [];
    }
  }

  async getById(id: string, ownerUid: string = 'local_user'): Promise<Client | null> {
    const list = await this.getAll(ownerUid);
    return list.find((c) => c.id === id) || null;
  }

  async create(data: ClientFormData, ownerUid: string = 'local_user'): Promise<Client> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('El nombre o razón social del cliente es obligatorio.');
    }

    const currentList = await this.getAll(ownerUid);

    // Accidental duplicate warning check
    const duplicate = currentList.find(
      (c) =>
        c.name.toLowerCase().trim() === trimmedName.toLowerCase() &&
        c.whatsapp.trim() === data.whatsapp.trim() &&
        data.whatsapp.trim() !== ''
    );
    if (duplicate) {
      throw new Error(`Ya existe un cliente registrado con el nombre "${trimmedName}" y ese mismo número de teléfono.`);
    }

    const now = new Date().toISOString();
    const newClient: Client = {
      ...data,
      name: trimmedName,
      whatsapp: data.whatsapp.trim(),
      email: data.email?.trim() || undefined,
      city: data.city?.trim() || undefined,
      address: data.address?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerUid,
      createdAt: now,
      updatedAt: now,
    };

    const updatedList = [newClient, ...currentList];
    const key = this.getKey(ownerUid);

    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      this.cache.set(key, updatedList);
      return { ...newClient };
    } catch (error) {
      console.error('Error al guardar cliente en localStorage:', error);
      throw new Error('No se pudo guardar el cliente en el almacenamiento local.');
    }
  }

  async update(
    id: string,
    updates: Partial<ClientFormData>,
    ownerUid: string = 'local_user'
  ): Promise<Client> {
    const currentList = await this.getAll(ownerUid);
    const index = currentList.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error('El cliente que intenta editar no existe.');
    }

    const current = currentList[index];
    const newName = updates.name !== undefined ? updates.name.trim() : current.name;
    if (!newName) {
      throw new Error('El nombre del cliente no puede estar vacío.');
    }

    const updatedClient: Client = {
      ...current,
      ...updates,
      name: newName,
      whatsapp: updates.whatsapp !== undefined ? updates.whatsapp.trim() : current.whatsapp,
      email: updates.email !== undefined ? updates.email?.trim() || undefined : current.email,
      city: updates.city !== undefined ? updates.city?.trim() || undefined : current.city,
      address: updates.address !== undefined ? updates.address?.trim() || undefined : current.address,
      notes: updates.notes !== undefined ? updates.notes?.trim() || undefined : current.notes,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...currentList];
    updatedList[index] = updatedClient;
    const key = this.getKey(ownerUid);

    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
      this.cache.set(key, updatedList);
      return { ...updatedClient };
    } catch (error) {
      console.error('Error al actualizar cliente en localStorage:', error);
      throw new Error('No se pudo actualizar el cliente en el almacenamiento local.');
    }
  }

  async delete(id: string, ownerUid: string = 'local_user'): Promise<boolean> {
    const currentList = await this.getAll(ownerUid);
    const filtered = currentList.filter((c) => c.id !== id);

    if (filtered.length === currentList.length) {
      throw new Error('El cliente a eliminar no fue encontrado.');
    }

    const key = this.getKey(ownerUid);
    try {
      localStorage.setItem(key, JSON.stringify(filtered));
      this.cache.set(key, filtered);
      return true;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw new Error('No se pudo eliminar el cliente del almacenamiento local.');
    }
  }
}
