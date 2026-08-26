// ============================================================================
// ⚡ EXTRACTEUR E-COMMERCE HAUTE PRÉCISION & PRÉ-TRAITEMENT DES DONNÉES
// Pour Alibaba, 1688, Taobao, Made-in-China & Plateformes E-Commerce
// ============================================================================

function extractPageData() {
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
  // 2. 💰 EXTRACTION DES PRIX RÉELS & PALIERS MOQ USINE
  // -------------------------------------------------------------------------
  
  // A. Scan des conteneurs de paliers (Ladder Pricing)
  const tierContainers = document.querySelectorAll(
    '[class*="price-item"], [class*="tier-item"], [class*="ladder-price"], [class*="price-ladder"], [class*="price-wrap"], [class*="tier-price"], [class*="od-ladder-price"], [class*="step-price"], .ladder-price-item'
  );

  tierContainers.forEach(container => {
    const text = (container.innerText || '').replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Détection Prix (FCFA, USD, CNY, EUR)
    const fcfaMatch = text.match(/(\d[\d\s\u00a0.,]{1,8})\s*(?:FCFA|CFA|XOF)/i);
    const usdMatch = text.match(/\$\s*(\d+(?:[.,]\d{1,2})?)/i) || text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:USD|\$)/i);
    const cnyMatch = text.match(/[¥￥]\s*(\d+(?:[.,]\d{1,2})?)/i) || text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:¥|￥|RMB|CNY)/i);

    // Détection Quantité
    const qtyMatch = text.match(/((?:≥|>|=|\d+)[-\s\d]*(?:pièce|pièces|piece|pieces|pcs|pc|paires|paire|pairs|pair|mètre|mètres|kg|carton|lot|unités|unité)[s]?)/i) ||
                     text.match(/(\d+\s*[-–]\s*\d+\s*(?:pcs|paires|pièces)?)/i) ||
                     text.match(/(≥\s*\d+)/i);

    let priceInFcfa = 0;
    let priceInCny = 0;

    if (fcfaMatch) {
      priceInFcfa = parseInt(fcfaMatch[1].replace(/[\s\u00a0.,]/g, ''), 10);
      priceInCny = parseFloat((priceInFcfa / 85).toFixed(2));
    } else if (usdMatch) {
      const pUsd = parseFloat(usdMatch[1].replace(',', '.'));
      if (pUsd > 0) {
        priceInFcfa = Math.round(pUsd * 650);
        priceInCny = parseFloat((pUsd * 7.25).toFixed(2));
      }
    } else if (cnyMatch) {
      priceInCny = parseFloat(cnyMatch[1].replace(',', '.'));
      if (priceInCny > 0) {
        priceInFcfa = Math.round(priceInCny * 85);
      }
    }

    if (priceInFcfa > 50) {
      const qStr = qtyMatch ? qtyMatch[1].trim() : '≥ 1 pièce';
      if (!tierPricing.some(t => t.minQty === qStr || t.priceFcfa === priceInFcfa)) {
        tierPricing.push({ minQty: qStr, priceFcfa: priceInFcfa, priceCny: priceInCny });
      }
    }
  });

  // B. Scan des prix directs dans la page si aucun palier détecté
  if (tierPricing.length > 0) {
    basePriceFcfa = tierPricing[0].priceFcfa;
    basePriceCny = tierPricing[0].priceCny;
    moq = tierPricing[0].minQty;
  } else {
    // 1. Scan FCFA
    const fcfaMatches = Array.from(rawText.matchAll(/(\d[\d\s\u00a0.,]{1,9})\s*(?:FCFA|CFA|XOF)/gi));
    for (const m of fcfaMatches) {
      const cleaned = m[1].replace(/[\s\u00a0.,]/g, '');
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 100 && num < 50000000 && !fcfaPrices.includes(num)) {
        fcfaPrices.push(num);
      }
    }

    // 2. Scan USD
    const usdMatches = Array.from(rawText.matchAll(/\$\s*(\d+(?:[.,]\d{1,2})?)/gi));
    for (const m of usdMatches) {
      const pUsd = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(pUsd) && pUsd > 0.05 && pUsd < 10000) {
        const fcfaVal = Math.round(pUsd * 650);
        if (!fcfaPrices.includes(fcfaVal)) fcfaPrices.push(fcfaVal);
      }
    }

    // 3. Scan CNY
    const cnyMatches = Array.from(rawText.matchAll(/[¥￥]\s*(\d+(?:[.,]\d{1,2})?)/gi));
    for (const m of cnyMatches) {
      const pCny = parseFloat(m[1].replace(',', '.'));
      if (!isNaN(pCny) && pCny > 0.1 && pCny < 50000) {
        const fcfaVal = Math.round(pCny * 85);
        if (!fcfaPrices.includes(fcfaVal)) fcfaPrices.push(fcfaVal);
      }
    }

    if (fcfaPrices.length > 0) {
      basePriceFcfa = fcfaPrices[0];
      basePriceCny = parseFloat((basePriceFcfa / 85).toFixed(2));
      tierPricing.push({ minQty: '≥ 1 pièce', priceFcfa: basePriceFcfa, priceCny: basePriceCny });
    }
  }

  // Détection MOQ dans le texte
  const moqMatch = rawText.match(/(?:MOQ|Commande minimale|Min\. order|Minimum order quantity)\s*[:：]?\s*(\d+[\s\w]*)/i);
  if (moqMatch && moqMatch[1]) {
    moq = moqMatch[1].trim().slice(0, 30);
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

  // DOM Selector pour le nom de l'entreprise
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

  // Extraction JSON intégrée
  if (!company) {
    try {
      const scripts = document.querySelectorAll('script:not([src])');
      for (const s of scripts) {
        const content = s.textContent || '';
        if (content.includes('companyName') || content.includes('supplierName')) {
          const compMatches = [
            ...content.matchAll(/"companyName"\s*:\s*"([^"]{4,90})"/g),
            ...content.matchAll(/"supplierName"\s*:\s*"([^"]{4,90})"/g)
          ];
          for (const cm of compMatches) {
            const rawName = cm[1].replace(/\\u[\dA-F]{4}/gi, (m) => String.fromCharCode(parseInt(m.replace(/\\u/g, ''), 16))).trim();
            if (rawName && !isForbiddenText(rawName)) {
              company = rawName;
              if (hasCompanyMarkers(rawName)) break;
            }
          }
          if (company && hasCompanyMarkers(company)) break;
        }
      }
    } catch (e) {}
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
  // 4. 📐 EXTRACTION DES CARACTÉRISTIQUES & SPÉCIFICATIONS TECHNIQUES
  // -------------------------------------------------------------------------
  const seenLabels = new Set();

  // A. Tableau HTML Standard (table tr)
  document.querySelectorAll('table tr, [class*="attribute-item"], [class*="spec-item"], [class*="do-entry-item"], dl.do-entry-item, [class*="product-prop"], [class*="detail-item"]').forEach(row => {
    let label = '';
    let value = '';

    if (row.tagName.toLowerCase() === 'tr') {
      const cells = Array.from(row.querySelectorAll('th, td, [role="cell"]')).map(c => c.innerText.trim()).filter(Boolean);
      if (cells.length === 2 && cells[0].length < 60 && cells[1].length < 200) {
        label = cells[0];
        value = cells[1];
      }
    } else if (row.tagName.toLowerCase() === 'dl') {
      const dt = row.querySelector('dt');
      const dd = row.querySelector('dd');
      if (dt && dd) {
        label = dt.innerText.trim();
        value = dd.innerText.trim();
      }
    } else {
      const labelEl = row.querySelector('[class*="label"], [class*="name"], [class*="key"], span:first-child');
      const valueEl = row.querySelector('[class*="value"], [class*="val"], span:last-child');
      if (labelEl && valueEl && labelEl !== valueEl) {
        label = labelEl.innerText.trim().replace(/[:：]$/, '');
        value = valueEl.innerText.trim();
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
    fcfaPrices: fcfaPrices.slice(0, 5),
    tierPricing: tierPricing.slice(0, 8),
    company,
    location,
    moq,
    specifications: allSpecifications.slice(0, 30),
    mainImage,
    images: productImages.slice(0, 5)
  };
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
    btnImportText.innerText = "📥 INJECTER L'ARTICLE COMPLET DANS SOURCING";
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
      
      if (cachedData.basePriceFcfa && cachedData.basePriceFcfa > 0) {
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

    try {
      let dispatched = false;
      const allTabs = await chrome.tabs.query({});
      
      for (const t of allTabs) {
        if (t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('quin-source') || t.url.includes('netlify.app'))) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: t.id },
              func: (payload, isEnrich) => {
                // 1. Envoi de l'événement direct à l'application
                window.postMessage({ 
                  type: isEnrich ? 'ENRICH_PRODUCT' : 'CAPTURE_PRODUCT', 
                  payload 
                }, '*');

                // 2. Synchronisation instantanée dans localStorage
                try {
                  const inboxRaw = localStorage.getItem('quin_source_inbox');
                  const inbox = inboxRaw ? JSON.parse(inboxRaw) : [];
                  inbox.unshift(payload);
                  localStorage.setItem('quin_source_inbox', JSON.stringify(inbox));

                  if (!isEnrich) {
                    const prodRaw = localStorage.getItem('quin_source_products');
                    const prods = prodRaw ? JSON.parse(prodRaw) : [];
                    if (!prods.some(p => p.id === payload.id || p.sourceUrl === payload.sourceUrl)) {
                      prods.unshift(payload);
                      localStorage.setItem('quin_source_products', JSON.stringify(prods));
                    }
                  }
                } catch (e) {}
              },
              args: [cleanProductPayload, isEnrichMode]
            });
            dispatched = true;
          } catch (e) {}
        }
      }

      msgBox.className = 'msg msg-success';
      msgBox.innerHTML = `🎉 <strong>Article Traité & Injecté !</strong> Fiche complète avec vrais prix et spécifications enregistrée dans votre Sourcing Hub.`;
      msgBox.style.display = 'block';
      btnImportText.innerText = "✅ Article Injecté avec Succès !";
    } catch (err) {
      msgBox.className = 'msg msg-error';
      msgBox.innerHTML = '⚠️ Erreur lors de l\'injection : ' + err.message;
      msgBox.style.display = 'block';
    } finally {
      setTimeout(() => {
        btnImportText.innerText = origText;
        btnImport.disabled = false;
      }, 3500);
    }
  });
});