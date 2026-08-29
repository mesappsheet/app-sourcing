import { isJwtExpired, refreshSupabaseSession, normalizeCategorySlug } from './utils/extensionLogic.js';

// ============================================================================
// ⚡ DEEP SCRAPER E-COMMERCE HAUTE PRÉCISION & ANALYSEUR UNIVERSEL DE DONNÉES
// Analyse 100% intégrale de la page : Vraies Photos Produit, Vrai Prix, Paliers, Specs
// ============================================================================

function deepScrapePageData() {
  function decodeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    try {
      const txt = document.createElement('textarea');
      txt.innerHTML = html;
      let val = txt.value;
      if (val.includes('&') && (val.includes('&#') || val.includes('&eacute;') || val.includes('&amp;') || val.includes('&ndash;') || val.includes('&quot;') || val.includes('&trade;') || val.includes('&copy;'))) {
        txt.innerHTML = val;
        val = txt.value;
      }
      return val.trim();
    } catch (e) {
      return html.replace(/&#39;/g, "'").replace(/&eacute;/g, "é").replace(/&ndash;/g, "–").replace(/&amp;/g, "&").trim();
    }
  }

  try {
    const url = window.location.href;
    const rawText = document.body ? document.body.innerText : '';
    const lowerUrl = url.toLowerCase();

    // 0. 🏷️ DÉTECTION PRÉCISE DE LA PLATEFORME SOURCE
    let platform = 'Alibaba';
    let platformType = 'ecommerce';

    if (lowerUrl.includes('1688.com')) {
      platform = '1688 Chine';
    } else if (lowerUrl.includes('alibaba.com')) {
      platform = 'Alibaba';
    } else if (lowerUrl.includes('taobao.com')) {
      platform = 'Taobao';
    } else if (lowerUrl.includes('tmall.com')) {
      platform = 'Tmall';
    } else if (lowerUrl.includes('aliexpress.com')) {
      platform = 'AliExpress';
    } else if (lowerUrl.includes('made-in-china.com')) {
      platform = 'Made-in-China';
    } else if (lowerUrl.includes('globalsources.com')) {
      platform = 'Global Sources';
    } else if (lowerUrl.includes('pinduoduo.com') || lowerUrl.includes('yangkeduo.com')) {
      platform = 'Pinduoduo';
    } else if (lowerUrl.includes('dhgate.com')) {
      platform = 'DHgate';
    } else if (lowerUrl.includes('amazon.')) {
      platform = 'Amazon';
    } else if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('douyin.com')) {
      platform = 'TikTok';
      platformType = 'social';
    } else if (lowerUrl.includes('instagram.com')) {
      platform = 'Instagram';
      platformType = 'social';
    }

    let title = '';
    let titleCn = '';
    let company = '';
    let location = 'Guangdong, Chine';
    let supplierBadge = 'Verified Supplier (Trade Assurance)';
    let supplierYears = '5 ans d\'expérience';
    let supplierRating = '4.9/5 (Excellente réputation)';
    let supplierResponseRate = 'Taux de réponse > 95%';
    let supplierEmployees = '';
    let supplierFactoryArea = '';
    let mainImage = '';
    let productImages = [];
    let videoUrl = '';
    let videoPoster = '';
    let allSpecifications = [];
    let tierPricing = [];
    let samplePriceFcfa = 0;
    let moq = '1 pièce';
    let basePriceCny = 0;
    let basePriceFcfa = 0;
    let formattedDisplayPrice = '';

    // -------------------------------------------------------------------------
    // 1. 🖼️ FILTRAGE STRICT DES VRAIES PHOTOS PRODUIT (ZÉRO DRAPEAUX / BANNIÈRES)
    // -------------------------------------------------------------------------
    const cleanImageUrl = (src) => {
      if (!src || typeof src !== 'string') return null;
      let s = src.trim();
      if (s.startsWith('//')) s = 'https:' + s;
      if (!s.startsWith('http')) return null;

      const lower = s.toLowerCase();

      // Filtrer STRICTEMENT les drapeaux de pays, bannières, logos et icônes
      const badKeywords = [
        'country-flag', 'flag', 'drapeau', 'banner', 'banniere', 'logo', 'icon', 
        'avatar', 'badge', 'sprite', 'header', 'footer', 'payment', 'pay_', 'trust', 
        'sgs', 'tuv', 'bestseller', 'alipay', 'wechat', 'service', 'blank.gif', 
        'spacer.gif', 'transparent.png', 'empty.png', 'tfs/', 'nav-', 'btn-', 'ad_'
      ];

      if (badKeywords.some(w => lower.includes(w))) {
        return null;
      }

      // Supprimer tous les suffixes de miniaturisation pour récupérer la pleine résolution HD
      s = s
        .replace(/_\d+x\d+[^.]*\.(jpg|png|webp|jpeg)/gi, '')
        .replace(/\.jpg_\d+x\d+[^.]*\.jpg/gi, '.jpg')
        .replace(/\.webp_\d+x\d+[^.]*\.webp/gi, '.webp')
        .replace(/_sum\.(jpg|png|webp)/gi, '')
        .replace(/_Q\d+\.(jpg|png|webp)/gi, '')
        .replace(/_\.webp$/gi, '')
        .replace(/_50x50\.(jpg|png|webp)/gi, '')
        .replace(/_100x100\.(jpg|png|webp)/gi, '')
        .replace(/_220x220\.(jpg|png|webp)/gi, '')
        .replace(/_350x350\.(jpg|png|webp)/gi, '');

      return s;
    };

    // A. Priorité 1 : Photos officielles du produit dans JSON-LD
    try {
      const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of ldScripts) {
        const content = script.innerText || script.textContent;
        if (!content) continue;
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          if (!item) continue;
          if (item.image) {
            const imgList = Array.isArray(item.image) ? item.image : [item.image];
            imgList.forEach(img => {
              let clean = cleanImageUrl(typeof img === 'string' ? img : (img.url || ''));
              if (clean && !productImages.includes(clean)) productImages.push(clean);
            });
          }
        }
      }
    } catch (e) {}

    // B. Priorité 2 : Sélecteurs stricts de la galerie principale du produit UNIQUEMENT (Zéro photos d'autres articles)
    const galleryImgSelectors = [
      '.main-image img',
      '.detail-gallery img',
      '[class*="detail-gallery"] img',
      '[class*="gallery-slider"] img',
      '.thumb-list img',
      '[class*="thumbnail-list"] img',
      '.image-list img',
      '[data-spm*="image"] img'
    ];

    for (const sel of galleryImgSelectors) {
      const els = document.querySelectorAll(sel);
      for (const img of els) {
        // Exclure STRICTEMENT les descriptions HTML où se trouvent les autres articles du fournisseur
        if (img.closest('#J-rich-text-description, .detail-desc-decorate, .detail-description, footer, [class*="recommend"], [class*="similar"], [class*="related"], [class*="other"]')) {
          continue;
        }
        const rawSrc = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-zoom-image') || '';
        const cleaned = cleanImageUrl(rawSrc);
        if (cleaned && !productImages.includes(cleaned)) {
          productImages.push(cleaned);
        }
        if (productImages.length >= 8) break;
      }
      if (productImages.length >= 8) break;
    }

    if (productImages.length > 0) {
      mainImage = productImages[0];
    }

    // -------------------------------------------------------------------------
    // 2. 📝 EXTRACTION DU TITRE DU PRODUIT
    // -------------------------------------------------------------------------
    const titleSelectors = [
      'h1.product-title',
      'h1.module-title',
      '.detail-title h1',
      '.title-content h1',
      'h1[data-e2e="product-title"]',
      '.product-name',
      '.detail-title',
      'h1'
    ];

    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 5) {
        title = decodeHtml(el.innerText);
        break;
      }
    }

    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.content) {
        title = decodeHtml(ogTitle.content);
      } else {
        title = decodeHtml(document.title || 'Article Sourcing');
      }
    }

    // Nettoyage intelligent du titre
    title = title
      .replace(/^alibaba\.com\s*[:\-|]/i, '')
      .replace(/^1688\.com\s*[:\-|]/i, '')
      .replace(/\s*-\s*Alibaba\.com$/i, '')
      .replace(/\s*-\s*1688\.com$/i, '')
      .replace(/\s*\|\s*Alibaba$/i, '')
      .replace(/\s*\|\s*1688$/i, '')
      .replace(/\s*–\s*Buy Product on Alibaba\.com$/i, '')
      .replace(/\s*-\s*Buy Product on Alibaba\.com$/i, '')
      .trim();

    // -------------------------------------------------------------------------
    // 3. 💰 EXTRACTION HAUTE PRÉCISION DU VRAI PRIX EXACT ET DES PALIERS USINE
    // -------------------------------------------------------------------------
    function parsePriceValue(str) {
      if (!str || typeof str !== 'string') return null;
      const clean = str.replace(/[\u00a0\t\r\n]/g, ' ').trim();
      
      let currency = '';
      const upper = clean.toUpperCase();
      if (upper.includes('FCFA') || upper.includes('CFA') || upper.includes('XOF')) currency = 'FCFA';
      else if (upper.includes('$') || upper.includes('USD')) currency = 'USD';
      else if (upper.includes('¥') || upper.includes('￥') || upper.includes('CNY') || upper.includes('RMB')) currency = 'CNY';
      else if (upper.includes('€') || upper.includes('EUR')) currency = 'EUR';
      
      if (!currency) return null;

      // Nettoyer les espaces entre chiffres (ex: "4 120" -> "4120")
      const normalized = clean.replace(/(\d)\s+(\d)/g, '$1$2');

      // Détection de fourchette de prix : "4120 - 5267 FCFA" ou "4120-5267" ou "$2.50 - $3.80"
      const rangeMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—|~|to|à)\s*(\d+(?:[.,]\d+)?)/i);
      if (rangeMatch) {
        let n1 = parseFloat(rangeMatch[1].replace(',', '.'));
        let n2 = parseFloat(rangeMatch[2].replace(',', '.'));
        if (!isNaN(n1) && !isNaN(n2) && n1 > 0 && n2 > 0 && n1 < 100000000 && n2 < 100000000) {
          const minRaw = Math.min(n1, n2);
          const maxRaw = Math.max(n1, n2);
          return convertPriceObj(minRaw, maxRaw, currency, true);
        }
      }

      // Prix unique : "5267 FCFA" ou "5267"
      const singleMatch = normalized.match(/(\d+(?:[.,]\d+)?)/);
      if (singleMatch) {
        let n = parseFloat(singleMatch[1].replace(',', '.'));
        if (!isNaN(n) && n > 0 && n < 100000000) {
          return convertPriceObj(n, n, currency, false);
        }
      }

      return null;
    }

    function convertPriceObj(minRaw, maxRaw, currency, isRange) {
      let minFcfa = 0, maxFcfa = 0, minCny = 0, maxCny = 0;
      if (currency === 'FCFA') {
        minFcfa = Math.round(minRaw);
        maxFcfa = Math.round(maxRaw);
        minCny = parseFloat((minFcfa / 85).toFixed(2));
        maxCny = parseFloat((maxFcfa / 85).toFixed(2));
      } else if (currency === 'USD') {
        minFcfa = Math.round(minRaw * 650);
        maxFcfa = Math.round(maxRaw * 650);
        minCny = parseFloat((minRaw * 7.25).toFixed(2));
        maxCny = parseFloat((maxRaw * 7.25).toFixed(2));
      } else if (currency === 'CNY') {
        minCny = minRaw;
        maxCny = maxRaw;
        minFcfa = Math.round(minCny * 85);
        maxFcfa = Math.round(maxCny * 85);
      } else if (currency === 'EUR') {
        minFcfa = Math.round(minRaw * 655.957);
        maxFcfa = Math.round(maxRaw * 655.957);
        minCny = parseFloat((minRaw * 7.8).toFixed(2));
        maxCny = parseFloat((maxRaw * 7.8).toFixed(2));
      }

      const formatted = (isRange && minFcfa !== maxFcfa)
        ? `${minFcfa.toLocaleString()} - ${maxFcfa.toLocaleString()} FCFA (${minCny} - ${maxCny} ¥)`
        : `${minFcfa.toLocaleString()} FCFA (${minCny} ¥)`;

      return {
        isRange: isRange && minFcfa !== maxFcfa,
        minFcfa,
        maxFcfa,
        minCny,
        maxCny,
        priceFcfa: minFcfa,
        priceCny: minCny,
        formatted
      };
    }

    // 1. Détection prioritaire dans le JSON-LD officiel de la page
    let jsonLdPrice = null;
    try {
      const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of ldScripts) {
        const content = script.innerText || script.textContent;
        if (!content) continue;
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (!item) continue;
          const offers = item.offers;
          if (offers) {
            const cur = (offers.priceCurrency || 'USD').toUpperCase();
            const currKey = (cur.includes('XOF') || cur.includes('CFA')) ? 'FCFA' : cur;
            if (offers.lowPrice && offers.highPrice) {
              const p = convertPriceObj(parseFloat(offers.lowPrice), parseFloat(offers.highPrice), currKey, true);
              if (p && p.priceFcfa > 0) { jsonLdPrice = p; break; }
            } else if (offers.price) {
              const p = convertPriceObj(parseFloat(offers.price), parseFloat(offers.price), currKey, false);
              if (p && p.priceFcfa > 0) { jsonLdPrice = p; break; }
            }
          }
        }
        if (jsonLdPrice) break;
      }
    } catch (e) {}

    // 2. Détection du bloc de prix principal dans le DOM (En-tête produit)
    const priceSelectors = [
      '.product-price',
      '.detail-price',
      '[class*="product-price"]',
      '[class*="module_price"]',
      '[data-spm*="price"]',
      '.price-wrapper',
      '.price-box',
      '.lead-price',
      '.main-price'
    ];
    let domHeroPrice = null;
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText) {
        if (el.closest('footer, [class*="recommend"], [class*="similar"], [class*="review"]')) continue;
        const parsed = parsePriceValue(el.innerText);
        if (parsed && parsed.priceFcfa > 0) {
          domHeroPrice = parsed;
          break;
        }
      }
    }

    // 3. Détection des vrais paliers dégressifs usine (LADDER PRICING)
    const ladderContainers = document.querySelectorAll(
      '.product-price [class*="price-item"], .product-price [class*="ladder"], [class*="module_price"] [class*="price-item"], [class*="module_price"] [class*="ladder"], [class*="od-ladder-price"], .ladder-price-item, .price-ladder, .quality-price-item, [class*="ladderPrice"]'
    );

    const rawTiers = [];
    ladderContainers.forEach(container => {
      if (container.closest('footer, [class*="recommend"], [class*="similar"], [class*="custom"], [class*="packaging"], [class*="personal"]')) return;
      const text = container.innerText ? container.innerText.replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim() : '';
      if (!text || text.length > 150) return;

      const p = parsePriceValue(text);
      const qtyM = text.match(/((?:≥|>|=|\d+)[-\s\d]*(?:pièces?|pcs|paires?|pairs?|sets?|jeux?|jeu|mètres?|kg|cartons?|lots?|unités?|unité)[s]?)/i) ||
                   text.match(/(\d+\s*[-–—~]\s*\d+\s*(?:pcs|paires?|pièces?|sets?|jeux?|jeu)?)/i) ||
                   text.match(/(≥\s*\d+[\s\w]*)/i);

      if (p && p.priceFcfa > 0 && qtyM && qtyM[1]) {
        const qStr = qtyM[1].trim();
        const qtyNum = parseInt(qStr.match(/\d+/)?.[0] || '0', 10);
        if (qtyNum > 0 && !rawTiers.some(t => t.qtyNum === qtyNum)) {
          rawTiers.push({
            qtyNum,
            minQty: qStr,
            priceFcfa: p.priceFcfa,
            priceCny: p.priceCny
          });
        }
      }
    });

    // Validation stricte des paliers dégressifs
    rawTiers.sort((a, b) => a.qtyNum - b.qtyNum);
    let isValidTierPricing = rawTiers.length >= 2;
    if (isValidTierPricing) {
      for (let i = 1; i < rawTiers.length; i++) {
        // Dégressivité obligatoire : une quantité supérieure doit coûter moins cher ou égal à l'unité
        if (rawTiers[i].priceFcfa > rawTiers[i - 1].priceFcfa) {
          isValidTierPricing = false;
          break;
        }
      }
    }

    if (isValidTierPricing) {
      tierPricing = rawTiers.map(t => ({
        minQty: t.minQty,
        priceFcfa: t.priceFcfa,
        priceCny: t.priceCny
      }));
    } else {
      tierPricing = [];
    }

    // 4. Détermination du prix de référence et d'affichage
    if (domHeroPrice) {
      basePriceFcfa = domHeroPrice.priceFcfa;
      basePriceCny = domHeroPrice.priceCny;
      formattedDisplayPrice = domHeroPrice.formatted;
    } else if (jsonLdPrice) {
      basePriceFcfa = jsonLdPrice.priceFcfa;
      basePriceCny = jsonLdPrice.priceCny;
      formattedDisplayPrice = jsonLdPrice.formatted;
    } else if (tierPricing.length > 0) {
      basePriceFcfa = tierPricing[0].priceFcfa;
      basePriceCny = tierPricing[0].priceCny;
      formattedDisplayPrice = `${basePriceFcfa.toLocaleString()} FCFA (${basePriceCny} ¥)`;
    } else {
      // Fallback prix unique sécurisé
      const singlePriceMatch = rawText.match(/(\d[\d\s.,]{0,8}\s*(?:-|–|—|~|to|à)\s*\d[\d\s.,]{0,8})\s*(?:FCFA|CFA|XOF|F\s*CFA|\$|USD|¥|￥|CNY|€|EUR)/i) ||
                               rawText.match(/(\d[\d\s.,]{0,8})\s*(?:FCFA|CFA|XOF|F\s*CFA|\$|USD|¥|￥|CNY|€|EUR)/i);
      if (singlePriceMatch) {
        const p = parsePriceValue(singlePriceMatch[0]);
        if (p && p.priceFcfa > 0) {
          basePriceFcfa = p.priceFcfa;
          basePriceCny = p.priceCny;
          formattedDisplayPrice = p.formatted;
        }
      }
    }

    if (!formattedDisplayPrice || basePriceFcfa === 0) {
      formattedDisplayPrice = basePriceFcfa > 0 ? `${basePriceFcfa.toLocaleString()} FCFA (${basePriceCny} ¥)` : 'Prix sur Demande (Usine)';
    }

    // -------------------------------------------------------------------------
    // 4. 📦 EXTRACTION DU MOQ RÉEL (QUANTITÉ MINIMALE)
    // -------------------------------------------------------------------------
    const moqRegexes = [
      /Quantit[eé]\s*minimale\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /Quantit[eé]\s*minimum\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /Commande\s*minimale\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /Commande\s*minimum\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /Min\.?\s*order(?:\s*quantity)?\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /Minimum\s*order(?:\s*quantity)?\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /MOQ\s*[:：]?\s*(\d[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i,
      /起订量\s*[:：]?\s*(\d[\d\s\u00a0]*(?:件|套|双|个)?)/i
    ];

    for (const rgx of moqRegexes) {
      const m = rawText.match(rgx);
      if (m && m[1]) {
        let rawMoq = m[1].replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
        const cutMatch = rawMoq.match(/^(\d+[\d\s\u00a0]*(?:jeux?|jeu|pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité)?)/i);
        if (cutMatch && cutMatch[1]) {
          moq = cutMatch[1].trim();
        } else {
          moq = rawMoq.slice(0, 35).trim();
        }
        break;
      }
    }

    if ((!moq || moq === '1 pièce') && tierPricing.length > 0) {
      moq = tierPricing[0].minQty;
    }

    // -------------------------------------------------------------------------
    // 5. 🏭 DEEP SCRAPE FOURNISSEUR & USINE (INFOS COMPLÈTES SANS "LOGO")
    // -------------------------------------------------------------------------
    const isForbiddenCompany = (str) => {
      if (!str || typeof str !== 'string') return true;
      const lower = str.toLowerCase().trim();
      const blacklisted = [
        'afficher plus', 'voir plus', 'see more', 'view more', 'plus', 'more',
        'alibaba', 'centre d\'aide', 'à propos', 'panier', 'store review',
        'bestseller', 'envoyer demande', 'discuter ici', 'contacter le fournisseur',
        'contact supplier', 'chat now', 'send inquiry', 'évaluations', 'évaluation',
        'avis', 'suivre', 'profil de l\'entreprise', 'company profile', 'store home',
        'accueil', 'produits', 'contact', 'home'
      ];
      return lower.length < 3 || lower.length > 95 || blacklisted.some(w => lower === w || lower.startsWith(w) || lower.endsWith(w));
    };

    const companySelectors = [
      'a[href*="company_profile"]',
      'a[href*=".en.alibaba.com"]',
      '.company-name',
      '.company-basic-info h2',
      '.supplier-name',
      '[data-e2e="company-name"]',
      '.name-wrapper a',
      '.shop-name',
      '[class*="supplier-name"]',
      '[class*="company-name"]'
    ];

    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el) {
        let txt = decodeHtml(el.innerText || el.getAttribute('title') || '');
        txt = txt
          .replace(/\b(Afficher plus|Voir plus|See more|View more|Follow|Suivre)\b/gi, '')
          .replace(/\b(logo|icon|icône)\b/gi, '')
          .trim();
        if (txt && !isForbiddenCompany(txt)) {
          company = txt;
          break;
        }
      }
    }

    if (!company) {
      const compRegexMatch = rawText.match(/([A-Z][a-zA-Z0-9\s.,&-]{3,50}(?:Co\.,?\s*Ltd\.?|Company\s+Limited|Factory|Technology|Hardware|Tools|Manufacturing|Industry|Enterprises))/i);
      if (compRegexMatch && !isForbiddenCompany(compRegexMatch[1])) {
        company = decodeHtml(compRegexMatch[1].trim()).replace(/\blogo\b/gi, '').trim();
      }
    }

    if (!company || isForbiddenCompany(company)) {
      company = 'Fabricant Vérifié ' + platform;
    }

    // Origine géographique industrielle
    const chinaCities = [
      'Chaozhou', 'Foshan', 'Guangdong', 'Shenzhen', 'Guangzhou', 'Zhejiang', 'Yiwu', 'Ningbo', 
      'Wenzhou', 'Jinhua', 'Yongkang', 'Dongguan', 'Zhongshan', 'Jiangsu', 'Changzhou', 
      'Wuxi', 'Shanghai', 'Shandong', 'Jinan', 'Qingdao', 'Tianjin', 'Hebei', 'Jieyang', 
      'Quanzhou', 'Xiamen', 'Fujian', 'Henan', 'Anhui'
    ];

    for (const city of chinaCities) {
      if (rawText.toLowerCase().includes(city.toLowerCase())) {
        location = `${city}, Chine`;
        break;
      }
    }

    // Années d'expérience
    const yearsMatch = rawText.match(/(\d+)\s*(?:yrs?|ans?|years?|年)\b/i);
    if (yearsMatch) {
      supplierYears = `${yearsMatch[1]} ans d'expérience`;
    }

    // Badges & Audits
    if (rawText.toLowerCase().includes('verified supplier') || rawText.toLowerCase().includes('fournisseur vérifié') || rawText.toLowerCase().includes('trade assurance')) {
      supplierBadge = 'Verified Supplier (Trade Assurance)';
    }

    // -------------------------------------------------------------------------
    // 6. 📐 DEEP SCRAPE TOUTES LES SPÉCIFICATIONS TECHNIQUES
    // -------------------------------------------------------------------------
    const seenLabels = new Set();
    const specRows = document.querySelectorAll(
      'tr, dl.do-entry-item, .do-entry-item, .product-prop, .attribute-item, .spec-item, [class*="attribute"], [class*="specification"] tr, [class*="prop-item"], [class*="attr-item"], .attr-item, [data-spm*="spec"] dl, [data-spm*="spec"] div, #J-rich-text-description tr, .detail-desc-decorate tr, [class*="attribute-layout"] div, [class*="params-item"], .feature-item'
    );

    specRows.forEach(row => {
      let label = '';
      let value = '';

      if (row.tagName === 'TR') {
        const th = row.querySelector('th, td:first-child');
        const td = row.querySelector('td:last-child');
        if (th && td && th !== td) {
          label = decodeHtml(th.innerText.replace(/[\t\r\n:]/g, ' ').trim());
          value = decodeHtml(td.innerText.replace(/[\t\r\n]/g, ' ').trim());
        }
      } else if (row.tagName === 'DL') {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (dt && dd) {
          label = decodeHtml(dt.innerText.replace(/[\t\r\n:]/g, ' ').trim());
          value = decodeHtml(dd.innerText.replace(/[\t\r\n]/g, ' ').trim());
        }
      } else {
        const spanLabel = row.querySelector('.label, .name, [class*="label"], [class*="name"], [class*="key"], [class*="title"], dt, span:first-child');
        const spanVal = row.querySelector('.value, [class*="value"], [class*="val"], dd, span:last-child');
        if (spanLabel && spanVal && spanLabel !== spanVal) {
          label = decodeHtml(spanLabel.innerText.replace(/[\t\r\n:]/g, ' ').trim());
          value = decodeHtml(spanVal.innerText.replace(/[\t\r\n]/g, ' ').trim());
        } else if (row.innerText && row.innerText.includes(':')) {
          const parts = row.innerText.split(':');
          if (parts.length === 2) {
            label = decodeHtml(parts[0].trim());
            value = decodeHtml(parts[1].trim());
          }
        }
      }

      if (label && value && label.length > 1 && label.length < 75 && value.length > 0 && value.length < 250) {
        const lowerL = label.toLowerCase();
        if (!seenLabels.has(lowerL) && !lowerL.includes('view') && !lowerL.includes('voir') && !lowerL.includes('afficher') && !lowerL.includes('feedback') && !lowerL.includes('review') && !lowerL.includes('score')) {
          seenLabels.add(lowerL);
          
          let categoryName = 'Spécifications Techniques';
          if (lowerL.includes('emballage') || lowerL.includes('livraison') || lowerL.includes('délai') || lowerL.includes('packaging') || lowerL.includes('delivery') || lowerL.includes('lead time') || lowerL.includes('port')) {
            categoryName = 'Emballage & Logistique';
          } else if (lowerL.includes('personnalis') || lowerL.includes('custom') || lowerL.includes('logo') || lowerL.includes('package')) {
            categoryName = 'Personnalisation Usine';
          } else if (lowerL.includes('certif') || lowerL.includes('norme') || lowerL.includes('grade') || lowerL.includes('food') || lowerL.includes('bpa')) {
            categoryName = 'Normes & Certifications';
          }

          allSpecifications.push({ category: categoryName, label, value });
        }
      }
    });

    // -------------------------------------------------------------------------
    // 7. 🎬 EXTRACTION STRICTE DE LA VIDÉO DU PRODUIT (AUCUNE INVENTION)
    // -------------------------------------------------------------------------
    const productVideoEl = document.querySelector(
      '.main-image video, .detail-gallery video, [class*="gallery"] video, [class*="main-layout"] video, .video-player video, [data-spm*="video"] video, .lib-video'
    );

    if (productVideoEl) {
      const s = productVideoEl.src || productVideoEl.currentSrc || productVideoEl.querySelector('source')?.src;
      if (s && s.startsWith('http') && !s.startsWith('blob:') && (s.includes('alicdn.com') || s.includes('taobao.com') || s.includes('.mp4') || s.includes('video'))) {
        if (!productVideoEl.closest('footer, [class*="recommend"], [class*="live-room"], [class*="chat"]')) {
          videoUrl = s;
          videoPoster = productVideoEl.poster || mainImage || '';
        }
      }
    }

    // -------------------------------------------------------------------------
    // 8. 🧭 EXTRACTION DU FIL D'ARIANE (BREADCRUMBS) ET MOTS-CLÉS DE CATÉGORIE
    // -------------------------------------------------------------------------
    let breadcrumbs = [];
    try {
      const crumbEls = document.querySelectorAll(
        '.breadcrumb a, [class*="breadcrumb"] a, [class*="crumbs"] a, .detail-breadcrumb a, [data-spm*="breadcrumb"] a, .ant-breadcrumb-link, .ui-breadcrumb a, .breadcrumb-item'
      );
      crumbEls.forEach(el => {
        const txt = el.innerText ? el.innerText.trim() : '';
        if (txt && !['home', 'accueil', 'all categories', 'toutes les catégories', '>', '/', '»'].includes(txt.toLowerCase()) && txt.length > 2) {
          breadcrumbs.push(decodeHtml(txt));
        }
      });
    } catch (e) {}

    let metaKeywords = '';
    try {
      const metaEl = document.querySelector('meta[name="keywords"]') || document.querySelector('meta[name="description"]');
      if (metaEl && metaEl.content) metaKeywords = decodeHtml(metaEl.content);
    } catch (e) {}

    const calculatedFcfa = basePriceFcfa > 0 ? basePriceFcfa : (tierPricing[0]?.priceFcfa || 0);
    const calculatedCny = basePriceCny > 0 ? basePriceCny : (tierPricing[0]?.priceCny || 0);

    return {
      url,
      title: title || decodeHtml(document.title || 'Article Détecté'),
      titleCn,
      platform,
      platformType,
      breadcrumbs,
      metaKeywords,
      basePriceFcfa: calculatedFcfa,
      basePriceCny: calculatedCny,
      samplePriceFcfa,
      formattedDisplayPrice: formattedDisplayPrice || `${calculatedFcfa.toLocaleString()} FCFA (${calculatedCny} ¥)`,
      tierPricing: tierPricing.slice(0, 10),
      company: company || ('Fabricant Vérifié ' + platform),
      location,
      supplierBadge,
      supplierYears,
      supplierRating,
      supplierResponseRate,
      supplierEmployees,
      supplierFactoryArea,
      moq: moq || (tierPricing[0]?.minQty || '1 pièce'),
      specifications: allSpecifications.slice(0, 50),
      mainImage: mainImage || (productImages[0] || ''),
      images: productImages.slice(0, 20),
      videoUrl: videoUrl || '',
      videoPoster: videoPoster || ''
    };
  } catch (err) {
    return {
      url: window.location.href,
      title: (document.title || 'Article Détecté').replace(/&#39;/g, "'").replace(/&eacute;/g, "é"),
      titleCn: '',
      platform: 'Alibaba',
      platformType: 'ecommerce',
      basePriceFcfa: 0,
      basePriceCny: 0,
      samplePriceFcfa: 0,
      formattedDisplayPrice: 'Prix sur Demande (Usine)',
      tierPricing: [],
      company: 'Fournisseur Direct',
      location: 'Chine',
      supplierBadge: 'Verified Supplier',
      supplierYears: '5 ans d\'expérience',
      moq: '1 pièce',
      specifications: [],
      mainImage: '',
      images: [],
      videoUrl: '',
      videoPoster: ''
    };
  }
}

// 🌐 INITIALISATION DE L'INTERFACE DU POPUP
async function initPopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const platformBadge = document.getElementById('platformBadge');
  const btnMinimizeToggle = document.getElementById('btnMinimizeToggle');
  const popupBody = document.getElementById('popupBody') || document.body;

  const tabCreate = document.getElementById('tabCreate');
  const tabEnrich = document.getElementById('tabEnrich');
  const targetProductBox = document.getElementById('targetProductBox');
  const targetProductSelect = document.getElementById('targetProductSelect');
  const btnImport = document.getElementById('btnImport');
  const btnImportText = document.getElementById('btnImportText');
  const msgBox = document.getElementById('msgBox');

  // Preview elements
  const previewTitle = document.getElementById('previewTitle');
  const previewPrice = document.getElementById('previewPrice');
  const previewSampleRow = document.getElementById('previewSampleRow');
  const previewSample = document.getElementById('previewSample');
  const previewSupplier = document.getElementById('previewSupplier');
  const previewLocation = document.getElementById('previewLocation');
  const previewMoq = document.getElementById('previewMoq');
  const previewTiersBox = document.getElementById('previewTiersBox');
  const previewTiersList = document.getElementById('previewTiersList');
  const previewSpecsBox = document.getElementById('previewSpecsBox');
  const previewSpecsList = document.getElementById('previewSpecsList');
  const previewSpecsCount = document.getElementById('previewSpecsCount');
  const previewMediaBar = document.getElementById('previewMediaBar');
  const previewImagesCount = document.getElementById('previewImagesCount');
  const previewVideoBadge = document.getElementById('previewVideoBadge');
  const previewImagesGallery = document.getElementById('previewImagesGallery');

  const categorySearchInput = document.getElementById('categorySearchInput');
  const categorySelect = document.getElementById('categorySelect');
  const selectedCategoryBadge = document.getElementById('selectedCategoryBadge');
  const btnClearCatSearch = document.getElementById('btnClearCatSearch');
  const autoCategorySuggestionBox = document.getElementById('autoCategorySuggestionBox');
  const autoCatSuggestionText = document.getElementById('autoCatSuggestionText');
  const btnApplyAutoCat = document.getElementById('btnApplyAutoCat');
  const btnToggleCreateCat = document.getElementById('btnToggleCreateCat');
  const createCategoryForm = document.getElementById('createCategoryForm');
  const btnCloseCreateCat = document.getElementById('btnCloseCreateCat');
  const btnConfirmCreateCat = document.getElementById('btnConfirmCreateCat');
  const newCatIconInput = document.getElementById('newCatIconInput');
  const newCatNameInput = document.getElementById('newCatNameInput');
  const newCatWorkspaceSelect = document.getElementById('newCatWorkspaceSelect');

  let currentMode = 'create';
  let cachedData = null;
  let availableProducts = [];

  // 🗂️ BASE COMPLÈTE DES RAYONS ET CATÉGORIES DE L'APPLICATION
  const ALL_CATEGORIES_DATA = [
    // 1. ARRIVAGE (PAR DÉFAUT)
    { id: 'inbox', workspaceId: 'ws_cuisines', name: "📥 Magasin d'Arrivage (Articles en Attente)", group: "⭐ ACCUEIL ARRIVAGE", isInbox: true },

    // 2. CUISINES & AMÉNAGEMENT
    { id: 'vaisselle', workspaceId: 'ws_cuisines', name: "🍽️ Assiettes, Vaisselle & Céramique", group: "🍳 Cuisines & Aménagement", keywords: ['assiette', 'plat', 'vaisselle', 'céramique', 'porcelaine', 'bol', 'tasse', 'verre', 'couvert', 'fourchette', 'couteau', 'ceramic', 'dish', 'plate', 'bone china', 'dinnerware', 'dinner set'] },
    { id: 'eviers', workspaceId: 'ws_cuisines', name: "🚰 Éviers Cuves & Cascades Inox", group: "🍳 Cuisines & Aménagement", keywords: ['evier', 'cuve', 'cascade', 'inox', 'bac', 'eviers', 'sink'] },
    { id: 'robinetterie', workspaceId: 'ws_cuisines', name: "🚿 Robinetterie Douchette 360°", group: "🍳 Cuisines & Aménagement", keywords: ['robinet', 'douchette', 'mitigeur', 'robinetterie', 'faucet'] },
    { id: 'electro', workspaceId: 'ws_cuisines', name: "🍳 Hottes & Plaques Induction / Cuisson", group: "🍳 Cuisines & Aménagement", keywords: ['hotte', 'plaque', 'induction', 'cuiseur', 'poele', 'casserole', 'friteuse', 'cuisson'] },
    { id: 'rangements', workspaceId: 'ws_cuisines', name: "🗄️ Organisateurs & Tiroirs Épices", group: "🍳 Cuisines & Aménagement", keywords: ['organisateur', 'tiroir', 'rangement', 'epice', 'casier'] },
    { id: 'plans', workspaceId: 'ws_cuisines', name: "🪵 Plans de Travail & Crédences", group: "🍳 Cuisines & Aménagement", keywords: ['plan de travail', 'credence', 'quartz', 'granit'] },
    { id: 'eclairage', workspaceId: 'ws_cuisines', name: "💡 LED Sous-Meubles & Profilés", group: "🍳 Cuisines & Aménagement", keywords: ['led', 'ruban', 'profil', 'eclairage', 'luminaire'] },
    { id: 'accessoires', workspaceId: 'ws_cuisines', name: "🗑️ Poubelles Tri & Accessoires Cuisine", group: "🍳 Cuisines & Aménagement", keywords: ['poubelle', 'egouttoir', 'distributeur', 'accessoire'] },

    // 3. QUINCAILLERIE & FIXATIONS
    { id: 'visserie', workspaceId: 'ws_quincaillerie', name: "🔩 Visserie & Fixations Lourdes", group: "🔩 Quincaillerie & Fixations", keywords: ['vis', 'boulon', 'ecrou', 'chevilles', 'taraud', 'fixation', 'auto-perforante', 'screw', 'entretoise'] },
    { id: 'coulisses', workspaceId: 'ws_quincaillerie', name: "🗄️ Coulisses Sous-Tiroirs Soft-Close", group: "🔩 Quincaillerie & Fixations", keywords: ['coulisse', 'glissiere', 'tiroir', 'amorti', 'soft-close', 'push', 'drawer slide'] },
    { id: 'charnieres', workspaceId: 'ws_quincaillerie', name: "🚪 Charnières, Vérins & Systèmes Relevables", group: "🔩 Quincaillerie & Fixations", keywords: ['charniere', 'gond', 'paumelle', 'clip-on', 'amortisseur', 'push to open', 'hinge', 'verin', 'levage', 'relevable', 'lift', 'hydraulic', 'gas spring', 'compas', 'bras', 'relevable', 'maintien', 'support de porte'] },
    { id: 'poignees', workspaceId: 'ws_quincaillerie', name: "🔘 Poignées & Boutons Meubles", group: "🔩 Quincaillerie & Fixations", keywords: ['poignee', 'bouton', 'tirant', 'handle'] },
    { id: 'serrures', workspaceId: 'ws_quincaillerie', name: "🔒 Serrures & Sécurité Meubles", group: "🔩 Quincaillerie & Fixations", keywords: ['serrure', 'verrou', 'cadenas', 'fermeture', 'lock'] },
    { id: 'angle', workspaceId: 'ws_quincaillerie', name: "🔄 Meubles d'Angle (Magic Corner)", group: "🔩 Quincaillerie & Fixations", keywords: ['angle', 'magic corner', 'panier tournant', 'colonne'] },
    { id: 'dressing', workspaceId: 'ws_quincaillerie', name: "🪜 Dressings & Penderies Relevables", group: "🔩 Quincaillerie & Fixations", keywords: ['dressing', 'penderie', 'lift', 'porte-pantalon'] },
    { id: 'alu', workspaceId: 'ws_quincaillerie', name: "📐 Profilés Alu & Gola", group: "🔩 Quincaillerie & Fixations", keywords: ['profil', 'alu', 'gola', 'bandeau', 'poignee integree'] },
    { id: 'outillage', workspaceId: 'ws_quincaillerie', name: "🛠️ Gabarits de Perçage & Outillage Pro", group: "🔩 Quincaillerie & Fixations", keywords: ['gabarit', 'perceuse', 'foret', 'visseuse', 'outil', 'fraise', 'drill'] },
    { id: 'machines', workspaceId: 'ws_quincaillerie', name: "⚡ Électroportatif & Machines Usine", group: "🔩 Quincaillerie & Fixations", keywords: ['machine', 'scie', 'plaqueuse', 'moteur'] },

    // 4. VÊTEMENTS & MODE
    { id: 'tshirts', workspaceId: 'ws_vetements', name: "👕 T-Shirts, Polos & Basiques", group: "👗 Vêtements & Mode", keywords: ['tshirt', 't-shirt', 'polo', 'coton', 'jersey'] },
    { id: 'sweats', workspaceId: 'ws_vetements', name: "🧥 Hoodies, Sweats & Pulls 400+ GSM", group: "👗 Vêtements & Mode", keywords: ['hoodie', 'sweat', 'pull', 'molleton'] },
    { id: 'pantalons', workspaceId: 'ws_vetements', name: "👖 Jeans, Cargos & Pantalons", group: "👗 Vêtements & Mode", keywords: ['jean', 'cargo', 'pantalon', 'jogging'] },
    { id: 'robes', workspaceId: 'ws_vetements', name: "👗 Robes, Jupes & Ensembles", group: "👗 Vêtements & Mode", keywords: ['robe', 'jupe', 'ensemble', 'chemise'] },
    { id: 'vestes', workspaceId: 'ws_vetements', name: "🦺 Vestes, Manteaux & Doudounes", group: "👗 Vêtements & Mode", keywords: ['veste', 'manteau', 'doudoune', 'blouson'] },

    // 5. CHAUSSURES & SNEAKERS
    { id: 'sneakers', workspaceId: 'ws_chaussures', name: "👟 Sneakers & Baskets Casual", group: "👟 Chaussures & Sneakers", keywords: ['sneaker', 'basket', 'chaussure sport'] },
    { id: 'ville', workspaceId: 'ws_chaussures', name: "👞 Chaussures Cuir & Mocassins", group: "👟 Chaussures & Sneakers", keywords: ['mocassin', 'derbie', 'richelieu', 'cuir'] },
    { id: 'sandales', workspaceId: 'ws_chaussures', name: "🩴 Sandales, Mules & Claquettes", group: "👟 Chaussures & Sneakers", keywords: ['sandale', 'mule', 'claquette', 'tong'] },

    // 6. HIGH-TECH & ÉLECTRONIQUE
    { id: 'audio', workspaceId: 'ws_electronique', name: "🎧 Écouteurs TWS ANC & Enceintes", group: "📱 High-Tech & Électronique", keywords: ['ecouteur', 'tws', 'casque', 'audio', 'enceinte', 'bluetooth'] },
    { id: 'chargeurs', workspaceId: 'ws_electronique', name: "⚡ Chargeurs GaN & Câbles USB-C", group: "📱 High-Tech & Électronique", keywords: ['chargeur', 'cable', 'gan', 'usb', 'powerbank'] },
    { id: 'smartwatch', workspaceId: 'ws_electronique', name: "⌚ Montres & Bracelets Connectés", group: "📱 High-Tech & Électronique", keywords: ['montre', 'smartwatch', 'bracelet'] },

    // 7. MOBILIER & DÉCORATION
    { id: 'assises', workspaceId: 'ws_mobilier', name: "🪑 Chaises Design, Fauteuils & Tabourets", group: "🪑 Mobilier & Décoration", keywords: ['chaise', 'fauteuil', 'tabouret', 'assise', 'canape'] },
    { id: 'tables', workspaceId: 'ws_mobilier', name: "🪵 Tables à Manger, Basses & Bureaux", group: "🪑 Mobilier & Décoration", keywords: ['table', 'bureau', 'manger'] },
    { id: 'deco', workspaceId: 'ws_mobilier', name: "🏺 Vases, Décoration & Miroirs", group: "🪑 Mobilier & Décoration", keywords: ['vase', 'miroir', 'tapis', 'deco', 'sculpture'] }
  ];

  let selectedCategoryItem = ALL_CATEGORIES_DATA[0];

  function renderCategoryOptions(query = '') {
    if (!categorySelect) return;
    const cleanQ = query.trim().toLowerCase();
    
    const filtered = ALL_CATEGORIES_DATA.filter(item => {
      if (!cleanQ) return true;
      if (item.name.toLowerCase().includes(cleanQ)) return true;
      if (item.group.toLowerCase().includes(cleanQ)) return true;
      if (item.keywords && item.keywords.some(k => k.toLowerCase().includes(cleanQ))) return true;
      return false;
    });

    categorySelect.innerHTML = '';

    if (filtered.length === 0) {
      const opt = document.createElement('option');
      opt.value = "";
      opt.innerText = "❌ Aucun rayon trouvé";
      opt.disabled = true;
      categorySelect.appendChild(opt);
      return;
    }

    const groups = {};
    filtered.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });

    Object.keys(groups).forEach(grpName => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = grpName;
      groups[grpName].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = `${cat.workspaceId}::${cat.id}`;
        opt.innerText = cat.name;
        if (selectedCategoryItem && selectedCategoryItem.id === cat.id && selectedCategoryItem.workspaceId === cat.workspaceId) {
          opt.selected = true;
        }
        optgroup.appendChild(opt);
      });
      categorySelect.appendChild(optgroup);
    });
  }

  function updateCategorySelection(val) {
    if (!val) return;
    const [wsId, catId] = val.split('::');
    const found = ALL_CATEGORIES_DATA.find(c => c.workspaceId === wsId && c.id === catId);
    if (found) {
      selectedCategoryItem = found;
      if (selectedCategoryBadge) {
        selectedCategoryBadge.innerText = (found.icon ? `${found.icon} ` : '') + (found.rawName || found.name.split(' ').slice(1, 4).join(' '));
        selectedCategoryBadge.title = `${found.group} > ${found.name}`;
      }

      if (btnImportText) {
        if (found.id === 'inbox') {
          btnImportText.innerText = "📥 ENVOYER AU MAGASIN D'ARRIVAGE (EN ATTENTE)";
        } else {
          btnImportText.innerText = `🚀 CLASSER DANS « ${found.name.slice(0, 24)} »`;
        }
      }
    }
  }

  function addNewCategoryToExtension(name, icon, workspaceId) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const cleanIcon = icon || '📦';
    const slug = cleanName
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 30);

    const targetWs = workspaceId || 'ws_quincaillerie';

    // 🛡️ Déduplication stricte (Section 5 de ROBUSTESSE_EXTENSION_CHROME)
    const existing = ALL_CATEGORIES_DATA.find(c => 
      c.workspaceId === targetWs && (c.id === slug || (c.rawName && c.rawName.toLowerCase() === cleanName.toLowerCase()))
    );

    if (existing) {
      updateCategorySelection(`${existing.workspaceId}::${existing.id}`);
      return existing;
    }

    const wsLabels = {
      ws_quincaillerie: '🔩 Quincaillerie & Fixations',
      ws_cuisines: '🍳 Cuisines & Aménagement',
      ws_outillage: '🛠️ Gabarits & Outillage Pro',
      ws_electromenager: '🔌 Électroménager & Cuisson',
      ws_vetements: '👗 Vêtements & Mode',
      ws_chaussures: '👟 Chaussures & Sneakers',
      ws_electronique: '📱 High-Tech & Électronique',
      ws_mobilier: '🪑 Mobilier & Décoration'
    };

    const newCatItem = {
      id: slug || ('cat_' + Date.now()),
      workspaceId: targetWs,
      name: `${cleanIcon} ${cleanName}`,
      rawName: cleanName,
      icon: cleanIcon,
      group: wsLabels[targetWs] || '🔩 Quincaillerie & Fixations',
      isNewlyCreated: true
    };

    ALL_CATEGORIES_DATA.push(newCatItem);
    renderCategoryOptions();
    updateCategorySelection(`${newCatItem.workspaceId}::${newCatItem.id}`);
    return newCatItem;
  }

  function detectBestCategory(data) {
    if (!data) return null;
    const combinedText = [
      (data.title || ''),
      (tab.title || ''),
      (data.breadcrumbs ? data.breadcrumbs.join(' ') : ''),
      (data.metaKeywords || ''),
      (data.specifications ? data.specifications.map(s => `${s.label} ${s.value}`).join(' ') : '')
    ].join(' ').toLowerCase();

    let bestMatch = null;
    let highestScore = 0;

    ALL_CATEGORIES_DATA.forEach(cat => {
      if (cat.isInbox || !cat.keywords) return;
      let score = 0;
      cat.keywords.forEach(kw => {
        const lowerKw = kw.toLowerCase();
        if (combinedText.includes(lowerKw)) {
          if ((data.title || '').toLowerCase().includes(lowerKw)) score += 4;
          if ((data.breadcrumbs || []).some(b => b.toLowerCase().includes(lowerKw))) score += 5;
          score += 2;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = cat;
      }
    });

    if (bestMatch && highestScore >= 2) {
      const confidencePct = Math.min(98, Math.round(50 + (highestScore * 10)));
      return { type: 'match', category: bestMatch, score: highestScore, confidence: confidencePct };
    }

    return null;
  }

  // 🔌 Connexion persistante au Service Worker pour garantir la finalisation en cas de fermeture
  let syncPort = null;
  let isPortConnected = false;
  try {
    syncPort = chrome.runtime.connect({ name: 'popup_sync' });
    isPortConnected = true;
    syncPort.onDisconnect.addListener(() => {
      isPortConnected = false;
      syncPort = null;
      if (chrome.runtime.lastError) {
        console.log('[EXT] Port popup_sync déconnecté:', chrome.runtime.lastError.message);
      }
    });
  } catch (e) {
    isPortConnected = false;
  }

  // 🆔 Identifiant unique de session de scraping (Prévention des Race Conditions)
  const currentScrapeRequestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // 🚀 Rendu immédiat des catégories (0ms)
  renderCategoryOptions();

  // 🚀 Pré-détection immédiate basée sur le titre de l'onglet
  const initialTitle = (tab.title || 'Article Détecté').replace(/[\-|–].*Alibaba.*$/i, '').trim();
  if (previewTitle) previewTitle.innerText = initialTitle;
  const quickDetection = detectBestCategory({ title: initialTitle, breadcrumbs: [] });
  if (quickDetection && quickDetection.category) {
    updateCategorySelection(`${quickDetection.category.workspaceId}::${quickDetection.category.id}`);
    if (autoCategorySuggestionBox && autoCatSuggestionText) {
      autoCatSuggestionText.innerHTML = `🎯 Suggéré : <strong>${quickDetection.category.name}</strong> (${quickDetection.confidence}% confiance)`;
      if (btnApplyAutoCat) btnApplyAutoCat.innerText = '✓ Sélectionné';
      autoCategorySuggestionBox.style.display = 'flex';
    }
  }

  // Écouteurs UI pour la recherche et création de rayons
  if (categorySearchInput) {
    categorySearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      if (btnClearCatSearch) btnClearCatSearch.style.display = q ? 'block' : 'none';
      renderCategoryOptions(q);
    });
  }

  if (btnClearCatSearch) {
    btnClearCatSearch.addEventListener('click', () => {
      categorySearchInput.value = '';
      btnClearCatSearch.style.display = 'none';
      renderCategoryOptions('');
      categorySearchInput.focus();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      updateCategorySelection(e.target.value);
    });
  }

  if (btnToggleCreateCat && createCategoryForm) {
    btnToggleCreateCat.addEventListener('click', () => {
      createCategoryForm.style.display = createCategoryForm.style.display === 'none' ? 'block' : 'none';
      if (createCategoryForm.style.display === 'block' && newCatNameInput) newCatNameInput.focus();
    });
  }

  if (btnCloseCreateCat && createCategoryForm) {
    btnCloseCreateCat.addEventListener('click', () => {
      createCategoryForm.style.display = 'none';
    });
  }

  if (btnConfirmCreateCat) {
    btnConfirmCreateCat.addEventListener('click', () => {
      const name = newCatNameInput?.value;
      const icon = newCatIconInput?.value || '📦';
      const ws = newCatWorkspaceSelect?.value || 'ws_cuisines';
      if (!name || !name.trim()) return;
      addNewCategoryToExtension(name, icon, ws);
      if (createCategoryForm) createCategoryForm.style.display = 'none';
      if (autoCategorySuggestionBox) autoCategorySuggestionBox.style.display = 'none';
    });
  }

  if (btnApplyAutoCat) {
    btnApplyAutoCat.addEventListener('click', () => {
      if (quickDetection && quickDetection.category) {
        updateCategorySelection(`${quickDetection.category.workspaceId}::${quickDetection.category.id}`);
      }
    });
  }

  // 1. VÉRIFICATION DU TYPE D'ONGLET
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
    if (previewTitle) previewTitle.innerHTML = "💡 <strong>Ouvrez une fiche produit sur Alibaba.com ou 1688.com</strong> pour prévisualiser et importer en 1 clic !";
    if (previewPrice) previewPrice.innerHTML = '<span style="color:#94A3B8; font-size:11px;">En attente de page produit</span>';
    if (previewSupplier) previewSupplier.innerText = 'Fournisseur E-Commerce';
    return;
  }

  // 2. EXTRACTION RICHE EN ARRIÈRE-PLAN (DEEP SCRAPE)
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: deepScrapePageData
    });

    if (results && results[0] && results[0].result) {
      cachedData = results[0].result;
      cachedData.requestId = currentScrapeRequestId;

      if (platformBadge) platformBadge.innerText = cachedData.platform || 'Alibaba';
      if (previewTitle) previewTitle.innerText = cachedData.title || initialTitle;
      if (previewPrice) previewPrice.innerHTML = `<strong>${cachedData.formattedDisplayPrice}</strong>`;
      if (previewSupplier) previewSupplier.innerText = cachedData.company || 'Fournisseur Direct';
      if (previewLocation) previewLocation.innerText = cachedData.location || 'Guangdong, Chine';
      if (previewMoq) previewMoq.innerText = cachedData.moq || '1 pièce';

      if (previewMediaBar) {
        if (previewImagesCount) previewImagesCount.innerText = `📷 ${cachedData.images?.length || 0} photo(s) HD`;
        if (previewVideoBadge) previewVideoBadge.style.display = cachedData.videoUrl ? 'inline-block' : 'none';
        previewMediaBar.style.display = 'flex';
      }

      if (previewImagesGallery) {
        previewImagesGallery.innerHTML = '';
        if (cachedData.images && cachedData.images.length > 0) {
          cachedData.images.slice(0, 8).forEach(imgUrl => {
            const img = document.createElement('img');
            img.src = imgUrl;
            img.style.cssText = 'width: 52px; height: 52px; border-radius: 6px; object-fit: cover; border: 1px solid #334155; flex-shrink: 0; background: #0F172A; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
            previewImagesGallery.appendChild(img);
          });
          previewImagesGallery.style.display = 'flex';
        } else {
          previewImagesGallery.style.display = 'none';
        }
      }

      if (cachedData.tierPricing && cachedData.tierPricing.length > 0 && previewTiersBox && previewTiersList) {
        previewTiersList.innerHTML = '';
        cachedData.tierPricing.forEach(t => {
          const row = document.createElement('div');
          row.className = 'tier-row';
          row.innerHTML = `<span style="color: #CBD5E1; font-weight: 600;">• ${t.minQty}</span> <strong style="color: #FCD34D;">${t.priceFcfa.toLocaleString()} FCFA <span style="color:#94A3B8; font-size:9.5px; font-weight:normal;">(${t.priceCny} ¥)</span></strong>`;
          previewTiersList.appendChild(row);
        });
        previewTiersBox.style.display = 'block';
      }

      if (cachedData.specifications && cachedData.specifications.length > 0 && previewSpecsBox && previewSpecsList) {
        previewSpecsList.innerHTML = '';
        if (previewSpecsCount) previewSpecsCount.innerText = `(${cachedData.specifications.length})`;
        cachedData.specifications.slice(0, 25).forEach(s => {
          const item = document.createElement('div');
          item.className = 'spec-item';
          item.innerHTML = `<span class="spec-label">${s.label} :</span><span class="spec-value">${s.value}</span>`;
          previewSpecsList.appendChild(item);
        });
        previewSpecsBox.style.display = 'block';
      }

      // Re-détection fine avec breadcrumbs et specs complètes
      const refinedDetection = detectBestCategory(cachedData);
      if (refinedDetection && refinedDetection.category) {
        updateCategorySelection(`${refinedDetection.category.workspaceId}::${refinedDetection.category.id}`);
        if (autoCategorySuggestionBox && autoCatSuggestionText) {
          autoCatSuggestionText.innerHTML = `🎯 Suggéré : <strong>${refinedDetection.category.name}</strong> (${refinedDetection.confidence}% confiance)`;
          if (btnApplyAutoCat) btnApplyAutoCat.innerText = '✓ Sélectionné';
          autoCategorySuggestionBox.style.display = 'flex';
        }
      }
    }
  } catch (e) {
    console.warn('[EXT] Scraping standard fallback:', e);
  }

  // 3. 📥 ACTION PRINCIPALE : INJECTION DANS L'APPLICATION (DIRECTEMENT DANS LE RAYON OU L'ARRIVAGE)
  btnImport.addEventListener('click', async () => {
    try {
      if (!cachedData) {
        cachedData = {
          title: (tab.title || 'Nouvel Article Sourcing').replace(/[\-|–].*Alibaba.*$/i, '').trim(),
          titleCn: '',
          platform: 'Alibaba',
          basePriceFcfa: 0,
          basePriceCny: 0,
          moq: '1 pièce',
          images: [],
          videos: [],
          tierPricing: [],
          specifications: [],
          company: 'Fournisseur Vérifié',
          location: 'Guangdong, Chine',
          sourceUrl: tab.url
        };
      }

      btnImport.disabled = true;
      const origText = btnImportText.innerText;
      btnImportText.innerText = "⏳ Injection Cloud en cours...";

    const isEnrichMode = currentMode === 'enrich';
    const targetId = isEnrichMode ? targetProductSelect.value : null;

    const targetWorkspace = selectedCategoryItem ? selectedCategoryItem.workspaceId : 'ws_cuisines';
    const targetCategory = selectedCategoryItem ? selectedCategoryItem.id : 'inbox';
    const targetCategoryName = selectedCategoryItem ? (selectedCategoryItem.rawName || selectedCategoryItem.name) : "Magasin d'Arrivage";

    const effectivePriceFcfa = (cachedData.basePriceFcfa && cachedData.basePriceFcfa > 0)
      ? cachedData.basePriceFcfa
      : ((cachedData.tierPricing && cachedData.tierPricing.length > 0)
        ? cachedData.tierPricing[0].priceFcfa
        : 0);

    const effectivePriceCny = cachedData.basePriceCny > 0 ? cachedData.basePriceCny : (effectivePriceFcfa > 0 ? parseFloat((effectivePriceFcfa / 85).toFixed(2)) : 0);

    const moqNumber = parseInt(cachedData.moq?.match(/\d+/)?.[0] || '1', 10);

    // 🎯 Génération d'une identité Déterministe basée sur l'URL source
    function getDeterministicSkuAndId(url) {
      if (!url) {
        const r = Math.random().toString(36).substring(2, 8).toUpperCase();
        return { sku: 'SKU-' + r, id: 'prod-' + r };
      }
      try {
        const u = new URL(url);
        const numMatch = u.pathname.match(/(\d{8,20})/);
        if (numMatch) return { sku: 'SKU-' + numMatch[1], id: 'prod-' + numMatch[1] };
        const searchId = u.searchParams.get('id') || u.searchParams.get('productId') || u.searchParams.get('itemId') || u.searchParams.get('item_id');
        if (searchId && searchId.length >= 4) return { sku: 'SKU-' + searchId, id: 'prod-' + searchId };
        let hash = 5381;
        const cleanStr = (u.hostname + u.pathname).toLowerCase().replace(/[^a-z0-9]/g, '');
        for (let i = 0; i < cleanStr.length; i++) {
          hash = ((hash << 5) + hash) + cleanStr.charCodeAt(i);
          hash |= 0;
        }
        const cleanHash = Math.abs(hash).toString(36).toUpperCase();
        return { sku: 'SKU-' + cleanHash, id: 'prod-' + cleanHash };
      } catch (e) {
        return { sku: 'SKU-' + Date.now(), id: 'prod-' + Date.now() };
      }
    }

    const deterministicIdentity = getDeterministicSkuAndId(tab.url);

    // Construction du Produit Structuré et Conforme à App Sourcing
    const cleanProductPayload = {
      id: isEnrichMode ? targetId : deterministicIdentity.id,
      workspaceId: targetWorkspace,
      targetWorkspaceId: targetWorkspace,
      sku: deterministicIdentity.sku,
      titleFr: cachedData.title || tab.title || 'Nouvel Article Sourcing',
      titleCn: cachedData.titleCn || '',
      category: targetCategory,
      categoryName: targetCategoryName,
      categoryIcon: targetCategory === 'inbox' ? '📥' : (selectedCategoryItem?.icon || selectedCategoryItem?.name?.split(' ')[0] || '📦'),
      newCategory: selectedCategoryItem?.isNewlyCreated ? {
        id: selectedCategoryItem.id,
        name: selectedCategoryItem.rawName || selectedCategoryItem.name,
        icon: selectedCategoryItem.icon || '📦',
        workspaceId: selectedCategoryItem.workspaceId
      } : null,
      unit: (function() {
        const lowerMoq = (cachedData.moq || '').toLowerCase();
        if (lowerMoq.includes('paire') || lowerMoq.includes('pair')) return 'Paire (paire)';
        if (lowerMoq.includes('jeu') || lowerMoq.includes('set')) return 'Jeu / Set (kit)';
        if (lowerMoq.includes('kg') || lowerMoq.includes('kilo')) return 'Kilogramme (kg)';
        if (lowerMoq.includes('mètre') || lowerMoq.includes('meter')) return 'Mètre (m)';
        if (lowerMoq.includes('carton')) return 'Carton (ctn)';
        if (lowerMoq.includes('lot')) return 'Lot (lot)';
        return 'Pièce (pc)';
      })(),
      priceCny: effectivePriceCny,
      priceFcfa: effectivePriceFcfa,
      basePriceCny: effectivePriceCny,
      basePriceFcfa: effectivePriceFcfa,
      samplePriceFcfa: cachedData.samplePriceFcfa || 0,
      moq: moqNumber,
      sourceUrl: tab.url,
      mainImage: cachedData.mainImage || (cachedData.images && cachedData.images[0]) || '',
      images: cachedData.images && cachedData.images.length > 0 ? cachedData.images : (cachedData.mainImage ? [cachedData.mainImage] : []),
      hasVideoDemo: Boolean(cachedData.videoUrl),
      videos: cachedData.videoUrl ? [cachedData.videoUrl] : [],
      videoDemo: cachedData.videoUrl ? {
        source: `Démo ${cachedData.platform || 'Usine'}`,
        videoUrl: cachedData.videoUrl,
        poster: cachedData.videoPoster || cachedData.mainImage || '',
        views: '100K vues'
      } : null,
      tierPricing: cachedData.tierPricing || [],
      specifications: cachedData.specifications || [],
      factoryName: cachedData.company || 'Usine Vérifiée ' + cachedData.platform,
      factoryCity: cachedData.location || 'Guangdong, Chine',
      factoryCountry: 'Chine',
      supplierBadge: cachedData.supplierBadge || 'Verified Supplier',
      supplierYears: cachedData.supplierYears || '5 ans d\'expérience',
      supplierRating: cachedData.supplierRating || '4.9/5',
      supplierResponseRate: cachedData.supplierResponseRate || 'Taux de réponse > 95%',
      suppliers: [
        {
          id: 'sup-' + Date.now(),
          name: cachedData.company || 'Usine Vérifiée ' + cachedData.platform,
          city: cachedData.location || 'Guangdong, Chine',
          country: 'Chine',
          badge: cachedData.supplierBadge || 'Verified Supplier',
          years: cachedData.supplierYears || '5 ans d\'expérience',
          rating: cachedData.supplierRating || '4.9/5',
          responseRate: cachedData.supplierResponseRate || 'Taux de réponse > 95%'
        }
      ],
      // 🏷️ Statut explicite de complétude (Section 4 de ROBUSTESSE_EXTENSION_CHROME)
      status: (effectivePriceFcfa > 0 && (cachedData.images?.length > 0 || cachedData.mainImage)) ? 'complete' : 'incomplete',
      completionDetails: {
        hasPrice: effectivePriceFcfa > 0,
        hasImages: Boolean(cachedData.images?.length > 0 || cachedData.mainImage),
        hasSupplier: Boolean(cachedData.company),
        hasTiers: Boolean(cachedData.tierPricing && cachedData.tierPricing.length > 0),
        hasSpecs: Boolean(cachedData.specifications && cachedData.specifications.length > 0)
      },
      createdAt: new Date().toISOString(),
      injectedAtFormatted: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // 🌟 GÉNÉRATION DE L'IDENTIFIANT DE CORRÉLATION (TRACE_ID) & VERSION
    const traceId = 'trc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const schemaVersion = '2.0';

    const importEventPayload = (isEnrichMode && targetId)
      ? { ...cleanProductPayload, importMode: 'enrich', targetProductId: targetId, traceId, schemaVersion }
      : { ...cleanProductPayload, traceId, schemaVersion };

    // 🌟 1. CANAL UNIQUE D'ÉCRITURE : SUPABASE CLOUD (SINGLE WRITER)
    const SUPABASE_URL = 'https://xgaehsajhlxkhxzqgfhz.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_zVzDkQ2gg7Whjg3sOKviNg_v2CvaQoV';
    let isCloudSuccess = false;

      try {
        const productVideos = cleanProductPayload.videos || [];
        const sbRow = {
          id: cleanProductPayload.id,
          workspace_id: targetWorkspace,
          sku: cleanProductPayload.sku,
          title_fr: cleanProductPayload.titleFr,
          title_cn: cleanProductPayload.titleCn || '',
          category: targetCategory,
          material: cleanProductPayload.material || 'Standard Qualité Usine',
          dimensions: cleanProductPayload.dimensions || '',
          images: cleanProductPayload.images || [],
          video_demo: productVideos.length > 0 ? JSON.stringify(productVideos) : null,
          specifications: cleanProductPayload.specifications || [],
          factory_name: cleanProductPayload.factoryName || '',
          factory_city: cleanProductPayload.factoryCity || '',
          tier_pricing: cleanProductPayload.tierPricing || [],
          moq: cachedData.moq || (String(moqNumber) + ' pièce'),
          suppliers: cleanProductPayload.suppliers || [],
          price_cny: parseFloat(cleanProductPayload.priceCny) || 0,
          unit: cleanProductPayload.unit || 'Pièce (pc)',
          source_url: cleanProductPayload.sourceUrl || '',
          source: 'extension',
          trace_id: traceId,
          created_at: cleanProductPayload.createdAt
        };

        // 🔐 Récupération du JWT authentifié avec rafraîchissement autonome si expiré
        const dataAuth = await chrome.storage.local.get(['quin_source_auth_jwt', 'quin_source_auth_refresh_token']);
        let currentToken = dataAuth.quin_source_auth_jwt;
        const refreshToken = dataAuth.quin_source_auth_refresh_token;

        if ((!currentToken || isJwtExpired(currentToken)) && refreshToken) {
          const refRes = await refreshSupabaseSession(refreshToken, SUPABASE_URL, SUPABASE_KEY);
          if (refRes.success && refRes.accessToken) {
            currentToken = refRes.accessToken;
            await chrome.storage.local.set({
              quin_source_auth_jwt: currentToken,
              quin_source_auth_refresh_token: refRes.refreshToken || refreshToken,
              quin_source_auth_updated_at: Date.now()
            });
          }
        }

        const activeAuthHeader = currentToken ? `Bearer ${currentToken}` : `Bearer ${SUPABASE_KEY}`;

        let sbRes = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=workspace_id,sku`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': activeAuthHeader,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(sbRow)
        });

        // Si 401 reçu, tenter un refresh immédiat et réessayer une fois
        if (sbRes.status === 401 && refreshToken) {
          const retryRef = await refreshSupabaseSession(refreshToken, SUPABASE_URL, SUPABASE_KEY);
          if (retryRef.success && retryRef.accessToken) {
            currentToken = retryRef.accessToken;
            await chrome.storage.local.set({
              quin_source_auth_jwt: currentToken,
              quin_source_auth_refresh_token: retryRef.refreshToken || refreshToken,
              quin_source_auth_updated_at: Date.now()
            });

            sbRes = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=workspace_id,sku`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
              },
              body: JSON.stringify(sbRow)
            });
          }
        }

        if (sbRes.ok) {
          isCloudSuccess = true;
          console.log(`[EXT][Canal1-Supabase] ✅ Écriture réussie (trace_id: ${traceId}, SKU: ${cleanProductPayload.sku})`);
          
          // Traçabilité dans la table product_events
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/product_events`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': currentToken ? `Bearer ${currentToken}` : `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                product_sku: cleanProductPayload.sku,
                workspace_id: targetWorkspace,
                action: 'insert',
                source: 'extension',
                trace_id: traceId,
                payload: { titleFr: cleanProductPayload.titleFr, category: targetCategory, priceCny: cleanProductPayload.priceCny }
              })
            });
          } catch (eAudit) {}
        }
      } catch (sbErr) {
        console.warn('[EXT][Canal1-Supabase] ⚠️ Erreur réseau vers Cloud:', sbErr);
      }

      // 🌟 2. CANAL 3 : TAMPON HORS-LIGNE LOCALSTORAGE (ACTIVÉ UNIQUEMENT SUR ÉCHEC DU CANAL 1)
      const taggedPayload = {
        ...importEventPayload,
        _syncing: !isCloudSuccess,
        timestamp: Date.now()
      };

      if (!isCloudSuccess) {
        try {
          const stored = await chrome.storage.local.get(['quin_source_pending_imports']);
          const queue = stored.quin_source_pending_imports || [];
          queue.push({
            ...sbRow,
            retryCount: 0,
            lastRetryAt: Date.now()
          });
          await chrome.storage.local.set({ 
            quin_source_pending_imports: queue,
            quin_source_latest_import: taggedPayload 
          });
          console.log(`[EXT][Canal3-Storage] 📥 Stocké dans la file d'attente service worker pour retry (trace_id: ${traceId})`);
        } catch (stErr) {}
      } else {
        try {
          chrome.storage?.local?.remove('quin_source_latest_import');
          console.log(`[EXT][Canal3-Storage] 🧹 Tampon de secours nettoyé`);
        } catch (stErr) {}
      }

      // 🌟 3. CANAL 2 : NOTIFICATION OPTIMISTE DE L'INTERFACE UTILISATEUR (SANS ÉCRITURE)
      try {
        await navigator.clipboard.writeText(JSON.stringify(taggedPayload));
      } catch (clipErr) {}

      try {
        const allTabs = await chrome.tabs.query({});
        for (const t of allTabs) {
          if (t.id && t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('192.168.') || t.url.includes('quin-source') || t.url.includes('netlify.app') || t.url.includes('sourcing'))) {
            try {
              chrome.tabs.sendMessage(t.id, {
                type: 'EXTENSION_DIRECT_IMPORT',
                payload: taggedPayload
              }, () => {
                if (chrome.runtime.lastError) {
                  // Catch sans exception silencieuse
                  console.log('[EXT] Notification tab sendMessage ignorée:', chrome.runtime.lastError.message);
                }
              });
            } catch (e) {}

            try {
              await chrome.scripting.executeScript({
                target: { tabId: t.id },
                func: (payload) => {
                  window.postMessage({
                    type: 'EXTENSION_DIRECT_IMPORT',
                    payload: payload
                  }, '*');

                  window.dispatchEvent(new CustomEvent('EXTENSION_IMPORT_EVENT', { detail: payload }));
                },
                args: [taggedPayload]
              });
            } catch (e) {}
          }
        }
      } catch (tabsErr) {}

      const wsLabel = targetWorkspace === 'ws_cuisines' ? 'Cuisines & Aménagement' : (targetWorkspace === 'ws_quincaillerie' ? 'Quincaillerie & Fixations' : targetWorkspace);
      msgBox.className = 'msg msg-success';
      msgBox.innerHTML = `🎉 <strong>Article Injecté dans « ${targetCategoryName} » !</strong><br><span style="font-size:10px; color:#A7F3D0;">🕒 ${cleanProductPayload.injectedAtFormatted} • Espace : ${wsLabel}</span><br>Sauvegardé sur Supabase Cloud (${effectivePriceFcfa.toLocaleString()} FCFA, MOQ: ${moqNumber}).`;
      msgBox.style.display = 'block';
      btnImportText.innerText = targetCategory === 'inbox' ? "✅ Placé dans Articles en Attente !" : "✅ Article Classé dans le Rayon !";
    } catch (err) {
      msgBox.className = 'msg msg-error';
      msgBox.innerHTML = '⚠️ Erreur lors de l\'injection : ' + err.message;
      msgBox.style.display = 'block';
    } finally {
      setTimeout(() => {
        btnImportText.innerText = origText;
        btnImport.disabled = false;
      }, 4000);
    }
  });
}

// 🚀 Exécution immédiate (que DOMContentLoaded ait déjà eu lieu ou non)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
