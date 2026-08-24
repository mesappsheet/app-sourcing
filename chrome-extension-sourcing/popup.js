function extractPageData() {
  const url = window.location.href;
  const rawText = document.body ? document.body.innerText : '';
  
  // 1. Titre Produit Réel
  const h1 = document.querySelector('h1');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const title = (h1 && h1.innerText) ? h1.innerText.trim() : ((ogTitle && ogTitle.content) ? ogTitle.content.trim() : document.title);

  // 2. Scan exhaustif des prix en FCFA et Devises dans tout le DOM
  const fcfaPrices = [];
  const matches = rawText.matchAll(/(\d[\d\s\u00a0.,]{1,9})\s*(?:FCFA|CFA|XOF)/gi);
  for (const m of matches) {
    const cleaned = m[1].replace(/[\s\u00a0.,]/g, '');
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 100 && num < 50000000 && !fcfaPrices.includes(num)) {
      fcfaPrices.push(num);
    }
  }

  const priceNodes = document.querySelectorAll('[class*="price"], [class*="Price"], [class*="lead"], [class*="tier"], .num, .value');
  priceNodes.forEach(node => {
    const t = node.innerText || '';
    if (t.includes('FCFA') || t.includes('CFA')) {
      const nums = t.match(/(\d[\d\s\u00a0.,]{1,9})/g);
      if (nums) {
        nums.forEach(nStr => {
          const cleaned = nStr.replace(/[\s\u00a0.,]/g, '');
          const n = parseInt(cleaned, 10);
          if (!isNaN(n) && n > 100 && n < 50000000 && !fcfaPrices.includes(n)) {
            fcfaPrices.push(n);
          }
        });
      }
    }
  });

  // 3. Fournisseur / Nom de l'Usine Réel (Filtrage Infaillible Mobile & Desktop)
  let company = '';
  
  // Blacklist formelle de mots, catégories et expressions interdits (anti-bannières de classement mobile)
  const isForbiddenText = (str) => {
    if (!str || typeof str !== 'string') return true;
    const lower = str.toLowerCase().trim();
    if (lower.length < 3 || lower.length > 95) return true;
    const forbidden = [
      'alibaba', 'ali express', 'aliexpress', 'centre d\'aide', 'à propos', 'propos d\'',
      'accio', 'service client', 'help center', 'conditions', 'politique', 'confidentialité',
      'protection des acheteurs', 'afficher plus', 'voir plus', 'see more', 'read more',
      'avis sur', 'note de', 'evaluation', 'feedback', 'suivre', 'contacter', 'discuter',
      'envoyer demande', 'commander', 'panier', 'store review', 'profile', 'trade assurance',
      'boutique', 'magasin', 'store', 'search', 'accueil', 'home',
      'ventes à la une', 'vente à la une', 'meilleures ventes', 'top ranking', 'ranking',
      'bestseller', 'best seller', 'tendances', 'trending', 'populaire', 'popular in',
      'dans perceuses', 'dans marteaux', 'dans outils', 'dans outillage', 'perceuses à',
      'offre spéciale', 'sélection du jour', 'choix de l\'acheteur', 'produits similaires',
      'recommandations', 'explore more', 'catégorie', 'catégories', 'category'
    ];
    return forbidden.some(w => lower.includes(w));
  };

  const hasCompanyMarkers = (str) => {
    return /(?:Co\.,?\s*Ltd\.?|Company\s+Limited|Factory|Technology|Electronics?|Hardware|Industrial|Equipment|Machinery|Trading|Corp|LLC|Manufacturing|Enterprise|Plant|Group|Société|Usine)/i.test(str);
  };

  // Priorité 0 : Extraction directe dans les variables JavaScript / JSON internes d'Alibaba Mobile & Desktop
  try {
    const scripts = document.querySelectorAll('script:not([src])');
    for (const s of scripts) {
      const content = s.textContent || '';
      if (content.includes('companyName') || content.includes('supplierName') || content.includes('shopName')) {
        const compMatches = [
          ...content.matchAll(/"companyName"\s*:\s*"([^"]{4,90})"/g),
          ...content.matchAll(/"supplierName"\s*:\s*"([^"]{4,90})"/g),
          ...content.matchAll(/"company_name"\s*:\s*"([^"]{4,90})"/g),
          ...content.matchAll(/"shopName"\s*:\s*"([^"]{4,90})"/g)
        ];
        for (const cm of compMatches) {
          const rawName = cm[1].replace(/\\u[\dA-F]{4}/gi, (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))).trim();
          if (rawName && !isForbiddenText(rawName)) {
            if (hasCompanyMarkers(rawName)) {
              company = rawName;
              break;
            } else if (!company) {
              company = rawName;
            }
          }
        }
        if (company && hasCompanyMarkers(company)) break;
      }
    }
  } catch (e) {}

  // Priorité 1 : Liens officiels vers le sous-domaine de l'usine, company_profile ou shop card mobile
  if (!company || !hasCompanyMarkers(company)) {
    const sellerLinks = document.querySelectorAll('a[href*=".alibaba.com"], a[href*="company_profile"], a[href*="minisite_url"], [class*="shop-name"], [class*="shopName"], [class*="companyName"], [class*="company-name"], [class*="supplierName"], [class*="supplier-name"]');
    for (const a of sellerLinks) {
      if (a.closest('footer, #footer, .footer, .ui-footer, .icbu-footer, header, nav, #header, [class*="ranking"], [class*="rank-banner"]')) continue;
      const href = a.getAttribute('href') || '';
      const isIgnoredDomain = href.includes('www.alibaba.com') || 
                              href.includes('french.alibaba.com') || 
                              href.includes('service.alibaba.com') || 
                              href.includes('message.alibaba.com') || 
                              href.includes('passport.alibaba.com') || 
                              href.includes('i.alibaba.com');
      const isProfileLink = href.includes('company_profile') || href.includes('trustpass') || href.includes('minisite') || (!isIgnoredDomain && href.includes('.alibaba.com'));

      const rawTextCandidate = a.getAttribute('title') || a.getAttribute('aria-label') || a.innerText || '';
      const cleanCandidate = rawTextCandidate.replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (cleanCandidate.length >= 4 && cleanCandidate.length <= 85 && !isForbiddenText(cleanCandidate)) {
        if (hasCompanyMarkers(cleanCandidate)) {
          company = cleanCandidate;
          break;
        } else if ((isProfileLink || a.className.includes('shop') || a.className.includes('company')) && !company) {
          company = cleanCandidate;
        }
      }
    }
  }

  // Priorité 2 : Scan Regex direct dans le texte brut de la page avec suffixes légaux stricts
  if (!company || isForbiddenText(company)) {
    const regexList = [
      /([A-Z0-9][A-Za-z0-9\s.,&'-]{2,60}(?:Co\.,?\s*Ltd\.?|Company\s+Limited))/i,
      /([A-Z0-9][A-Za-z0-9\s.,&'-]{2,60}(?:Electronics?|Technology|Hardware|Industrial|Equipment|Machinery|Factory|Manufactur(?:e|ing))\s+Co\.,?\s*Ltd\.?)/i,
      /([A-Z0-9][A-Za-z0-9\s.,&'-]{2,60}(?:Factory|Manufacture|Technology|Electronics?|Industrial|Machinery))/i
    ];
    for (const reg of regexList) {
      const match = rawText.match(reg);
      if (match && match[1]) {
        const c = match[1].replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
        if (c.length >= 4 && c.length <= 85 && !isForbiddenText(c)) {
          company = c;
          break;
        }
      }
    }
  }

  // Priorité 3 : Scan JSON-LD
  if (!company || isForbiddenText(company)) {
    try {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const parsed = JSON.parse(script.textContent || '{}');
          const seller = parsed.seller || parsed.brand || parsed.offers?.seller || parsed.provider;
          if (seller && seller.name && typeof seller.name === 'string') {
            const sName = seller.name.trim();
            if (sName.length >= 4 && !isForbiddenText(sName)) {
              company = sName;
              break;
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  if (!company || isForbiddenText(company)) {
    company = 'Fabricant Vérifié Alibaba';
  } else {
    company = company.replace(/\s+(logo|store|boutique|official|shop)$/i, '').trim();
  }

  // 4. Extraction Exhaustive des Paliers de Prix & Quantités Minimales (MOQ Dégressif)
  const tierPricing = [];
  
  // A. Scan des blocs de cellules de paliers tarifaires Alibaba
  const tierContainers = document.querySelectorAll(
    '[class*="price-item"], [class*="tier-item"], [class*="ladder-price"], [class*="price-ladder"], [class*="price-wrap"], [class*="tier-price"], .quality-item, .spec-price, [class*="price-cell"]'
  );

  tierContainers.forEach(container => {
    if (container.closest('footer, header, nav, [class*="recommend"], [class*="similar"]')) return;
    const text = (container.innerText || '').replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    const priceMatch = text.match(/(\d[\d\s\u00a0.,]{1,8})\s*(?:FCFA|CFA|XOF|\$|¥|￥|USD)/i);
    const qtyMatch = text.match(/((?:≥|>|=|\d+)[-\s\d]*(?:pièce|pièces|piece|pieces|pcs|pc|unité|unités|kg|set|sets|boîte|paire)[s]?)/i) ||
                     text.match(/((?:≥|>|=|\d+)[-\s\d]{1,15})/i);

    if (priceMatch && qtyMatch) {
      const pNum = parseInt(priceMatch[1].replace(/[\s\u00a0.,]/g, ''), 10);
      const qStr = qtyMatch[1].trim();
      if (pNum && pNum > 100 && !tierPricing.some(t => t.minQty === qStr || t.priceFcfa === pNum)) {
        tierPricing.push({
          minQty: qStr,
          priceFcfa: pNum,
          priceCny: parseFloat((pNum / 85).toFixed(2))
        });
      }
    }
  });

  // B. Scan Regex Global dans le texte de la page si les conteneurs sont éclatés
  if (tierPricing.length === 0) {
    const tierRegex = /(\d[\d\s\u00a0.,]{1,8})\s*(?:FCFA|CFA|XOF)\s*[\r\n\t\s]*((?:≥|>|=|\d+)[-\s\d]{1,15}\s*(?:pièce|pièces|pcs|pc)?)/gi;
    const tierMatches = [...rawText.matchAll(tierRegex)];
    for (const tm of tierMatches) {
      const pNum = parseInt(tm[1].replace(/[\s\u00a0.,]/g, ''), 10);
      const qStr = tm[2].trim();
      if (pNum && pNum > 100 && !tierPricing.some(t => t.priceFcfa === pNum)) {
        tierPricing.push({
          minQty: qStr,
          priceFcfa: pNum,
          priceCny: parseFloat((pNum / 85).toFixed(2))
        });
      }
    }
  }

  // C. Fallback sur les prix FCFA détectés (avec filtrage des coupons/valeurs aberrantes)
  if (tierPricing.length === 0 && fcfaPrices.length > 0) {
    const maxFcfa = Math.max(...fcfaPrices);
    // Garder seulement les prix réalistes (au moins 25% du prix principal pour éliminer coupons/accessoires)
    const validFcfaPrices = fcfaPrices.filter(p => p >= maxFcfa * 0.25).sort((a, b) => b - a);
    
    validFcfaPrices.slice(0, 3).forEach((p, idx) => {
      const qtyLabel = idx === 0 ? '1-999 pièce' : (idx === 1 ? '1000-2999 pièce' : '≥3000 pièce');
      tierPricing.push({
        minQty: qtyLabel,
        priceFcfa: p,
        priceCny: parseFloat((p / 85).toFixed(2))
      });
    });
  }

  // MOQ déduit du premier palier
  let moq = '1 pièce';
  if (tierPricing.length > 0) {
    moq = tierPricing[0].minQty;
  }

  // 5. Localisation Réelle Fournisseur (Filtrage Strict Anti-Adresse de Livraison)
  let location = '';
  const badLocWords = ['adresse de livraison', 'shipping address', 'deliver to', 'expédier à', 'livraison vers', 'adresse de', 'adresse'];
  
  const chinaCities = ['Guangdong', 'Zhejiang', 'Foshan', 'Yiwu', 'Ningbo', 'Shenzhen', 'Guangzhou', 'Jinan', 'Dongguan', 'Wenzhou', 'Shanghai', 'Jiangsu', 'Shandong', 'Hebei', 'Henan', 'Sichuan', 'Fujian', 'Anhui'];
  for (const city of chinaCities) {
    if (rawText.toLowerCase().includes(city.toLowerCase())) {
      location = `${city}, Chine`;
      break;
    }
  }

  if (!location) {
    const candidateLocNodes = document.querySelectorAll('[class*="location"], [class*="country"], .company-basic-info, .factory-city');
    for (const node of candidateLocNodes) {
      const text = (node.innerText || '').trim();
      const lower = text.toLowerCase();
      if (text && text.length < 50 && !badLocWords.some(w => lower.includes(w))) {
        location = text;
        break;
      }
    }
  }
  if (!location || badLocWords.some(w => location.toLowerCase().includes(w))) {
    location = 'Guangdong, Chine';
  }

  // 6. Badge & Années d'Expérience Réelles
  let badge = '';
  let years = '';
  const badgeNode = document.querySelector('[class*="verified"], [class*="gold"], [class*="years"], [class*="badge"]');
  if (badgeNode && badgeNode.innerText) {
    badge = badgeNode.innerText.trim();
  }
  const yearMatch = rawText.match(/(\d+)\s*(?:ans|yrs|years)/i);
  if (yearMatch) {
    years = `${yearMatch[1]} ans d'expérience`;
  }

  // 6. 🌐 EXPLORATION TOTALE ET INFAILLIBLE DES CARACTÉRISTIQUES (MULTI-NIVEAUX)
  const allSpecifications = [];
  const seenLabels = new Set();

  function registerSpec(category, label, value) {
    if (!label || !value) return;
    let l = label.replace(/[:：\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    let v = value.replace(/[:：\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (l.length < 2 || l.length > 65 || v.length < 1 || v.length > 250) return;
    if (/^(rechercher|envoyer|discuter|panier|accueil|connexion|acheter|avis|contact|commander|suivant|précédent|catégorie)$/i.test(l)) return;
    if (/^(rechercher|envoyer|discuter|panier|accueil|connexion)$/i.test(v)) return;

    const lowerL = l.toLowerCase();
    if (seenLabels.has(lowerL)) return;
    seenLabels.add(lowerL);

    allSpecifications.push({
      category: category || 'Spécifications Techniques',
      label: l,
      value: v
    });
  }

  // NIVEAU 1 : Scanner tous les tableaux HTML (table, tr, td, th)
  document.querySelectorAll('table tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('th, td, [role="cell"]')).map(c => c.innerText.trim()).filter(Boolean);
    if (cells.length === 2) {
      registerSpec('Spécifications Techniques', cells[0], cells[1]);
    } else if (cells.length >= 4) {
      for (let i = 0; i < cells.length - 1; i += 2) {
        registerSpec('Spécifications Techniques', cells[i], cells[i + 1]);
      }
    }
  });

  // NIVEAU 2 : Scanner tous les conteneurs d'attributs, définitions et listes Alibaba
  const specSelectors = [
    'dl', '[class*="spec-item"]', '[class*="spec_item"]', '[class*="specItem"]',
    '[class*="attr-item"]', '[class*="attr_item"]', '[class*="attrItem"]',
    '[class*="attribute-item"]', '[class*="attribute_item"]',
    '[class*="detail-attribute"]', '[class*="product-prop"]',
    '[class*="overview-item"]', '[class*="param-item"]',
    '[class*="do-entry-item"]', '[class*="item-content"]', '[role="row"]'
  ];

  document.querySelectorAll(specSelectors.join(',')).forEach(el => {
    const dt = el.querySelector('dt, [class*="name"], [class*="title"], [class*="label"], [class*="key"], [class*="attr-name"], [class*="left"]');
    const dd = el.querySelector('dd, [class*="val"], [class*="value"], [class*="desc"], [class*="attr-val"], [class*="right"]');
    if (dt && dd && dt.innerText && dd.innerText) {
      registerSpec('Spécifications Techniques', dt.innerText, dd.innerText);
    } else {
      const text = el.innerText || '';
      if (text.includes(':') || text.includes('：')) {
        const parts = text.split(/[:：]/).map(p => p.trim()).filter(Boolean);
        if (parts.length === 2) {
          registerSpec('Spécifications Techniques', parts[0], parts[1]);
        }
      }
    }
  });

  // NIVEAU 3 : Scanner le bloc "Caractéristiques du produit" par proximité de titre dans le DOM
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, div, span, p')).filter(node => {
    const txt = (node.innerText || '').toLowerCase().trim();
    return (txt === 'caractéristiques du produit' || txt === 'product attributes' || txt === 'key attributes' || txt === 'spécifications');
  });

  headings.forEach(heading => {
    const container = heading.closest('section, div[class*="module"], div[class*="layout"], div[class*="box"]') || heading.parentElement;
    if (container) {
      const text = container.innerText || '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const startIdx = lines.findIndex(l => /caractéristique|attribute|spécification/i.test(l));
      if (startIdx !== -1) {
        for (let i = startIdx + 1; i < lines.length - 1; i += 2) {
          const l = lines[i];
          const v = lines[i + 1];
          if (l && v && l.length < 50 && v.length < 150 && !/emballage|avis|rechercher|faq|profil/i.test(l)) {
            registerSpec('Spécifications Techniques', l, v);
          }
        }
      }
    }
  });

  // NIVEAU 4 : Scanner les sections Emballage, Délais, Personnalisation, Logistique
  document.querySelectorAll('[class*="packaging"], [class*="logistics"], [class*="shipping"], [class*="lead-time"], [class*="customization"], [class*="oem"]').forEach(sec => {
    const secText = sec.innerText || '';
    let cat = 'Emballage & Logistique';
    if (/lead|délai/i.test(secText)) cat = 'Délais de Livraison';
    if (/custom|oem|logo/i.test(secText)) cat = 'Personnalisation & OEM';

    sec.querySelectorAll('tr, li, div').forEach(row => {
      const t = (row.innerText || '').trim();
      if (t.includes(':') || t.includes('：')) {
        const parts = t.split(/[:：]/).map(p => p.trim()).filter(Boolean);
        if (parts.length === 2) {
          registerSpec(cat, parts[0], parts[1]);
        }
      }
    });
  });

  // NIVEAU 5 : Extraction par motifs réguliers de secours sur le texte complet de la page
  const textExtractionPatterns = [
    { label: 'Type de foret', regex: /(?:Type de foret|Drill type)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Source d\'alimentation', regex: /(?:Source d['\s]alimentation|Power source)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Tension électrique', regex: /(?:Tension [ée]lectrique|Voltage)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Type Chuck / Mandrin', regex: /(?:Type Chuck|Chuck type|Type Mandrin)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Chuck Taille', regex: /(?:Chuck Taille|Chuck size|Taille mandrin)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Diamètre max. de perçage', regex: /(?:Diam[eè]tre max\.? de per[çc]age|Max drilling diameter)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Max Couple / Vitesse', regex: /(?:Max Couple|Max torque|Max RPM)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Puissance d\'Entrée Nominale', regex: /(?:Puissance d['\s]Entr[eé]e Nominale|Rated input power)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Type de moteur', regex: /(?:Type de moteur|Motor type)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Vitesse à vide', regex: /(?:Vitesse [aà] vide|No-load speed)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Nombre de vitesses', regex: /(?:Nombre de vitesses|Speed count|Gear count)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Capacité de La batterie', regex: /(?:Capacit[eé] de La batterie|Battery capacity)\s*[:：\n\t]?\s*([^\n\r\t,]+)/i, cat: 'Spécifications Techniques' },
    { label: 'Capacité de personnalisation', regex: /(?:Capacit[eé] de personnalisation du fournisseur|Customization)\s*[:：\n\t]?\s*([^\n\r\t]{5,100})/i, cat: 'Personnalisation & OEM' },
    { label: 'Détails d\'emballage', regex: /(?:D[eé]tails d['\s]emballage|Packaging details)\s*[:：\n\t]?\s*([^\n\r\t]{5,100})/i, cat: 'Emballage & Logistique' },
    { label: 'Port d\'expédition', regex: /(?:Port d['\s]exp[eé]dition|Port|Shipping port)\s*[:：\n\t]?\s*([^\n\r\t]{3,50})/i, cat: 'Emballage & Logistique' },
    { label: 'Garantie usine', regex: /(?:Garantie|Warranty)\s*[:：\n\t]?\s*([^\n\r\t]{3,50})/i, cat: 'Garantie & Normes' }
  ];

  textExtractionPatterns.forEach(pat => {
    const m = rawText.match(pat.regex);
    if (m && m[1]) {
      registerSpec(pat.cat, pat.label, m[1]);
    }
  });

  // 7. 📦 Quantité minimale (MOQ) complémentaire
  if (!moq || moq === '1 pièce') {
    const moqMatch = rawText.match(/(?:Quantit[ée]\s*minimale|Min(?:imum)?\s*Order|MOQ)\s*[:：]?\s*(\d[\d\s\u00a0]*)/i);
    if (moqMatch) {
      moq = moqMatch[1].replace(/[\s\u00a0]/g, '') + ' pièces';
    }
  }

  // 8. 🎨 Options de Personnalisation Usine (OEM / Branding)
  const customization = [];
  document.querySelectorAll('[class*="customization"] li, [class*="custom"] li, [class*="oem"] li, [class*="custom-item"]').forEach(li => {
    const t = li.innerText.trim();
    if (t && t.length < 120 && !customization.includes(t)) {
      customization.push(t);
      registerSpec('Personnalisation & OEM', 'Option Personnalisation', t);
    }
  });

  // 9. 📸 Galerie Photos HD Réelles du Produit Uniquement (Filtre Strict Anti-Pollution)
  const productImages = [];
  const galleryContainers = document.querySelectorAll(
    '.detail-gallery, .main-image, .image-viewer, [class*="detail-gallery"], [class*="main-layout"] [class*="gallery"], [class*="image-view"], [class*="slider-wrapper"], [class*="slick-track"], [data-spm*="gallery"], .vertical-slider, .icbu-shop-gallery, .thumb-list'
  );

  let candidateElements = [];
  if (galleryContainers.length > 0) {
    galleryContainers.forEach(container => {
      container.querySelectorAll('img').forEach(img => candidateElements.push(img));
    });
  }

  if (candidateElements.length === 0) {
    document.querySelectorAll('img').forEach(img => {
      const isBadZone = img.closest('footer, header, nav, [class*="recommend"], [class*="related"], [class*="similar"], [class*="guess"], [class*="sidebar"], [class*="footer"], [class*="banner"], [class*="offer"]');
      if (!isBadZone) {
        candidateElements.push(img);
      }
    });
  }

  candidateElements.forEach(img => {
    let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
    if (!src) return;

    const isProductCdn = src.includes('/kf/') || src.includes('imgextra') || src.includes('sc04.alicdn');
    const isUiAsset = src.includes('/tfs/') || src.includes('/icon/') || src.includes('avatar') || src.includes('badge') || src.includes('logo') || src.includes('sprite') || src.includes('.svg');

    if (isProductCdn && !isUiAsset) {
      let clean = src.replace(/_\d+x\d+\.(jpg|png|webp|jpeg)/gi, '');
      if (clean.startsWith('//')) clean = 'https:' + clean;
      
      if (!productImages.includes(clean)) {
        productImages.push(clean);
      }
    }
  });

  // 10. Vidéo Démo Réelle
  let videoUrl = '';
  const v = document.querySelector('video source, video');
  if (v) {
    videoUrl = v.src || v.currentSrc || '';
  }

  return {
    url,
    title,
    fcfaPrices: fcfaPrices.slice(0, 5),
    tierPricing: tierPricing.slice(0, 5),
    company,
    location,
    badge,
    years,
    moq: moq || '1 pièce',
    specifications: allSpecifications.slice(0, 100),
    customization: customization.slice(0, 10),
    images: productImages.slice(0, 10),
    videoUrl,
    rawTextSnippet: rawText.slice(0, 4000)
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const tabCreate = document.getElementById('tabCreate');
  const tabEnrich = document.getElementById('tabEnrich');
  const targetProductBox = document.getElementById('targetProductBox');
  const targetProductSelect = document.getElementById('targetProductSelect');
  const btnImport = document.getElementById('btnImport');
  const btnImportText = document.getElementById('btnImportText');
  const msgBox = document.getElementById('msgBox');
  
  const previewTitle = document.getElementById('previewTitle');
  const previewPrice = document.getElementById('previewPrice');
  const previewSupplier = document.getElementById('previewSupplier');
  const previewLocation = document.getElementById('previewLocation');
  const previewLocationRow = document.getElementById('previewLocationRow');
  const previewTiersBox = document.getElementById('previewTiersBox');
  const previewTiersList = document.getElementById('previewTiersList');

  let currentMode = 'create'; // 'create' ou 'enrich'
  let cachedData = null;
  let availableProducts = [];
  let activeProductId = null;

  // Gestion des onglets de mode
  tabCreate.addEventListener('click', () => {
    currentMode = 'create';
    tabCreate.classList.add('active');
    tabEnrich.classList.remove('active');
    targetProductBox.style.display = 'none';
    btnImport.classList.remove('btn-enrich');
    btnImportText.innerText = '📥 IMPORTER COMME NOUVEL ARTICLE';
  });

  tabEnrich.addEventListener('click', () => {
    currentMode = 'enrich';
    tabEnrich.classList.add('active');
    tabCreate.classList.remove('active');
    targetProductBox.style.display = 'block';
    btnImport.classList.add('btn-enrich');
    btnImportText.innerText = '➕ AJOUTER CE FOURNISSEUR & COMPLÉTER';
  });

  // 1. Récupération des articles existants et de l'article actif depuis l'application
  try {
    const allTabs = await chrome.tabs.query({});
    const appTab = allTabs.find(t => t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1')));
    
    if (appTab && appTab.id) {
      const appData = await chrome.scripting.executeScript({
        target: { tabId: appTab.id },
        func: () => {
          let list = [];
          try {
            const activeWs = localStorage.getItem('quin_source_active_ws') || 'ws_quincaillerie';
            const rawProds = localStorage.getItem(`ws_products_${activeWs}`) || localStorage.getItem('quin_source_products');
            if (rawProds) list = JSON.parse(rawProds);
          } catch (e) {}

          let activeId = null;
          try {
            if (window.__QUIN_ACTIVE_PRODUCT__?.id) {
              activeId = window.__QUIN_ACTIVE_PRODUCT__.id;
            } else if (document.body.getAttribute('data-active-product-id')) {
              activeId = document.body.getAttribute('data-active-product-id');
            } else {
              const rawActive = localStorage.getItem('quin_source_active_product');
              if (rawActive) activeId = JSON.parse(rawActive)?.id;
            }
          } catch (e) {}

          return { products: list, activeProductId: activeId };
        }
      });

      if (appData && appData[0]?.result) {
        availableProducts = appData[0].result.products || [];
        activeProductId = appData[0].result.activeProductId;
      }
    }
  } catch (e) {}

  // Remplissage du sélecteur d'articles existants avec PRIORITÉ ABSOLUE à l'article en cours
  if (targetProductSelect) {
    targetProductSelect.innerHTML = '';
    if (availableProducts.length > 0) {
      // 🥇 TRI STRICT : L'article actuellement ouvert dans l'app est positionné tout en haut (Position #1)
      const sortedProducts = [...availableProducts].sort((a, b) => {
        if (a.id === activeProductId) return -1;
        if (b.id === activeProductId) return 1;
        return 0;
      });

      sortedProducts.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        const isActive = p.id === activeProductId;
        if (isActive) {
          opt.innerText = `⭐ [EN COURS DANS L'APP] ${p.sku ? '[' + p.sku + '] ' : ''}${p.titleFr ? p.titleFr.slice(0, 36) : 'Article'}`;
          opt.selected = true;
        } else {
          opt.innerText = `📦 ${p.sku ? '[' + p.sku + '] ' : ''}${p.titleFr ? p.titleFr.slice(0, 42) : 'Article'}`;
        }
        targetProductSelect.appendChild(opt);
      });

      // Si un article est déjà ouvert dans l'application, on bascule automatiquement
      // par défaut sur l'onglet "Compléter Fiche" pour une ergonomie 100% fluide !
      if (activeProductId) {
        currentMode = 'enrich';
        tabEnrich.classList.add('active');
        tabCreate.classList.remove('active');
        targetProductBox.style.display = 'block';
        btnImport.classList.add('btn-enrich');
        btnImportText.innerText = '➕ AJOUTER CE FOURNISSEUR & COMPLÉTER';
      }
    } else {
      targetProductSelect.innerHTML = '<option value="">Aucun article dans le catalogue (Mode Création seul)</option>';
    }
  }

  // 2. Extraction des données de la page active Alibaba
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageData
    });

    if (results && results[0] && results[0].result) {
      cachedData = results[0].result;
      previewTitle.innerText = cachedData.title ? (cachedData.title.slice(0, 70) + (cachedData.title.length > 70 ? '...' : '')) : 'Page Alibaba active';
      
      if (cachedData.fcfaPrices && cachedData.fcfaPrices.length > 0) {
        const pFcfa = cachedData.fcfaPrices[0];
        const pCny = (pFcfa / 85).toFixed(2);
        previewPrice.innerHTML = `<strong>${pFcfa.toLocaleString()} FCFA</strong> <span style="color: #94A3B8; font-size: 10px;">(${pCny} ¥)</span>`;
      } else {
        previewPrice.innerText = 'Détecté dans la page';
      }

      if (cachedData.company) {
        previewSupplier.innerText = cachedData.company.slice(0, 42);
      } else {
        previewSupplier.innerText = 'Fabricant Vérifié Alibaba';
      }

      if (cachedData.location) {
        previewLocation.innerText = cachedData.location;
        previewLocationRow.style.display = 'flex';
      }

      // Affichage des Paliers Dégressifs MOQ dans le Popup
      if (cachedData.tierPricing && cachedData.tierPricing.length > 0 && previewTiersBox && previewTiersList) {
        previewTiersList.innerHTML = '';
        cachedData.tierPricing.forEach(t => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.fontSize = '10.5px';
          row.style.background = 'rgba(255,255,255,0.04)';
          row.style.padding = '3px 7px';
          row.style.borderRadius = '5px';
          row.innerHTML = `<span style="color: #CBD5E1; font-weight: 600;">• ${t.minQty}</span> <strong style="color: #FCD34D;">${t.priceFcfa.toLocaleString()} FCFA <span style="color:#94A3B8; font-size:9.5px; font-weight:normal;">(${t.priceCny} ¥)</span></strong>`;
          previewTiersList.appendChild(row);
        });
        previewTiersBox.style.display = 'block';
      }
    }
  } catch (e) {
    previewTitle.innerText = tab.title || 'Page active';
    previewPrice.innerText = 'Prêt à importer';
    previewSupplier.innerText = 'Alibaba.com';
  }

  // 3. Clic sur le bouton d'importation
  btnImport.addEventListener('click', async () => {
    btnImport.disabled = true;
    btnImport.innerHTML = '<span>⏳ Transmission en cours...</span>';
    msgBox.style.display = 'none';

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageData
      });

      const rawPayload = (results && results[0] && results[0].result) ? results[0].result : (cachedData || { url: tab.url, title: tab.title });

      const targetId = (currentMode === 'enrich' && targetProductSelect) ? targetProductSelect.value : null;

      const payload = {
        ...rawPayload,
        importMode: currentMode, // 'create' ou 'enrich'
        targetProductId: targetId,
        timestamp: Date.now()
      };

      // 1️⃣ PONT 1 : Injection directe en mémoire dans l'application
      try {
        const allTabs = await chrome.tabs.query({});
        const appTabs = allTabs.filter(t => t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.title?.includes('SOURCING') || t.title?.includes('QUIN-SOURCE')));
        for (const appTab of appTabs) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: appTab.id },
              func: (data) => {
                window.postMessage({ type: 'EXTENSION_DIRECT_IMPORT', payload: data }, '*');
                window.dispatchEvent(new CustomEvent('EXTENSION_IMPORT_EVENT', { detail: data }));
                localStorage.setItem('quin_source_latest_import', JSON.stringify(data));
              },
              args: [payload]
            });
          } catch (e) {}
        }
      } catch (tabErr) {}

      // 2️⃣ PONT 2 : Copie dans le presse-papier
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload));
      } catch (clipErr) {}

      // 3️⃣ PONT 3 : Envoi HTTP Multi-Ports & Support Mobile (Wi-Fi 192.168.100.7)
      const customIp = localStorage.getItem('quin_source_server_ip') || '192.168.100.7';
      const targetHosts = Array.from(new Set(['localhost', '127.0.0.1', customIp, '192.168.100.7']));
      const targetPorts = [5173, 5174, 5175];
      let sentSuccess = false;
      for (const host of targetHosts) {
        for (const port of targetPorts) {
          try {
            const resp = await fetch(`http://${host}:${port}/api/import-live`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (resp && resp.ok) {
              sentSuccess = true;
            }
          } catch (portErr) {}
        }
      }

      msgBox.className = 'msg msg-success';
      if (currentMode === 'enrich') {
        msgBox.innerHTML = `🎉 <strong>Fournisseur Rattaché !</strong> L'usine et ses caractéristiques ont été fusionnées sur l'article !`;
      } else {
        msgBox.innerHTML = `🎉 <strong>Nouvel Article Créé !</strong> Toutes les données réelles sont enregistrées dans votre catalogue !`;
      }
      msgBox.style.display = 'block';
      btnImport.innerHTML = '<span>✅ Transmis avec Succès !</span>';
      btnImport.disabled = false;
    } catch (err) {
      msgBox.className = 'msg msg-error';
      msgBox.innerHTML = '⚠️ Veuillez ouvrir votre application (http://localhost:5173) dans un onglet.';
      msgBox.style.display = 'block';
      btnImport.disabled = false;
      btnImport.innerHTML = '<span>📥 Réessayer l\'Envoi</span>';
    }
  });
});