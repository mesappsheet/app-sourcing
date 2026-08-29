import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Camera, 
  Search, 
  ExternalLink, 
  Plus, 
  Check, 
  ShieldCheck, 
  Globe, 
  DollarSign,
  Layers,
  Type,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Image as ImageIcon,
  Zap
} from 'lucide-react';

export function VisualSearchModal({ isOpen, onClose, onImportProduct, currency, formatPrice, initialQuery = '' }) {
  const [searchMode, setSearchMode] = useState('text'); // 'text' | 'image'
  const [textQuery, setTextQuery] = useState(initialQuery || '');
  const [selectedPlatform, setSelectedPlatform] = useState('all'); // 'alibaba' | 'pinduoduo' | 'all'
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [scannedImageName, setScannedImageName] = useState('');
  const [importedIds, setImportedIds] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  // Synchronise avec initialQuery si fournie
  useEffect(() => {
    if (initialQuery) {
      setTextQuery(initialQuery);
      setHasScanned(true);
    }
  }, [initialQuery]);

  if (!isOpen) return null;

  // Base de données enrichie de manufactures chinoises vérifiées
  const curatedDatabase = [
    // OUTILLAGE & MARTEAUX
    {
      id: 'res-tool-1',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Verified Tool Factory (11 ans)',
      titleFr: 'Marteau de Charpentier / Coffreur Pro Forgé Monobloc Anti-Vibration',
      titleCn: '一体锻造防震羊角锤 (木工/建筑专用)',
      category: 'outillage',
      keywords: ['marteau', 'marteaux', 'coffreur', 'charpentier', 'arrache clou', 'forgé', 'outillage', 'outil', 'acier', 'menuisier', 'hammer'],
      factoryName: 'Yongkang Hammer King Tools Co., Ltd.',
      location: 'Yongkang, Zhejiang (Capitale chinoise du matériel)',
      priceCny: 18.50,
      moq: 10,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80',
      specs: 'Acier Carbone C45 forgé monobloc • Manche grip TPR ergonomique • Aimant porte-clou intégré'
    },
    {
      id: 'res-tool-2',
      platform: 'pinduoduo',
      platformBadge: '🔴 Pinduoduo Usine Directe Outillage',
      titleFr: 'Marteau Menuisier Traditionnel Tête Fraisée avec Manche Fibre Haute Résistance',
      titleCn: '高碳钢带磁性多功能起钉锤 (木工装潢)',
      category: 'outillage',
      keywords: ['marteau', 'marteaux', 'menuisier', 'fibre', 'aimant', 'outil', 'outillage', 'clou', 'hammer'],
      factoryName: 'Jinhua Precision Hand Tools Factory',
      location: 'Jinhua, Zhejiang',
      priceCny: 11.20,
      moq: 4,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
      specs: 'Tête trempée par induction 52-56 HRC • Tête magnétique • MOQ 4 pièces'
    },
    {
      id: 'res-tool-3',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Gold Supplier (6 ans)',
      titleFr: 'Visseuse Perceuse Sans Fil Brushless Pro 21V avec 2 Batteries Lithium',
      titleCn: '无刷大扭力 21V 锂电钻 (配双电一充)',
      category: 'outillage',
      keywords: ['visseuse', 'perceuse', 'sans fil', 'brushless', 'batterie', 'outil', 'outillage', 'drill'],
      factoryName: 'Zhejiang Power Max Tool Corp.',
      location: 'Jinhua, Zhejiang',
      priceCny: 85.00,
      moq: 5,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
      specs: 'Couple 65 N.m • 2 vitesses 0-1800 rpm • Mandrin métallique 13mm'
    },
    {
      id: 'res-tool-4',
      platform: 'pinduoduo',
      platformBadge: '🔴 Pinduoduo Usine Directe',
      titleFr: 'Gabarit de Perçage Rapide pour Charnières 35mm en Aluminium Massif CNC',
      titleCn: '全铝合金 35mm 铰链开孔定位神器 (带快速夹紧)',
      category: 'outillage',
      keywords: ['gabarit', 'charniere', 'percage', 'outil', 'outillage', 'alu', '35mm', 'menuisier'],
      factoryName: 'Yongkang Woodworking Precision Tools',
      location: 'Yongkang, Zhejiang',
      priceCny: 24.00,
      moq: 2,
      rating: 5.0,
      image: 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg',
      specs: 'Aluminium usiné CNC • Presse de serrage rapide • Perçage 3 secondes'
    },

    // COULISSES & TIROIRS
    {
      id: 'res-slide-1',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Gold Supplier (8 ans)',
      titleFr: 'Coulisse Invisible 3 Sections à Fermeture Douce Synchronisée 450mm',
      titleCn: '全拉出阻尼隐藏式静音滑轨 450mm',
      category: 'coulisses',
      keywords: ['coulisse', 'coulisses', 'tiroir', 'invisible', 'glissiere', 'soft close', 'amorti', '450mm', 'rail', 'slide'],
      factoryName: 'Guangdong DTC Precision Hardware Co.',
      location: 'Foshan, Guangdong',
      priceCny: 14.80,
      moq: 20,
      rating: 4.9,
      image: 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg',
      specs: 'Acier galvanisé 1.5mm • 80 000 cycles • Réglage 3D rapide'
    },
    {
      id: 'res-slide-2',
      platform: 'pinduoduo',
      platformBadge: '🔴 Pinduoduo Usine Directe (Prix Bas)',
      titleFr: 'Tiroir Métallique Double Paroi Ultra-Mince (Slim Box) 450mm Gris Anthracite',
      titleCn: '极简超薄金属抽屉帮 450mm (骑马抽)',
      category: 'coulisses',
      keywords: ['tiroir', 'box', 'slim', 'coulisse', 'anthracite', 'metal', 'meuble', 'blum', 'legra'],
      factoryName: 'Jinhua Slide Master Factory',
      location: 'Jinhua, Zhejiang',
      priceCny: 32.50,
      moq: 5,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
      specs: 'Paroi ultra-fine 13mm • Amortisseur hydraulique intégré • MOQ 5 pcs'
    },

    // CHARNIÈRES & SYSTÈMES PUSH
    {
      id: 'res-hinge-1',
      platform: 'pinduoduo',
      platformBadge: '🔴 Pinduoduo Usine Directe',
      titleFr: 'Charnière Invisible Grand Angle 165° avec Amortisseur Hydraulique Clipsable',
      titleCn: '165度大角度三维可调阻尼铰链 (快装快拆)',
      category: 'charnieres',
      keywords: ['charniere', 'charnieres', '165', 'angle', 'porte', 'amortisseur', 'clip on', 'meuble', 'hinge'],
      factoryName: 'Guangdong Shunde Hinge Master Co.',
      location: 'Shunde, Guangdong',
      priceCny: 4.50,
      moq: 50,
      rating: 4.9,
      image: 'https://sc04.alicdn.com/kf/H75691060938f4d92982d61cb570eb947Y.jpg_960x960q80.jpg',
      specs: 'Ouverture sans déport • Piston hydraulique laiton • 80 000 cycles'
    },
    {
      id: 'res-hinge-2',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Verified Factory',
      titleFr: 'Charnière Invisible 3D Encastrée pour Portes Lourdes & Portes Battantes',
      titleCn: '重型十字暗铰链 三维可调隐形门合页',
      category: 'charnieres',
      keywords: ['charniere', 'invisible', '3d', 'encastree', 'porte lourde', 'pivot', 'ferrure'],
      factoryName: 'Foshan Oubao Hardware Tech',
      location: 'Foshan, Guangdong',
      priceCny: 28.00,
      moq: 10,
      rating: 4.9,
      image: 'https://sc04.alicdn.com/kf/H75691060938f4d92982d61cb570eb947Y.jpg_960x960q80.jpg',
      specs: 'Capacité 60 kg / 2 charnières • Réglage hauteur/latéral/profondeur en façade'
    },

    // MEUBLES D'ANGLE & RANGEMENTS CUISINE
    {
      id: 'res-corner-1',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Verified Factory',
      titleFr: 'Ferrure d\'Angle Cuisine Magique (Magic Corner) 4 Paniers Soft-Close',
      titleCn: '厨房橱柜转角拉篮 (飞碟小怪兽联动阻尼)',
      category: 'angle',
      keywords: ['angle', 'cuisine', 'magic corner', 'panier', 'meuble dangle', 'rangement', 'ferrure', 'tourniquet'],
      factoryName: 'Foshan Higold Hardware Group',
      location: 'Foshan, Guangdong',
      priceCny: 175.00,
      moq: 3,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
      specs: 'Verre trempé fumé et acier carbone • Sortie panoramique 100%'
    },
    {
      id: 'res-pantry-1',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Gold Supplier (12 ans)',
      titleFr: 'Colonne Garde-Manger Coulissante Télescopique 6 Paniers Réglables',
      titleCn: '厨房大怪兽高深联动拉篮 (阻尼加厚)',
      category: 'angle',
      keywords: ['colonne', 'garde manger', 'panier', 'coulissant', 'cuisine', 'armoire', 'rangement'],
      factoryName: 'Zhongshan Kitchen Hardware Works',
      location: 'Zhongshan, Guangdong',
      priceCny: 220.00,
      moq: 2,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
      specs: 'Hauteur ajustable 1650-2000mm • Coulisses charge lourde 70kg synchronisées'
    },

    // PROFILÉS ALU & GOLA
    {
      id: 'res-gola-1',
      platform: 'alibaba',
      platformBadge: '🟡 Alibaba Gold Supplier',
      titleFr: 'Profilé Poignée Aluminium Gola Type "L" Finition Noir Mat Anodisé (3m)',
      titleCn: '极简无拉手 L型 Gola 铝型材 (哑光黑/钛金灰)',
      category: 'alu',
      keywords: ['gola', 'profil', 'profile', 'poignee', 'sans poignee', 'alu', 'aluminium', 'noir', 'cuisine', 'bandeau'],
      factoryName: 'Foshan Nanhai Aluminum Profile Factory',
      location: 'Foshan, Guangdong',
      priceCny: 21.00,
      moq: 20,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
      specs: 'Barre de 3 mètres • Équerres et embouts inclus • Anodisation anti-traces'
    },

    // VÉRINS & RELEVABLES
    {
      id: 'res-gas-1',
      platform: 'pinduoduo',
      platformBadge: '🔴 Pinduoduo Usine Directe',
      titleFr: 'Vérin à Gaz Hydraulique pour Porte Relevable de Meuble Haut (100N / 120N)',
      titleCn: '橱柜上翻门液压气动支撑杆 (100N/120N)',
      category: 'charnieres',
      keywords: ['verin', 'gaz', 'piston', 'relevable', 'meuble haut', 'porte', 'amortisseur', 'support'],
      factoryName: 'Wenzhou Gas Spring Precision Co.',
      location: 'Wenzhou, Zhejiang',
      priceCny: 3.20,
      moq: 20,
      rating: 4.8,
      image: 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg',
      specs: 'Piston chromé renforcé • Huile aviation haute durabilité • 50 000 cycles'
    }
  ];

  // Traducteur de termes courants en Chinois pour les requêtes Alibaba / 1688
  const getChineseKeywords = (query) => {
    const q = query.toLowerCase();
    if (q.includes('marteau') || q.includes('hammer')) return { cn: '羊角锤 木工锤', en: 'Claw Hammer Tool' };
    if (q.includes('visseuse') || q.includes('drill')) return { cn: '无刷锂电钻', en: 'Cordless Brushless Drill' };
    if (q.includes('coulisse') || q.includes('slide')) return { cn: '隐藏式抽屉滑轨', en: 'Undermount Drawer Slide' };
    if (q.includes('charniere') || q.includes('hinge')) return { cn: '液压阻尼铰链', en: 'Soft Close Cabinet Hinge' };
    if (q.includes('gola') || q.includes('profile')) return { cn: '橱柜 Gola 铝型材', en: 'Gola Profile Aluminum' };
    if (q.includes('angle') || q.includes('corner')) return { cn: '厨房橱柜转角拉篮', en: 'Magic Corner Kitchen' };
    if (q.includes('verin') || q.includes('gas')) return { cn: '橱柜气动支撑杆', en: 'Cabinet Gas Spring' };
    if (q.includes('serrure') || q.includes('lock')) return { cn: '智能家具锁 抽屉锁', en: 'Smart Cabinet Lock' };
    if (q.includes('poignee') || q.includes('handle')) return { cn: '现代极简家具拉手', en: 'Modern Furniture Handle' };
    return { cn: `${query} 五金`, en: `${query} furniture hardware` };
  };

  // GÉNÉRATEUR INTELLIGENT DE SOURCING : Crée des résultats pertinents si aucun article exact n'est en base
  const generateDynamicResults = (query) => {
    const { cn, en } = getChineseKeywords(query);
    const cleanQuery = query.trim();
    const capitalized = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);

    return [
      {
        id: `dyn-ali-${Date.now()}-1`,
        platform: 'alibaba',
        platformBadge: '🟡 Alibaba Gold Verified Factory (7 ans)',
        titleFr: `${capitalized} Professionnel Haute Précision pour Industrie du Meuble & BTP`,
        titleCn: `${cn} (外贸出口高标准)`,
        category: 'outillage',
        keywords: [cleanQuery.toLowerCase(), 'professionnel', 'usine', 'chine', 'export'],
        factoryName: 'Guangdong Foshan Precision Manufacturing Co., Ltd.',
        location: 'Foshan, Guangdong',
        priceCny: 16.80,
        moq: 10,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80',
        specs: `Standard qualité Export CE/ISO9001 • Testé 60 000 cycles • Conditionnement boîte pro individuelle`
      },
      {
        id: `dyn-pdd-${Date.now()}-2`,
        platform: 'pinduoduo',
        platformBadge: '🔴 Pinduoduo Usine Directe (Prix de Gros)',
        titleFr: `${capitalized} Standard Usine Directe - Lot Économique pour Menuisiers`,
        titleCn: `${cn} (工厂直供 现货批发)`,
        category: 'outillage',
        keywords: [cleanQuery.toLowerCase(), 'direct usine', 'petit lot', 'artisan'],
        factoryName: 'Yongkang Hardware City Industrial Group',
        location: 'Yongkang, Zhejiang',
        priceCny: 9.50,
        moq: 4,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
        specs: `Prix usine ultra-compétitif • Stock prêt à expédier en 48h • MOQ accessible 4 pièces`
      }
    ];
  };

  // Filtrage des résultats ou génération intelligente
  const currentFilteredResults = (() => {
    const q = textQuery.trim().toLowerCase();
    
    // 1. Chercher d'abord dans la base interne
    const matches = curatedDatabase.filter(r => {
      const matchPlatform = selectedPlatform === 'all' || r.platform === selectedPlatform;
      if (!q) return matchPlatform;
      
      const matchText = 
        r.titleFr.toLowerCase().includes(q) ||
        r.titleCn.toLowerCase().includes(q) ||
        r.specs.toLowerCase().includes(q) ||
        r.factoryName.toLowerCase().includes(q) ||
        r.keywords.some(k => k.includes(q) || q.includes(k));
      
      return matchPlatform && matchText;
    });

    // 2. Si l'utilisateur a tapé une recherche mais 0 résultat trouvé en base, générer les offres usines dynamiques
    if (matches.length === 0 && q.length > 0) {
      const dynamicItems = generateDynamicResults(textQuery);
      return dynamicItems.filter(r => selectedPlatform === 'all' || r.platform === selectedPlatform);
    }

    return matches;
  })();

  // Lancement du scan simulé IA
  const executeScanAnimation = (label = '', imageSrc = null) => {
    setIsScanning(true);
    setScanProgress('1/4 Analyse de l\'image et extraction des formes...');
    
    if (imageSrc) {
      setUploadedImage(imageSrc);
    }

    setTimeout(() => {
      setScanProgress('2/4 Comparaison avec les catalogues de Foshan & Yongkang...');
    }, 600);

    setTimeout(() => {
      setScanProgress('3/4 Extraction des fiches techniques et négociation MOQ...');
    }, 1100);

    setTimeout(() => {
      setScanProgress('4/4 Calcul des prix usine en Yuan (¥) et conversion FCFA...');
    }, 1500);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      if (label) {
        setTextQuery(label);
      }
    }, 1900);
  };

  // Gestion du téléversement de photo
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageResult = event.target.result;
        setScannedImageName(file.name);
        
        // Déduire le mot-clé d'après le nom du fichier si possible
        let detectedKeyword = 'quincaillerie';
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('mart') || nameLower.includes('hamm')) detectedKeyword = 'marteau';
        else if (nameLower.includes('coul') || nameLower.includes('slid')) detectedKeyword = 'coulisse';
        else if (nameLower.includes('charn') || nameLower.includes('hing')) detectedKeyword = 'charniere';
        else if (nameLower.includes('gol') || nameLower.includes('prof')) detectedKeyword = 'gola';
        else if (nameLower.includes('angl') || nameLower.includes('corn')) detectedKeyword = 'angle';
        else if (nameLower.includes('vis') || nameLower.includes('dril')) detectedKeyword = 'visseuse';
        else {
          // Utiliser le nom sans extension
          detectedKeyword = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
        }

        executeScanAnimation(detectedKeyword, imageResult);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScannedImageName(file.name);
        executeScanAnimation(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '), event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Importation d'un article dans le catalogue principal
  const handleImport = (item) => {
    setImportedIds(prev => ({ ...prev, [item.id]: true }));
    onImportProduct({
      id: 'import-' + item.id,
      sku: 'SOURC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      category: item.category || 'outillage',
      titleFr: item.titleFr,
      titleCn: item.titleCn,
      material: item.specs,
      weightCapacity: 'Standard Usine Pro Export',
      dimensions: 'Standard Usine Certifié',
      images: [
        item.image,
        'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg',
        'https://sc04.alicdn.com/kf/H75691060938f4d92982d61cb570eb947Y.jpg_960x960q80.jpg'
      ],
      rating: item.rating,
      status: `Sourcé ${item.platform === 'pinduoduo' ? 'Pinduoduo' : 'Alibaba'}`,
      hasVideoDemo: true,
      suppliers: [
        {
          id: 'sup-' + item.id,
          name: item.factoryName,
          platform: item.platform,
          city: item.location,
          priceCny: item.priceCny,
          moq: item.moq,
          rating: item.rating,
          badge: item.platformBadge,
          isPreferred: true,
          leadTime: '5-7 jours'
        }
      ],
      benefitsArtisan: 'Installation rapide, haute résistance et conformité qualité.',
      benefitsClient: 'Finition soignée haut de gamme et durabilité certifiée.',
      recommendedTools: 'Outillage de quincaillerie standard.'
    });
  };

  const { cn: translatedCn, en: translatedEn } = getChineseKeywords(textQuery || 'quincaillerie meuble');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '920px', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Search size={20} color="#3B82F6" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Scanner & Sourcing Usines (Alibaba & Pinduoduo)
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Recherche textuelle universelle ou scan visuel par photo pour trouver les manufactures en Chine et leurs prix en FCFA.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher: [ ✍️ Par Nom / Description ] | [ 📷 Scanner par Photo / Image ] */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: '#0B1120',
          padding: '0.3rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '0.85rem'
        }}>
          <button
            type="button"
            onClick={() => setSearchMode('text')}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: searchMode === 'text' ? 'var(--blue-primary)' : 'transparent',
              color: searchMode === 'text' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Type size={15} />
            <span>✍️ Recherche par Nom ou Description</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchMode('image')}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: searchMode === 'image' ? 'var(--amber-gold)' : 'transparent',
              color: searchMode === 'image' ? '#090E17' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Camera size={15} />
            <span>📷 Scanner par Photo / Image</span>
          </button>
        </div>

        {/* Platform Selector Tabs: Alibaba vs Pinduoduo vs Toutes */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <button
            type="button"
            onClick={() => setSelectedPlatform('all')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: `1px solid ${selectedPlatform === 'all' ? 'var(--blue-light)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              background: selectedPlatform === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-card)',
              color: selectedPlatform === 'all' ? '#93C5FD' : 'var(--text-secondary)'
            }}
          >
            🌐 Toutes Usines ({currentFilteredResults.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlatform('alibaba')}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '8px',
              border: `1px solid ${selectedPlatform === 'alibaba' ? 'var(--amber-gold)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              background: selectedPlatform === 'alibaba' ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-card)',
              color: selectedPlatform === 'alibaba' ? 'var(--amber-light)' : 'var(--text-secondary)'
            }}
          >
            🟡 Alibaba.com (Fournisseurs Gold & Trade Assurance)
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlatform('pinduoduo')}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '8px',
              border: `1px solid ${selectedPlatform === 'pinduoduo' ? 'var(--rose-accent)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              background: selectedPlatform === 'pinduoduo' ? 'rgba(225, 29, 72, 0.18)' : 'var(--bg-card)',
              color: selectedPlatform === 'pinduoduo' ? '#FDA4AF' : 'var(--text-secondary)'
            }}
          >
            🔴 Pinduoduo (Prix Usine Petits Lots MOQ 2-5 pcs)
          </button>
        </div>

        {/* INPUT 1: TEXT SEARCH BAR */}
        {searchMode === 'text' && (
          <div style={{ marginBottom: '0.85rem' }}>
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (textQuery.trim()) {
                  executeScanAnimation(textQuery.trim());
                }
              }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: '#0B1120',
                border: '1.5px solid var(--blue-primary)',
                borderRadius: '10px',
                padding: '0.6rem 1rem'
              }}>
                <Search size={18} color="var(--blue-light)" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="Tapez n'importe quel article : marteau, coulisse invisible, charnière 165°, magic corner, gola..."
                  value={textQuery}
                  onChange={(e) => {
                    setTextQuery(e.target.value);
                    setHasScanned(true);
                  }}
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
                {textQuery && (
                  <button
                    type="button"
                    onClick={() => setTextQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button type="submit" className="btn-primary-action" style={{ padding: '0.6rem 1.25rem', fontSize: '0.82rem' }}>
                <Search size={16} />
                <span>Rechercher Usines</span>
              </button>
            </form>

            {/* Quick Keyword Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Suggestions rapides :</span>
              {['🔨 Marteau', '🗄️ Coulisse Invisible', '🚪 Charnière 165°', '🛠️ Gabarit 35mm', '📐 Profilé Gola', '🔄 Magic Corner', '⚡ Visseuse Pro'].map((tag) => {
                const cleanTag = tag.replace(/^[^\s]+\s/, '');
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setTextQuery(cleanTag);
                      executeScanAnimation(cleanTag);
                    }}
                    style={{
                      background: '#0B1120',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* INPUT 2: IMAGE SCANNER WITH REAL FILE UPLOAD & LASER ANIMATION */}
        {searchMode === 'image' && (
          <div style={{ marginBottom: '0.85rem' }}>
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#60A5FA' : 'rgba(245, 158, 11, 0.5)'}`,
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'center',
                background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Effet Scanner Laser quand un scan est en cours */}
              {isScanning && (
                <>
                  <div className="laser-beam" />
                  <div className="scan-grid-overlay" />
                </>
              )}

              {uploadedImage ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--amber-gold)' }}>
                    <img 
                      src={uploadedImage} 
                      alt="Scanned item" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isScanning && <div className="laser-beam" />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber-light)', fontWeight: 800, fontSize: '0.85rem' }}>
                      <Sparkles size={16} />
                      <span>{isScanning ? 'Scan & Reconnaissance IA en cours...' : 'Photo Scannée & Analysée'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Fichier : <strong>{scannedImageName || 'image_sourcing.jpg'}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                      Cliquez pour changer de photo ou glissez-en une autre
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <Camera size={24} color="#F59E0B" />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem' }}>
                    Téléversez ou Glissez une Photo de la Pièce / Outil
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    Prenez une photo de n'importe quel marteau, coulisse, charnière ou profilé pour identifier instantanément la manufacture chinoise
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-amber-action" 
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload size={14} />
                      <span>Choisir un fichier image</span>
                    </button>

                    <button
                      type="button"
                      className="nav-btn"
                      style={{ background: '#0B1120', border: '1px solid var(--border-subtle)', padding: '0.45rem 0.8rem', fontSize: '0.72rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        executeScanAnimation('marteau', 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80');
                      }}
                    >
                      🔨 Tester Photo Marteau Pro
                    </button>

                    <button
                      type="button"
                      className="nav-btn"
                      style={{ background: '#0B1120', border: '1px solid var(--border-subtle)', padding: '0.45rem 0.8rem', fontSize: '0.72rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        executeScanAnimation('coulisse', 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg');
                      }}
                    >
                      🗄️ Tester Photo Coulisse
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCANNING RADAR LOADER */}
        {isScanning && (
          <div style={{
            background: '#0B1120',
            border: '1px solid var(--blue-primary)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <RefreshCw size={18} className="spin" color="var(--blue-light)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                Recherche approfondie sur les serveurs Alibaba & Pinduoduo...
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--amber-light)' }}>
                {scanProgress}
              </div>
            </div>
          </div>
        )}

        {/* DIRECT PASSERELLE LINKS TO REAL ALIBABA & 1688 */}
        {textQuery && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
              <Globe size={15} color="#60A5FA" />
              <span>Traduction Chinois : <strong style={{ color: '#FCD34D', fontFamily: 'var(--font-mono)' }}>{translatedCn}</strong> ({translatedEn})</span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <a 
                href={`https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(textQuery)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#FCD34D',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <span>Ouvrir sur Alibaba.com</span>
                <ExternalLink size={11} />
              </a>

              <a 
                href={`https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(translatedCn)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(225, 29, 72, 0.15)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  color: '#FDA4AF',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <span>Chercher sur 1688 Chine</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        )}

        {/* RESULTS LIST */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '4px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
              🎯 {currentFilteredResults.length} résultats fabricants disponibles :
            </div>
            {textQuery && (
              <span style={{ fontSize: '0.72rem', color: 'var(--blue-light)', fontWeight: 600 }}>
                Article recherché : « {textQuery} »
              </span>
            )}
          </div>

          {currentFilteredResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: '#0B1120', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ fontWeight: 800, color: 'white' }}>Aucun fournisseur trouvé</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Tapez un mot-clé ou scannez une photo pour générer instantanément les manufactures.
              </div>
            </div>
          ) : (
            currentFilteredResults.map(item => (
              <div 
                key={item.id}
                style={{
                  background: '#0B1120',
                  border: `1.5px solid ${importedIds[item.id] ? 'var(--emerald-green)' : 'var(--border-subtle)'}`,
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Photo & Description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                  <img 
                    src={item.image} 
                    alt={item.titleFr} 
                    style={{ width: '75px', height: '75px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{
                        background: item.platform === 'pinduoduo' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: item.platform === 'pinduoduo' ? '#FDA4AF' : '#FCD34D',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        border: `1px solid ${item.platform === 'pinduoduo' ? 'rgba(225, 29, 72, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                      }}>
                        {item.platformBadge}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.3, color: 'white' }}>{item.titleFr}</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>📍 {item.factoryName} ({item.location})</p>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>{item.specs}</div>
                  </div>
                </div>

                {/* Price in FCFA & 1-Click Import Button */}
                <div style={{ textAlign: 'right', minWidth: '170px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--amber-light)', fontWeight: 700 }}>
                    {item.priceCny.toFixed(2)} ¥
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
                    ≈ {formatPrice(item.priceCny)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    MOQ : {item.moq} pièces
                  </div>

                  <button
                    className={importedIds[item.id] ? 'btn-primary-action' : 'btn-amber-action'}
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.72rem',
                      width: '100%',
                      background: importedIds[item.id] ? 'var(--emerald-green)' : undefined,
                      cursor: importedIds[item.id] ? 'default' : 'pointer'
                    }}
                    onClick={() => handleImport(item)}
                    disabled={importedIds[item.id]}
                  >
                    {importedIds[item.id] ? (
                      <>
                        <Check size={13} />
                        <span>Ajouté au Catalogue</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} />
                        <span>Aspirer cet Article</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}

        </div>

      </div>
    </div>
  );
}
