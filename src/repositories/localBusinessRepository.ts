import { BusinessProfile, INITIAL_BUSINESS_PROFILE } from '../types/business';
import { IBusinessRepository } from './interfaces';
import { getBusinessLogo, saveBusinessLogo, deleteBusinessLogo } from '../services/imageStorage';

const STORAGE_KEY_PREFIX = 'cotizador_neon_business_v1';

export class LocalBusinessRepository implements IBusinessRepository {
  private inMemoryCache: Map<string, BusinessProfile> = new Map();

  private getKey(ownerUid: string = 'local_user'): string {
    return `${STORAGE_KEY_PREFIX}_${ownerUid}`;
  }

  async getProfile(ownerUid: string = 'local_user'): Promise<BusinessProfile> {
    const key = this.getKey(ownerUid);

    // Return cached profile if already loaded in memory
    if (this.inMemoryCache.has(key)) {
      return { ...this.inMemoryCache.get(key)! };
    }

    try {
      // Load stored logo from IndexedDB
      const logoFromDB = await getBusinessLogo(ownerUid);

      const raw = localStorage.getItem(key);
      if (!raw) {
        // Return initial clean profile without overwriting yet
        const initial = {
          ...INITIAL_BUSINESS_PROFILE,
          ownerUid,
          logoDataUrl: logoFromDB || '',
        };
        this.inMemoryCache.set(key, initial);
        return { ...initial };
      }

      const parsed = JSON.parse(raw) as BusinessProfile;
      // Ensure essential fields exist
      const sanitized: BusinessProfile = {
        ...INITIAL_BUSINESS_PROFILE,
        ...parsed,
        ownerUid,
        logoDataUrl: logoFromDB || parsed.logoDataUrl || '',
        depositPercentage: typeof parsed.depositPercentage === 'number' ? parsed.depositPercentage : 50,
        paymentMethods: Array.isArray(parsed.paymentMethods)
          ? parsed.paymentMethods
          : INITIAL_BUSINESS_PROFILE.paymentMethods,
      };

      this.inMemoryCache.set(key, sanitized);
      return { ...sanitized };
    } catch (error) {
      console.error('Error al leer los datos de Mi Negocio desde el almacenamiento local:', error);
      // Fallback without destroying what is in storage
      if (this.inMemoryCache.has(key)) {
        return { ...this.inMemoryCache.get(key)! };
      }
      return { ...INITIAL_BUSINESS_PROFILE, ownerUid };
    }
  }

  async saveProfile(profile: Partial<BusinessProfile>, ownerUid: string = 'local_user'): Promise<BusinessProfile> {
    const key = this.getKey(ownerUid);
    const existing = await this.getProfile(ownerUid);

    // Handle logo persistence in IndexedDB safely
    let currentLogo = existing.logoDataUrl || '';
    if (profile.logoDataUrl !== undefined) {
      if (profile.logoDataUrl) {
        await saveBusinessLogo(profile.logoDataUrl, ownerUid);
        currentLogo = profile.logoDataUrl;
      } else {
        await deleteBusinessLogo(ownerUid);
        currentLogo = '';
      }
    }

    const updated: BusinessProfile = {
      ...existing,
      ...profile,
      ownerUid,
      logoDataUrl: currentLogo,
      depositPercentage:
        typeof profile.depositPercentage === 'number'
          ? profile.depositPercentage
          : typeof existing.depositPercentage === 'number'
            ? existing.depositPercentage
            : 50,
      updatedAt: new Date().toISOString(),
    };

    // To prevent exceeding localStorage 5MB quota, store lightweight version in localStorage
    const forLocalStorage = {
      ...updated,
      logoDataUrl: '', // Stored safely in IndexedDB
    };

    try {
      localStorage.setItem(key, JSON.stringify(forLocalStorage));
      this.inMemoryCache.set(key, updated);
      return { ...updated };
    } catch (error) {
      console.error('Error al persistir los datos comerciales en localStorage:', error);
      throw new Error('No se pudo guardar la información del negocio en el almacenamiento local.');
    }
  }

  async resetProfile(ownerUid: string = 'local_user'): Promise<BusinessProfile> {
    const key = this.getKey(ownerUid);
    await deleteBusinessLogo(ownerUid);
    const resetData: BusinessProfile = {
      ...INITIAL_BUSINESS_PROFILE,
      ownerUid,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(resetData));
      this.inMemoryCache.set(key, resetData);
      return { ...resetData };
    } catch (error) {
      console.error('Error al restablecer perfil:', error);
      throw error;
    }
  }
}
