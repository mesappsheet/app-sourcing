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

export function parseProductVideos(videoDemo, videos) {
  if (Array.isArray(videos) && videos.length > 0) {
    return videos.filter(v => typeof v === 'string' && v.trim().length > 0);
  }
  if (!videoDemo) return [];
  if (typeof videoDemo === 'string') {
    try {
      const parsed = JSON.parse(videoDemo);
      if (Array.isArray(parsed)) return parsed.filter(v => typeof v === 'string' && v.trim().length > 0);
    } catch (e) {}
    return [videoDemo].filter(Boolean);
  }
  if (typeof videoDemo === 'object') {
    if (Array.isArray(videoDemo.videos)) return videoDemo.videos.filter(Boolean);
    if (videoDemo.videoUrl) return [videoDemo.videoUrl].filter(Boolean);
  }
  return [];
}

// 💾 Sauvegarde dans Supabase Cloud + IndexedDB locale
export async function saveAllProductsToDb(products, workspaceId = 'ws_quincaillerie') {
  // 1. Sauvegarde Cloud Supabase
  if (supabase && isSupabaseConfigured && Array.isArray(products) && products.length > 0) {
    try {
      const rows = products.map(p => {
        const productVideos = parseProductVideos(p.videoDemo, p.videos);
        return {
          id: p.id,
          workspace_id: p.workspaceId || workspaceId,
          sku: p.sku || 'SKU-001',
          title_fr: p.titleFr || 'Article',
          title_cn: p.titleCn || '',
          category: p.category || 'all',
          material: p.material || '',
          dimensions: p.dimensions || '',
          images: p.images || [],
          video_demo: productVideos.length > 0 ? JSON.stringify(productVideos) : null,
          specifications: p.specifications || [],
          factory_name: p.factoryName || '',
          factory_city: p.factoryCity || '',
          tier_pricing: p.tierPricing || [],
          moq: p.moq || '1 pièce',
          suppliers: p.suppliers || [],
          price_cny: parseFloat(p.priceCny) || 0,
          unit: p.unit || 'Pièce (pc)',
          source_url: p.sourceUrl || ''
        };
      });

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
        return data.map(r => {
          const vids = parseProductVideos(r.video_demo, r.videos);
          return {
            id: r.id,
            workspaceId: r.workspace_id,
            sku: r.sku,
            titleFr: r.title_fr,
            titleCn: r.title_cn,
            category: (r.category && r.category !== 'all') ? r.category : 'inbox',
            material: r.material,
            dimensions: r.dimensions,
            images: r.images || [],
            videos: vids,
            videoDemo: vids[0] || (r.video_demo && typeof r.video_demo === 'string' && !r.video_demo.startsWith('[') ? r.video_demo : null),
            specifications: r.specifications || [],
            factoryName: r.factory_name,
            factoryCity: r.factory_city,
            tierPricing: r.tier_pricing || [],
            moq: r.moq,
            suppliers: r.suppliers || [],
            priceCny: r.price_cny,
            unit: r.unit,
            sourceUrl: r.source_url
          };
        });
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

// 🌐 GESTION DES CATÉGORIES & SOUS-CATÉGORIES DANS SUPABASE CLOUD & INDEXEDDB
export async function saveCategoriesToDb(categories, workspaceId = 'ws_quincaillerie') {
  if (!categories || !Array.isArray(categories)) return;

  // 1. Sauvegarde locale
  try {
    localStorage.setItem(`ws_categories_${workspaceId}`, JSON.stringify(categories));
    if (workspaceId === 'ws_quincaillerie') {
      localStorage.setItem('quin_source_categories', JSON.stringify(categories));
    }
  } catch (e) {}

  // 2. Sauvegarde Cloud Supabase (Aplatissement pour table SQL)
  if (supabase && isSupabaseConfigured) {
    try {
      const flatRows = [];
      categories.forEach((mainCat, index) => {
        flatRows.push({
          id: mainCat.id,
          workspace_id: workspaceId,
          name: mainCat.name,
          icon: mainCat.icon || '📁',
          count: mainCat.count || 0
        });

        if (Array.isArray(mainCat.subCategories)) {
          mainCat.subCategories.forEach((sub, subIdx) => {
            flatRows.push({
              id: sub.id,
              workspace_id: workspaceId,
              name: sub.name,
              icon: sub.icon || '▫️',
              count: sub.count || 0
            });
          });
        }
      });

      if (flatRows.length > 0) {
        await supabase.from('categories').upsert(flatRows);
      }
    } catch (sbErr) {
      console.warn('Erreur sauvegarde catégories Supabase:', sbErr);
    }
  }
}

export async function loadCategoriesFromDb(workspaceId = 'ws_quincaillerie') {
  // 1. Chargement local prioritaire (conserve l'arborescence complète)
  try {
    const saved = localStorage.getItem(`ws_categories_${workspaceId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return null;
}

// 🗑️ Suppression d'un produit dans Supabase Cloud & IndexedDB
export async function deleteProductFromDb(productId) {
  if (supabase && isSupabaseConfigured && productId) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (e) {
      console.warn('Erreur suppression Supabase:', e);
    }
  }
}

// 📦 Déplacement atomique d'un produit vers une catégorie / sous-catégorie
export async function updateProductCategoryInDb(productId, newCategory, workspaceId = 'ws_quincaillerie') {
  if (supabase && isSupabaseConfigured && productId) {
    try {
      await supabase
        .from('products')
        .update({ category: newCategory, updated_at: new Date().toISOString() })
        .eq('id', productId);
    } catch (e) {
      console.warn('Erreur mise à jour catégorie Supabase:', e);
    }
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


// 💾 Sauvegarde atomique d'un produit individuel dans Supabase Cloud & IndexedDB
export async function saveProductToDb(product, workspaceId = 'ws_quincaillerie') {
  if (!product) return;

  // 1. Sauvegarde Cloud Supabase
  if (supabase && isSupabaseConfigured) {
    try {
      const productVideos = parseProductVideos(product.videoDemo, product.videos);
      const row = {
        id: product.id,
        workspace_id: product.workspaceId || workspaceId,
        sku: product.sku || 'SKU-001',
        title_fr: product.titleFr || 'Article',
        title_cn: product.titleCn || '',
        category: product.category || 'inbox',
        material: product.material || '',
        dimensions: product.dimensions || '',
        images: product.images || [],
        video_demo: productVideos.length > 0 ? JSON.stringify(productVideos) : null,
        specifications: product.specifications || [],
        factory_name: product.factoryName || '',
        factory_city: product.factoryCity || '',
        tier_pricing: product.tierPricing || [],
        moq: String(product.moq || '1 pièce'),
        suppliers: product.suppliers || [],
        price_cny: parseFloat(product.priceCny) || 0,
        unit: product.unit || 'Pièce (pc)',
        source_url: product.sourceUrl || ''
      };

      await supabase.from('products').upsert(row);
      console.log('✅ Produit synchronisé avec succès dans Supabase Cloud !');
    } catch (sbErr) {
      console.warn('Erreur synchronisation Supabase produit unique:', sbErr);
    }
  }

  // 2. Sauvegarde locale IndexedDB
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_PRODUCTS], 'readwrite');
    const store = tx.objectStore(STORE_PRODUCTS);
    store.put(product);
  } catch (err) {
    console.warn('Erreur sauvegarde IndexedDB produit unique:', err);
  }
}
