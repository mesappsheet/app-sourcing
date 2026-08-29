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
  },
  {
    id: 'cat_electromenager',
    name: 'Électroménager & Cuisson',
    icon: '🔌',
    subCategories: [
      { id: 'cuiseurs', name: 'Cuisinières à Riz & Cuiseurs', icon: '🍚' },
      { id: 'petit_electro', name: 'Petits Appareils Cuisine', icon: '🍳' },
      { id: 'accessoires_cuisine', name: 'Ustensiles & Accessoires', icon: '🥄' }
    ]
  }
];

export const CATEGORIES = DEFAULT_CATEGORIES_TREE;

export const INITIAL_PRODUCTS = [];

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
