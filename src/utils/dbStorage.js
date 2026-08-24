// 🗄️ MOTEUR DE STOCKAGE HAUTE CAPACITÉ SUPABASE CLOUD + INDEXEDDB & BACKEND DISK
// Élimine toute limite de stockage et permet une synchronisation universelle Cloud / PC / Mobile

import { supabase, isSupabaseConfigured } from './supabaseClient';

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

// 💾 Sauvegarde dans Supabase Cloud + IndexedDB locale
export async function saveAllProductsToDb(products, workspaceId = 'ws_quincaillerie') {
  // 1. Sauvegarde Cloud Supabase
  if (supabase && isSupabaseConfigured && Array.isArray(products) && products.length > 0) {
    try {
      const rows = products.map(p => ({
        id: p.id,
        workspace_id: p.workspaceId || workspaceId,
        sku: p.sku || 'SKU-001',
        title_fr: p.titleFr || 'Article',
        title_cn: p.titleCn || '',
        category: p.category || 'all',
        material: p.material || '',
        dimensions: p.dimensions || '',
        images: p.images || [],
        video_demo: p.videoDemo || null,
        specifications: p.specifications || [],
        factory_name: p.factoryName || '',
        factory_city: p.factoryCity || '',
        tier_pricing: p.tierPricing || [],
        moq: p.moq || '1 pièce',
        suppliers: p.suppliers || [],
        price_cny: parseFloat(p.priceCny) || 0,
        unit: p.unit || 'Pièce (pc)',
        source_url: p.sourceUrl || ''
      }));

      await supabase.from('products').upsert(rows);
    } catch (sbErr) {
      console.warn('Erreur synchronisation Supabase:', sbErr);
    }
  }

  // 2. Sauvegarde locale IndexedDB
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PRODUCTS], 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    
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

// 📥 Chargement depuis Supabase Cloud (Priorité absolue) ou IndexedDB locale
export async function loadAllProductsFromDb(workspaceId = 'ws_quincaillerie') {
  // 1. Essai de chargement depuis Supabase Cloud
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data.map(r => ({
          id: r.id,
          workspaceId: r.workspace_id,
          sku: r.sku,
          titleFr: r.title_fr,
          titleCn: r.title_cn,
          category: r.category,
          material: r.material,
          dimensions: r.dimensions,
          images: r.images || [],
          videoDemo: r.video_demo,
          specifications: r.specifications || [],
          factoryName: r.factory_name,
          factoryCity: r.factory_city,
          tierPricing: r.tier_pricing || [],
          moq: r.moq,
          suppliers: r.suppliers || [],
          priceCny: r.price_cny,
          unit: r.unit,
          sourceUrl: r.source_url
        }));
      }
    } catch (sbErr) {
      console.warn('Erreur chargement Supabase:', sbErr);
    }
  }

  // 2. Repli vers IndexedDB locale
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
