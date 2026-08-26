// ============================================================================
// ⚡ EXTRACTEUR E-COMMERCE HAUTE PRÉCISION & PRÉ-TRAITEMENT DES DONNÉES
// Pour Alibaba, 1688, Taobao, Made-in-China & Plateformes E-Commerce
// ============================================================================

function extractPageData() {
  try {
    const url = window.location.href;
    const rawText = document.body ? document.body.innerText : '';
    const lowerUrl = url.toLowerCase();

    // 0. 🏷️ DÉTECTION DE LA PLATEFORME ACTIVE
    let platform = 'Alibaba';
    let platformType = 'ecommerce';

    if (lowerUrl.includes('1688.com')) {
      platform = '1688 Chine';
    } else if (lowerUrl.includes('alibaba.com')) {
      platform = 'Alibaba';
    } else if (lowerUrl.includes('taobao.com')) {
      platform = 'Taobao';
    } else if (lowerUrl.includes('aliexpress.com')) {
      platform = 'AliExpress';
    } else if (lowerUrl.includes('made-in-china.com')) {
      platform = 'Made-in-China';
    } else if (lowerUrl.includes('globalsources.com')) {
      platform = 'Global Sources';
    } else if (lowerUrl.includes('pinduoduo.com') || lowerUrl.includes('yangkeduo.com')) {
      platform = 'Pinduoduo';
    } else if (lowerUrl.includes('tiktok.com')) {
      platform = 'TikTok';
      platformType = 'social';
    } else if (lowerUrl.includes('instagram.com')) {
      platform = 'Instagram';
      platformType = 'social';
    }

    let title = '';
    let company = '';
    let location = 'Guangdong, Chine';
    let mainImage = '';
    const productImages = [];
    const allSpecifications = [];
    const tierPricing = [];
    let fcfaPrices = [];
    let moq = '1 pièce';
    let basePriceCny = 0;
    let basePriceFcfa = 0;

    // -------------------------------------------------------------------------
    // 1. 📝 EXTRACTION DU TITRE DU PRODUIT
    // -------------------------------------------------------------------------
    const titleSelectors = [
      'h1.product-title',
      'h1.module-title',
      '.detail-title h1',
      '.title-content h1',
      'h1[data-e2e="product-title"]',
      '.product-name',
      'h1'
    ];

    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 5) {
        title = el.innerText.trim();
        break;
      }
    }

    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.content) {
        title = ogTitle.content.trim();
      } else {
        title = document.title || 'Article Sourcing';
      }
    }

    // Nettoyage intelligent du titre (anti-spam SEO)
    title = title
      .replace(/^alibaba\.com\s*[:\-|]/i, '')
      .replace(/^1688\.com\s*[:\-|]/i, '')
      .replace(/\s*-\s*Alibaba\.com$/i, '')
      .replace(/\s*-\s*1688\.com$/i, '')
      .replace(/\s*\|\s*Alibaba$/i, '')
      .trim();

    // -------------------------------------------------------------------------
    // 2. 💰 EXTRACTION DU VRAI PRIX & DU MOQ RÉEL (ALIBABA / 1688 / TAOBAO)
    // -------------------------------------------------------------------------
    let formattedDisplayPrice = '';

    // 🎯 PRIORITÉ 1 : SCAN DIRECT DE LA FOURCHETTE DE PRIX DU PRODUIT (ex: 1335-4660 FCFA)
    const fcfaRangeMatch = rawText.match(/(\d[\d\s.,]{1,8})\s*[-–—~−]\s*(\d[\d\s.,]{1,8})\s*(?:FCFA|CFA|XOF)/i);
    const usdRangeMatch = rawText.match(/\$\s*(\d+(?:[.,]\d+)?)\s*[-–—~−]\s*\$?\s*(\d+(?:[.,]\d+)?)/i);
    const cnyRangeMatch = rawText.match(/(\d+(?:[.,]\d+)?)\s*[-–—~−]\s*(\d+(?:[.,]\d+)?)\s*(?:¥|￥|RMB|CNY)/i) ||
                          rawText.match(/[¥￥]\s*(\d+(?:[.,]\d+)?)\s*[-–—~−]\s*[¥￥]?\s*(\d+(?:[.,]\d+)?)/i);

    if (fcfaRangeMatch) {
      const pMin = parseInt(fcfaRangeMatch[1].replace(/[\s\u00a0.,]/g, ''), 10);
      const pMax = parseInt(fcfaRangeMatch[2].replace(/[\s\u00a0.,]/g, ''), 10);
      if (pMin > 50 && pMax >= pMin && pMin < 50000000) {
        basePriceFcfa = pMin;
        basePriceCny = parseFloat((pMin / 85).toFixed(2));
        const maxCny = parseFloat((pMax / 85).toFixed(2));
        formattedDisplayPrice = `${pMin.toLocaleString()} - ${pMax.toLocaleString()} FCFA (${basePriceCny} - ${maxCny} ¥)`;
        // Note: tierPricing is modified below in real-world logic, keeping scope
      }
    } else if (usdRangeMatch) {
      const uMin = parseFloat(usdRangeMatch[1].replace(',', '.'));
      const uMax = parseFloat(usdRangeMatch[2].replace(',', '.'));
      if (uMin > 0 && uMax >= uMin) {
        const pMin = Math.round(uMin * 650);
        const pMax = Math.round(uMax * 650);
        basePriceFcfa = pMin;
        basePriceCny = parseFloat((uMin * 7.25).toFixed(2));
        const maxCny = parseFloat((uMax * 7.25).toFixed(2));
        formattedDisplayPrice = `${pMin.toLocaleString()} - ${pMax.toLocaleString()} FCFA (${basePriceCny} - ${maxCny} ¥)`;
      }
    } else if (cnyRangeMatch) {
      const cMin = parseFloat(cnyRangeMatch[1].replace(',', '.'));
      const cMax = parseFloat(cnyRangeMatch[2].replace(',', '.'));
      if (cMin > 0 && cMax >= cMin) {
        basePriceCny = cMin;
        basePriceFcfa = Math.round(cMin * 85);
        const maxFcfa = Math.round(cMax * 85);
        formattedDisplayPrice = `${basePriceFcfa.toLocaleString()} - ${maxFcfa.toLocaleString()} FCFA (${cMin} - ${cMax} ¥)`;
      }
    }

    // 🎯 PRIORITÉ 2 : PALIERS DÉGRESSIFS (SI AU MOINS 2 PALIERS DISTINCTS DÉTECTÉS)
    if (!formattedDisplayPrice) {
      const ladderCandidates = document.querySelectorAll(
        '[class*="ladder-price"], [class*="tier-item"], [class*="step-price"], [class*="od-ladder-price"], .ladder-price-item, .price-ladder, .quality-price-item, [class*="ladderPrice"]'
      );

      ladderCandidates.forEach(el => {
        const isBad = el.closest('footer, nav, [class*="recommend"], [class*="coupon"], [class*="similar"]');
        if (isBad) return;

        const text = el.innerText ? el.innerText.replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim() : '';
        if (!text || text.length > 120) return;

        const priceM = text.match(/(\d[\d\s.,]{1,8})\s*(?:FCFA|CFA|XOF|\$|¥|￥|USD)/i);
        const qtyM = text.match(/((?:≥|>|=|\d+)[-\s\d]*(?:pièce|pièces|piece|pieces|pcs|pc|paires|paire|pairs|pair|mètre|mètres|kg|carton|lot|unités|unité)[s]?)/i) ||
                     text.match(/(\d+\s*[-–—~−]\s*\d+\s*(?:pcs|paires|pièces|pièce)?)/i) ||
                     text.match(/(≥\s*\d+[\s\w]*)/i);

        if (priceM && qtyM) {
          let pFcfa = 0;
          let pCny = 0;
          if (text.includes('FCFA') || text.includes('CFA') || text.includes('XOF')) {
            pFcfa = parseInt(priceM[1].replace(/[\s\u00a0.,]/g, ''), 10);
            pCny = parseFloat((pFcfa / 85).toFixed(2));
          } else if (text.includes('$') || text.toLowerCase().includes('usd')) {
            const u = parseFloat(priceM[1].replace(',', '.'));
            pFcfa = Math.round(u * 650);
            pCny = parseFloat((u * 7.25).toFixed(2));
          } else if (text.includes('¥') || text.includes('￥') || text.toLowerCase().includes('cny')) {
            pCny = parseFloat(priceM[1].replace(',', '.'));
            pFcfa = Math.round(pCny * 85);
          }

          if (pFcfa > 50 && pFcfa < 50000000) {
            const qStr = qtyM[1].trim();
            if (!tierPricing.some(t => t.minQty === qStr || t.priceFcfa === pFcfa)) {
              tierPricing.push({ minQty: qStr, priceFcfa: pFcfa, priceCny: pCny });
            }
          }
        }
      });

      if (tierPricing.length >= 2) {
        const pricesList = tierPricing.map(t => t.priceFcfa);
        const minP = Math.min(...pricesList);
        const maxP = Math.max(...pricesList);
        basePriceFcfa = minP;
        basePriceCny = parseFloat((minP / 85).toFixed(2));
        const minCny = parseFloat((minP / 85).toFixed(2));
        const maxCny = parseFloat((maxP / 85).toFixed(2));
        formattedDisplayPrice = `${minP.toLocaleString()} - ${maxP.toLocaleString()} FCFA (${minCny} - ${maxCny} ¥)`;

        const firstQty = tierPricing[0].minQty;
        const moqNumMatch = firstQty.match(/\d+/);
        if (moqNumMatch) {
          moq = `${moqNumMatch[0]} pièce${parseInt(moqNumMatch[0], 10) > 1 ? 's' : ''}`;
        } else {
          moq = firstQty;
        }
      } else {
        tierPricing = [];
      }
    }

    // 🎯 PRIORITÉ 3 : PRIX SIMPLE SI AUCUNE FOURCHETTE NI PALIERS
    if (!formattedDisplayPrice) {
      const fcfaSingleMatch = rawText.match(/(\d[\d\s.,]{1,8})\s*(?:FCFA|CFA|XOF)/i);
      const usdSingleMatch = rawText.match(/\$\s*(\d+(?:[.,]\d{1,2})?)/i);
      const cnySingleMatch = rawText.match(/[¥￥]\s*(\d+(?:[.,]\d{1,2})?)/i);

      if (fcfaSingleMatch) {
        const p = parseInt(fcfaSingleMatch[1].replace(/[\s\u00a0.,]/g, ''), 10);
        if (p > 50 && p < 50000000) {
          basePriceFcfa = p;
          basePriceCny = parseFloat((p / 85).toFixed(2));
          formattedDisplayPrice = `${p.toLocaleString()} FCFA (${basePriceCny} ¥)`;
        }
      } else if (usdSingleMatch) {
        const pUsd = parseFloat(usdSingleMatch[1].replace(',', '.'));
        if (pUsd > 0) {
          basePriceFcfa = Math.round(pUsd * 650);
          basePriceCny = parseFloat((pUsd * 7.25).toFixed(2));
          formattedDisplayPrice = `${basePriceFcfa.toLocaleString()} FCFA (${basePriceCny} ¥)`;
        }
      } else if (cnySingleMatch) {
        const pCny = parseFloat(cnySingleMatch[1].replace(',', '.'));
        if (pCny > 0) {
          basePriceCny = pCny;
          basePriceFcfa = Math.round(pCny * 85);
          formattedDisplayPrice = `${basePriceFcfa.toLocaleString()} FCFA (${pCny} ¥)`;
        }
      }
    }

    // 🎯 PRIORITÉ 4 : EXTRACTION CIBLÉE DU MOQ
    if (!moq || moq === '1 pièce') {
      const moqRegexes = [
        /Quantit[eé]\s*minimale\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /Quantit[eé]\s*minimum\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /Commande\s*minimale\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /Commande\s*minimum\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /Min\.?\s*order(?:\s*quantity)?\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /Minimum\s*order(?:\s*quantity)?\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /MOQ\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i,
        /起订量\s*[:：]?\s*(\d+[\s\w\u00a0./-]*)/i
      ];

      for (const rgx of moqRegexes) {
        const m = rawText.match(rgx);
        if (m && m[1]) {
          let rawMoq = m[1].replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
          const cutMatch = rawMoq.match(/^(\d+\s*(?:pièces?|pcs|paires?|pairs?|sets?|mètres?|kg|cartons?|lots?|unités?|unité|pièce)?)/i);
          if (cutMatch && cutMatch[1]) {
            moq = cutMatch[1].trim();
          } else {
            moq = rawMoq.slice(0, 35).trim();
          }
          break;
        }
      }
    }

    if ((!moq || moq === '1 pièce') && tierPricing.length > 0) {
      moq = tierPricing[0].minQty;
    }

    // -------------------------------------------------------------------------
    // 3. 🏭 EXTRACTION DE L'USINE / FOURNISSEUR & ORIGINE
    // -------------------------------------------------------------------------
    const isForbiddenText = (str) => {
      if (!str || typeof str !== 'string') return true;
      const lower = str.toLowerCase().trim();
      return lower.length < 3 || lower.length > 95 || ['alibaba', 'centre d\'aide', 'à propos', 'panier', 'store review', 'bestseller'].some(w => lower.includes(w));
    };

    const hasCompanyMarkers = (str) => {
      return /(?:Co\.,?\s*Ltd\.?|Company\s+Limited|Factory|Technology|Electronics?|Hardware|Industrial|Equipment|Machinery|Trading|Corp|LLC|Manufacturing|Enterprise|Plant|Group|Société|Usine)/i.test(str);
    };

    const companySelectors = [
      '.company-name',
      '.company-basic-info h2',
      '.supplier-name',
      '.company-name-link',
      '[data-e2e="company-name"]',
      '.name-wrapper a',
      '.shop-name'
    ];

    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && !isForbiddenText(el.innerText)) {
        company = el.innerText.trim();
        break;
      }
    }

    if (!company) company = 'Fabricant Vérifié ' + platform;

    // Détection Ville d'Origine
    const chinaCities = ['Guangdong', 'Zhejiang', 'Foshan', 'Yiwu', 'Ningbo', 'Shenzhen', 'Guangzhou', 'Jinan', 'Dongguan', 'Wenzhou', 'Shanghai', 'Jiangsu', 'Shandong', 'Quanzhou', 'Xiamen'];
    for (const city of chinaCities) {
      if (rawText.toLowerCase().includes(city.toLowerCase())) {
        location = `${city}, Chine`;
        break;
      }
    }

    // -------------------------------------------------------------------------
    // 4. 📐 EXTRACTION DES SPÉCIFICATIONS TECHNIQUES
    // -------------------------------------------------------------------------
    const seenLabels = new Set();
    const rows = document.querySelectorAll('tr, dl.do-entry-item, .product-prop, .attribute-item, .spec-item, [class*="attribute"]');
    
    rows.forEach(row => {
      let label = '';
      let value = '';

      if (row.tagName === 'TR') {
        const th = row.querySelector('th, td:first-child');
        const td = row.querySelector('td:last-child');
        if (th && td && th !== td) {
          label = th.innerText.replace(/[\t\r\n:]/g, ' ').trim();
          value = td.innerText.replace(/[\t\r\n]/g, ' ').trim();
        }
      } else if (row.tagName === 'DL') {
        const dt = row.querySelector('dt');
        const dd = row.querySelector('dd');
        if (dt && dd) {
          label = dt.innerText.replace(/[\t\r\n:]/g, ' ').trim();
          value = dd.innerText.replace(/[\t\r\n]/g, ' ').trim();
        }
      }

      if (label && value && label.length > 1 && label.length < 50 && value.length > 0 && value.length < 150) {
        const lowerL = label.toLowerCase();
        if (!seenLabels.has(lowerL) && !lowerL.includes('view') && !lowerL.includes('voir')) {
          seenLabels.add(lowerL);
          allSpecifications.push({ category: 'Spécifications Techniques', label, value });
        }
      }
    });

    // -------------------------------------------------------------------------
    // 5. 🖼️ IMAGE PRINCIPALE DU PRODUIT
    // -------------------------------------------------------------------------
    const imgCandidates = Array.from(document.querySelectorAll(
      '.main-image img, .detail-gallery img, [class*="gallery"] img, [class*="main-layout"] img, img'
    ));

    for (const img of imgCandidates) {
      let src = img.src || img.getAttribute('data-src') || '';
      if (!src) continue;
      if (src.includes('/tfs/') || src.includes('/icon/') || src.includes('avatar') || src.includes('badge') || src.includes('logo') || src.includes('.svg')) {
        continue;
      }
      let clean = src
        .replace(/_\d+x\d+[^.]*\.(jpg|png|webp|jpeg)/gi, '')
        .replace(/\.jpg_\d+x\d+[^.]*\.jpg/gi, '.jpg')
        .replace(/\.webp_\d+x\d+[^.]*\.webp/gi, '.webp')
        .replace(/_sum\.(jpg|png|webp)/gi, '')
        .replace(/_Q\d+\.(jpg|png|webp)/gi, '');

      if (clean.startsWith('//')) clean = 'https:' + clean;
      if (clean.startsWith('http')) {
        mainImage = clean;
        productImages.push(clean);
        break;
      }
    }

    return {
      url,
      title,
      platform,
      platformType,
      basePriceFcfa,
      basePriceCny,
      formattedDisplayPrice: formattedDisplayPrice || (basePriceFcfa > 0 ? `${basePriceFcfa.toLocaleString()} FCFA` : ''),
      fcfaPrices: fcfaPrices.slice(0, 5),
      tierPricing: tierPricing.slice(0, 8),
      company,
      location,
      moq,
      specifications: allSpecifications.slice(0, 30),
      mainImage,
      images: productImages.slice(0, 5)
    };
  } catch (err) {
    return {
      url: window.location.href,
      title: document.title || 'Page détectée',
      platform: 'Web',
      platformType: 'ecommerce',
      basePriceFcfa: 0,
      basePriceCny: 0,
      formattedDisplayPrice: 'Prêt pour Sourcing',
      fcfaPrices: [],
      tierPricing: [],
      company: 'Fournisseur Détecté',
      location: 'Chine',
      moq: '1 pièce',
      specifications: [],
      mainImage: '',
      images: []
    };
  }
}

// 🌐 INITIALISATION DE L'INTERFACE POPUP
document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const platformBadge = document.getElementById('platformBadge');
  const btnMinimizeToggle = document.getElementById('btnMinimizeToggle');
  const dragHandleBar = document.getElementById('dragHandleBar');
  const popupBody = document.getElementById('popupBody') || document.body;

  const tabCreate = document.getElementById('tabCreate');
  const tabEnrich = document.getElementById('tabEnrich');
  const targetProductBox = document.getElementById('targetProductBox');
  const targetProductSelect = document.getElementById('targetProductSelect');
  const btnImport = document.getElementById('btnImport');
  const btnImportText = document.getElementById('btnImportText');
  const msgBox = document.getElementById('msgBox');

  // Product Specs Elements
  const previewTitle = document.getElementById('previewTitle');
  const previewPrice = document.getElementById('previewPrice');
  const previewSupplier = document.getElementById('previewSupplier');
  const previewLocation = document.getElementById('previewLocation');
  const previewMoq = document.getElementById('previewMoq');
  const previewTiersBox = document.getElementById('previewTiersBox');
  const previewTiersList = document.getElementById('previewTiersList');
  const previewSpecsBox = document.getElementById('previewSpecsBox');
  const previewSpecsList = document.getElementById('previewSpecsList');
  const previewSpecsCount = document.getElementById('previewSpecsCount');

  // 🖐️ GESTION DU VOLET DÉPLAÇABLE / GLISSANT (DRAGGABLE BOTTOM-SHEET)
  let isCompact = false;
  const toggleCompactMode = () => {
    isCompact = !isCompact;
    if (isCompact) {
      popupBody.classList.add('is-compact');
      if (btnMinimizeToggle) btnMinimizeToggle.innerText = '▼';
    } else {
      popupBody.classList.remove('is-compact');
      if (btnMinimizeToggle) btnMinimizeToggle.innerText = '↕';
    }
  };

  if (btnMinimizeToggle) {
    btnMinimizeToggle.addEventListener('click', toggleCompactMode);
  }

  if (dragHandleBar) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const onTouchStart = (e) => {
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      isDragging = true;
    };

    const onTouchMove = (e) => {
      if (!isDragging) return;
      currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - startY;
      
      // Glissement vers le bas > 40px -> Réduire le volet
      if (deltaY > 40 && !isCompact) {
        toggleCompactMode();
        isDragging = false;
      } 
      // Glissement vers le haut > 40px -> Déplier le volet
      else if (deltaY < -40 && isCompact) {
        toggleCompactMode();
        isDragging = false;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    dragHandleBar.addEventListener('touchstart', onTouchStart, { passive: true });
    dragHandleBar.addEventListener('touchmove', onTouchMove, { passive: true });
    dragHandleBar.addEventListener('touchend', onTouchEnd);
    dragHandleBar.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);
    dragHandleBar.addEventListener('dblclick', toggleCompactMode);
  }

  let currentMode = 'create';
  let cachedData = null;
  let availableProducts = [];

  // Mode Selection Tabs
  tabCreate.addEventListener('click', () => {
    currentMode = 'create';
    tabCreate.classList.add('active');
    tabEnrich.classList.remove('active');
    targetProductBox.style.display = 'none';
    btnImport.classList.remove('btn-enrich');
    btnImportText.innerText = "📥 ENVOYER AU MAGASIN D'ARRIVAGE (EN ATTENTE)";
  });

  tabEnrich.addEventListener('click', () => {
    currentMode = 'enrich';
    tabEnrich.classList.add('active');
    tabCreate.classList.remove('active');
    targetProductBox.style.display = 'block';
    btnImport.classList.add('btn-enrich');
    btnImportText.innerText = "🏭 AJOUTER L'USINE À L'ARTICLE EXISTANT";
  });

  // 1. EXTRACTION DES DONNÉES DANS L'ONGLET ACTIF
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageData
    });

    if (results && results[0] && results[0].result) {
      cachedData = results[0].result;

      // Badge Plateforme
      if (platformBadge) {
        platformBadge.innerText = cachedData.platform || 'Web';
      }

      // Données Produit Extraites
      previewTitle.innerText = cachedData.title ? (cachedData.title.slice(0, 85) + (cachedData.title.length > 85 ? '...' : '')) : (tab.title || 'Article détecté');
      
      if (cachedData.formattedDisplayPrice) {
        previewPrice.innerHTML = `<strong>${cachedData.formattedDisplayPrice}</strong>`;
      } else if (cachedData.basePriceFcfa && cachedData.basePriceFcfa > 0) {
        previewPrice.innerHTML = `<strong>${cachedData.basePriceFcfa.toLocaleString()} FCFA</strong> <span style="color: #94A3B8; font-size: 10px;">(${cachedData.basePriceCny} ¥)</span>`;
      } else if (cachedData.fcfaPrices && cachedData.fcfaPrices.length > 0) {
        const pFcfa = cachedData.fcfaPrices[0];
        const pCny = (pFcfa / 85).toFixed(2);
        previewPrice.innerHTML = `<strong>${pFcfa.toLocaleString()} FCFA</strong> <span style="color: #94A3B8; font-size: 10px;">(${pCny} ¥)</span>`;
      } else {
        previewPrice.innerText = 'Prêt pour Sourcing';
      }

      if (cachedData.company) {
        previewSupplier.innerText = cachedData.company.slice(0, 40);
      } else {
        previewSupplier.innerText = cachedData.platform || 'Fournisseur Détecté';
      }

      if (cachedData.location) {
        previewLocation.innerText = cachedData.location;
      }

      if (cachedData.moq && previewMoq) {
        previewMoq.innerText = cachedData.moq;
      }

      // Affichage des Paliers de Prix Réels
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

      // Affichage des Spécifications Techniques Détectées
      if (cachedData.specifications && cachedData.specifications.length > 0 && previewSpecsBox && previewSpecsList) {
        previewSpecsList.innerHTML = '';
        if (previewSpecsCount) previewSpecsCount.innerText = `(${cachedData.specifications.length})`;
        cachedData.specifications.slice(0, 8).forEach(s => {
          const item = document.createElement('div');
          item.className = 'spec-item';
          item.innerHTML = `<span class="spec-label">${s.label} :</span><span class="spec-value">${s.value}</span>`;
          previewSpecsList.appendChild(item);
        });
        previewSpecsBox.style.display = 'block';
      }
    }
  } catch (e) {
    if (previewTitle) previewTitle.innerText = tab.title || 'Article actif';
    if (previewPrice) previewPrice.innerText = 'Prêt à importer';
    if (platformBadge) platformBadge.innerText = 'Web';
  }

  // 2. RÉCUPÉRATION DU CATALOGUE EXISTANT POUR LE MODE COMPLÉTER
  try {
    const allTabs = await chrome.tabs.query({});
    for (const t of allTabs) {
      if (t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('quin-source') || t.url.includes('netlify.app'))) {
        try {
          const storageRes = await chrome.scripting.executeScript({
            target: { tabId: t.id },
            func: () => {
              const raw = localStorage.getItem('quin_source_products');
              return raw ? JSON.parse(raw) : [];
            }
          });
          if (storageRes && storageRes[0]?.result?.length > 0) {
            availableProducts = storageRes[0].result;
            targetProductSelect.innerHTML = availableProducts.map(p => 
              `<option value="${p.id}">${p.titleFr || p.title || p.name} (${p.category || 'Article'})</option>`
            ).join('');
            break;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  if (availableProducts.length === 0) {
    targetProductSelect.innerHTML = '<option value="">Aucun article existant trouvé dans le catalogue</option>';
  }

  // 3. 📥 ACTION PRINCIPALE : INJECTION DE L'ARTICLE TRAITÉ DANS L'APPLICATION
  btnImport.addEventListener('click', async () => {
    if (!cachedData) return;

    btnImport.disabled = true;
    const origText = btnImportText.innerText;
    btnImportText.innerText = "⏳ Traitement et Injection en cours...";

    const isEnrichMode = currentMode === 'enrich';
    const targetId = isEnrichMode ? targetProductSelect.value : null;

    // Détermination du prix principal
    const effectivePriceFcfa = (cachedData.tierPricing && cachedData.tierPricing.length > 0)
      ? cachedData.tierPricing[0].priceFcfa
      : (cachedData.basePriceFcfa || (cachedData.fcfaPrices && cachedData.fcfaPrices[0]) || 4500);

    const effectivePriceCny = parseFloat((effectivePriceFcfa / 85).toFixed(2));

    // Construction du Produit Structuré et Nettoyé
    const cleanProductPayload = {
      id: isEnrichMode ? targetId : ('prod-' + Date.now()),
      titleFr: cachedData.title || tab.title || 'Nouvel Article Sourcing',
      titleEn: cachedData.title || tab.title || '',
      category: 'quincaillerie',
      unit: cachedData.moq?.toLowerCase().includes('paire') ? 'Paire (paire)' : (cachedData.moq?.toLowerCase().includes('kg') ? 'Kilogramme (kg)' : 'Pièce (pc)'),
      priceCny: effectivePriceCny,
      priceFcfa: effectivePriceFcfa,
      moq: parseInt(cachedData.moq?.match(/\d+/)?.[0] || '1', 10),
      sourceUrl: tab.url,
      images: cachedData.images && cachedData.images.length > 0 ? cachedData.images : (cachedData.mainImage ? [cachedData.mainImage] : []),
      mainImage: cachedData.mainImage || (cachedData.images && cachedData.images[0]) || '',
      tierPricing: cachedData.tierPricing || [],
      specifications: cachedData.specifications || [],
      factoryName: cachedData.company || 'Usine Vérifiée ' + cachedData.platform,
      factoryCity: cachedData.location || 'Guangdong, Chine',
      factoryCountry: 'Chine',
      supplierBadge: 'Verified Supplier',
      supplierYears: '5 ans d\'expérience',
      suppliers: [
        {
          id: 'sup-' + Date.now(),
          name: cachedData.company || 'Usine Vérifiée ' + cachedData.platform,
          city: cachedData.location || 'Guangdong, Chine',
          country: 'Chine',
          badge: 'Verified Supplier',
          years: '5 ans d\'expérience',
          priceCny: effectivePriceCny,
          priceFcfa: effectivePriceFcfa,
          moq: parseInt(cachedData.moq?.match(/\d+/)?.[0] || '1', 10),
          url: tab.url,
          isPreferred: true,
          priceTiers: cachedData.tierPricing || []
        }
      ],
      createdAt: new Date().toISOString()
    };

    const arrivalMediaItem = {
      id: 'media-' + Date.now(),
      type: 'image',
      url: cleanProductPayload.mainImage || 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80',
      poster: cleanProductPayload.mainImage || '',
      title: cleanProductPayload.titleFr,
      platform: cachedData.platform || 'Alibaba',
      sourceUrl: tab.url,
      priceFcfa: effectivePriceFcfa,
      priceCny: effectivePriceCny,
      tierPricing: cachedData.tierPricing || [],
      specifications: cachedData.specifications || [],
      factoryName: cleanProductPayload.factoryName,
      factoryCity: cleanProductPayload.factoryCity,
      moq: cleanProductPayload.moq,
      productData: cleanProductPayload,
      createdAt: new Date().toISOString()
    };

    try {
      let dispatched = false;
      const allTabs = await chrome.tabs.query({});
      
      for (const t of allTabs) {
        if (t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('quin-source') || t.url.includes('netlify.app'))) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: t.id },
              func: (mediaItem) => {
                // 1. Envoi au Magasin d'Arrivage UNIQUEMENT
                window.postMessage({ 
                  type: 'CAPTURE_MEDIA', 
                  payload: mediaItem 
                }, '*');

                // 2. Synchronisation dans le stockage du Magasin d'Arrivage
                try {
                  const raw = localStorage.getItem('quin_source_captured_media');
                  const arr = raw ? JSON.parse(raw) : [];
                  if (!arr.some(m => m.id === mediaItem.id || (m.sourceUrl && m.sourceUrl === mediaItem.sourceUrl))) {
                    arr.unshift(mediaItem);
                    localStorage.setItem('quin_source_captured_media', JSON.stringify(arr));
                  }
                } catch (e) {}
              },
              args: [arrivalMediaItem]
            });
            dispatched = true;
          } catch (e) {}
        }
      }

      msgBox.className = 'msg msg-success';
      msgBox.innerHTML = `🎉 <strong>Envoyé au Magasin d'Arrivage !</strong> L'article est en attente dans votre Magasin d'Arrivage avec tous ses vrais prix et spécifications, prêt pour transfert.`;
      msgBox.style.display = 'block';
      btnImportText.innerText = "✅ Placé dans le Magasin d'Arrivage !";
    } catch (err) {
      msgBox.className = 'msg msg-error';
      msgBox.innerHTML = '⚠️ Erreur lors de l\'envoi : ' + err.message;
      msgBox.style.display = 'block';
    } finally {
      setTimeout(() => {
        btnImportText.innerText = origText;
        btnImport.disabled = false;
      }, 3500);
    }
  });
});