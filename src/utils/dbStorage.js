// 🗄️ MOTEUR DE STOCKAGE HAUTE CAPACITÉ INDEXEDDB & BACKEND DISK
// Élimine la limite de 5MB du LocalStorage et permet de stocker des gigaoctets de dossiers lourds

const DB_NAME = 'QuinSourceDossiersDB';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products_dossiers';
const STORE_CATEGORIES = 'categories';
const STORE_SETTINGS = 'settings';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 💾 Sauvegarde dans IndexedDB (Capacité illimitée en Go)
export async function saveAllProductsToDb(products) {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PRODUCTS], 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    
    // Vider puis réinsérer tous les produits
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = resolve;
      clearReq.onerror = reject;
    });

    for (const prod of products) {
      store.put(prod);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn('Erreur sauvegarde IndexedDB:', err);
  }
}

// 📥 Chargement depuis IndexedDB
export async function loadAllProductsFromDb() {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PRODUCTS], 'readonly');
    const store = tx.objectStore(STORE_PRODUCTS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erreur chargement IndexedDB:', err);
    return [];
  }
}

// 🌐 SYNC DISQUE SERVEUR (/api/products-db)
export async function syncProductsToServerDisk(products) {
  try {
    const res = await fetch('/api/products-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });
    return res.ok;
  } catch (e) {
    console.warn('Serveur local non joignable pour sync disque:', e);
    return false;
  }
}

export async function loadProductsFromServerDisk() {
  try {
    const res = await fetch('/api/products-db');
    if (res.ok) {
      const data = await res.json();
      if (data && data.products && Array.isArray(data.products) && data.products.length > 0) {
        return data.products;
      }
    }
  } catch (e) {
    console.warn('Impossible de charger depuis le disque serveur:', e);
  }
  return null;
}
