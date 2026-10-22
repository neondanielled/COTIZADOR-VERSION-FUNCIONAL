import { SavedQuote } from '../types/quote';

/**
 * Image & Data Storage Service
 * Uses IndexedDB to persist workshop logos and quote data safely without exhausting localStorage 5MB quota.
 * Also provides client-side image optimization, aspect-ratio preservation, and localStorage bloat cleanup.
 */

const DB_NAME = 'cotizador_neon_db';
const DB_VERSION = 2;
const STORE_NAME = 'business_assets';
const QUOTES_STORE = 'quotes_store';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QUOTES_STORE)) {
        db.createObjectStore(QUOTES_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sweeps localStorage to remove obsolete giant base64 fallbacks or embedded logoDataUrl inside quotes.
 * This recovers up to 4.9MB of localStorage space immediately.
 */
export function cleanupLocalStorageBloat(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Remove large logo fallbacks
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cotizador_neon_logo_fallback_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 2. Strip embedded logoDataUrl in quotes stored in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cotizador_neon_quotes_v1_')) {
        const raw = localStorage.getItem(key);
        if (raw && (raw.includes('data:image') || raw.length > 50000)) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              let modified = false;
              const sanitized = parsed.map((item: any) => {
                if (item?.businessSnapshot?.logoDataUrl && item.businessSnapshot.logoDataUrl.length > 200) {
                  modified = true;
                  return {
                    ...item,
                    businessSnapshot: {
                      ...item.businessSnapshot,
                      logoDataUrl: '',
                    },
                  };
                }
                return item;
              });

              if (modified) {
                localStorage.setItem(key, JSON.stringify(sanitized));
              }
            }
          } catch (e) {
            console.warn('Could not sanitize quote in localStorage:', e);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error en limpieza de almacenamiento local:', err);
  }
}

/**
 * Stores the logo image in IndexedDB
 */
export async function saveBusinessLogo(
  dataUrl: string,
  ownerUid: string = 'local_user'
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, `logo_${ownerUid}`);

      req.onsuccess = () => {
        // Once saved in IndexedDB, remove large fallback from localStorage to preserve quota
        try {
          localStorage.removeItem(`cotizador_neon_logo_fallback_${ownerUid}`);
        } catch {}
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Fallo al guardar logo en IndexedDB, usando fallback:', error);
    try {
      localStorage.setItem(`cotizador_neon_logo_fallback_${ownerUid}`, dataUrl);
    } catch (e) {
      console.warn('No se pudo guardar en almacenamiento local fallback (cuota alcanzada):', e);
    }
  }
}

/**
 * Retrieves the logo image from IndexedDB (with fallback)
 */
export async function getBusinessLogo(
  ownerUid: string = 'local_user'
): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`logo_${ownerUid}`);

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as string);
        } else {
          // Check fallback
          const fb = localStorage.getItem(`cotizador_neon_logo_fallback_${ownerUid}`);
          resolve(fb || null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Fallo al leer logo de IndexedDB, leyendo fallback:', error);
    const fb = localStorage.getItem(`cotizador_neon_logo_fallback_${ownerUid}`);
    return fb || null;
  }
}

/**
 * Deletes the logo image from IndexedDB
 */
export async function deleteBusinessLogo(
  ownerUid: string = 'local_user'
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(`logo_${ownerUid}`);

      req.onsuccess = () => {
        try {
          localStorage.removeItem(`cotizador_neon_logo_fallback_${ownerUid}`);
        } catch {}
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Error al eliminar logo:', error);
    try {
      localStorage.removeItem(`cotizador_neon_logo_fallback_${ownerUid}`);
    } catch {}
  }
}

/**
 * Stores quotes list in IndexedDB (virtually unlimited quota compared to 5MB localStorage)
 */
export async function saveQuotesToIDB(
  quotes: SavedQuote[],
  ownerUid: string = 'local_user'
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUOTES_STORE, 'readwrite');
      const store = tx.objectStore(QUOTES_STORE);
      const req = store.put(quotes, `quotes_${ownerUid}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Error al guardar presupuestos en IndexedDB:', error);
  }
}

/**
 * Retrieves quotes list from IndexedDB
 */
export async function getQuotesFromIDB(
  ownerUid: string = 'local_user'
): Promise<SavedQuote[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUOTES_STORE, 'readonly');
      const store = tx.objectStore(QUOTES_STORE);
      const req = store.get(`quotes_${ownerUid}`);
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result)) {
          resolve(req.result as SavedQuote[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Error al leer presupuestos de IndexedDB:', error);
    return null;
  }
}

/**
 * Validates, resizes proportionally and compresses an uploaded image file.
 * Returns a high quality data URL suitable for both UI preview and PDF embedding.
 */
export async function processAndCompressImage(
  file: File,
  maxDimension: number = 600
): Promise<{ dataUrl: string; width: number; height: number }> {
  // 1. Validate file size (max 5 MB)
  const MAX_SIZE_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('El archivo supera el tamaño máximo permitido de 5 MB.');
  }

  // 2. Validate MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  if (!allowedMimeTypes.includes(file.type) && (!ext || !allowedExtensions.includes(ext))) {
    throw new Error('Formato de imagen no soportado. Por favor utilizá archivos JPG, JPEG, PNG o WebP.');
  }

  // 3. Load file into HTML Image
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('No se pudo leer el archivo seleccionado.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Calculate proportional dimensions
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (targetWidth > maxDimension || targetHeight > maxDimension) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
              targetWidth = maxDimension;
            } else {
              targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
              targetHeight = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({ dataUrl: result, width: img.width, height: img.height });
            return;
          }

          // Use smooth interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Preserve transparency for PNG/WebP, use PNG format for crisp vector logos
          const outputFormat = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
          const optimizedDataUrl = canvas.toDataURL(outputFormat, 0.88);

          resolve({
            dataUrl: optimizedDataUrl,
            width: targetWidth,
            height: targetHeight,
          });
        } catch (canvasErr) {
          console.warn('Error en compresión de canvas, usando imagen original:', canvasErr);
          resolve({ dataUrl: result, width: img.width, height: img.height });
        }
      };

      img.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
      img.src = result;
    };

    reader.onerror = () => reject(new Error('Error al procesar el archivo.'));
    reader.readAsDataURL(file);
  });
}
