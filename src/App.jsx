import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Sparkles, 
  FolderCog, 
  Layers, 
  Zap,
  Inbox,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { CATEGORIES, DEFAULT_CATEGORIES_TREE, INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './data/catalogData';
import { INITIAL_WORKSPACES, WORKSPACE_TEMPLATES } from './data/workspacesData';

import { Navbar } from './components/Navbar';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ArticleDetailDrawer } from './components/ArticleDetailDrawer';
import { PricingCalculatorModal } from './components/PricingCalculatorModal';
import { AddArticleModal } from './components/AddArticleModal';
import { EditArticleModal } from './components/EditArticleModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { ManageWorkspacesModal } from './components/ManageWorkspacesModal';
import { FullScreenImageViewer } from './components/FullScreenImageViewer';
import { LoginPage } from './components/LoginPage';
import { ContextMenuCascade } from './components/ContextMenuCascade';
import { CapturedMediaHub } from './components/CapturedMediaHub';
import { InboxTrashView } from './components/InboxTrashView';

import { 
  saveAllProductsToDb, 
  loadAllProductsFromDb, 
  deleteProductFromDb,
  updateProductCategoryInDb,
  saveCategoriesToDb,
  loadCategoriesFromDb,
  syncProductsToServerDisk, 
  loadProductsFromServerDisk,
  getDeletedProductIds,
  markProductAsDeleted,
  unmarkProductAsDeleted
} from './utils/dbStorage';
import { preloadAndCacheCatalog, cacheProductImagesAndVideos } from './utils/indexedMediaDB';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';

export function App() {
  // 🔐 0. AUTHENTIFICATION & PWA (Mode Propriétaire / Google / Email)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('quin_source_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [installPrompt, setInstallPrompt] = useState(null);

  // 🏢 1. ESPACES DE SOURCING MULTI-PROJETS (Workspaces)
  const [workspaces, setWorkspaces] = useState(() => {
    const saved = localStorage.getItem('quin_source_workspaces_list');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    const saved = localStorage.getItem('quin_source_active_ws');
    return saved || 'ws_quincaillerie';
  });

  // 🧹 PURGE AUTOMATIQUE DU VIEUX CACHE OBSOLÈTE (Base 100% Vierge & Zéro Résidu)
  const APP_DATA_VERSION = 'v5.0_clean_empty_database_2026';
  try {
    if (localStorage.getItem('app_data_version') !== APP_DATA_VERSION) {
      localStorage.removeItem('quin_source_products');
      localStorage.removeItem('ws_products_ws_quincaillerie');
      localStorage.removeItem('ws_products_ws_cuisines');
      localStorage.removeItem('ws_products_ws_outillage');
      localStorage.removeItem('ws_products_ws_electromenager');
      localStorage.removeItem('ws_products_ws_vetements');
      localStorage.removeItem('ws_products_ws_chaussures');
      localStorage.removeItem('ws_products_ws_electronique');
      localStorage.removeItem('ws_products_ws_mobilier');
      localStorage.removeItem('quin_source_latest_import');
      localStorage.setItem('app_data_version', APP_DATA_VERSION);
      try {
        indexedDB.deleteDatabase('QuinSourceDossiersDB');
        indexedDB.deleteDatabase('AppSourcingMediaDB');
      } catch (idbErr) {}
    }
  } catch (e) {}

  // 📦 2. BASE DE DONNÉES DES ARTICLES PAR ESPACE (Démarrage 100% Vierge / Source Cloud Unifiée)
  const [allProductsByWs, setAllProductsByWs] = useState(() => {
    const map = {};
    INITIAL_WORKSPACES.forEach(ws => {
      map[ws.id] = [];
    });
    return map;
  });

  // 🗄️ 3. RAYONS / CATÉGORIES PAR ESPACE
  const [allCategoriesByWs, setAllCategoriesByWs] = useState(() => {
    const map = {};
    
    // Quincaillerie
    const savedQuinCat = localStorage.getItem('quin_source_categories');
    map.ws_quincaillerie = savedQuinCat ? JSON.parse(savedQuinCat) : CATEGORIES;

    // Autres espaces avec leurs modèles de catégories
    INITIAL_WORKSPACES.forEach(ws => {
      if (ws.id !== 'ws_quincaillerie') {
        const savedWsCat = localStorage.getItem(`ws_categories_${ws.id}`);
        if (savedWsCat) {
          map[ws.id] = JSON.parse(savedWsCat);
        } else {
          const tpl = WORKSPACE_TEMPLATES.find(t => t.id === `tpl_${ws.id.replace('ws_', '')}`);
          map[ws.id] = tpl ? tpl.categories : CATEGORIES;
        }
      }
    });

    return map;
  });

  // Articles & Rayons de l'espace actif
  const products = allProductsByWs[activeWorkspaceId] || [];

  

  
  // 📥 Téléchargement & Mise en cache automatique des photos/vidéos dans IndexedDB
  useEffect(() => {
    if (products && products.length > 0) {
      preloadAndCacheCatalog(products);
    }
  }, [activeWorkspaceId, products?.length]);

  const categories = allCategoriesByWs[activeWorkspaceId] || CATEGORIES;

  const [currentTab, setCurrentTab] = useState('catalog');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Settings & Currency
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('quin_source_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Modals & Menu Contextuel Clic Droit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageWorkspacesOpen, setIsManageWorkspacesOpen] = useState(false);
  const [manageWsInitialCreate, setManageWsInitialCreate] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // 🖱️ Menu Contextuel Clic Droit en Cascade
  const [contextMenuState, setContextMenuState] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    product: null
  });

  // FullScreen High-Resolution Image Viewer
  const [imageViewerState, setImageViewerState] = useState({
    isOpen: false,
    product: null,
    initialIndex: 0
  });

  const handleOpenImageViewer = (prod, index = 0) => {
    setImageViewerState({
      isOpen: true,
      product: prod,
      initialIndex: index
    });
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // 🎬 Section Photos & Vidéos Capturées du Magasin d'Arrivage
  const [inboxSubTab, setInboxSubTab] = useState('products'); // 'products' | 'media'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSyncingExtension, setIsSyncingExtension] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null); // null | 'success' | 'empty'

  const [capturedMedia, setCapturedMedia] = useState(() => {
    try {
      const raw = localStorage.getItem('quin_source_captured_media');
      if (!raw) return [];
      const arr = JSON.parse(raw);
      // Nettoyage et déduplication automatique des médias au chargement
      const seen = new Set();
      return arr.filter(item => {
        const key = item.url || item.id || (item.title + item.poster);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (e) {
      return [];
    }
  });

  // Chargement asynchrone depuis IndexedDB pour restaurer les vidéos réelles Base64 / MP4
  useEffect(() => {
    import('./utils/indexedMediaDB').then(({ getAllMediaItemsFromDB }) => {
      getAllMediaItemsFromDB().then(dbItems => {
        if (dbItems && dbItems.length > 0) {
          setCapturedMedia(prev => {
            const map = new Map();
            prev.forEach(it => map.set(it.id, it));
            dbItems.forEach(it => {
              // Si la version DB contient la vraie vidéo Base64, la prioriser
              if (it.url && it.url.startsWith('data:video')) {
                map.set(it.id, it);
              } else if (!map.has(it.id)) {
                map.set(it.id, it);
              }
            });
            return Array.from(map.values());
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    try {
      // Stocker une version légère dans localStorage pour éviter le dépassement de quota
      const lightweight = capturedMedia.map(m => {
        if (m.url && m.url.startsWith('data:video') && m.url.length > 500000) {
          return { ...m, url: m.poster || 'local-video-stored-in-indexeddb' };
        }
        return m;
      });
      localStorage.setItem('quin_source_captured_media', JSON.stringify(lightweight));
    } catch (e) {}
  }, [capturedMedia]);

  // 🗑️ Section Corbeille du Magasin d'Arrivage
  const [trashedItems, setTrashedItems] = useState(() => {
    try {
      const raw = localStorage.getItem('quin_source_trashed_items');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('quin_source_trashed_items', JSON.stringify(trashedItems));
    } catch (e) {}
  }, [trashedItems]);

  const handleAddCapturedMedia = async (newMedia) => {
    if (!newMedia) return;

    // Enregistrement permanent dans IndexedDB (Capacité illimitée pour fichiers vidéos)
    try {
      const { saveMediaItemToDB } = await import('./utils/indexedMediaDB');
      await saveMediaItemToDB(newMedia);
    } catch (e) {}

    setCapturedMedia(prev => {
      // Déduplication absolue par ID, par URL ou par titre/poster
      const isDuplicate = prev.some(m => 
        m.id === newMedia.id || 
        (m.url && newMedia.url && m.url === newMedia.url) ||
        (m.poster && newMedia.poster && m.poster === newMedia.poster && m.title === newMedia.title)
      );
      if (isDuplicate) {
        return prev;
      }
      return [newMedia, ...prev];
    });
    showToast(`🎬 Média « ${newMedia.title || 'Média capturé'} » ajouté dans le Magasin d'Arrivage !`);
  };

  const handleRemoveCapturedMedia = (mediaId) => {
    setCapturedMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  // Déplacement d'un média capturé vers la Corbeille
  const handleTrashCapturedMedia = (media) => {
    const trashEntry = {
      trashId: 'trash-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      itemType: 'media',
      deletedAt: new Date().toISOString(),
      data: media
    };
    setCapturedMedia(prev => prev.filter(m => m.id !== media.id));
    setTrashedItems(prev => [trashEntry, ...prev]);
    showToast(`🗑️ Média « ${media.title || 'Média'} » placé dans la Corbeille.`);
  };

  // Déplacement d'un article d'arrivage vers la Corbeille
  const handleTrashProduct = (product) => {
    const trashEntry = {
      trashId: 'trash-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      itemType: 'product',
      deletedAt: new Date().toISOString(),
      data: product
    };
    
    setAllProductsByWs(prev => {
      const remaining = (prev[activeWorkspaceId] || []).filter(p => p.id !== product.id);
      saveAllProductsToDb(remaining, activeWorkspaceId);
      return {
        ...prev,
        [activeWorkspaceId]: remaining
      };
    });

    // ⚡ Suppression immédiate dans Supabase Cloud & IndexedDB
    deleteProductFromDb(product.id);

    // 🧹 Nettoyage de tout cache d'import résiduel
    try {
      localStorage.removeItem('quin_source_latest_import');
      fetch('/api/import-live?consume=true').catch(() => {});
    } catch (e) {}

    setTrashedItems(prev => [trashEntry, ...prev]);
    if (selectedProduct?.id === product.id) setSelectedProduct(null);
    showToast(`🗑️ Article « ${product.titleFr} » supprimé (placé dans la Corbeille).`);
  };

  // Restauration d'un élément depuis la Corbeille
  const handleRestoreItem = (trashEntry) => {
    if (trashEntry.itemType === 'media') {
      setCapturedMedia(prev => [trashEntry.data, ...prev]);
    } else if (trashEntry.itemType === 'product') {
      const restored = trashEntry.data;
      if (restored && restored.id) {
        unmarkProductAsDeleted(restored.id);
      }
      setAllProductsByWs(prev => {
        const current = prev[activeWorkspaceId] || [];
        const updated = [restored, ...current.filter(p => p.id !== restored.id)];
        saveAllProductsToDb(updated, activeWorkspaceId);
        return {
          ...prev,
          [activeWorkspaceId]: updated
        };
      });
      // ⚡ Restauration dans Supabase Cloud
      saveProductToDb(restored, activeWorkspaceId);
    }
    setTrashedItems(prev => prev.filter(i => i.trashId !== trashEntry.trashId));
    showToast(`♻️ « ${trashEntry.data?.titleFr || trashEntry.data?.title || 'Élément'} » restauré dans le Magasin d'Arrivage !`);
  };

  // Suppression définitive d'un élément de la Corbeille
  const handlePermanentDeleteItem = (trashEntry) => {
    if (trashEntry.itemType === 'product' && trashEntry.data?.id) {
      deleteProductFromDb(trashEntry.data.id);
    }
    setTrashedItems(prev => prev.filter(i => i.trashId !== trashEntry.trashId));
    showToast(`❌ Élément définitivement supprimé.`);
  };

  // Vidage complet de la Corbeille
  const handleEmptyTrash = () => {
    trashedItems.forEach(item => {
      if (item.itemType === 'product' && item.data?.id) {
        deleteProductFromDb(item.data.id);
      }
    });
    setTrashedItems([]);
    showToast(`🧹 La Corbeille a été entièrement vidée.`);
  };

  const handleAssignMediaToProduct = (media, targetProductId) => {
    const currentList = allProductsByWs[activeWorkspaceId] || [];
    const prod = currentList.find(p => p.id === targetProductId);
    if (!prod) return;

    let updatedProd = { ...prod };
    if (media.type === 'video') {
      const existingVids = Array.isArray(prod.videos) ? prod.videos : (prod.videoDemo?.videoUrl ? [prod.videoDemo.videoUrl] : []);
      const newVids = existingVids.includes(media.url) ? existingVids : [media.url, ...existingVids];
      const existingImgs = Array.isArray(prod.images) ? prod.images : [];
      const newImgs = (media.poster && !existingImgs.includes(media.poster)) ? [media.poster, ...existingImgs] : existingImgs;

      updatedProd = {
        ...updatedProd,
        hasVideoDemo: true,
        videos: newVids,
        images: newImgs.length > 0 ? newImgs : prod.images,
        videoDemo: {
          ...(typeof prod.videoDemo === 'object' ? prod.videoDemo : {}),
          videoUrl: newVids[0] || media.url,
          poster: media.poster || prod.videoDemo?.poster || '',
          source: media.platform || prod.videoDemo?.source || 'Vidéo Démo'
        }
      };
    } else {
      const existingImgs = Array.isArray(prod.images) ? prod.images : [];
      const newImgs = existingImgs.includes(media.url) ? existingImgs : [media.url, ...existingImgs];
      updatedProd = {
        ...updatedProd,
        images: newImgs
      };
    }

    handleSaveProduct(updatedProd);
    handleRemoveCapturedMedia(media.id);
    showToast(`🎉 Média ajouté avec succès à « ${prod.titleFr.slice(0, 30)}... » !`);
  };

  const handleCreateProductFromMedia = (media) => {
    if (!media) return;

    if (media.productData && typeof media.productData === 'object') {
      const fullProd = {
        ...media.productData,
        id: media.productData.id || ('prod-' + Date.now()),
        sku: media.productData.sku || ('QUIN-ARR-' + Math.random().toString(36).substring(2, 6).toUpperCase()),
        category: 'inbox',
        categoryName: 'Magasin d\'Arrivage',
        categoryIcon: '📥',
        images: (Array.isArray(media.productData.images) && media.productData.images.length > 0)
          ? media.productData.images
          : (media.poster ? [media.poster] : (media.url ? [media.url] : ['https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg'])),
        specifications: media.productData.specifications || media.specifications || [],
        tierPricing: media.productData.tierPricing || media.tierPricing || [],
        factoryName: media.productData.factoryName || media.factoryName || 'Fournisseur Vérifié Chine',
        factoryCity: media.productData.factoryCity || media.factoryCity || 'Guangdong, Chine',
        suppliers: (Array.isArray(media.productData.suppliers) && media.productData.suppliers.length > 0)
          ? media.productData.suppliers
          : [
              {
                id: 'sup-' + Date.now(),
                name: media.factoryName || 'Usine Vérifiée ' + (media.platform || 'Alibaba'),
                city: media.factoryCity || 'Guangdong, Chine',
                country: 'Chine',
                badge: 'Verified Supplier',
                years: '5 ans d\'expérience',
                priceCny: media.priceCny || 0.42,
                priceFcfa: media.priceFcfa || 36,
                moq: media.moq || 50000,
                isPreferred: true
              }
            ]
      };
      handleImportFromExtension(fullProd);
      handleRemoveCapturedMedia(media.id);
      showToast(`✨ « ${fullProd.titleFr.slice(0, 30)}... » créé dans le Magasin d'Arrivage avec toutes ses photos HD et caractéristiques !`);
      return;
    }

    const isVideo = media.type === 'video';
    const posterImg = media.poster || (isVideo ? null : media.url);
    const newProd = {
      id: 'prod-' + Date.now(),
      sku: 'QUIN-ARR-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      category: 'inbox',
      categoryName: 'Magasin d\'Arrivage',
      categoryIcon: '📥',
      titleFr: media.title || 'Nouvel Article Capturé',
      titleCn: '',
      unit: 'Pièce (pc)',
      priceCny: media.priceCny || 0.42,
      priceFcfa: media.priceFcfa || 36,
      basePriceCny: media.priceCny || 0.42,
      moq: media.moq || 50000,
      images: posterImg ? [posterImg] : ['https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg'],
      videos: isVideo ? [media.url] : [],
      hasVideoDemo: isVideo,
      videoDemo: isVideo ? { 
        videoUrl: media.url, 
        poster: media.poster || '',
        source: media.platform || 'Démo Usine',
        views: '150K vues' 
      } : null,
      specifications: media.specifications || [],
      tierPricing: media.tierPricing || [],
      factoryName: media.factoryName || 'Fournisseur Vérifié Chine',
      factoryCity: media.factoryCity || 'Guangdong, Chine',
      suppliers: [
        {
          id: 'sup-' + Date.now(),
          name: media.factoryName || 'Fournisseur Direct Chine',
          city: media.factoryCity || 'Guangdong, Chine',
          badge: 'Verified Supplier',
          priceCny: media.priceCny || 0.42,
          priceFcfa: media.priceFcfa || 36,
          moq: media.moq || 50000,
          isPreferred: true
        }
      ]
    };
    handleImportFromExtension(newProd);
    handleRemoveCapturedMedia(media.id);
    showToast(`✨ Nouvel article créé dans le Magasin d'Arrivage !`);
  };

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // 🗄️ CHARGEMENT INITIAL HAUTE CAPACITÉ & SYNC TEMPS RÉEL
  useEffect(() => {
    let isMounted = true;

    // 🔄 Fonction de synchronisation Cloud Supabase instantanée
    const refreshFromCloud = async () => {
      try {
        const cloudProducts = await loadAllProductsFromDb(activeWorkspaceId);
        if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0 && isMounted) {
          setAllProductsByWs(prev => {
            const current = prev[activeWorkspaceId] || [];
            if (cloudProducts.length !== current.length || (cloudProducts[0] && cloudProducts[0].id !== current[0]?.id)) {
              return {
                ...prev,
                [activeWorkspaceId]: cloudProducts
              };
            }
            return prev;
          });
        }
      } catch (e) {}
    };

    async function loadDataFromHighCapacityStorage() {
      try {
        // 1. Essai de chargement prioritaire depuis Supabase Cloud
        const cloudProducts = await loadAllProductsFromDb(activeWorkspaceId);
        if (cloudProducts && Array.isArray(cloudProducts) && isMounted) {
          try {
            localStorage.setItem(`ws_products_${activeWorkspaceId}`, JSON.stringify(cloudProducts));
            if (activeWorkspaceId === 'ws_quincaillerie') {
              localStorage.setItem('quin_source_products', JSON.stringify(cloudProducts));
            }
          } catch (e) {}

          setAllProductsByWs(prev => ({
            ...prev,
            [activeWorkspaceId]: cloudProducts
          }));
          setIsInitialLoadDone(true);
          return;
        }

        // 2. Essai de chargement depuis le fichier disque serveur
        const serverProducts = await loadProductsFromServerDisk();
        if (serverProducts && serverProducts.length > 0 && isMounted) {
          try {
            localStorage.setItem('quin_source_products', JSON.stringify(serverProducts));
          } catch (e) {}

          setAllProductsByWs(prev => ({
            ...prev,
            ws_quincaillerie: serverProducts
          }));
          setIsInitialLoadDone(true);
          return;
        }

        // 3. Essai de chargement depuis la base IndexedDB locale
        const dbProducts = await loadAllProductsFromDb(activeWorkspaceId);
        if (dbProducts && dbProducts.length > 0 && isMounted) {
          setAllProductsByWs(prev => ({
            ...prev,
            [activeWorkspaceId]: dbProducts
          }));
        }
      } finally {
        if (isMounted) setIsInitialLoadDone(true);
      }
    }

    loadDataFromHighCapacityStorage();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  // ⚡ FONCTION UNIVERSELLE DE CONVERSION ET D'IMPORTATION DEPUIS L'EXTENSION (100% Infaillible)
  const handleImportFromExtension = (data) => {
    if (!data) return false;
    
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        return false;
      }
    }

    if (!parsedData || (!parsedData.title && !parsedData.url)) return false;

    // Nettoyage strict du nom d'usine
    let cleanCompany = parsedData.company || parsedData.factoryName || '';
    const badCompanyWords = ['afficher plus', 'voir plus', 'see more', 'avis', 'boutique', 'évaluation', 'feedback', 'suivre', 'propos d\'alibaba', 'centre d\'aide'];
    if (!cleanCompany || badCompanyWords.some(w => cleanCompany.toLowerCase().includes(w))) {
      cleanCompany = parsedData.platform ? `Usine Vérifiée ${parsedData.platform}` : 'Fournisseur Direct Chine';
    }

    let cleanCity = parsedData.location || parsedData.factoryCity || '';
    if (!cleanCity || cleanCity.includes('Adresse de livraison')) {
      cleanCity = 'Guangdong, Chine';
    }

    let basePriceFcfa = 0;
    if (parsedData.basePriceFcfa && Number(parsedData.basePriceFcfa) > 0) {
      basePriceFcfa = Number(parsedData.basePriceFcfa);
    } else if (parsedData.fcfaPrices && parsedData.fcfaPrices.length > 0) {
      basePriceFcfa = parsedData.fcfaPrices[0];
    } else if (parsedData.priceFcfa && Number(parsedData.priceFcfa) > 0) {
      basePriceFcfa = parseInt(parsedData.priceFcfa, 10);
    } else if (parsedData.tierPricing && parsedData.tierPricing.length > 0) {
      basePriceFcfa = parsedData.tierPricing[0].priceFcfa;
    } else if (parsedData.priceCny && Number(parsedData.priceCny) > 0) {
      basePriceFcfa = Math.round(Number(parsedData.priceCny) * 85);
    } else {
      basePriceFcfa = 3500;
    }

    const priceCny = (parsedData.basePriceCny && Number(parsedData.basePriceCny) > 0)
      ? Number(parsedData.basePriceCny)
      : (parsedData.priceCny && Number(parsedData.priceCny) > 0
        ? Number(parsedData.priceCny)
        : parseFloat((basePriceFcfa / 85).toFixed(2)));

    const tiers = Array.isArray(parsedData.tierPricing) && parsedData.tierPricing.length > 0 ? parsedData.tierPricing : [];
    const detectedMoq = parsedData.moq || (tiers[0]?.minQty) || '1 pièce';

    // 🌟 OPTION B : ENRICHISSEMENT & COMPLÉMENT D'UN ARTICLE EXISTANT (Multi-Fournisseurs)
    if (parsedData.importMode === 'enrich' && parsedData.targetProductId) {
      let targetProductFound = null;
      setAllProductsByWs(prev => {
        const currentList = prev[activeWorkspaceId] || [];
        const updatedList = currentList.map(p => {
          if (p.id === parsedData.targetProductId) {
            // Créer la nouvelle usine comparative avec ses paliers dédiés
            const newSupplier = {
              id: `sup-${Date.now()}`,
              name: cleanCompany,
              platform: (parsedData.url && parsedData.url.includes('pinduoduo')) ? 'pinduoduo' : 'alibaba',
              city: cleanCity,
              priceCny: priceCny,
              moq: detectedMoq,
              priceTiers: tiers,
              rating: 4.9,
              badge: parsedData.badge || 'Verified Supplier',
              years: parsedData.years || '4 ans d\'expérience',
              isPreferred: false,
              url: parsedData.url || '',
              leadTime: '5 - 15 jours'
            };

            // 1. Fusion des fournisseurs sans doublon de nom
            const existingSuppliers = Array.isArray(p.suppliers) ? p.suppliers : [];
            const mergedSuppliers = [
              ...existingSuppliers.filter(s => s.name?.toLowerCase() !== cleanCompany.toLowerCase()),
              newSupplier
            ];

            // 2. Fusion et complément des caractéristiques techniques (sans écraser)
            const existingSpecs = Array.isArray(p.specifications) ? p.specifications : [];
            const newSpecs = Array.isArray(parsedData.specifications) ? parsedData.specifications : [];
            const existingLabels = new Set(existingSpecs.map(s => (s.label || '').toLowerCase().trim()));
            const mergedSpecs = [...existingSpecs];
            newSpecs.forEach(ns => {
              if (ns.label && !existingLabels.has(ns.label.toLowerCase().trim())) {
                mergedSpecs.push(ns);
                existingLabels.add(ns.label.toLowerCase().trim());
              }
            });

            // 3. Complément des photos HD
            const existingImages = Array.isArray(p.images) ? p.images : [];
            const newImages = Array.isArray(parsedData.images) ? parsedData.images : [];
            const mergedImages = [...existingImages];
            newImages.forEach(img => {
              if (img && !mergedImages.includes(img)) mergedImages.push(img);
            });

            const bestPrice = Math.min(...mergedSuppliers.map(s => parseFloat(s.priceCny) || 99999));

            targetProductFound = {
              ...p,
              suppliers: mergedSuppliers,
              specifications: mergedSpecs,
              images: mergedImages.slice(0, 15),
              tierPricing: (p.tierPricing && p.tierPricing.length > 0) ? p.tierPricing : tiers,
              priceCny: bestPrice < 99999 ? bestPrice : p.priceCny
            };
            return targetProductFound;
          }
          return p;
        });
        return {
          ...prev,
          [activeWorkspaceId]: updatedList
        };
      });

      if (targetProductFound) {
        setSelectedProduct(targetProductFound);
        showToast(`🎉 Usine « ${cleanCompany.slice(0, 30)} » rattachée avec ses paliers MOQ !`);
        return true;
      }
    }

    // 🌟 OPTION A : CRÉATION / MISE À JOUR SANS DOUBLON DANS LE MAGASIN D'ARRIVAGE
    const rawTitle = (parsedData.title || 'Article Importé Alibaba')
      .replace(/&#39;/g, "'")
      .replace(/&eacute;/g, "é")
      .replace(/&ndash;/g, "–")
      .replace(/&amp;/g, "&")
      .replace(/\s*-\s*Alibaba\.com$/i, '')
      .replace(/\s*–\s*Buy Product on Alibaba\.com$/i, '')
      .trim();

    const normalizeUrl = (u) => (u ? u.split('?')[0].split('#')[0].trim().toLowerCase() : '');
    const cleanSourceUrl = normalizeUrl(parsedData.url || parsedData.sourceUrl || '');
    const cleanTitleSample = rawTitle.slice(0, 35).toLowerCase().trim();

    const currentList = allProductsByWs[activeWorkspaceId] || [];
    
    // Recherche stricte d'un article existant pour éviter les doublons
    const existingIndex = currentList.findIndex(p => {
      if (!p) return false;
      const pUrl = normalizeUrl(p.sourceUrl || '');
      if (cleanSourceUrl && pUrl && pUrl === cleanSourceUrl) return true;
      const pTitle = (p.titleFr || '').slice(0, 35).toLowerCase().trim();
      return pTitle && cleanTitleSample && pTitle === cleanTitleSample;
    });

    const hasRealVideo = Boolean(parsedData.videoUrl && parsedData.videoUrl.startsWith('http') && !parsedData.videoUrl.startsWith('blob:'));
    const finalImages = (Array.isArray(parsedData.images) && parsedData.images.length > 0) ? parsedData.images : (parsedData.mainImage ? [parsedData.mainImage] : []);

    let targetProduct;

    // 🌟 0. GESTION DE LA CRÉATION INSTANTANÉE D'UN NOUVEAU RAYON / SOUS-CATÉGORIE
    const targetWs = parsedData.targetWorkspaceId || parsedData.workspaceId || activeWorkspaceId;
    const effectiveCategory = (parsedData.category && parsedData.category !== 'inbox') ? parsedData.category : 'inbox';
    const effectiveCatName = parsedData.categoryName || (effectiveCategory === 'inbox' ? "Magasin d'Arrivage" : effectiveCategory);
    const effectiveCatIcon = parsedData.categoryIcon || (effectiveCategory === 'inbox' ? '📥' : '📦');

    if (parsedData.newCategory && parsedData.newCategory.id && parsedData.newCategory.name) {
      const newCat = parsedData.newCategory;

      setAllCategoriesByWs(prevCats => {
        const currentWsCats = prevCats[targetWs] || CATEGORIES;
        const clonedTree = JSON.parse(JSON.stringify(currentWsCats));

        let alreadyExists = false;
        clonedTree.forEach(group => {
          if (group.subCategories && group.subCategories.some(sub => sub.id === newCat.id)) {
            alreadyExists = true;
          }
        });

        if (!alreadyExists) {
          const targetGroup = clonedTree.find(g => !g.isInbox && g.id !== 'inbox') || clonedTree[1] || clonedTree[0];
          if (targetGroup) {
            if (!targetGroup.subCategories) targetGroup.subCategories = [];
            targetGroup.subCategories.push({
              id: newCat.id,
              name: newCat.name,
              icon: newCat.icon || '📦'
            });
          }
        }

        try {
          localStorage.setItem(`ws_categories_${targetWs}`, JSON.stringify(clonedTree));
          if (targetWs === 'ws_quincaillerie') {
            localStorage.setItem('quin_source_categories', JSON.stringify(clonedTree));
          }
        } catch (e) {}

        return {
          ...prevCats,
          [targetWs]: clonedTree
        };
      });
    }

    if (existingIndex >= 0) {
      // MISE À JOUR DE L'ARTICLE EXISTANT (Anti-Doublon Garanti)
      const oldProd = currentList[existingIndex];
      targetProduct = {
        ...oldProd,
        workspaceId: targetWs,
        titleFr: rawTitle,
        category: effectiveCategory,
        categoryName: effectiveCatName,
        categoryIcon: effectiveCatIcon,
        priceFcfa: basePriceFcfa,
        priceCny: priceCny,
        basePriceFcfa: basePriceFcfa,
        basePriceCny: priceCny,
        moq: detectedMoq,
        images: finalImages.length > 0 ? finalImages : oldProd.images,
        mainImage: finalImages[0] || oldProd.mainImage,
        specifications: (parsedData.specifications && parsedData.specifications.length > 0) ? parsedData.specifications : oldProd.specifications,
        tierPricing: (tiers && tiers.length > 0) ? tiers : oldProd.tierPricing,
        factoryName: cleanCompany || oldProd.factoryName,
        factoryCity: cleanCity || oldProd.factoryCity,
        hasVideoDemo: hasRealVideo,
        videos: hasRealVideo ? [parsedData.videoUrl] : [],
        updatedAt: new Date().toISOString(),
        injectedAt: parsedData.injectedAt || new Date().toISOString(),
        injectedAtFormatted: parsedData.injectedAtFormatted || new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    } else {
      // CRÉATION D'UN NOUVEL ARTICLE UNIQUE
      const nowIso = new Date().toISOString();
      const formattedDate = new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const sku = `IMP-${Date.now().toString().slice(-4)}`;
      targetProduct = {
        id: `prod-${Date.now()}`,
        sku,
        workspaceId: targetWs,
        titleFr: rawTitle,
        titleCn: parsedData.titleCn || '',
        category: effectiveCategory,
        categoryName: effectiveCatName,
        categoryIcon: effectiveCatIcon,
        material: parsedData.material || 'Standard Qualité Usine',
        dimensions: parsedData.dimensions || 'Standard Pro Export',
        images: finalImages,
        mainImage: finalImages[0] || '',
        hasVideoDemo: hasRealVideo,
        videos: hasRealVideo ? [parsedData.videoUrl] : [],
        videoDemo: hasRealVideo ? {
          source: parsedData.platform ? `Démo ${parsedData.platform}` : 'Démonstration Usine Réelle',
          videoUrl: parsedData.videoUrl,
          poster: parsedData.videoPoster || '',
          views: '100K vues'
        } : null,
        specifications: parsedData.specifications || [],
        factoryName: cleanCompany,
        factoryCity: cleanCity,
        tierPricing: tiers,
        moq: detectedMoq,
        suppliers: [
          {
            id: `sup-${Date.now()}`,
            name: cleanCompany,
            platform: (parsedData.url && parsedData.url.includes('pinduoduo')) ? 'pinduoduo' : 'alibaba',
            city: cleanCity,
            priceCny: priceCny,
            priceFcfa: basePriceFcfa,
            moq: detectedMoq,
            priceTiers: tiers,
            rating: 4.9,
            badge: parsedData.badge || 'Verified Supplier',
            years: parsedData.years || '4 ans d\'expérience',
            isPreferred: true,
            url: parsedData.url || parsedData.sourceUrl || '',
            leadTime: '5 - 15 jours'
          }
        ],
        basePriceCny: priceCny,
        priceCny: priceCny,
        priceFcfa: basePriceFcfa,
        unit: parsedData.unit || 'Pièce (pc)',
        sourceUrl: parsedData.url || parsedData.sourceUrl || '',
        createdAt: nowIso,
        updatedAt: nowIso,
        injectedAt: parsedData.injectedAt || nowIso,
        injectedAtFormatted: parsedData.injectedAtFormatted || formattedDate
      };
    }

    setAllProductsByWs(prev => {
      const list = prev[targetWs] || [];
      const withoutTarget = list.filter(p => p.id !== targetProduct.id && normalizeUrl(p.sourceUrl) !== cleanSourceUrl);
      const updatedList = [targetProduct, ...withoutTarget];
      saveAllProductsToDb(updatedList, targetWs);
      return {
        ...prev,
        [targetWs]: updatedList
      };
    });

    if (targetWs !== activeWorkspaceId) {
      setActiveWorkspaceId(targetWs);
    }

    // ⚡ Sauvegarde directe Supabase Cloud
    saveProductToDb(targetProduct, targetWs);

    // 📥 Téléchargement & Mise en cache locale automatique de toutes les photos & vidéos
    cacheProductImagesAndVideos(targetProduct);

    // 🧹 Nettoyage de la file d'attente pour éliminer les anciennes données
    try {
      localStorage.removeItem('quin_source_latest_import');
      fetch('/api/import-live?consume=true').catch(() => {});
    } catch (e) {}

    // ⚡ Basculer sur le bon onglet et afficher la notification
    setCurrentTab('catalog');
    setSelectedCategory(effectiveCategory);
    if (effectiveCategory === 'inbox') {
      setInboxSubTab('products');
    }
    setSearchQuery('');
    setSelectedProduct(targetProduct);

    if (parsedData.newCategory) {
      showToast(`✨ Nouveau rayon « ${effectiveCatName} » créé et « ${targetProduct.titleFr.slice(0, 26)}... » classé dedans !`);
    } else if (effectiveCategory !== 'inbox') {
      showToast(`🚀 « ${targetProduct.titleFr.slice(0, 26)}... » classé dans « ${effectiveCatName} » !`);
    } else {
      showToast(`🎉 « ${targetProduct.titleFr.slice(0, 26)}... » réceptionné dans le Magasin d'Arrivage !`);
    }
    return true;
  };

  // 💾 Synchronisation de l'article actuellement consulté dans l'application pour l'extension (Temps Réel)
  useEffect(() => {
    try {
      if (selectedProduct) {
        const payload = {
          id: selectedProduct.id,
          sku: selectedProduct.sku,
          titleFr: selectedProduct.titleFr
        };
        localStorage.setItem('quin_source_active_product', JSON.stringify(payload));
        window.__QUIN_ACTIVE_PRODUCT__ = payload;
        document.body.setAttribute('data-active-product-id', selectedProduct.id);
      } else {
        localStorage.removeItem('quin_source_active_product');
        window.__QUIN_ACTIVE_PRODUCT__ = null;
        document.body.removeAttribute('data-active-product-id');
      }
    } catch (e) {}
  }, [selectedProduct]);

  // ⚡ ÉCOUTEURS GLOBAUX EN DIRECT (Mémoire, CustomEvents, Polling & LocalStorage)
  useEffect(() => {
    let lastSeen = Date.now();

    // 1. Écoute des messages directs envoyés dans l'onglet (Produits & Médias)
    const handleWindowMessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'EXTENSION_DIRECT_IMPORT' || e.data.type === 'EXTENSION_INJECT_PRODUCT') {
        handleImportFromExtension(e.data.payload);
      } else if (e.data.type === 'CAPTURE_MEDIA' || e.data.type === 'EXTENSION_INJECT_MEDIA') {
        handleAddCapturedMedia(e.data.payload);
      }
    };
    window.addEventListener('message', handleWindowMessage);

    // 2. Écoute des événements personnalisés
    const handleCustomEvent = (e) => {
      if (e.detail) {
        if (e.detail.isMedia || e.detail.mediaUrl) {
          handleAddCapturedMedia(e.detail);
        } else {
          handleImportFromExtension(e.detail);
        }
      }
    };
    window.addEventListener('EXTENSION_IMPORT_EVENT', handleCustomEvent);
    window.addEventListener('CAPTURE_MEDIA_EVENT', (e) => {
      if (e.detail) handleAddCapturedMedia(e.detail);
    });

    // 3. Écoute du collage clavier (Ctrl+V)
    const handlePaste = (e) => {
      const text = e.clipboardData?.getData('text');
      if (text && text.includes('{') && (text.includes('fcfaPrices') || text.includes('specifications') || text.includes('alibaba.com'))) {
        handleImportFromExtension(text);
      }
    };
    window.addEventListener('paste', handlePaste);

    // 4. Polling ultra-rapide (HTTP + LocalStorage)
    const interval = setInterval(async () => {
      // LocalStorage check
      try {
        const rawSaved = localStorage.getItem('quin_source_latest_import');
        if (rawSaved) {
          const saved = JSON.parse(rawSaved);
          if (saved && saved.timestamp && saved.timestamp > lastSeen) {
            lastSeen = saved.timestamp;
            handleImportFromExtension(saved);
            return;
          }
        }
      } catch (e) {}

      // HTTP endpoint check
      try {
        const res = await fetch('/api/import-live');
        if (res.ok) {
          const data = await res.json();
          if (data && data.timestamp && data.timestamp > lastSeen && (data.title || data.url)) {
            lastSeen = data.timestamp;
            handleImportFromExtension(data);
          }
        }
      } catch (e) {}

      // Supabase Cloud live inbox check
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('workspace_id', activeWorkspaceId)
            .eq('category', 'inbox');

          if (!error && data && Array.isArray(data) && data.length > 0) {
            setAllProductsByWs(prev => {
              const currentList = prev[activeWorkspaceId] || [];
              const currentIds = new Set(currentList.map(p => p.id));
              const newItems = data.filter(d => !currentIds.has(d.id)).map(r => ({
                id: r.id,
                workspaceId: r.workspace_id,
                sku: r.sku,
                titleFr: r.title_fr,
                titleCn: r.title_cn,
                category: 'inbox',
                categoryName: 'Magasin d\'Arrivage',
                categoryIcon: '📥',
                material: r.material || 'Standard Qualité Usine',
                dimensions: r.dimensions || '',
                images: r.images || [],
                videos: typeof r.video_demo === 'string' && r.video_demo.startsWith('[') ? JSON.parse(r.video_demo) : [],
                specifications: r.specifications || [],
                factoryName: r.factory_name,
                factoryCity: r.factory_city,
                tierPricing: r.tier_pricing || [],
                moq: r.moq,
                suppliers: r.suppliers || [],
                priceCny: r.price_cny,
                priceFcfa: Math.round((r.price_cny || 0) * 85),
                unit: r.unit || 'Pièce (pc)',
                sourceUrl: r.source_url,
                createdAt: r.created_at,
                injectedAt: r.created_at,
                injectedAtFormatted: r.created_at ? new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null
              }));

              if (newItems.length > 0) {
                setSelectedCategory('inbox');
                setInboxSubTab('products');
                setSelectedProduct(newItems[0]);
                showToast(`🎉 « ${newItems[0].titleFr.slice(0, 30)}... » réceptionné dans le Magasin d'Arrivage !`);
                return {
                  ...prev,
                  [activeWorkspaceId]: [...newItems, ...currentList]
                };
              }
              return prev;
            });
          }
        } catch (sbErr) {}
      }
    }, 1500);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('EXTENSION_IMPORT_EVENT', handleCustomEvent);
      window.removeEventListener('paste', handlePaste);
      clearInterval(interval);
    };
  }, [activeWorkspaceId]);

  // 💾 SAUVEGARDE DES RAYONS PAR ESPACE
  useEffect(() => {
    if (!allCategoriesByWs) return;
    const currentCats = allCategoriesByWs[activeWorkspaceId] || [];
    try {
      localStorage.setItem(`ws_categories_${activeWorkspaceId}`, JSON.stringify(currentCats));
      if (activeWorkspaceId === 'ws_quincaillerie') {
        localStorage.setItem('quin_source_categories', JSON.stringify(currentCats));
      }
    } catch (e) {
      console.warn('LocalStorage categories error:', e);
    }
  }, [allCategoriesByWs, activeWorkspaceId]);

  // 💾 SAUVEGARDE DES ESPACES ET DE L'ESPACE ACTIF
  useEffect(() => {
    try {
      localStorage.setItem('quin_source_workspaces_list', JSON.stringify(workspaces));
      localStorage.setItem('quin_source_active_ws', activeWorkspaceId);
    } catch (e) {
      console.warn('LocalStorage workspaces error:', e);
    }
  }, [workspaces, activeWorkspaceId]);

  useEffect(() => {
    try {
      localStorage.setItem('quin_source_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage settings error:', e);
    }
  }, [settings]);

  // 🎨 SYNCHRONISATION DU THÈME
  useEffect(() => {
    const activeTheme = settings.theme || 'dark-midnight';
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [settings.theme]);

  // 🔐 SYNCHRONISATION AUTHENTIFICATION SUPABASE & PWA
  useEffect(() => {
    // 1. Interception de l'invite PWA pour installer l'application
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 2. Gestion de session Supabase Auth
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('quin_source_auth_user', JSON.stringify(session.user));
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('quin_source_auth_user', JSON.stringify(session.user));
        } else if (_event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('quin_source_auth_user');
        }
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        subscription?.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast("🎉 Application installée avec succès sur votre appareil !");
      setInstallPrompt(null);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    localStorage.removeItem('quin_source_auth_user');
    setUser(null);
    showToast("Déconnexion réussie");
  };

  // --- WORKSPACES MANAGEMENT HANDLERS ---
  const handleSelectWorkspace = (wsId) => {
    setActiveWorkspaceId(wsId);
    setSelectedProduct(null);
    setSelectedCategory('all');
    setSearchQuery('');
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    const targetWs = workspaces.find(w => w.id === wsId);
    showToast(`📂 Espace « ${targetWs?.name || 'Sourcing'} » activé !`);
  };

  const handleCreateWorkspace = (newWs, templateCategories) => {
    setWorkspaces(prev => [...prev, newWs]);
    setAllCategoriesByWs(prev => ({
      ...prev,
      [newWs.id]: templateCategories || CATEGORIES
    }));
    setAllProductsByWs(prev => ({
      ...prev,
      [newWs.id]: []
    }));
    setActiveWorkspaceId(newWs.id);
    setSelectedProduct(null);
    setSelectedCategory('all');
    setSearchQuery('');
    showToast(`🎉 Nouvel Espace « ${newWs.name} » créé avec succès !`);
  };

  const handleUpdateWorkspace = (wsId, updatedFields) => {
    setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, ...updatedFields } : w));
    showToast('✏️ Espace de sourcing mis à jour.');
  };

  const handleDeleteWorkspace = (wsId) => {
    if (workspaces.length <= 1) {
      alert('Vous devez conserver au moins un espace de sourcing.');
      return;
    }
    const wsToDelete = workspaces.find(w => w.id === wsId);
    const remaining = workspaces.filter(w => w.id !== wsId);
    setWorkspaces(remaining);

    if (activeWorkspaceId === wsId) {
      setActiveWorkspaceId(remaining[0].id);
      setSelectedProduct(null);
      setSelectedCategory('all');
    }

    // Nettoyer le stockage local
    localStorage.removeItem(`ws_products_${wsId}`);
    localStorage.removeItem(`ws_categories_${wsId}`);
    showToast(`🗑️ L'espace « ${wsToDelete?.name || ''} » a été supprimé.`);
  };

  const getWorkspaceProductCount = (wsId) => {
    return allProductsByWs[wsId]?.length || 0;
  };

  // Price Formatter (FCFA / EUR / USD / CNY)
  const formatPrice = (priceCny) => {
    const num = parseFloat(priceCny) || 0;
    const rate = settings?.rates?.[settings?.currency] || (settings?.currency === 'FCFA' ? 85.0 : 0.13);
    if (settings?.currency === 'CNY') {
      return `${num.toFixed(2)} ¥`;
    }
    if (settings?.currency === 'FCFA') {
      const val = Math.round(num * rate);
      return `${val.toLocaleString()} FCFA`;
    }
    if (settings?.currency === 'USD') {
      return `$${(num * rate).toFixed(2)}`;
    }
    return `${(num * rate).toFixed(2)} €`;
  };

  // 🗂️ Arborescence des catégories normalisée pour l'espace actif (avec Magasin d'Arrivage)
  const categoriesTree = useMemo(() => {
    const raw = allCategoriesByWs[activeWorkspaceId];
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      return DEFAULT_CATEGORIES_TREE;
    }
    const hasTree = raw.some(c => Array.isArray(c.subCategories));
    if (hasTree) {
      const realMainCount = raw.filter(c => c.id !== 'inbox' && c.id !== 'all').length;
      if (realMainCount <= 1) {
        return DEFAULT_CATEGORIES_TREE;
      }
      const hasInbox = raw.some(c => c.id === 'inbox');
      if (!hasInbox) {
        return [
          { id: 'inbox', name: 'Magasin d\'Arrivage', icon: '📥', isInbox: true, subCategories: [] },
          ...raw
        ];
      }
      return raw;
    }

    return DEFAULT_CATEGORIES_TREE;
  }, [allCategoriesByWs, activeWorkspaceId]);

  // Total & Inbox Counts
  const totalCount = products.length;
  // Articles non classés dans un rayon spécifique -> Magasin d'Arrivage
  const inboxCount = useMemo(() => {
    if (!Array.isArray(products)) return 0;
    const validSubIds = categoriesTree
      .filter(m => m.id !== 'inbox' && m.id !== 'all')
      .flatMap(m => [m.id, ...(m.subCategories || []).map(s => s.id)]);
    return products.filter(p => !p.category || p.category === 'inbox' || p.category === 'all' || !validSubIds.includes(p.category)).length;
  }, [products, categoriesTree]);

  // Calcul des compteurs par catégorie et sous-catégorie
  const categoryCounts = useMemo(() => {
    const counts = {
      all: products.length,
      inbox: inboxCount
    };

    categoriesTree.forEach(main => {
      let mainSum = 0;
      if (Array.isArray(main.subCategories)) {
        main.subCategories.forEach(sub => {
          const subCount = products.filter(p => p && p.category === sub.id).length;
          counts[sub.id] = subCount;
          mainSum += subCount;
        });
      }
      const directMainCount = products.filter(p => p && p.category === main.id).length;
      counts[main.id] = mainSum + directMainCount;
    });

    return counts;
  }, [products, categoriesTree, inboxCount]);

  // 🔍 DÉTECTION AUTOMATIQUE DES DOUBLONS DANS LE CATALOGUE
  const duplicateProductIds = useMemo(() => {
    const dups = new Set();
    if (!Array.isArray(products) || products.length <= 1) return dups;

    const urlMap = {};
    const titleMap = {};

    products.forEach(p => {
      if (!p) return;
      // 1. Même URL source
      if (p.sourceUrl && p.sourceUrl.length > 10) {
        const cleanUrl = p.sourceUrl.split('?')[0].trim().toLowerCase();
        if (urlMap[cleanUrl]) {
          dups.add(p.id);
          dups.add(urlMap[cleanUrl]);
        } else {
          urlMap[cleanUrl] = p.id;
        }
      }

      // 2. Même Titre FR significatif
      if (p.titleFr && p.titleFr.length > 8) {
        const cleanTitle = p.titleFr.trim().toLowerCase().slice(0, 50);
        if (titleMap[cleanTitle]) {
          dups.add(p.id);
          dups.add(titleMap[cleanTitle]);
        } else {
          titleMap[cleanTitle] = p.id;
        }
      }
    });

    return dups;
  }, [products]);

  // Produits filtrés selon la catégorie / sous-catégorie sélectionnée
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(prod => {
      if (!prod) return false;
      
      let matchCat = true;
      if (selectedCategory === 'all') {
        matchCat = true;
      } else if (selectedCategory === 'inbox') {
        const validSubIds = categoriesTree
          .filter(m => m.id !== 'inbox' && m.id !== 'all')
          .flatMap(m => [m.id, ...(m.subCategories || []).map(s => s.id)]);
        matchCat = (!prod.category || prod.category === 'inbox' || prod.category === 'all' || !validSubIds.includes(prod.category));
      } else {
        const mainCatMatch = categoriesTree.find(m => m.id === selectedCategory);
        if (mainCatMatch && Array.isArray(mainCatMatch.subCategories) && mainCatMatch.subCategories.length > 0) {
          const subIds = [mainCatMatch.id, ...mainCatMatch.subCategories.map(s => s.id)];
          matchCat = subIds.includes(prod.category);
        } else {
          matchCat = prod.category === selectedCategory;
        }
      }

      if (!searchQuery.trim()) return matchCat;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = prod.titleFr?.toLowerCase()?.includes(q) || (prod.titleCn && String(prod.titleCn).toLowerCase().includes(q));
      const matchSku = prod.sku?.toLowerCase()?.includes(q);
      const matchMaterial = prod.material && String(prod.material).toLowerCase().includes(q);
      const matchBenefArtisan = prod.benefitsArtisan && String(prod.benefitsArtisan).toLowerCase().includes(q);
      const matchBenefClient = prod.benefitsClient && String(prod.benefitsClient).toLowerCase().includes(q);
      const matchDimensions = prod.dimensions && String(prod.dimensions).toLowerCase().includes(q);
      const matchSpecs = Array.isArray(prod.specifications) && prod.specifications.some(s => 
        (s?.label && String(s.label).toLowerCase().includes(q)) || (s?.value && String(s.value).toLowerCase().includes(q))
      );
      const matchSuppliers = Array.isArray(prod.suppliers) && prod.suppliers.some(s => 
        (s?.name && String(s.name).toLowerCase().includes(q)) || (s?.city && String(s.city).toLowerCase().includes(q))
      );

      const matchText = matchTitle || matchSku || matchMaterial || matchBenefArtisan || matchBenefClient || matchDimensions || matchSpecs || matchSuppliers;
      return matchCat && matchText;
    });
  }, [products, selectedCategory, searchQuery, categoriesTree]);

  // 🖱️ GESTION DU MENU CONTEXTUEL CLIC DROIT EN CASCADE
  const handleOpenContextMenu = (e, prod) => {
    if (e && e.clientX !== undefined) {
      setContextMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        product: prod
      });
    } else {
      const rect = e?.currentTarget?.getBoundingClientRect?.();
      setContextMenuState({
        isOpen: true,
        position: rect ? { x: rect.left, y: rect.bottom + 5 } : { x: 50, y: 150 },
        product: prod
      });
    }
  };

  // 📦 RECLASSEMENT D'UN ARTICLE DANS UNE SOUS-CATÉGORIE (Atomique Supabase + Local)
  const handleMoveProductToCategory = (productOrId, mainCatId, subCatId = null) => {
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId;
    const finalCatId = subCatId || mainCatId;
    if (!productId || !finalCatId || finalCatId === 'all') return;

    let movedTitle = '';
    setAllProductsByWs(prev => {
      const currentList = prev[activeWorkspaceId] || [];
      const updatedList = currentList.map(p => {
        if (p.id === productId) {
          movedTitle = p.titleFr;
          return { ...p, category: finalCatId, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      saveAllProductsToDb(updatedList, activeWorkspaceId);
      return {
        ...prev,
        [activeWorkspaceId]: updatedList
      };
    });

    // ⚡ Mise à jour directe Supabase Cloud
    updateProductCategoryInDb(productId, finalCatId, activeWorkspaceId);

    // Mettre à jour l'article sélectionné si ouvert
    setSelectedProduct(prev => (prev && prev.id === productId ? { ...prev, category: finalCatId } : prev));

    // Nom convivial pour le Toast
    let catDisplayName = finalCatId === 'inbox' ? 'Magasin d\'Arrivage (Transit)' : finalCatId;
    categoriesTree.forEach(main => {
      if (main.id === finalCatId) catDisplayName = main.name;
      main.subCategories?.forEach(sub => {
        if (sub.id === finalCatId) catDisplayName = `${main.name} ➔ ${sub.name}`;
      });
    });

    showToast(`📦 « ${movedTitle ? movedTitle.slice(0, 26) + '...' : 'Article'} » classé dans « ${catDisplayName} » !`);
  };

  // --- CRUD HANDLERS: PRODUCTS (Active Workspace) ---
  const handleSaveProduct = (updatedProduct) => {
    setAllProductsByWs(prev => {
      const updatedList = (prev[activeWorkspaceId] || []).map(p => p.id === updatedProduct.id ? updatedProduct : p);
      saveAllProductsToDb(updatedList, activeWorkspaceId);
      return {
        ...prev,
        [activeWorkspaceId]: updatedList
      };
    });

    if (selectedProduct?.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
    showToast(`✅ « ${updatedProduct.titleFr} » mis à jour et synchronisé sur Supabase !`);
  };

  const handleDeleteProduct = (productOrId) => {
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId;
    const prod = products.find(p => p.id === productId);

    // Si l'article est dans le Magasin d'Arrivage, le déplacer dans la Corbeille
    if (prod && (prod.category === 'inbox' || selectedCategory === 'inbox')) {
      handleTrashProduct(prod);
      return;
    }

    setAllProductsByWs(prev => {
      const remaining = (prev[activeWorkspaceId] || []).filter(p => p.id !== productId);
      saveAllProductsToDb(remaining, activeWorkspaceId);
      return {
        ...prev,
        [activeWorkspaceId]: remaining
      };
    });

    // ⚡ Suppression directe Supabase Cloud
    deleteProductFromDb(productId);

    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
    if (editingProduct?.id === productId) {
      setIsEditModalOpen(false);
      setEditingProduct(null);
    }
    showToast(`🗑️ « ${prod?.titleFr || 'L\'article'} » a été supprimé de la base.`);
  };

  const handleWipeAllProducts = () => {
    if (window.confirm("⚠️ Voulez-vous vraiment vider TOUT le catalogue (remettre la base à 0 article) ?")) {
      setAllProductsByWs(prev => {
        saveAllProductsToDb([], activeWorkspaceId);
        return {
          ...prev,
          [activeWorkspaceId]: []
        };
      });
      try {
        localStorage.removeItem('quin_source_products');
        localStorage.removeItem(`ws_products_${activeWorkspaceId}`);
      } catch (e) {}
      setSelectedProduct(null);
      showToast("🧹 Le catalogue a été entièrement remis à zéro (0 article).");
    }
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setIsEditModalOpen(true);
  };

  // --- CRUD HANDLERS: CATEGORIES & SOUS-CATÉGORIES DANS SUPABASE (Active Workspace) ---
  const handleAddMainCategory = (newMain) => {
    setAllCategoriesByWs(prev => {
      const current = prev[activeWorkspaceId] || categoriesTree;
      const updated = [...current, newMain];
      saveCategoriesToDb(updated, activeWorkspaceId);
      return { ...prev, [activeWorkspaceId]: updated };
    });
    showToast(`📁 Rayon principal « ${newMain.name} » créé sur Supabase Cloud !`);
  };

  const handleAddSubCategory = (parentCatId, newSub) => {
    setAllCategoriesByWs(prev => {
      const current = prev[activeWorkspaceId] || categoriesTree;
      const updated = current.map(main => {
        if (main.id === parentCatId) {
          return {
            ...main,
            subCategories: [...(main.subCategories || []), newSub]
          };
        }
        return main;
      });
      saveCategoriesToDb(updated, activeWorkspaceId);
      return { ...prev, [activeWorkspaceId]: updated };
    });
    showToast(`▫️ Sous-catégorie « ${newSub.name} » créée sur Supabase Cloud !`);
  };

  const handleUpdateCategory = (itemId, updates, parentId = null) => {
    setAllCategoriesByWs(prev => {
      const current = prev[activeWorkspaceId] || categoriesTree;
      let updated;
      if (!parentId) {
        updated = current.map(main => main.id === itemId ? { ...main, ...updates } : main);
      } else {
        updated = current.map(main => {
          if (main.id === parentId) {
            return {
              ...main,
              subCategories: (main.subCategories || []).map(s => s.id === itemId ? { ...s, ...updates } : s)
            };
          }
          return main;
        });
      }
      saveCategoriesToDb(updated, activeWorkspaceId);
      return { ...prev, [activeWorkspaceId]: updated };
    });
    showToast(`✏️ Rayon « ${updates.name} » mis à jour sur Supabase Cloud !`);
  };

  const handleDeleteCategory = (itemId, parentId = null) => {
    setAllCategoriesByWs(prev => {
      const current = prev[activeWorkspaceId] || categoriesTree;
      let updated;
      if (!parentId) {
        updated = current.filter(main => main.id !== itemId);
      } else {
        updated = current.map(main => {
          if (main.id === parentId) {
            return {
              ...main,
              subCategories: (main.subCategories || []).filter(s => s.id !== itemId)
            };
          }
          return main;
        });
      }
      saveCategoriesToDb(updated, activeWorkspaceId);
      return { ...prev, [activeWorkspaceId]: updated };
    });

    // Redirection automatique des articles orphelins vers le Magasin d'Arrivage (Inbox)
    setAllProductsByWs(prev => {
      const currentList = prev[activeWorkspaceId] || [];
      const updatedList = currentList.map(p => {
        if (p.category === itemId) {
          return { ...p, category: 'inbox' };
        }
        return p;
      });
      saveAllProductsToDb(updatedList, activeWorkspaceId);
      return { ...prev, [activeWorkspaceId]: updatedList };
    });

    if (selectedCategory === itemId) {
      setSelectedCategory('all');
    }

    showToast(`🗑️ Rayon supprimé. Les articles associés ont été transférés dans le « Magasin d'Arrivage ».`);
  };

  // Handle new product import into active workspace
  const handleImportProduct = (newProd) => {
    if (newProd.category) {
      setAllCategoriesByWs(prev => {
        const currentCats = prev[activeWorkspaceId] || [];
        const catExists = currentCats.some(c => c.id === newProd.category || c.name?.toLowerCase() === newProd.category?.toLowerCase());
        if (!catExists) {
          const newCat = {
            id: newProd.category,
            name: newProd.categoryName || (newProd.category.charAt(0).toUpperCase() + newProd.category.slice(1)),
            icon: newProd.categoryIcon || '📦',
            count: 1
          };
          return {
            ...prev,
            [activeWorkspaceId]: [...currentCats, newCat]
          };
        }
        return prev;
      });
    }

    setAllProductsByWs(prev => ({
      ...prev,
      [activeWorkspaceId]: [newProd, ...(prev[activeWorkspaceId] || [])]
    }));

    setSelectedProduct(newProd);
    setCurrentTab('catalog');
    setSelectedCategory('all');
    setSearchQuery('');
    showToast(`🎉 « ${newProd.titleFr} » a été ajouté à votre espace !`);
  };

  // Export JSON/Catalogue for active workspace or all
  const handleExport = () => {
    const activeWs = workspaces.find(w => w.id === activeWorkspaceId) || { name: 'Sourcing' };
    const exportData = {
      workspace: activeWs,
      categories: categories,
      products: products,
      exportedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `catalogue_${activeWs.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    setSelectedProduct(null);
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    setIsSettingsOpen(false);
  };

  // 🔐 ÉCRAN DE CONNEXION GOOGLE & PERSONNEL SI NON CONNECTÉ
  if (!user) {
    return (
      <LoginPage 
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(`👋 Bienvenue, ${loggedUser?.user_metadata?.full_name || loggedUser?.email || 'Propriétaire'} !`);
        }} 
      />
    );
  }

  const activeWsObj = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <div className="app-container">
      {/* Top Navigation with Workspace Switcher & User/PWA Actions */}
      <Navbar 
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
        currency={settings.currency}
        setCurrency={(curr) => setSettings(s => ({ ...s, currency: curr }))}
        theme={settings.theme || 'dark-midnight'}
        setTheme={(th) => setSettings(s => ({ ...s, theme: th }))}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onWipeAllProducts={handleWipeAllProducts}
        articlesCount={products.length}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenManageWorkspaces={(createMode = false) => {
          setManageWsInitialCreate(createMode);
          setIsManageWorkspacesOpen(true);
        }}
        getWorkspaceProductCount={getWorkspaceProductCount}
        user={user}
        onLogout={handleLogout}
        installPrompt={installPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* CATALOGUE PRINCIPAL DE L'ESPACE ACTIF */}
        <div>
          {/* Top Bar with Search & Export */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Search input */}
            <div style={{
              flex: 1,
              minWidth: '280px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '0.6rem 1rem'
            }}>
              <Search size={18} color="var(--text-tertiary)" />
              <input 
                type="text"
                placeholder={`Rechercher dans ${activeWsObj?.name || 'cet espace'} (nom, SKU, specs, usines)...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className="nav-btn"
                disabled={isSyncingExtension}
                style={{
                  background: syncFeedback === 'success' 
                    ? 'rgba(16, 185, 129, 0.25)' 
                    : (syncFeedback === 'empty' 
                      ? 'rgba(245, 158, 11, 0.2)' 
                      : (isSyncingExtension ? 'rgba(59, 130, 246, 0.25)' : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(16, 185, 129, 0.2))')),
                  border: syncFeedback === 'success' 
                    ? '1.5px solid #10B981' 
                    : (syncFeedback === 'empty' 
                      ? '1.5px solid #F59E0B' 
                      : (isSyncingExtension ? '1.5px solid #3B82F6' : '1.5px solid #10B981')),
                  color: syncFeedback === 'success' 
                    ? '#6EE7B7' 
                    : (syncFeedback === 'empty' 
                      ? '#FCD34D' 
                      : (isSyncingExtension ? '#93C5FD' : '#34D399')),
                  padding: '0.6rem 1.1rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: isSyncingExtension ? 'wait' : 'pointer',
                  borderRadius: '8px',
                  boxShadow: syncFeedback === 'success' ? '0 0 15px rgba(16, 185, 129, 0.4)' : (isSyncingExtension ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'),
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none'
                }}
                onClick={async () => {
                  if (isSyncingExtension) return;
                  setIsSyncingExtension(true);
                  setSyncFeedback(null);

                  try {
                    showToast("⏳ Interrogation en direct de Supabase Cloud & Extension...");

                    // 1. Priorité 1 : Vérifier le serveur local /api/import-live avec Timeout de 600ms
                    try {
                      const controller = new AbortController();
                      const timer = setTimeout(() => controller.abort(), 600);
                      const res = await fetch('/api/import-live?consume=true', { signal: controller.signal });
                      clearTimeout(timer);
                      if (res.ok) {
                        const liveData = await res.json();
                        if (liveData && (liveData.titleFr || liveData.title || liveData.url)) {
                          handleImportFromExtension(liveData);
                          setSyncFeedback('success');
                          setTimeout(() => setSyncFeedback(null), 3000);
                          return;
                        }
                      }
                    } catch (e) {}

                    // 2. Priorité 2 : Vérifier le dernier import dans LocalStorage
                    const rawSaved = localStorage.getItem('quin_source_latest_import');
                    if (rawSaved) {
                      try {
                        const saved = JSON.parse(rawSaved);
                        if (saved && (saved.titleFr || saved.title || saved.sku)) {
                          localStorage.removeItem('quin_source_latest_import');
                          handleImportFromExtension(saved);
                          setSyncFeedback('success');
                          setTimeout(() => setSyncFeedback(null), 3000);
                          return;
                        }
                      } catch (e) {}
                    }

                    // 3. Priorité 3 : Interrogation Directe Supabase Cloud (Espace Actif & Global)
                    const cloudProducts = await loadAllProductsFromDb(activeWorkspaceId);
                    if (cloudProducts && cloudProducts.length > 0) {
                      setAllProductsByWs(prev => ({
                        ...prev,
                        [activeWorkspaceId]: cloudProducts
                      }));
                      
                      const inboxItem = cloudProducts.find(p => p.category === 'inbox');
                      if (inboxItem) {
                        setSelectedCategory('inbox');
                        setInboxSubTab('products');
                        setSelectedProduct(inboxItem);
                        showToast(`🎉 « ${inboxItem.titleFr.slice(0, 32)}... » synchronisé avec succès !`);
                        setSyncFeedback('success');
                        setTimeout(() => setSyncFeedback(null), 3000);
                        return;
                      } else {
                        showToast(`✅ ${cloudProducts.length} articles synchronisés avec Supabase Cloud !`);
                        setSyncFeedback('success');
                        setTimeout(() => setSyncFeedback(null), 3000);
                        return;
                      }
                    }

                    // 4. Priorité 4 : Vérifier si des articles sont arrivés dans d'autres espaces (ex: Cuisines vs Quincaillerie)
                    if (supabase && isSupabaseConfigured) {
                      try {
                        const { data: anyInbox } = await supabase
                          .from('products')
                          .select('*')
                          .eq('category', 'inbox');
                        
                        if (anyInbox && anyInbox.length > 0) {
                          const targetWs = anyInbox[0].workspace_id;
                          if (targetWs && targetWs !== activeWorkspaceId) {
                            setActiveWorkspaceId(targetWs);
                            localStorage.setItem('quin_source_active_ws', targetWs);
                            showToast(`🔄 Bascule automatique vers l'espace « ${targetWs === 'ws_cuisines' ? 'Cuisines' : 'Quincaillerie'} » où l'article a été injecté !`);
                            setSyncFeedback('success');
                            setTimeout(() => setSyncFeedback(null), 3000);
                            return;
                          }
                        }
                      } catch (e) {}
                    }

                    setSyncFeedback('empty');
                    showToast("💡 Ouvrez l'extension sur Alibaba et cliquez sur « 📥 ENVOYER AU MAGASIN D'ARRIVAGE » !");
                    setTimeout(() => setSyncFeedback(null), 3500);
                  } catch (e) {
                    setSyncFeedback('empty');
                    showToast("💡 Ouvrez l'extension sur Alibaba et cliquez sur « 📥 ENVOYER AU MAGASIN D'ARRIVAGE » !");
                    setTimeout(() => setSyncFeedback(null), 3500);
                  } finally {
                    setIsSyncingExtension(false);
                  }
                }}
                title="Cliquer pour forcer la synchronisation avec l'extension et Supabase Cloud"
              >
                {isSyncingExtension ? (
                  <>
                    <Loader2 size={16} className="animate-spin" color="#93C5FD" />
                    <span>⏳ Recherche Cloud...</span>
                  </>
                ) : syncFeedback === 'success' ? (
                  <>
                    <CheckCircle size={16} color="#10B981" />
                    <span>✅ Article Réceptionné !</span>
                  </>
                ) : syncFeedback === 'empty' ? (
                  <>
                    <AlertCircle size={16} color="#F59E0B" />
                    <span>ℹ️ 0 Article en Attente</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} color="#34D399" />
                    <span>⚡ Réceptionner Extension</span>
                  </>
                )}
              </button>

              <button 
                className="btn-primary-action" 
                onClick={() => setIsAddModalOpen(true)}
                style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}
                title="Ajouter un article dans cet espace"
              >
                <Plus size={16} />
                <span>+ Nouvel Article</span>
              </button>

              <button 
                className="nav-btn"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.6rem 1rem' }}
                onClick={handleExport}
                title="Exporter ce catalogue au format JSON"
              >
                <Download size={16} />
                <span>Exporter ({filteredProducts.length})</span>
              </button>
            </div>
          </div>

          {/* Dashboard 2-column or 3-column Grid (Avec Sidebar Sticky & Pliable) */}
          <div 
            className={`dashboard-grid ${selectedProduct ? 'has-drawer' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: isSidebarCollapsed ? '48px 1fr' : '260px 1fr',
              gap: '1.25rem',
              alignItems: 'start',
              transition: 'all 0.25s ease'
            }}
          >
            
            {/* Left Column: Categories Menu with Sticky, Internal Scroll & Collapse */}
            <div style={{ position: 'sticky', top: '75px' }}>
              <CategoryFilter 
                categoriesTree={categoriesTree}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                counts={categoryCounts}
                inboxCount={inboxCount}
                totalCount={totalCount}
                onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
                onMoveProductToCategory={handleMoveProductToCategory}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />

              {/* Workspace Summary Card (Visible si la sidebar n'est pas repliée) */}
              {!isSidebarCollapsed && (
                <div className="card" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#93C5FD', fontWeight: 700 }}>
                    <Sparkles size={14} />
                    <span>Statistiques : {activeWsObj?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    <span>Total Références :</span>
                    <strong style={{ color: 'white' }}>{totalCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    <span>Magasin d'Arrivage :</span>
                    <strong style={{ color: inboxCount > 0 ? '#FCD34D' : 'var(--text-secondary)' }}>{inboxCount} non triés</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Photos/Vidéos en Sas :</span>
                    <strong style={{ color: '#60A5FA' }}>{capturedMedia.length}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Center Column: Products Cards Grid OR Captured Media Hub */}
            <div style={{ minWidth: 0 }}>
              
              {/* 📥 ONGLETS DU MAGASIN D'ARRIVAGE (Articles vs Médias Capturés vs Corbeille) */}
              {selectedCategory === 'inbox' && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1.2rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '0.4rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  width: 'fit-content',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => setInboxSubTab('products')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: inboxSubTab === 'products' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                      border: 'none',
                      color: inboxSubTab === 'products' ? '#000000' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      boxShadow: inboxSubTab === 'products' ? '0 2px 10px rgba(245, 158, 11, 0.4)' : 'none'
                    }}
                  >
                    <span>📦 Articles en Attente</span>
                    <span style={{ background: inboxSubTab === 'products' ? '#000' : 'rgba(255,255,255,0.1)', color: inboxSubTab === 'products' ? '#FCD34D' : 'var(--text-secondary)', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>
                      {filteredProducts.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setInboxSubTab('media')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: inboxSubTab === 'media' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent',
                      border: 'none',
                      color: inboxSubTab === 'media' ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      boxShadow: inboxSubTab === 'media' ? '0 2px 10px rgba(37, 99, 235, 0.4)' : 'none'
                    }}
                  >
                    <span>🎬 Photos & Vidéos Capturées</span>
                    <span style={{ background: inboxSubTab === 'media' ? '#FFF' : 'rgba(255,255,255,0.1)', color: inboxSubTab === 'media' ? '#2563EB' : 'var(--text-secondary)', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>
                      {capturedMedia.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setInboxSubTab('trash')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: inboxSubTab === 'trash' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'transparent',
                      border: 'none',
                      color: inboxSubTab === 'trash' ? '#FFFFFF' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      boxShadow: inboxSubTab === 'trash' ? '0 2px 10px rgba(239, 68, 68, 0.4)' : 'none'
                    }}
                  >
                    <span>🗑️ Corbeille Arrivage</span>
                    <span style={{ background: inboxSubTab === 'trash' ? '#FFF' : 'rgba(255,255,255,0.1)', color: inboxSubTab === 'trash' ? '#EF4444' : 'var(--text-secondary)', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>
                      {trashedItems.length}
                    </span>
                  </button>
                </div>
              )}

              {/* VUE 1 : CORBEILLE DU MAGASIN D'ARRIVAGE */}
              {selectedCategory === 'inbox' && inboxSubTab === 'trash' ? (
                <InboxTrashView 
                  trashedItems={trashedItems}
                  onRestoreItem={handleRestoreItem}
                  onPermanentDeleteItem={handlePermanentDeleteItem}
                  onEmptyTrash={handleEmptyTrash}
                  showToast={showToast}
                />
              ) : selectedCategory === 'inbox' && inboxSubTab === 'media' ? (
                /* VUE 2 : HUB DES PHOTOS & VIDÉOS CAPTURÉES */
                <CapturedMediaHub 
                  capturedMedia={capturedMedia}
                  onAddMedia={handleAddCapturedMedia}
                  onRemoveMedia={handleRemoveCapturedMedia}
                  onTrashMedia={handleTrashCapturedMedia}
                  onAssignMediaToProduct={handleAssignMediaToProduct}
                  onCreateProductFromMedia={handleCreateProductFromMedia}
                  categoriesTree={categoriesTree}
                  allProducts={products}
                  showToast={showToast}
                />
              ) : (
                /* VUE 3 : CATALOGUE STANDARD D'ARTICLES */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {filteredProducts.length} articles dans l'espace « {activeWsObj?.name} »
                    </div>
                    
                    {searchQuery && (
                      <button 
                        style={{ background: 'transparent', border: 'none', color: 'var(--blue-light)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => setSearchQuery('')}
                      >
                        Effacer la recherche
                      </button>
                    )}
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div style={{
                      background: '#0B1120',
                      border: '1.5px dashed var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '3rem 2rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{activeWsObj?.icon || '📦'}</div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                        {selectedCategory === 'inbox' 
                          ? "Le Magasin d'Arrivage est vide !"
                          : searchQuery ? 'Aucun article ne correspond à votre recherche' : `Votre catalogue « ${activeWsObj?.name} » est prêt !`}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                        {selectedCategory === 'inbox'
                          ? 'Tous vos produits importés ont été classés avec succès dans leurs sous-catégories respectives.'
                          : searchQuery 
                            ? 'Essayez avec un autre mot-clé ou réinitialisez le filtre.' 
                            : 'Importez des produits avec votre extension ou ajoutez votre premier article manuellement.'}
                      </p>

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        {searchQuery && (
                          <button 
                            className="nav-btn"
                            style={{ padding: '0.55rem 1.2rem', fontSize: '0.82rem' }}
                            onClick={() => setSearchQuery('')}
                          >
                            Effacer la recherche
                          </button>
                        )}
                        <button 
                          className="btn-primary-action"
                          style={{ padding: '0.55rem 1.2rem', fontSize: '0.82rem' }}
                          onClick={() => setIsAddModalOpen(true)}
                        >
                          <Plus size={15} />
                          <span>+ Ajouter un Premier Article</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="products-grid">
                      {filteredProducts.map(product => (
                        <ProductCard 
                          key={product.id}
                          product={product}
                          isSelected={selectedProduct?.id === product.id}
                          onSelect={setSelectedProduct}
                          onOpenImageViewer={handleOpenImageViewer}
                          formatPrice={formatPrice}
                          categories={categoriesTree}
                          onMoveProductToCategory={handleMoveProductToCategory}
                          onOpenContextMenu={handleOpenContextMenu}
                          isDuplicate={duplicateProductIds.has(product.id)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* MODALS */}
      <FullScreenImageViewer
        isOpen={imageViewerState.isOpen}
        onClose={() => setImageViewerState({ isOpen: false, product: null, initialIndex: 0 })}
        images={imageViewerState.product?.images || []}
        videos={imageViewerState.product?.videos || []}
        videoDemo={imageViewerState.product?.videoDemo}
        initialIndex={imageViewerState.initialIndex}
        productTitle={imageViewerState.product?.titleFr || ''}
        onOpenEdit={() => {
          if (imageViewerState.product) {
            handleOpenEditModal(imageViewerState.product);
          }
        }}
      />

      <AddArticleModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleImportProduct}
        categories={categoriesTree}
        currency={settings.currency}
        formatPrice={formatPrice}
      />

      <EditArticleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        categories={categoriesTree}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categoriesTree={categoriesTree}
        activeWorkspaceName={activeWsObj?.name || 'Sourcing'}
        onAddCategory={handleAddMainCategory}
        onAddSubCategory={handleAddSubCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* 🖱️ MENU CONTEXTUEL CLIC DROIT EN CASCADE */}
      <ContextMenuCascade
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        product={contextMenuState.product}
        categoriesTree={categoriesTree}
        onSelectCategory={(prod, mainId, subId) => handleMoveProductToCategory(prod.id, mainId, subId)}
        onDeleteProduct={(prod) => handleDeleteProduct(prod.id)}
        onClose={() => setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, product: null })}
      />

      <ManageWorkspacesModal
        isOpen={isManageWorkspacesOpen}
        onClose={() => setIsManageWorkspacesOpen(false)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
        initialCreateMode={manageWsInitialCreate}
        getWorkspaceProductCount={getWorkspaceProductCount}
      />

      <PricingCalculatorModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      {/* 📁 MODAL DOSSIER SOURCING 360° COMPLET */}
      {selectedProduct && (
        <ArticleDetailDrawer 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenEditModal={handleOpenEditModal}
          onDeleteProduct={handleDeleteProduct}
          onOpenImageViewer={handleOpenImageViewer}
          settings={settings}
          formatPrice={formatPrice}
          onUpdateProduct={handleSaveProduct}
          isDuplicate={duplicateProductIds.has(selectedProduct.id)}
          onImportFromClipboard={(data, targetId) => {
            let pData = data;
            if (typeof data === 'string') {
              try { pData = JSON.parse(data); } catch (e) { return false; }
            }
            return handleImportFromExtension({ ...pData, importMode: 'enrich', targetProductId: targetId });
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #059669, #047857)',
          color: 'white',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.45)',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
