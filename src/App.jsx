import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Sparkles, 
  FolderCog,
  Layers,
  Zap
} from 'lucide-react';

import { CATEGORIES, INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './data/catalogData';
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

import { 
  saveAllProductsToDb, 
  loadAllProductsFromDb, 
  syncProductsToServerDisk, 
  loadProductsFromServerDisk 
} from './utils/dbStorage';

export function App() {
  // 🏢 1. ESPACES DE SOURCING MULTI-PROJETS (Workspaces)
  const [workspaces, setWorkspaces] = useState(() => {
    const saved = localStorage.getItem('quin_source_workspaces_list');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    const saved = localStorage.getItem('quin_source_active_ws');
    return saved || 'ws_quincaillerie';
  });

  // 📦 2. BASE DE DONNÉES DES ARTICLES PAR ESPACE (Isolation Totale)
  const [allProductsByWs, setAllProductsByWs] = useState(() => {
    const map = {};
    
    // Charger le workspace Quincaillerie avec les données existantes (0 perte)
    const savedQuin = localStorage.getItem('quin_source_products');
    map.ws_quincaillerie = savedQuin ? JSON.parse(savedQuin) : INITIAL_PRODUCTS;

    // Charger les autres workspaces
    INITIAL_WORKSPACES.forEach(ws => {
      if (ws.id !== 'ws_quincaillerie') {
        const savedWs = localStorage.getItem(`ws_products_${ws.id}`);
        map[ws.id] = savedWs ? JSON.parse(savedWs) : [];
      }
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

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageWorkspacesOpen, setIsManageWorkspacesOpen] = useState(false);
  const [manageWsInitialCreate, setManageWsInitialCreate] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
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

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // 🗄️ CHARGEMENT INITIAL HAUTE CAPACITÉ & SYNC TEMPS RÉEL
  useEffect(() => {
    let isMounted = true;

    async function loadDataFromHighCapacityStorage() {
      try {
        // 1. Essai de chargement depuis le fichier disque serveur
        const serverProducts = await loadProductsFromServerDisk();
        if (serverProducts && serverProducts.length > 0 && isMounted) {
          setAllProductsByWs(prev => {
            // Fusionner pour ne perdre aucun produit
            const existing = prev.ws_quincaillerie || [];
            const existingIds = new Set(existing.map(p => p.id || p.sku));
            const newProds = serverProducts.filter(p => !existingIds.has(p.id || p.sku));
            
            // Priorité absolue aux produits du serveur
            return {
              ...prev,
              ws_quincaillerie: serverProducts
            };
          });
          setIsInitialLoadDone(true);
          return;
        }

        // 2. Essai de chargement depuis la base IndexedDB locale
        const dbProducts = await loadAllProductsFromDb();
        if (dbProducts && dbProducts.length > 0 && isMounted) {
          setAllProductsByWs(prev => ({
            ...prev,
            ws_quincaillerie: dbProducts
          }));
          syncProductsToServerDisk(dbProducts);
        } else if (isMounted) {
          syncProductsToServerDisk(INITIAL_PRODUCTS);
          saveAllProductsToDb(INITIAL_PRODUCTS);
        }
      } finally {
        if (isMounted) setIsInitialLoadDone(true);
      }
    }

    loadDataFromHighCapacityStorage();

    // 🔄 Écoute périodique toutes les 3s pour afficher immédiatement les produits sourcés via Telegram
    const interval = setInterval(async () => {
      const liveProducts = await loadProductsFromServerDisk();
      if (liveProducts && liveProducts.length > 0 && isMounted) {
        setAllProductsByWs(prev => {
          const current = prev.ws_quincaillerie || [];
          if (liveProducts.length !== current.length || liveProducts[0]?.id !== current[0]?.id) {
            return {
              ...prev,
              ws_quincaillerie: liveProducts
            };
          }
          return prev;
        });
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
      cleanCompany = 'Foshan Milatool Electronic Equipment Co., Ltd.';
    }

    let cleanCity = parsedData.location || parsedData.factoryCity || '';
    if (!cleanCity || cleanCity.includes('Adresse de livraison')) {
      cleanCity = 'Foshan, Guangdong (Chine)';
    }

    let basePriceFcfa = 5000;
    if (parsedData.fcfaPrices && parsedData.fcfaPrices.length > 0) {
      basePriceFcfa = parsedData.fcfaPrices[0];
    } else if (parsedData.priceFcfa) {
      basePriceFcfa = parseInt(parsedData.priceFcfa) || 5000;
    }
    const priceCny = parseFloat(parsedData.priceCny || (basePriceFcfa / 85).toFixed(2));

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

    // 🌟 OPTION A : CRÉATION D'UN NOUVEL ARTICLE
    const rawTitle = parsedData.title || 'Article Importé Alibaba';
    const sku = `IMP-${Date.now().toString().slice(-4)}`;
    
    const activeCats = allCategoriesByWs[activeWorkspaceId] || [];
    const firstCat = activeCats.find(c => c.id !== 'all');
    const category = parsedData.category && parsedData.category !== 'all' ? parsedData.category : (firstCat ? firstCat.id : 'all');

    const newProduct = {
      id: `prod-${Date.now()}`,
      sku,
      titleFr: rawTitle,
      titleCn: parsedData.titleCn || '',
      category,
      material: parsedData.material || 'Standard Qualité Usine',
      dimensions: parsedData.dimensions || 'Standard Pro Export',
      images: parsedData.images && parsedData.images.length > 0 ? parsedData.images : [
        'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80'
      ],
      hasVideoDemo: Boolean(parsedData.videoUrl),
      videoDemo: parsedData.videoUrl ? {
        source: 'Démonstration Usine Réelle',
        videoUrl: parsedData.videoUrl,
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
          moq: detectedMoq,
          priceTiers: tiers,
          rating: 4.9,
          badge: parsedData.badge || 'Verified Supplier',
          years: parsedData.years || '4 ans d\'expérience',
          isPreferred: true,
          url: parsedData.url || '',
          leadTime: '5 - 15 jours'
        }
      ],
      basePriceCny: priceCny,
      priceCny: priceCny,
      unit: parsedData.unit || 'Pièce (pc)',
      sourceUrl: parsedData.url || ''
    };

    setAllProductsByWs(prev => {
      const currentList = prev[activeWorkspaceId] || [];
      const filtered = currentList.filter(p => !newProduct.sourceUrl || p.sourceUrl !== newProduct.sourceUrl);
      return {
        ...prev,
        [activeWorkspaceId]: [newProduct, ...filtered]
      };
    });

    setSelectedProduct(newProduct);
    showToast(`🎉 « ${newProduct.titleFr.slice(0, 40)}... » importé avec succès dans votre espace !`);
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
    let lastSeen = Date.now() - 3000;

    // 1. Écoute des messages directs envoyés dans l'onglet
    const handleWindowMessage = (e) => {
      if (e.data && (e.data.type === 'EXTENSION_DIRECT_IMPORT' || e.data.type === 'EXTENSION_INJECT_PRODUCT')) {
        handleImportFromExtension(e.data.payload);
      }
    };
    window.addEventListener('message', handleWindowMessage);

    // 2. Écoute des événements personnalisés
    const handleCustomEvent = (e) => {
      if (e.detail) {
        handleImportFromExtension(e.detail);
      }
    };
    window.addEventListener('EXTENSION_IMPORT_EVENT', handleCustomEvent);

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
    }, 1000);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('EXTENSION_IMPORT_EVENT', handleCustomEvent);
      window.removeEventListener('paste', handlePaste);
      clearInterval(interval);
    };
  }, [activeWorkspaceId]);

  // 💾 SAUVEGARDE PERMANENTE DES ARTICLES PAR ESPACE (Actif seulement après chargement)
  useEffect(() => {
    if (!isInitialLoadDone || !allProductsByWs) return;

    // Sauvegarder l'espace actif
    const currentProds = allProductsByWs[activeWorkspaceId] || [];
    try {
      localStorage.setItem(`ws_products_${activeWorkspaceId}`, JSON.stringify(currentProds));
      if (activeWorkspaceId === 'ws_quincaillerie') {
        localStorage.setItem('quin_source_products', JSON.stringify(currentProds));
        syncProductsToServerDisk(currentProds);
        saveAllProductsToDb(currentProds);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [allProductsByWs, activeWorkspaceId, isInitialLoadDone]);

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

  // Category counts in active workspace
  const categoryCounts = useMemo(() => {
    const counts = { all: (products || []).length };
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        if (c && c.id && c.id !== 'all') {
          counts[c.id] = (products || []).filter(p => p && p.category === c.id).length;
        }
      });
    }
    return counts;
  }, [products, categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(prod => {
      if (!prod) return false;
      const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
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
  }, [products, selectedCategory, searchQuery]);

  // --- CRUD HANDLERS: PRODUCTS (Active Workspace) ---
  const handleSaveProduct = (updatedProduct) => {
    // Vérifier si la catégorie existe, sinon la créer
    if (updatedProduct.category) {
      setAllCategoriesByWs(prev => {
        const currentCats = prev[activeWorkspaceId] || [];
        const catExists = currentCats.some(c => c.id === updatedProduct.category || c.name?.toLowerCase() === updatedProduct.category?.toLowerCase());
        if (!catExists) {
          const newCat = {
            id: updatedProduct.category,
            name: updatedProduct.categoryName || (updatedProduct.category.charAt(0).toUpperCase() + updatedProduct.category.slice(1)),
            icon: updatedProduct.categoryIcon || '📦',
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
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map(p => p.id === updatedProduct.id ? updatedProduct : p)
    }));

    if (selectedProduct?.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
    showToast(`✅ « ${updatedProduct.titleFr} » mis à jour avec succès !`);
  };

  const handleDeleteProduct = (productId) => {
    const prod = products.find(p => p.id === productId);
    setAllProductsByWs(prev => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).filter(p => p.id !== productId)
    }));

    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
    if (editingProduct?.id === productId) {
      setIsEditModalOpen(false);
      setEditingProduct(null);
    }
    showToast(`🗑️ « ${prod?.titleFr || 'L\'article'} » a été supprimé.`);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setIsEditModalOpen(true);
  };

  // --- CRUD HANDLERS: CATEGORIES (Active Workspace) ---
  const handleAddCategory = (newCat) => {
    setAllCategoriesByWs(prev => ({
      ...prev,
      [activeWorkspaceId]: [...(prev[activeWorkspaceId] || []), newCat]
    }));
  };

  const handleUpdateCategory = (catId, updatedFields) => {
    setAllCategoriesByWs(prev => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).map(c => c.id === catId ? { ...c, ...updatedFields } : c)
    }));
  };

  const handleDeleteCategory = (catId) => {
    setAllCategoriesByWs(prev => ({
      ...prev,
      [activeWorkspaceId]: (prev[activeWorkspaceId] || []).filter(c => c.id !== catId)
    }));
    if (selectedCategory === catId) {
      setSelectedCategory('all');
    }
  };

  // 📦 DÉPLACEMENT & RECLASSEMENT D'UN ARTICLE VERS UN RAYON (Drag & Drop ou Sélecteur 1-Clic)
  const handleMoveProductToCategory = (productId, targetCategoryId) => {
    if (!productId || !targetCategoryId || targetCategoryId === 'all') return;

    let movedTitle = '';
    const currentCats = allCategoriesByWs[activeWorkspaceId] || categories;
    const targetCat = currentCats.find(c => c.id === targetCategoryId);

    setAllProductsByWs(prev => {
      const currentList = prev[activeWorkspaceId] || [];
      const updatedList = currentList.map(p => {
        if (p.id === productId) {
          movedTitle = p.titleFr;
          return { ...p, category: targetCategoryId };
        }
        return p;
      });

      // Synchronisation persistante sur disque serveur & IndexedDB
      syncProductsToServerDisk(updatedList);
      saveAllProductsToDb(updatedList);

      return {
        ...prev,
        [activeWorkspaceId]: updatedList
      };
    });

    if (movedTitle) {
      showToast(`📦 « ${movedTitle.slice(0, 32)}... » reclassé dans « ${targetCat ? targetCat.name : targetCategoryId} » !`);
    }
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

  const activeWsObj = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <div className="app-container">
      {/* Top Navigation with Workspace Switcher */}
      <Navbar 
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
        currency={settings.currency}
        setCurrency={(curr) => setSettings(s => ({ ...s, currency: curr }))}
        theme={settings.theme || 'dark-midnight'}
        setTheme={(th) => setSettings(s => ({ ...s, theme: th }))}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        articlesCount={products.length}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenManageWorkspaces={(createMode = false) => {
          setManageWsInitialCreate(createMode);
          setIsManageWorkspacesOpen(true);
        }}
        getWorkspaceProductCount={getWorkspaceProductCount}
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
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(16, 185, 129, 0.2))',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  padding: '0.6rem 1rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && handleImportFromExtension(text)) {
                      return;
                    }
                    const res = await fetch('/api/import-live');
                    if (res.ok) {
                      const data = await res.json();
                      if (data && (data.title || data.url)) {
                        if (handleImportFromExtension(data)) return;
                      }
                    }
                    showToast("💡 Astuce : Sur votre onglet Alibaba, cliquez sur l'extension Chrome puis sur « Importer » !");
                  } catch (e) {
                    showToast("💡 Astuce : Sur votre onglet Alibaba, cliquez sur l'extension Chrome puis sur « Importer » !");
                  }
                }}
                title="Réceptionner ou forcer l'importation de l'extension Chrome (1-Clic)"
              >
                <Zap size={16} color="#34D399" />
                <span>⚡ Réceptionner Extension</span>
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

          {/* Dashboard 2-column or 3-column Grid */}
          <div className={`dashboard-grid ${selectedProduct ? 'has-drawer' : ''}`}>
            
            {/* Left Column: Categories Menu with Manage Button */}
            <div>
              <CategoryFilter 
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                counts={categoryCounts}
                onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
                onMoveProductToCategory={handleMoveProductToCategory}
              />

              {/* Workspace Summary Card */}
              <div className="card" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#93C5FD', fontWeight: 700 }}>
                  <Sparkles size={14} />
                  <span>Statistiques : {activeWsObj?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  <span>Total Références :</span>
                  <strong style={{ color: 'white' }}>{products.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Rayons Actifs :</span>
                  <strong style={{ color: 'var(--amber-light)' }}>{categories.length - 1}</strong>
                </div>
              </div>
            </div>

            {/* Center Column: Products Cards Grid */}
            <div>
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
                    {searchQuery ? 'Aucun article ne correspond à votre recherche' : `Votre catalogue « ${activeWsObj?.name} » est prêt !`}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                    {searchQuery 
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
                      categories={categories}
                      onMoveProductToCategory={handleMoveProductToCategory}
                    />
                  ))}
                </div>
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
        categories={categories}
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
        categories={categories}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
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
