import { CATEGORIES, INITIAL_PRODUCTS } from './catalogData';

export const WORKSPACE_TEMPLATES = [
  {
    id: 'tpl_quincaillerie',
    name: 'Quincaillerie & Menuiserie',
    icon: '⚙️',
    domain: 'Ferrures, visserie, coulisses & outillage usine',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'visserie', name: 'Visserie & Fixations', icon: '🔩', count: 0 },
      { id: 'coulisses', name: 'Coulisses & Tiroirs', icon: '🗄️', count: 0 },
      { id: 'charnieres', name: 'Charnières & Push', icon: '🚪', count: 0 },
      { id: 'angle', name: "Meubles d'Angle Cuisine", icon: '🔄', count: 0 },
      { id: 'dressing', name: 'Dressings & Penderies', icon: '🪜', count: 0 },
      { id: 'alu', name: 'Profilés Alu & Gola', icon: '📐', count: 0 },
      { id: 'outillage', name: 'Gabarits & Productivité', icon: '🛠️', count: 0 }
    ]
  },
  {
    id: 'tpl_cuisines',
    name: 'Cuisines & Aménagement',
    icon: '🍳',
    domain: 'Éviers inox cascade, robinetterie & électro',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'eviers', name: 'Éviers Cuves & Cascades Inox', icon: '🚰', count: 0 },
      { id: 'robinetterie', name: 'Robinetterie Douchette 360°', icon: '🚿', count: 0 },
      { id: 'electro', name: 'Hottes & Plaques Induction', icon: '🍳', count: 0 },
      { id: 'rangements', name: 'Organisateurs & Tiroirs Épices', icon: '🗄️', count: 0 },
      { id: 'plans', name: 'Plans de Travail & Crédences', icon: '🪵', count: 0 },
      { id: 'eclairage', name: 'LED Sous-Meubles & Profilés', icon: '💡', count: 0 },
      { id: 'accessoires', name: 'Poubelles Tri & Accessoires', icon: '🗑️', count: 0 }
    ]
  },
  {
    id: 'tpl_vetements',
    name: 'Vêtements & Prêt-à-Porter',
    icon: '👗',
    domain: 'Streetwear, basiques 400 GSM & confection',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'tshirts', name: 'T-Shirts & Polos Coton Lourd', icon: '👕', count: 0 },
      { id: 'sweats', name: 'Hoodies & Sweats 400+ GSM', icon: '🧥', count: 0 },
      { id: 'pantalons', name: 'Jeans, Cargos & Joggings', icon: '👖', count: 0 },
      { id: 'robes', name: 'Robes & Ensembles', icon: '👗', count: 0 },
      { id: 'vestes', name: 'Vestes, Manteaux & Doudounes', icon: '🦺', count: 0 },
      { id: 'sport', name: 'Activewear & Fitness', icon: '🏃', count: 0 },
      { id: 'accessoires', name: 'Casquettes, Sacs & Bonnets', icon: '🧢', count: 0 }
    ]
  },
  {
    id: 'tpl_chaussures',
    name: 'Chaussures & Sneakers',
    icon: '👟',
    domain: 'Baskets, chaussures de ville & semelles',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'sneakers', name: 'Sneakers Casual & Streetwear', icon: '👟', count: 0 },
      { id: 'sport_shoes', name: 'Chaussures Running & Trail', icon: '🏃', count: 0 },
      { id: 'ville', name: 'Mocassins & Chaussures Cuir', icon: '👞', count: 0 },
      { id: 'sandales', name: 'Sandales, Mules & Claquettes', icon: '🩴', count: 0 },
      { id: 'bottes', name: 'Bottines & Chaussures Sécurité', icon: '🥾', count: 0 },
      { id: 'semelles', name: 'Semelles & Accessoires Entretien', icon: '🧼', count: 0 }
    ]
  },
  {
    id: 'tpl_electronique',
    name: 'High-Tech & Électronique',
    icon: '📱',
    domain: 'Gadgets, audio, chargeurs & domotique',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'audio', name: 'Écouteurs TWS ANC & Enceintes', icon: '🎧', count: 0 },
      { id: 'chargeurs', name: 'Chargeurs GaN Rapides & Câbles', icon: '⚡', count: 0 },
      { id: 'smartwatch', name: 'Montres & Bracelets Connectés', icon: '⌚', count: 0 },
      { id: 'smarthome', name: 'Domotique & Caméras WiFi', icon: '📹', count: 0 },
      { id: 'gaming', name: 'Accessoires Gaming & Claviers', icon: '🎮', count: 0 },
      { id: 'supports', name: 'Supports & Hubs USB-C', icon: '💻', count: 0 }
    ]
  },
  {
    id: 'tpl_mobilier',
    name: 'Mobilier & Décoration',
    icon: '🪑',
    domain: 'Chaises, tables, luminaires & déco',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'assises', name: 'Chaises Design & Fauteuils', icon: '🪑', count: 0 },
      { id: 'tables', name: 'Tables à Manger & Basses', icon: '🪵', count: 0 },
      { id: 'rangement_meuble', name: 'Buffets, Étagères & Meubles TV', icon: '🗄️', count: 0 },
      { id: 'luminaire', name: 'Suspensions & Lampadaires', icon: '💡', count: 0 },
      { id: 'deco', name: 'Miroirs, Tapis & Vases', icon: '🏺', count: 0 }
    ]
  },
  {
    id: 'tpl_personnalise',
    name: 'Espace Vierge (Personnalisé)',
    icon: '📦',
    domain: 'Créez vos propres rayons et catégories sur-mesure',
    categories: [
      { id: 'all', name: 'Tous les Articles', icon: '🗂️', count: 0 },
      { id: 'categorie_1', name: 'Rayon Principal', icon: '📦', count: 0 }
    ]
  }
];

export const INITIAL_WORKSPACES = [
  {
    id: 'ws_quincaillerie',
    name: 'Quincaillerie & Menuiserie',
    icon: '⚙️',
    domain: 'Ferrures, visserie, coulisses & outillage usine',
    badge: 'Projet Principal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'ws_cuisines',
    name: 'Cuisines & Aménagement',
    icon: '🍳',
    domain: 'Éviers inox cascade, robinetterie & électro',
    badge: 'Actif',
    isDefault: false,
    createdAt: '2026-01-02T00:00:00.000Z'
  },
  {
    id: 'ws_vetements',
    name: 'Vêtements & Textile',
    icon: '👗',
    domain: 'Streetwear, basiques 400 GSM & confection',
    badge: 'Actif',
    isDefault: false,
    createdAt: '2026-01-03T00:00:00.000Z'
  }
];

export const SAMPLE_PRODUCTS_BY_WORKSPACE = {
  ws_quincaillerie: INITIAL_PRODUCTS,
  ws_cuisines: [],
  ws_vetements: []
};
