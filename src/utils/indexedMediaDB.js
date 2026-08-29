/**
 * IndexedDB Haute Capacité pour stocker les vidéos et photos localement (Sans limite de taille)
 * Téléchargement et mise en cache automatique des images et vidéos du catalogue
 */
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const DB_NAME = 'AppSourcingMediaDB';
const DB_VERSION = 2;
const STORE_NAME = 'media_store';
const CACHE_STORE_NAME = 'cached_urls_store';

// Cache mémoire en session (URL -> Blob URL) pour accès instantané en 0ms
const memoryBlobMap = new Map();

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'url' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaItemToDB(item) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('IndexedDB save error:', e);
    return false;
  }
}

export async function getAllMediaItemsFromDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IndexedDB load error:', e);
    return [];
  }
}

export async function deleteMediaItemFromDB(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('IndexedDB delete error:', e);
    return false;
  }
}

/**
 * 📥 Télécharge et met en cache localement une URL média (photo ou vidéo)
 */
export async function cacheMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Si déjà un blob local ou data URL
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // 1. Vérifier si déjà en mémoire
  if (memoryBlobMap.has(url)) {
    return memoryBlobMap.get(url);
  }

  try {
    const db = await openDB();

    // 2. Vérifier si déjà stocké dans IndexedDB
    const cachedItem = await new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const store = tx.objectStore(CACHE_STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (cachedItem && cachedItem.blob) {
      const localBlobUrl = URL.createObjectURL(cachedItem.blob);
      memoryBlobMap.set(url, localBlobUrl);
      return localBlobUrl;
    }

    // 3. Téléchargement réel en arrière-plan via fetch
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    const localBlobUrl = URL.createObjectURL(blob);
    memoryBlobMap.set(url, localBlobUrl);

    // Sauvegarde permanente dans IndexedDB
    await new Promise((resolve) => {
      const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CACHE_STORE_NAME);
      store.put({
        url,
        blob,
        mimeType: blob.type || (url.includes('.mp4') ? 'video/mp4' : 'image/jpeg'),
        timestamp: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });

    // ☁️ Téléversement miroir permanent vers Supabase Storage (Bucket product-media)
    if (supabase && isSupabaseConfigured && !url.includes('supabase.co/storage')) {
      try {
        const isVideo = url.includes('.mp4') || (blob.type && blob.type.includes('video'));
        const folder = isVideo ? 'videos' : 'images';
        const ext = isVideo ? 'mp4' : 'jpg';
        const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        supabase.storage.from('product-media').upload(filePath, blob, {
          contentType: blob.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          upsert: true
        }).catch(() => {});
      } catch (cloudErr) {}
    }

    return localBlobUrl;
  } catch (err) {
    // Si CORS bloque le fetch, on garde l'URL distante
    return url;
  }
}

/**
 * Récupère immédiatement l'URL locale si déjà en cache, sinon retourne l'original
 */
export function getCachedBlobUrl(url) {
  if (!url) return '';
  if (memoryBlobMap.has(url)) return memoryBlobMap.get(url);
  return url;
}

/**
 * ⚡ Télécharge et met en cache toutes les photos et vidéos d'un produit
 */
export async function cacheProductImagesAndVideos(product) {
  if (!product) return;

  const tasks = [];

  // Photos
  if (Array.isArray(product.images)) {
    product.images.forEach(imgUrl => {
      if (imgUrl && typeof imgUrl === 'string' && !imgUrl.startsWith('data:') && !imgUrl.startsWith('blob:')) {
        tasks.push(cacheMediaUrl(imgUrl));
      }
    });
  }

  // Vidéos
  const videos = Array.isArray(product.videos) ? product.videos : (product.videoDemo?.videoUrl ? [product.videoDemo.videoUrl] : []);
  videos.forEach(vidUrl => {
    if (vidUrl && typeof vidUrl === 'string' && !vidUrl.startsWith('data:') && !vidUrl.startsWith('blob:')) {
      tasks.push(cacheMediaUrl(vidUrl));
    }
  });

  if (tasks.length > 0) {
    Promise.allSettled(tasks).catch(() => {});
  }
}

/**
 * 📦 Télécharge en arrière-plan tous les médias d'une liste de produits
 */
export function preloadAndCacheCatalog(products = []) {
  if (!Array.isArray(products) || products.length === 0) return;

  // Lancement en tâche de fond douce
  setTimeout(() => {
    products.forEach((prod, index) => {
      setTimeout(() => {
        cacheProductImagesAndVideos(prod);
      }, index * 250); // Espace les téléchargements pour fluidifier le réseau
    });
  }, 1000);
}

/**
 * 🪝 Hook React pour obtenir l'URL locale en cache d'un média avec mise à jour automatique
 */
export function useCachedMedia(url) {
  const [resolvedUrl, setResolvedUrl] = useState(() => getCachedBlobUrl(url));

  useEffect(() => {
    let isMounted = true;
    if (!url) {
      setResolvedUrl('');
      return;
    }

    if (memoryBlobMap.has(url)) {
      setResolvedUrl(memoryBlobMap.get(url));
      return;
    }

    cacheMediaUrl(url).then(localUrl => {
      if (isMounted && localUrl) {
        setResolvedUrl(localUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return resolvedUrl || url;
}

