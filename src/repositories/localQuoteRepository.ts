import { SavedQuote, QuoteStatus } from '../types/quote';
import { IQuoteRepository } from './interfaces';
import {
  saveQuotesToIDB,
  getQuotesFromIDB,
  cleanupLocalStorageBloat,
} from '../services/imageStorage';

const STORAGE_QUOTES_KEY_PREFIX = 'cotizador_neon_quotes_v1';
const STORAGE_SEQUENCE_KEY_PREFIX = 'cotizador_neon_quote_seq_v1';

/**
 * Sanitizes a quote so it never contains heavy base64 images inside its businessSnapshot.
 * The workshop logo is kept safely in IndexedDB and loaded dynamically for PDF generation.
 */
function sanitizeQuote(quote: SavedQuote): SavedQuote {
  if (
    quote.businessSnapshot &&
    quote.businessSnapshot.logoDataUrl &&
    quote.businessSnapshot.logoDataUrl.length > 200
  ) {
    return {
      ...quote,
      businessSnapshot: {
        ...quote.businessSnapshot,
        logoDataUrl: '',
      },
    };
  }
  return quote;
}

export class LocalQuoteRepository implements IQuoteRepository {
  private cache: Map<string, SavedQuote[]> = new Map();
  private hasCleanedBloat: boolean = false;

  private getQuotesKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_QUOTES_KEY_PREFIX}_${ownerUid}`;
  }

  private getSeqKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_SEQUENCE_KEY_PREFIX}_${ownerUid}`;
  }

  private async getNextSequence(
    ownerUid: string = 'local_user'
  ): Promise<{ sequenceNumber: number; quoteNumber: string }> {
    const key = this.getSeqKey(ownerUid);
    let currentSeq = 0;

    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        currentSeq = parseInt(raw, 10) || 0;
      }
    } catch (e) {
      console.warn('Error al leer secuencia de presupuestos en localStorage:', e);
    }

    // Safety fallback: ensure sequence is at least the highest sequence already saved
    try {
      const existing = await this.getAll(ownerUid);
      const maxExisting = existing.reduce(
        (max, q) => Math.max(max, q.sequenceNumber || 0),
        0
      );
      if (maxExisting > currentSeq) {
        currentSeq = maxExisting;
      }
    } catch {}

    const nextSeq = currentSeq + 1;
    try {
      localStorage.setItem(key, nextSeq.toString());
    } catch (e) {
      console.warn('Error al guardar secuencia en localStorage (se mantiene en memoria):', e);
    }

    const formatted = `PR-${nextSeq.toString().padStart(4, '0')}`;
    return { sequenceNumber: nextSeq, quoteNumber: formatted };
  }

  /**
   * Dual-layer persistence: writes to IndexedDB (unlimited quota) and localStorage (fast cache).
   * Gracefully handles QuotaExceededError by keeping IndexedDB as the authoritative store.
   */
  private async persistQuotes(
    ownerUid: string,
    quotes: SavedQuote[]
  ): Promise<SavedQuote[]> {
    const key = this.getQuotesKey(ownerUid);
    const sanitizedList = quotes.map(sanitizeQuote);

    // 1. Update in-memory cache
    this.cache.set(key, sanitizedList);

    // 2. Persist to IndexedDB (safe from 5MB quota errors)
    await saveQuotesToIDB(sanitizedList, ownerUid);

    // 3. Persist to localStorage with safety catch
    try {
      localStorage.setItem(key, JSON.stringify(sanitizedList));
    } catch (lsError) {
      console.warn(
        'localStorage cuota excedida. Se limpiará almacenamiento y los datos quedan seguros en IndexedDB:',
        lsError
      );
      cleanupLocalStorageBloat();
      try {
        localStorage.setItem(key, JSON.stringify(sanitizedList));
      } catch {
        // If localStorage is still full, IndexedDB has already persisted all quotes safely!
      }
    }

    return sanitizedList;
  }

  async getAll(ownerUid: string = 'local_user'): Promise<SavedQuote[]> {
    const key = this.getQuotesKey(ownerUid);

    if (this.cache.has(key)) {
      return [...this.cache.get(key)!];
    }

    // One-time bloat cleanup on initial load
    if (!this.hasCleanedBloat) {
      this.hasCleanedBloat = true;
      cleanupLocalStorageBloat();
    }

    // 1. Try reading from IndexedDB
    try {
      const fromIDB = await getQuotesFromIDB(ownerUid);
      if (fromIDB !== null) {
        const sanitized = fromIDB.map(sanitizeQuote);
        this.cache.set(key, sanitized);
        return [...sanitized];
      }
    } catch (e) {
      console.warn('Fallo al leer presupuestos de IndexedDB, usando localStorage:', e);
    }

    // 2. Fallback / initial migration from localStorage
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.cache.set(key, []);
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.map(sanitizeQuote);
        // Migrate to IndexedDB for permanent unlimited safety
        await saveQuotesToIDB(sanitized, ownerUid);
        this.cache.set(key, sanitized);
        return [...sanitized];
      }
      this.cache.set(key, []);
      return [];
    } catch (error) {
      console.error('Error al leer presupuestos desde el almacenamiento:', error);
      if (this.cache.has(key)) {
        return [...this.cache.get(key)!];
      }
      return [];
    }
  }

  async getById(id: string, ownerUid: string = 'local_user'): Promise<SavedQuote | null> {
    const list = await this.getAll(ownerUid);
    return list.find((q) => q.id === id) || null;
  }

  async create(
    data: Omit<SavedQuote, 'id' | 'quoteNumber' | 'sequenceNumber' | 'createdAt' | 'updatedAt' | 'ownerUid'>,
    ownerUid: string = 'local_user'
  ): Promise<SavedQuote> {
    const { sequenceNumber, quoteNumber } = await this.getNextSequence(ownerUid);
    const now = new Date().toISOString();

    const rawQuote: SavedQuote = {
      ...data,
      id: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quoteNumber,
      sequenceNumber,
      ownerUid,
      createdAt: now,
      updatedAt: now,
    };

    const newQuote = sanitizeQuote(rawQuote);
    const currentList = await this.getAll(ownerUid);
    const updatedList = [newQuote, ...currentList];

    await this.persistQuotes(ownerUid, updatedList);
    return { ...newQuote };
  }

  async update(
    id: string,
    updates: Partial<SavedQuote>,
    ownerUid: string = 'local_user'
  ): Promise<SavedQuote> {
    const currentList = await this.getAll(ownerUid);
    const index = currentList.findIndex((q) => q.id === id);

    if (index === -1) {
      throw new Error('El presupuesto que intenta modificar no existe.');
    }

    const current = currentList[index];
    const rawUpdated: SavedQuote = {
      ...current,
      ...updates,
      id: current.id, // Preserve original ID
      quoteNumber: current.quoteNumber, // Preserve original sequential number
      sequenceNumber: current.sequenceNumber,
      createdAt: current.createdAt, // Preserve original creation date
      updatedAt: new Date().toISOString(),
    };

    const updatedQuote = sanitizeQuote(rawUpdated);
    const updatedList = [...currentList];
    updatedList[index] = updatedQuote;

    await this.persistQuotes(ownerUid, updatedList);
    return { ...updatedQuote };
  }

  async delete(id: string, ownerUid: string = 'local_user'): Promise<boolean> {
    const currentList = await this.getAll(ownerUid);
    const filtered = currentList.filter((q) => q.id !== id);

    if (filtered.length === currentList.length) {
      throw new Error('El presupuesto a eliminar no fue encontrado.');
    }

    await this.persistQuotes(ownerUid, filtered);
    return true;
  }

  async duplicate(id: string, ownerUid: string = 'local_user'): Promise<SavedQuote> {
    const original = await this.getById(id, ownerUid);
    if (!original) {
      throw new Error('No se encontró el presupuesto a duplicar.');
    }

    const { sequenceNumber, quoteNumber } = await this.getNextSequence(ownerUid);
    const now = new Date().toISOString();

    const duplicated: SavedQuote = sanitizeQuote({
      ...original,
      id: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      quoteNumber,
      sequenceNumber,
      status: 'pendiente', // Reset to pending for the new quotation
      createdAt: now,
      updatedAt: now,
      formData: {
        ...original.formData,
        signDescription: `${original.formData.signDescription || 'Cartel'} (Copia)`,
      },
    });

    const currentList = await this.getAll(ownerUid);
    const updatedList = [duplicated, ...currentList];

    await this.persistQuotes(ownerUid, updatedList);
    return { ...duplicated };
  }

  async updateStatus(
    id: string,
    status: QuoteStatus,
    ownerUid: string = 'local_user'
  ): Promise<SavedQuote> {
    return this.update(id, { status }, ownerUid);
  }
}
