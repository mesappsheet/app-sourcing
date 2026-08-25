export const DEFAULT_CATEGORIES_TREE = [
  { 
    id: 'inbox', 
    name: 'Magasin d\'Arrivage', 
    icon: '📥', 
    isInbox: true, 
    subCategories: [] 
  },
  {
    id: 'cat_quincaillerie',
    name: 'Quincaillerie & Fixations',
    icon: '🔩',
    subCategories: [
      { id: 'visserie', name: 'Visserie & Fixations', icon: '🔩' },
      { id: 'coulisses', name: 'Coulisses & Tiroirs', icon: '🗄️' },
      { id: 'charnieres', name: 'Charnières & Push', icon: '🚪' },
      { id: 'poignees', name: 'Poignées & Boutons', icon: '🔘' },
      { id: 'serrures', name: 'Serrures & Sécurité', icon: '🔒' }
    ]
  },
  {
    id: 'cat_cuisine_meubles',
    name: 'Meubles & Rangement Cuisine',
    icon: '🍽️',
    subCategories: [
      { id: 'angle', name: 'Meubles d\'Angle Cuisine', icon: '🔄' },
      { id: 'dressing', name: 'Dressings & Penderies', icon: '🪜' },
      { id: 'alu', name: 'Profilés Alu & Gola', icon: '📐' },
      { id: 'led', name: 'Éclairage LED Meuble', icon: '💡' }
    ]
  },
  {
    id: 'cat_outillage_pro',
    name: 'Gabarits & Outillage Pro',
    icon: '🛠️',
    subCategories: [
      { id: 'outillage', name: 'Gabarits & Productivité', icon: '🛠️' },
      { id: 'machines', name: 'Électroportatif Usine', icon: '⚡' },
      { id: 'mesure', name: 'Mesure & Niveaux Lasers', icon: '📏' }
    ]
  }
];

export const CATEGORIES = DEFAULT_CATEGORIES_TREE;

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-df-01',
    sku: 'QUIN-FIX-DF01',
    category: 'visserie',
    titleFr: 'Entretoise de Fixation Verre Garde-Corps & Escalier - DF Railing Inox 304 Noir Mat',
    titleCn: '304不锈钢黑色哑光玻璃夹固定销 楼梯护栏配件',
    material: 'Acier Inoxydable 304 Noir Mat PVD',
    weightCapacity: 'Charge Latérale > 150 kg/pièce • Verre 8-12mm',
    dimensions: 'Diamètre 38/50mm • Corps 30/50mm • Goujon M10/M12',
    icon: '🔩',
    rating: 4.9,
    status: 'Sourcé Usine',
    hasVideoDemo: true,
    images: [
      'https://s.alicdn.com/@sc04/kf/H8c24fa76ab894addaf7aa70d5163b1d7w.jpg_960x960q80.jpg',
      'https://s.alicdn.com/@sc04/kf/H61bb6d872fea4070985ec828f14f1042V.jpg_960x960q80.jpg'
    ],
    variants: {
      diametres: ['38 mm', '50 mm'],
      longueursCorps: ['30 mm', '50 mm'],
      finitions: ['Noir Mat PVD (Standard)', 'Inox Brossé Satiné', 'Or Brossé PVD']
    },
    specifications: [
      { label: 'Type de fixation', value: 'Entretoise murale traversante pour verre' },
      { label: 'Épaisseur verre compatible', value: 'Verre trempé ou feuilleté 8mm à 12mm' },
      { label: 'Fixation support', value: 'Goujon double filetage bois / cheville béton' },
      { label: 'Protection verre', value: 'Joints d\'étanchéité EPDM transparents inclus' },
      { label: 'Résistance mécanique', value: 'Conforme garde-corps charges dynamiques' }
    ],
    suppliers: [
      {
        id: 'sup-df-railing',
        name: 'Foshan DF Railing Hardware Manufacturing Co.',
        city: 'Foshan (Guangdong)',
        priceCny: 4.85,
        moq: 100,
        leadTime: '10 jours',
        rating: 4.9,
        verified: true
      }
    ]
  },
  {
    id: 'prod-001',
    sku: 'QUIN-COU-001',
    category: 'coulisses',
    titleFr: 'Coulisse Sous-Tiroir Invisible Sortie Totale Soft-Close 450mm',
    titleCn: '450mm 隐藏式全拉出阻尼滑轨 (三节缓冲)',
    material: 'Acier Galvanisé Q235 Épais Anti-Rouille',
    weightCapacity: '40 kg certifié (80 000 cycles)',
    dimensions: 'Longueur 450mm (Disponible de 250 à 600mm)',
    icon: '🗄️',
    rating: 4.9,
    status: 'Bestseller Usine',
    hasVideoDemo: true,
    
    // Galerie de vraies photos style Alibaba/1688
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'
    ],

    // Variantes de sélection style Alibaba
    variants: {
      longueurs: ['300 mm', '350 mm', '400 mm', '450 mm (Standard)', '500 mm', '550 mm'],
      finitions: ['Zingué Brillant', 'Gris Anthracite', 'Noir Mat'],
      typeFermeture: ['Amorti Soft-Close', 'Push-to-Open (Sans Poignée)', 'Combiné Push + Soft-Close']
    },

    // Spécifications techniques détaillées
    specifications: [
      { label: 'Type d\'installation', value: 'Montage sous le tiroir (100% Invisible)' },
      { label: 'Course de sortie', value: 'Sortie Totale 3 sections (100% accessible)' },
      { label: 'Réglage 3D', value: 'Hauteur 0-3mm, Latéral ±1.5mm, Profondeur ±2mm' },
      { label: 'Épaisseur panneau tiroir', value: '16 mm à 19 mm' },
      { label: 'Durée de vie certifiée', value: '80 000 cycles d\'ouverture/fermeture' },
      { label: 'Matière du vérin', value: 'Piston laiton & huile silicone aviation' }
    ],

    // Multi-Supplier Data
    suppliers: [
      {
        id: 'sup-foshan-01',
        name: 'Foshan Top Precision Hardware Co.',
        city: 'Foshan (Guangdong)',
        priceCny: 14.50,
        moq: 50,
        rating: 4.9,
        badge: 'Super Factory 1688 (8 ans)',
        isPreferred: true,
        url1688: 'https://detail.1688.com/offer/6548123912.html',
        leadTime: '5 jours',
        priceTiers: [
          { minQty: 50, priceCny: 14.50 },
          { minQty: 200, priceCny: 13.50 },
          { minQty: 1000, priceCny: 12.20 }
        ]
      },
      {
        id: 'sup-jinhua-02',
        name: 'Jinhua Golden Slide Manufacturing',
        city: 'Jinhua (Zhejiang)',
        priceCny: 13.20,
        moq: 200,
        rating: 4.6,
        badge: 'Vérifié 1688 (5 ans)',
        isPreferred: false,
        url1688: 'https://detail.1688.com/offer/712390123.html',
        leadTime: '7 jours'
      }
    ],

    // Video & Social Radar
    videoDemo: {
      source: 'Douyin (TikTok Chinois)',
      views: '240K vues',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-kitchen-drawer-opening-and-closing-smoothly-41224-large.mp4',
      transcriptCn: '隐藏三节带阻尼滑轨，轻轻一推静音回位，底部安装完全隐形，木工师傅安装特别快。',
      script30s: {
        hook: '🔥 Arrêtez de perdre 45 minutes à régler vos tiroirs traditionnels !',
        demo: 'Voici la coulisse invisible sous-tiroir à sortie totale avec amortisseur hydraulique. Le tiroir s\'ouvre à 100% sans rien laisser visible sur les côtés, et se referme dans un silence absolu.',
        artisanTip: '💡 Pour les menuisiers : Le clip de fixation rapide permet de poser et démonter le tiroir sans aucun outil. La molette intégrée permet un réglage 3D en 5 secondes chrono.',
        cta: 'Disponible dès maintenant en gros pour vos chantiers sur-mesure !'
      }
    },

    benefitsArtisan: 'Gain de 30 min par meuble grâce au clipsage sans outil. Réglage 3D précis par simple molette.',
    benefitsClient: 'Finition haut de gamme invisible, fermeture amortie ultra-silencieuse et accès complet au fond du tiroir.',
    recommendedTools: 'Gabarit de perçage universel 32mm et mèche bois 6mm.'
  },

  {
    id: 'prod-002',
    sku: 'QUIN-ANG-002',
    category: 'angle',
    titleFr: 'Ferrure d\'Angle Magique Cuisine (Magic Corner) 4 Paniers Soft-Close',
    titleCn: '厨房橱柜转角拉篮 (飞碟小怪兽联动阻尼)',
    material: 'Acier Carbone & Verre Trempé Fumé / Caisson 900-1000mm',
    weightCapacity: '25 kg par plateau (Total 50kg)',
    dimensions: 'Pour caisson angle droit 900mm (ouverture porte min 450mm)',
    icon: '🔄',
    rating: 4.9,
    status: 'Tendance Virale',
    hasVideoDemo: true,

    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80'
    ],

    variants: {
      sensOuverture: ['Ouverture à Droite (Right)', 'Ouverture à Gauche (Left)', 'Universel Réversible'],
      finitionPaniers: ['Gris Anthracite & Verre', 'Chromé Miroir & Bois Blanc', 'Noir Titane Mat'],
      largeurCaisson: ['Caisson 900 mm', 'Caisson 1000 mm']
    },

    specifications: [
      { label: 'Type de mouvement', value: 'Cinématique articulée à sortie totale décalée' },
      { label: 'Nombre de plateaux', value: '4 paniers indépendants à fond antidérapant' },
      { label: 'Système d\'amortissement', value: 'Amortisseurs hydrauliques bi-directionnels' },
      { label: 'Largeur minimum porte', value: '450 mm' },
      { label: 'Hauteur intérieure caisson', value: '650 mm à 750 mm' },
      { label: 'Garantie mécanique usine', value: '5 ans' }
    ],

    suppliers: [
      {
        id: 'sup-foshan-01',
        name: 'Foshan Top Precision Hardware Co.',
        city: 'Foshan (Guangdong)',
        priceCny: 185.00,
        moq: 5,
        rating: 4.9,
        badge: 'Super Factory 1688 (8 ans)',
        isPreferred: true,
        url1688: 'https://detail.1688.com/offer/6129847192.html',
        leadTime: '7 jours'
      }
    ],

    videoDemo: {
      source: 'Xiaohongshu (Rednote)',
      views: '580K vues',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-kitchen-cabinet-with-smart-storage-41225-large.mp4',
      transcriptCn: '死角空间大变身！小怪兽转角拉篮，打开柜门所有锅具全部推出来，承重强静音缓冲。',
      script30s: {
        hook: '❌ Ne laissez plus jamais les angles de vos cuisines devenir des espaces morts !',
        demo: 'En ouvrant la porte, les 4 paniers avancent automatiquement vers vous. Tout le contenu du fond du meuble devient accessible sans se baisser.',
        artisanTip: '💡 Astuce poseur : Système réversible droite/gauche avec gabarit de fond fourni pour un montage en moins de 25 minutes.',
        cta: 'L\'accessoire indispensable qui déclenche le coup de cœur chez vos clients cuisine.'
      }
    },

    benefitsArtisan: 'Valorise vos réalisations de cuisines avec une marge 3x supérieure aux meubles standards.',
    benefitsClient: '100% de l\'espace d\'angle rentabilisé, fond anti-dérapant et plateaux extractibles faciles à nettoyer.',
    recommendedTools: 'Visseuse à renvoi d\'angle et niveau laser.'
  },

  {
    id: 'prod-003',
    sku: 'OUT-GAB-003',
    category: 'outillage',
    titleFr: 'Gabarit de Perçage Rapide & Précision pour Charnières 35mm en Aluminium',
    titleCn: '全铝合金 35mm 铰链开孔定位神器 (带快速夹紧)',
    material: 'Corps Aluminium CNC Massif Anodisé & Mèche Carbure Tungstène',
    weightCapacity: 'Usage Intensif Quotidien Atelier & Chantier',
    dimensions: 'Entraxe réglable 3mm, 4mm, 5mm, 6mm',
    icon: '🛠️',
    rating: 5.0,
    status: 'Gain Productivité',
    hasVideoDemo: true,

    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80',
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80'
    ],

    variants: {
      pack: ['Gabarit Seul', 'Pack Pro avec 2 Mèches 35mm + Clé Allen', 'Coffret Valise Rigide Alu'],
      diametresSupportes: ['Standard 35mm', 'Option 26mm + 35mm']
    },

    specifications: [
      { label: 'Précision d\'alignement', value: 'Usinage CNC ±0.05 mm' },
      { label: 'Type de serrage', value: 'Presse rapide intégrée avec patin caoutchouc' },
      { label: 'Contrôle de profondeur', value: 'Bague d\'arrêt réglable 10mm à 15mm' },
      { label: 'Poids de l\'outil', value: '620 g (Ultra-robuste)' }
    ],

    suppliers: [
      {
        id: 'sup-jinhua-05',
        name: 'Yongkang Precision Woodworking Tools',
        city: 'Yongkang (Zhejiang)',
        priceCny: 28.00,
        moq: 10,
        rating: 5.0,
        badge: 'Usine Outillage Bois (10 ans)',
        isPreferred: true,
        url1688: 'https://detail.1688.com/offer/556789123.html',
        leadTime: '2 jours'
      }
    ],

    videoDemo: {
      source: 'Douyin (Menuiserie Pro)',
      views: '1.2M vues',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-and-drilling-wood-41226-large.mp4',
      transcriptCn: '木工必备开孔神器！全铝合金打造，自带快速夹具，一按一压3秒搞定一个铰链孔。',
      script30s: {
        hook: '⚡ Percez vos trous de charnières 35mm en 3 secondes sans jamais tracer au crayon !',
        demo: 'Ce gabarit en aluminium massif intègre un système de serrage rapide et une bague de profondeur. Vous posez, vous serrez, vous percez : profondeur et alignement 100% parfaits.',
        artisanTip: '💡 Le gain de temps : Vous préparez 10 portes de placard en 5 minutes sans aucun risque de transpercer le panneau.',
        cta: 'L\'outil qui se rentabilise dès le premier meuble fabriqué.'
      }
    },

    benefitsArtisan: 'Zéro déchet de panneau percé de travers. Zéro mesure manuelle répétitive.',
    benefitsClient: 'Des portes de placard parfaitement droites et alignées au millimètre.',
    recommendedTools: 'Perceuse-visseuse standard 18V.'
  },

  {
    id: 'prod-004',
    sku: 'ALU-PRO-004',
    category: 'alu',
    titleFr: 'Profilé Poignée Aluminium Gola Type "L" Finition Noir Mat & Titane',
    titleCn: '极简无拉手 L型 Gola 铝型材 (哑光黑/钛金灰)',
    material: 'Aluminium 6063 Anodisé Haute Résistance Qualité Export',
    weightCapacity: 'Profilé Structurel Caisson',
    dimensions: 'Barre de 3 mètres avec embouts et équerres de fixation',
    icon: '📐',
    rating: 4.8,
    status: 'Meuble Moderne',
    hasVideoDemo: true,

    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80'
    ],

    variants: {
      typeProfil: ['Profilé "L" (Meubles Sous-Plan)', 'Profilé "C" (Entre Tiroirs Intermédiaires)', 'Profilé Vertical (Armoires)'],
      couleurFinition: ['Noir Mat Anodisé', 'Gris Titane Brossé', 'Champagne Or Brossé', 'Alu Naturel Argent'],
      longueurBarre: ['Barre 3.00 mètres', 'Barre 4.00 mètres', 'Découpe sur-mesure']
    },

    specifications: [
      { label: 'Alliage aluminium', value: 'Aluminium 6063 T5 haute dureté' },
      { label: 'Traitement de surface', value: 'Anodisation 12-15 microns anti-traces' },
      { label: 'Accessoires inclus', value: '2 embouts d\'extrémité + 4 équerres de fixation' },
      { label: 'Compatibilité caissons', value: 'Panneaux 18mm et 19mm standard' }
    ],

    suppliers: [
      {
        id: 'sup-nanhai-06',
        name: 'Foshan Nanhai Aluminum Profile Factory',
        city: 'Foshan (Guangdong)',
        priceCny: 22.50,
        moq: 30,
        rating: 4.8,
        badge: 'Super Factory Profilés Alu',
        isPreferred: true,
        url1688: 'https://detail.1688.com/offer/778901234.html',
        leadTime: '4 jours'
      }
    ],

    videoDemo: {
      source: 'Douyin (Design Meubles)',
      views: '310K vues',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-black-kitchen-interior-41227-large.mp4',
      transcriptCn: '极简意式无拉手柜门设计，嵌入式Gola铝合金型材，线条感极强，高端大气。',
      script30s: {
        hook: '🖤 Donnez à vos meubles le look ultra-moderne des cuisines italiennes haut de gamme !',
        demo: 'Le profilé Gola en aluminium s\'encastre directement dans le caisson. Fini les poignées apparentes qui dépassent : les façades restent pures et épurées.',
        artisanTip: '💡 Fourni avec ses équerres d\'assemblage rapide et ses embouts de chant assortis pour une finition impeccable.',
        cta: 'Proposez le design contemporain le plus demandé par les architectes d\'intérieur.'
      }
    },

    benefitsArtisan: 'Installation propre, compatible avec tous les panneaux de 18mm et 19mm.',
    benefitsClient: 'Facilité de nettoyage, esthétique minimaliste luxueuse.',
    recommendedTools: 'Scie à onglet lame aluminium et défonceuse.'
  },
  {
    id: 'prod-005',
    sku: 'QUIN-DRE-005',
    category: 'dressing',
    titleFr: 'Penderie Escamotable Basculante avec Vérin Hydraulique (Lift Dressing)',
    titleCn: '衣柜升降挂衣杆 (液压缓冲重型高位衣架)',
    material: 'Tube Acier Chromé & Boîtier Aluminium Noir / Amortisseur Gaz',
    weightCapacity: '15 à 18 kg',
    dimensions: 'Largeur extensible 830mm à 1150mm (Adaptable tous dressings)',
    icon: '🪜',
    rating: 4.9,
    status: 'Ergonomie Top',
    hasVideoDemo: true,

    images: [
      'https://images.unsplash.com/photo-1558997519-83ea9252def8?w=800&q=80',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'
    ],

    variants: {
      largeurs: ['600 - 830 mm (Petit)', '830 - 1150 mm (Standard)', '1150 - 1400 mm (Grand)'],
      finitions: ['Noir Mat & Chrome', 'Gris Moka & Or Brossé', 'Argent Satiné']
    },

    specifications: [
      { label: 'Type de vérin', value: 'Vérin hydraulique double amorti à gaz' },
      { label: 'Capacité de charge', value: '18 kg certifiés (manteaux et costumes)' },
      { label: 'Poignée de tirage', value: 'Télescopique ergonomique antiglisse' }
    ],

    suppliers: [
      {
        id: 'sup-foshan-01',
        name: 'Foshan Top Precision Hardware Co.',
        city: 'Foshan (Guangdong)',
        priceCny: 52.00,
        moq: 10,
        rating: 4.9,
        badge: 'Super Factory 1688 (8 ans)',
        isPreferred: true,
        url1688: 'https://detail.1688.com/offer/667812930.html',
        leadTime: '5 jours'
      }
    ],

    videoDemo: {
      source: 'Douyin (Dressing Pro)',
      views: '450K vues',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-organized-luxury-closet-with-clothes-41228-large.mp4',
      transcriptCn: '高处衣服拿不到？液压升降衣架，轻轻一拉平稳下降，挂满衣服也能轻松回弹。',
      script30s: {
        hook: '👗 Comment exploiter les 2,50m de hauteur d\'un dressing sans avoir besoin d\'escabeau ?',
        demo: 'Tirez simplement la poignée centrale : la penderie descend doucement à hauteur d\'homme. Vous choisissez votre vêtement, et le vérin hydraulique remonte la tringle tout seul.',
        artisanTip: '💡 Largeur télescopique réglable : vous n\'avez pas besoin de fabriquer un caisson à une mesure fixe.',
        cta: 'L\'équipement qui transforme un simple placard en dressing de luxe.'
      }
    },

    benefitsArtisan: 'Pose facile avec 4 vis latérales de chaque côté.',
    benefitsClient: 'Double la capacité de rangement des vêtements suspendus.',
    recommendedTools: 'Niveau à bulle et tournevis cruciforme.'
  },

  {
    id: 'prod-006',
    sku: 'QUIN-CHA-006',
    category: 'charnieres',
    titleFr: 'Charnière Invisible Grand Angle 165° avec Amortisseur Intégré Clip-On',
    titleCn: '165度大角度三维可调阻尼铰链 (快装快拆)',
    material: 'Acier Nickele Épais Anti-Corrosion',
    weightCapacity: 'Portes lourdes jusqu\'à 22mm d\'épaisseur',
    dimensions: 'Diamètre boîtier 35mm / Entraxe 48mm',
    icon: '🚪',
    rating: 4.8,
    status: 'Indispensable',
    hasVideoDemo: true,

    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80'
    ],

    variants: {
      typeMontage: ['Embase Clipsable Sans Outil (Clip-on)', 'Embase Fixe à Visser'],
      angleOuverture: ['165° Grand Angle', '175° Angle Total'],
      finitions: ['Nickel Brillant', 'Noir Titane Mat']
    },

    specifications: [
      { label: 'Angle d\'ouverture', value: '165 degrés sans déport (tiroirs intérieurs libres)' },
      { label: 'Diamètre de perçage', value: '35 mm standard boîtier' },
      { label: 'Entraxe de fixation', value: '48 mm standard' },
      { label: 'Amortisseur', value: 'Piston hydraulique silencieux en laiton' }
    ],

    suppliers: [
      {
        id: 'sup-foshan-01',
        name: 'Foshan Top Precision Hardware Co.',
        city: 'Foshan (Guangdong)',
        priceCny: 4.80,
        moq: 100,
        rating: 4.9,
        badge: 'Super Factory 1688 (8 ans)',
        isPreferred: true,
        url1688: 'https://detail.1688.com/offer/512983712.html',
        leadTime: '3 jours'
      }
    ],

    videoDemo: {
      source: 'Douyin (Quincaillerie)',
      views: '180K vues',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-wardrobe-doors-opening-smoothly-41229-large.mp4',
      transcriptCn: '165度大开角铰链，柜门全开不挡抽屉，内装抽屉拉出完全无干涉。',
      script30s: {
        hook: '🚪 Vos tiroirs intérieurs bloquent contre la porte ouverte à 90° ?',
        demo: 'Cette charnière spéciale permet une ouverture à 165°. La porte s\'efface complètement, ce qui permet à vos tiroirs intérieurs de sortir sans jamais frotter.',
        artisanTip: '💡 Équipée d\'un amortisseur hydraulique en laiton qui garantit 80 000 cycles d\'ouverture/fermeture silencieuse.',
        cta: 'La référence incontournable pour les meubles d\'angle et dressings à tiroirs cachés.'
      }
    },

    benefitsArtisan: 'Évite les entretoises disgracieuses pour décaler les coulisses.',
    benefitsClient: 'Accès panoramique à l\'intérieur du meuble et zéro bruit à la fermeture.',
    recommendedTools: 'Mèche forstner 35mm.'
  }
];

// Configuration des taux de conversion et logistique adaptés à l'Afrique (FCFA)
export const DEFAULT_SETTINGS = {
  currency: 'FCFA', // Devise principale : Franc CFA (XOF / XAF)
  rates: {
    FCFA: 85.0, // 1 CNY (Yuan) ≈ 85 FCFA (Taux de change direct)
    EUR: 0.13,  // 1 CNY ≈ 0.13 EUR
    USD: 0.14   // 1 CNY ≈ 0.14 USD
  },
  freightCostPerKg: 1650, // Coût estimé transport maritime groupé Chine -> Afrique (1 650 FCFA / kg)
  freightCostPerKgAir: 6500, // Coût fret aérien express échantillons (6 500 FCFA / kg)
  targetMarginMultiplier: 2.2 // Coeff multiplicateur vente pour artisans locaux (ex: Revient 1 000 FCFA -> Vente 2 200 FCFA)
};
