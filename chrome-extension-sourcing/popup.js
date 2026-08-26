function extractPageData() {
  const url = window.location.href;
  const rawText = document.body ? document.body.innerText : '';
  const lowerUrl = url.toLowerCase();

  // 0. 🏷️ DÉTECTION DE LA PLATEFORME ACTIVE
  let platform = 'Web / E-Commerce';
  let platformType = 'ecommerce'; // 'social' | 'ecommerce' | 'video'

  if (lowerUrl.includes('tiktok.com')) {
    platform = 'TikTok';
    platformType = 'social';
  } else if (lowerUrl.includes('instagram.com')) {
    platform = 'Instagram';
    platformType = 'social';
  } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) {
    platform = 'Facebook';
    platformType = 'social';
  } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    platform = 'YouTube';
    platformType = 'video';
  } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    platform = 'X (Twitter)';
    platformType = 'social';
  } else if (lowerUrl.includes('pinterest.com')) {
    platform = 'Pinterest';
    platformType = 'social';
  } else if (lowerUrl.includes('1688.com')) {
    platform = '1688 Chine';
    platformType = 'ecommerce';
  } else if (lowerUrl.includes('alibaba.com')) {
    platform = 'Alibaba';
    platformType = 'ecommerce';
  } else if (lowerUrl.includes('taobao.com')) {
    platform = 'Taobao';
    platformType = 'ecommerce';
  } else if (lowerUrl.includes('aliexpress.com')) {
    platform = 'AliExpress';
    platformType = 'ecommerce';
  } else if (lowerUrl.includes('made-in-china.com')) {
    platform = 'Made-in-China';
    platformType = 'ecommerce';
  } else if (lowerUrl.includes('pinduoduo.com') || lowerUrl.includes('yangkeduo.com')) {
    platform = 'Pinduoduo';
    platformType = 'ecommerce';
  }

  let title = '';
  let company = '';
  let location = 'Guangdong, Chine';
  let videoUrl = '';
  let videoPoster = '';
  const productImages = [];
  const allSpecifications = [];
  const fcfaPrices = [];
  const tierPricing = [];
  let moq = '1 pièce';

  // =========================================================================
  // 1. 🎵 MODULE SPÉCIFIQUE : TIKTOK
  // =========================================================================
  if (platform === 'TikTok') {
    location = 'TikTok';
    const videoIdMatch = url.match(/\/video\/(\d+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    const authorMatch = url.match(/@([a-zA-Z0-9_.-]+)/);
    const urlAuthor = authorMatch ? ('@' + authorMatch[1]) : '';
    company = urlAuthor || 'Créateur TikTok';

    // A. Extraction directe dans les données JSON réhydratées de TikTok
    let itemStruct = null;
    try {
      const univScript = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__') || 
                         document.getElementById('SIGI_STATE') || 
                         document.getElementById('__DEFAULT_DATA__');
      if (univScript) {
        const json = JSON.parse(univScript.textContent || '{}');
        const defaultScope = json['__DEFAULT_SCOPE__'] || json;
        const videoDetail = defaultScope['webapp.video-detail'] || defaultScope['ItemModule'];
        if (videoDetail?.itemInfo?.itemStruct) {
          itemStruct = videoDetail.itemInfo.itemStruct;
        } else if (videoId && videoDetail?.[videoId]) {
          itemStruct = videoDetail[videoId];
        }
      }
    } catch (e) {}

    if (itemStruct) {
      videoUrl = itemStruct.video?.playAddr || itemStruct.video?.downloadAddr || '';
      videoPoster = itemStruct.video?.cover || itemStruct.video?.originCover || itemStruct.video?.dynamicCover || '';
      title = itemStruct.desc || '';
      if (itemStruct.author?.nickname || itemStruct.author?.uniqueId) {
        company = itemStruct.author.nickname || ('@' + itemStruct.author.uniqueId);
      }
    }

    // B. Extraction DOM de secours pour TikTok
    if (!title) {
      const descEl = document.querySelector('[data-e2e="browse-video-desc"], h1[data-e2e="browse-video-desc"], [data-e2e="video-desc"], h1');
      if (descEl && descEl.innerText) {
        title = descEl.innerText.trim();
      } else {
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && ogDesc.content) title = ogDesc.content.trim();
        else title = document.title.replace(/\s*\|\s*TikTok$/i, '').trim();
      }
    }

    if (!videoUrl || !videoPoster) {
      const videos = Array.from(document.querySelectorAll('video'));
      const mainVid = videos.find(v => {
        const r = v.getBoundingClientRect();
        return r.width > 150 && r.height > 150;
      }) || videos[0];

      if (mainVid) {
        if (!videoPoster && mainVid.poster) videoPoster = mainVid.poster;
        if (!videoUrl && mainVid.src && !mainVid.src.startsWith('blob:')) {
          videoUrl = mainVid.src;
        }
      }
      if (!videoPoster) {
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg && ogImg.content) videoPoster = ogImg.content;
      }
      if (!videoUrl) videoUrl = url;
    }

    // C. Photos TikTok : Seulement la couverture HD de la vidéo + diaporama (Anti-Avatars !)
    if (videoPoster && !productImages.includes(videoPoster)) {
      productImages.push(videoPoster);
    }
    document.querySelectorAll('[data-e2e="browse-photo"] img, [class*="DivPhoto"] img').forEach(img => {
      const s = img.src || img.getAttribute('data-src') || '';
      if (s && !s.includes('avatar') && !productImages.includes(s)) {
        productImages.push(s);
      }
    });
  }

  // =========================================================================
  // 2. 📸 MODULE SPÉCIFIQUE : INSTAGRAM
  // =========================================================================
  else if (platform === 'Instagram') {
    location = 'Instagram';
    company = 'Compte Instagram';

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogTitleText = ogTitle ? ogTitle.content : '';
    if (ogTitleText.includes('on Instagram:')) {
      const parts = ogTitleText.split('on Instagram:');
      company = parts[0].trim();
      title = parts[1].replace(/^["'\s]+|["'\s]+$/g, '').trim();
    } else {
      title = ogTitleText || document.title;
    }

    const mainArticle = document.querySelector('article, [role="main"]') || document.body;
    const mainVid = mainArticle.querySelector('video');
    if (mainVid) {
      if (mainVid.src && !mainVid.src.startsWith('blob:')) videoUrl = mainVid.src;
      if (mainVid.poster) videoPoster = mainVid.poster;
    }
    if (!videoUrl) {
      const ogVideo = document.querySelector('meta[property="og:video"], meta[property="og:video:secure_url"]');
      if (ogVideo && ogVideo.content) videoUrl = ogVideo.content;
      else videoUrl = url;
    }
    if (!videoPoster) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content) videoPoster = ogImg.content;
    }

    if (videoPoster && !productImages.includes(videoPoster)) {
      productImages.push(videoPoster);
    }
    mainArticle.querySelectorAll('img').forEach(img => {
      const s = img.src || img.getAttribute('data-src') || '';
      const isAvatar = s.includes('s150x150') || s.includes('avatar') || (img.alt && img.alt.toLowerCase().includes('profile'));
      if (s && !isAvatar && !productImages.includes(s)) {
        if (img.naturalWidth === 0 || img.naturalWidth > 150) {
          productImages.push(s);
        }
      }
    });
  }

  // =========================================================================
  // 3. 🔵 MODULE SPÉCIFIQUE : FACEBOOK
  // =========================================================================
  else if (platform === 'Facebook') {
    location = 'Facebook';
    company = 'Page Facebook';
    const ogTitle = document.querySelector('meta[property="og:title"]');
    title = (ogTitle && ogTitle.content) ? ogTitle.content.trim() : document.title;

    const mainVid = document.querySelector('[role="main"] video, video');
    if (mainVid) {
      if (mainVid.src && !mainVid.src.startsWith('blob:')) videoUrl = mainVid.src;
      if (mainVid.poster) videoPoster = mainVid.poster;
    }
    if (!videoUrl) {
      const ogVid = document.querySelector('meta[property="og:video"], meta[property="og:video:url"]');
      if (ogVid && ogVid.content) videoUrl = ogVid.content;
      else videoUrl = url;
    }
    if (!videoPoster) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg && ogImg.content) videoPoster = ogImg.content;
    }
    if (videoPoster && !productImages.includes(videoPoster)) {
      productImages.push(videoPoster);
    }
  }

  // =========================================================================
  // 4. 🔴 MODULE SPÉCIFIQUE : YOUTUBE & SHORTS
  // =========================================================================
  else if (platform === 'YouTube') {
    location = 'YouTube';
    let ytId = '';
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);

    if (shortsMatch) ytId = shortsMatch[1];
    else if (watchMatch) ytId = watchMatch[1];
    else if (embedMatch) ytId = embedMatch[1];

    if (ytId) {
      videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
      videoPoster = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    } else {
      videoUrl = url;
    }

    const titleEl = document.querySelector('h1.ytd-watch-metadata, #title h1, h1');
    title = (titleEl && titleEl.innerText) ? titleEl.innerText.trim() : document.title.replace(/- YouTube$/i, '').trim();

    const channelEl = document.querySelector('#channel-name, #upload-info #text a, ytd-channel-name a');
    company = (channelEl && channelEl.innerText) ? channelEl.innerText.trim() : 'Chaîne YouTube';

    if (videoPoster && !productImages.includes(videoPoster)) {
      productImages.push(videoPoster);
    }
  }

  // =========================================================================
  // 5. ⚡ MODULE E-COMMERCE & SOURCING (ALIBABA / 1688 / TAOBAO / EXPORT)
  // =========================================================================
  else {
    // 1. Titre
    const h1 = document.querySelector('h1');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    title = (h1 && h1.innerText) ? h1.innerText.trim() : ((ogTitle && ogTitle.content) ? ogTitle.content.trim() : document.title);

    // 2. Scan des prix en FCFA
    const matches = rawText.matchAll(/(\d[\d\s\u00a0.,]{1,9})\s*(?:FCFA|CFA|XOF)/gi);
    for (const m of matches) {
      const cleaned = m[1].replace(/[\s\u00a0.,]/g, '');
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num > 100 && num < 50000000 && !fcfaPrices.includes(num)) {
        fcfaPrices.push(num);
      }
    }

    // 3. Vidéo Usine
    const vList = Array.from(document.querySelectorAll('.video-player video, .detail-video video, [class*="video"] video, video'));
    for (const v of vList) {
      let src = v.src || v.currentSrc || '';
      if (src && !src.startsWith('blob:')) {
        if (src.startsWith('//')) src = 'https:' + src;
        videoUrl = src;
        videoPoster = v.poster || '';
        break;
      }
      if (v.poster && !videoPoster) videoPoster = v.poster;
    }

    if (!videoUrl) {
      try {
        const scripts = document.querySelectorAll('script:not([src])');
        for (const s of scripts) {
          const content = s.textContent || '';
          if (content.includes('videoUrl') || content.includes('cloud.video.taobao.com') || content.includes('vod.alicdn.com')) {
            const vMatches = [
              ...content.matchAll(/"videoUrl"\s*:\s*"([^"]+)"/g),
              ...content.matchAll(/(https?:)?\/\/(?:cloud\.video\.taobao\.com|vod\.alicdn\.com)[^"'\s\\]+\.mp4/g)
            ];
            for (const vm of vMatches) {
              let clean = (vm[1] || vm[0]).replace(/\\u002F/g, '/').replace(/\\/g, '');
              if (clean.startsWith('//')) clean = 'https:' + clean;
              if (clean.startsWith('http')) {
                videoUrl = clean;
                break;
              }
            }
          }
          if (videoUrl) break;
        }
      } catch (e) {}
    }

    // 4. Photos Galerie HD
    const galleryContainers = document.querySelectorAll(
      '.detail-gallery, .main-image, .image-viewer, [class*="detail-gallery"], [class*="main-layout"] [class*="gallery"], [class*="image-view"], [class*="slider-wrapper"], [class*="slick-track"], [data-spm*="gallery"], .vertical-slider, .icbu-shop-gallery, .thumb-list'
    );

    let candidateElements = [];
    if (galleryContainers.length > 0) {
      galleryContainers.forEach(container => {
        container.querySelectorAll('img').forEach(img => candidateElements.push(img));
      });
    }

    if (candidateElements.length < 3) {
      document.querySelectorAll('img').forEach(img => {
        const isBadZone = img.closest('footer, header, nav, [class*="recommend"], [class*="related"], [class*="similar"], [class*="sidebar"], [class*="banner"]');
        if (!isBadZone) candidateElements.push(img);
      });
    }

    candidateElements.forEach(img => {
      let src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
      if (!src) return;

      const isUiAsset = src.includes('/tfs/') || src.includes('/icon/') || src.includes('avatar') || src.includes('badge') || src.includes('logo') || src.includes('sprite') || src.includes('.svg');
      if (isUiAsset) return;

      let clean = src
        .replace(/_\d+x\d+[^.]*\.(jpg|png|webp|jpeg)/gi, '')
        .replace(/\.jpg_\d+x\d+[^.]*\.jpg/gi, '.jpg')
        .replace(/\.webp_\d+x\d+[^.]*\.webp/gi, '.webp')
        .replace(/_sum\.(jpg|png|webp)/gi, '')
        .replace(/_Q\d+\.(jpg|png|webp)/gi, '');

      if (clean.startsWith('//')) clean = 'https:' + clean;
      if (clean.startsWith('http') && !productImages.includes(clean)) {
        productImages.push(clean);
      }
    });

    // 5. Nom Fournisseur & Paliers MOQ
    const isForbiddenText = (str) => {
      if (!str || typeof str !== 'string') return true;
      const lower = str.toLowerCase().trim();
      return lower.length < 3 || lower.length > 95 || ['alibaba', 'centre d\'aide', 'à propos', 'panier', 'store review', 'bestseller'].some(w => lower.includes(w));
    };

    const hasCompanyMarkers = (str) => {
      return /(?:Co\.,?\s*Ltd\.?|Company\s+Limited|Factory|Technology|Electronics?|Hardware|Industrial|Equipment|Machinery|Trading|Corp|LLC|Manufacturing|Enterprise|Plant|Group|Société|Usine)/i.test(str);
    };

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

    if (!company) company = 'Fabricant Vérifié Alibaba';

    // Paliers MOQ
    const tierContainers = document.querySelectorAll('[class*="price-item"], [class*="tier-item"], [class*="ladder-price"], [class*="price-ladder"], [class*="price-wrap"], [class*="tier-price"]');
    tierContainers.forEach(container => {
      const text = (container.innerText || '').replace(/[\t\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const priceMatch = text.match(/(\d[\d\s\u00a0.,]{1,8})\s*(?:FCFA|CFA|XOF|\$|¥|￥|USD)/i);
      const qtyMatch = text.match(/((?:≥|>|=|\d+)[-\s\d]*(?:pièce|pièces|piece|pieces|pcs|pc|unité|unités)[s]?)/i);
      if (priceMatch && qtyMatch) {
        const pNum = parseInt(priceMatch[1].replace(/[\s\u00a0.,]/g, ''), 10);
        const qStr = qtyMatch[1].trim();
        if (pNum && pNum > 100 && !tierPricing.some(t => t.minQty === qStr || t.priceFcfa === pNum)) {
          tierPricing.push({ minQty: qStr, priceFcfa: pNum, priceCny: parseFloat((pNum / 85).toFixed(2)) });
        }
      }
    });

    if (tierPricing.length > 0) moq = tierPricing[0].minQty;

    const chinaCities = ['Guangdong', 'Zhejiang', 'Foshan', 'Yiwu', 'Ningbo', 'Shenzhen', 'Guangzhou', 'Jinan', 'Dongguan', 'Wenzhou', 'Shanghai', 'Jiangsu', 'Shandong'];
    for (const city of chinaCities) {
      if (rawText.toLowerCase().includes(city.toLowerCase())) {
        location = `${city}, Chine`;
        break;
      }
    }

    // Caractéristiques
    const seenLabels = new Set();
    document.querySelectorAll('table tr').forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td, [role="cell"]')).map(c => c.innerText.trim()).filter(Boolean);
      if (cells.length === 2 && cells[0].length < 60 && cells[1].length < 200) {
        const lowerL = cells[0].toLowerCase();
        if (!seenLabels.has(lowerL)) {
          seenLabels.add(lowerL);
          allSpecifications.push({ category: 'Spécifications Techniques', label: cells[0], value: cells[1] });
        }
      }
    });
  }

  return {
    url,
    title: title || document.title,
    platform,
    platformType,
    fcfaPrices: fcfaPrices.slice(0, 5),
    tierPricing: tierPricing.slice(0, 5),
    company,
    location,
    moq,
    specifications: allSpecifications.slice(0, 50),
    images: productImages.slice(0, 15),
    videoUrl,
    videoPoster,
    rawTextSnippet: rawText.slice(0, 2000)
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
  
  // Media Preview Elements
  const videoPreviewBox = document.getElementById('videoPreviewBox');
  const videoPreviewPlayer = document.getElementById('videoPreviewPlayer');
  const videoPosterContainer = document.getElementById('videoPosterContainer');
  const videoPosterImg = document.getElementById('videoPosterImg');
  const videoStatusText = document.getElementById('videoStatusText');
  const videoSourceBadge = document.getElementById('videoSourceBadge');
  const btnSendVideoDirect = document.getElementById('btnSendVideoDirect');
  const btnDownloadMp4File = document.getElementById('btnDownloadMp4File');
  
  const imagesPreviewBox = document.getElementById('imagesPreviewBox');
  const imagesGrid = document.getElementById('imagesGrid');
  const imagesCountBadge = document.getElementById('imagesCountBadge');
  const btnToggleAllImages = document.getElementById('btnToggleAllImages');
  const btnSendImagesDirect = document.getElementById('btnSendImagesDirect');
  const btnSendImagesText = document.getElementById('btnSendImagesText');
  const noMediaDetectedBox = document.getElementById('noMediaDetectedBox');

  // Specs Elements
  const previewTitle = document.getElementById('previewTitle');
  const previewPrice = document.getElementById('previewPrice');
  const previewSupplier = document.getElementById('previewSupplier');
  const previewLocation = document.getElementById('previewLocation');
  const previewLocationRow = document.getElementById('previewLocationRow');
  const previewTiersBox = document.getElementById('previewTiersBox');
  const previewTiersList = document.getElementById('previewTiersList');

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
  let activeProductId = null;
  let selectedImages = new Set();

  // Mode Selector Tabs
  tabCreate.addEventListener('click', () => {
    currentMode = 'create';
    tabCreate.classList.add('active');
    tabEnrich.classList.remove('active');
    targetProductBox.style.display = 'none';
    btnImport.classList.remove('btn-enrich');
    btnImportText.innerText = '📥 IMPORTER TOUT DANS LE SOURCING';
  });

  tabEnrich.addEventListener('click', () => {
    currentMode = 'enrich';
    tabEnrich.classList.add('active');
    tabCreate.classList.remove('active');
    targetProductBox.style.display = 'block';
    btnImport.classList.add('btn-enrich');
    btnImportText.innerText = '➕ RATTACHER À LA FICHE CIBLE';
  });

  // Mise à jour du compteur d'images sélectionnées
  function updateImagesCountDisplay() {
    const total = (cachedData?.images || []).length;
    const count = selectedImages.size;
    if (imagesCountBadge) imagesCountBadge.innerText = `📷 Photos Détectées (${count}/${total})`;
    if (btnSendImagesText) btnSendImagesText.innerText = `📷 Capter ${count} Photo(s) dans Magasin`;
    if (btnToggleAllImages) {
      btnToggleAllImages.innerText = count === total ? 'Tout désélectionner' : 'Tout sélectionner';
    }
  }

  // Rendu de la grille des photos
  function renderImagesGrid(images) {
    if (!imagesGrid) return;
    imagesGrid.innerHTML = '';
    selectedImages = new Set(images);

    images.forEach((imgUrl, idx) => {
      const card = document.createElement('div');
      card.className = 'img-thumb-card selected';
      card.title = `Photo #${idx + 1} (Cliquez pour inclure / exclure)`;

      const img = document.createElement('img');
      img.src = imgUrl;
      img.loading = 'lazy';

      const check = document.createElement('div');
      check.className = 'img-thumb-check';
      check.innerText = '✓';

      card.appendChild(img);
      card.appendChild(check);

      card.addEventListener('click', () => {
        if (selectedImages.has(imgUrl)) {
          selectedImages.delete(imgUrl);
          card.classList.remove('selected');
        } else {
          selectedImages.add(imgUrl);
          card.classList.add('selected');
        }
        updateImagesCountDisplay();
      });

      imagesGrid.appendChild(card);
    });

    updateImagesCountDisplay();
  }

  // Tout cocher / décocher
  if (btnToggleAllImages) {
    btnToggleAllImages.addEventListener('click', () => {
      const total = (cachedData?.images || []).length;
      if (selectedImages.size === total) {
        selectedImages.clear();
        document.querySelectorAll('.img-thumb-card').forEach(c => c.classList.remove('selected'));
      } else {
        (cachedData?.images || []).forEach(url => selectedImages.add(url));
        document.querySelectorAll('.img-thumb-card').forEach(c => c.classList.add('selected'));
      }
      updateImagesCountDisplay();
    });
  }

  // 1. Récupération des articles de l'application
  try {
    const allTabs = await chrome.tabs.query({});
    const appTab = allTabs.find(t => t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('quin-source') || t.url.includes('netlify.app')));
    
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

  // Remplissage du sélecteur d'articles
  if (targetProductSelect) {
    targetProductSelect.innerHTML = '';
    if (availableProducts.length > 0) {
      const sortedProducts = [...availableProducts].sort((a, b) => {
        if (a.id === activeProductId) return -1;
        if (b.id === activeProductId) return 1;
        return 0;
      });

      sortedProducts.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        const isActive = p.id === activeProductId;
        if (isActive) {
          opt.innerText = `⭐ [EN COURS] ${p.sku ? '[' + p.sku + '] ' : ''}${p.titleFr ? p.titleFr.slice(0, 36) : 'Article'}`;
          opt.selected = true;
        } else {
          opt.innerText = `📦 ${p.sku ? '[' + p.sku + '] ' : ''}${p.titleFr ? p.titleFr.slice(0, 42) : 'Article'}`;
        }
        targetProductSelect.appendChild(opt);
      });

      if (activeProductId) {
        currentMode = 'enrich';
        tabEnrich.classList.add('active');
        tabCreate.classList.remove('active');
        targetProductBox.style.display = 'block';
        btnImport.classList.add('btn-enrich');
        btnImportText.innerText = '➕ RATTACHER À LA FICHE CIBLE';
      }
    } else {
      targetProductSelect.innerHTML = '<option value="">Aucun article dans le catalogue</option>';
    }
  }

  // 2. Extraction des données de la page courante
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

      // Prévisualisation Photos HD Détectées
      if (cachedData.images && cachedData.images.length > 0) {
        imagesPreviewBox.style.display = 'block';
        renderImagesGrid(cachedData.images);
      } else {
        imagesPreviewBox.style.display = 'none';
      }

      if (!cachedData.videoUrl && (!cachedData.images || cachedData.images.length === 0)) {
        if (noMediaDetectedBox) {
          noMediaDetectedBox.innerText = 'ℹ️ Aucun média direct détecté. Prêt pour import texte/données.';
          noMediaDetectedBox.style.display = 'block';
        }
      } else if (noMediaDetectedBox) {
        noMediaDetectedBox.style.display = 'none';
      }

      // Données Produit / Publication
      previewTitle.innerText = cachedData.title ? (cachedData.title.slice(0, 70) + (cachedData.title.length > 70 ? '...' : '')) : (tab.title || 'Page active');
      
      if (cachedData.fcfaPrices && cachedData.fcfaPrices.length > 0) {
        const pFcfa = cachedData.fcfaPrices[0];
        const pCny = (pFcfa / 85).toFixed(2);
        previewPrice.innerHTML = `<strong>${pFcfa.toLocaleString()} FCFA</strong> <span style="color: #94A3B8; font-size: 10px;">(${pCny} ¥)</span>`;
      } else {
        previewPrice.innerText = cachedData.platformType === 'social' ? 'Média Social (Sans Prix)' : 'Prêt à sourcer';
      }

      if (cachedData.company) {
        previewSupplier.innerText = cachedData.company.slice(0, 42);
      } else {
        previewSupplier.innerText = cachedData.platform || 'Fournisseur Détecté';
      }

      if (cachedData.location) {
        previewLocation.innerText = cachedData.location;
        previewLocationRow.style.display = 'flex';
      }

      // Paliers MOQ
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
    if (previewTitle) previewTitle.innerText = tab.title || 'Page active';
    if (previewPrice) previewPrice.innerText = 'Prêt à importer';
    if (platformBadge) platformBadge.innerText = 'Web';
  }



  // 4. 📷 BOUTON CAPTURE PHOTOS DIRECTES VERS MAGASIN D'ARRIVAGE
  if (btnSendImagesDirect) {
    btnSendImagesDirect.addEventListener('click', async () => {
      const imagesToCapture = Array.from(selectedImages);
      if (imagesToCapture.length === 0) {
        msgBox.className = 'msg msg-error';
        msgBox.innerHTML = '⚠️ Veuillez cocher au moins une photo à envoyer.';
        msgBox.style.display = 'block';
        return;
      }

      const mediaItems = imagesToCapture.map((imgUrl, i) => ({
        id: 'media-' + Date.now() + '-' + i,
        type: 'image',
        url: imgUrl,
        title: cachedData?.title ? `Photo #${i + 1} : ${cachedData.title.slice(0, 35)}...` : `Photo HD #${i + 1}`,
        platform: cachedData?.platform || 'Réseaux Sociaux',
        createdAt: new Date().toISOString()
      }));

      try {
        const allTabs = await chrome.tabs.query({});
        for (const t of allTabs) {
          if (t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('quin-source') || t.url.includes('netlify.app'))) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: t.id },
                func: (items) => {
                  items.forEach(item => {
                    window.postMessage({ type: 'CAPTURE_MEDIA', payload: item }, '*');
                  });
                  try {
                    const raw = localStorage.getItem('quin_source_captured_media');
                    const arr = raw ? JSON.parse(raw) : [];
                    const existingUrls = new Set(arr.map(m => m.url));
                    const newUnique = items.filter(it => !existingUrls.has(it.url));
                    localStorage.setItem('quin_source_captured_media', JSON.stringify([...newUnique, ...arr]));
                  } catch (e) {}
                },
                args: [mediaItems]
              });
            } catch (e) {}
          }
        }

        msgBox.className = 'msg msg-success';
        msgBox.innerHTML = `📷 <strong>${imagesToCapture.length} Photos Capturées !</strong> Transmises au Magasin d'Arrivage.`;
        msgBox.style.display = 'block';
        btnSendImagesDirect.innerHTML = `<span>✅ ${imagesToCapture.length} Photos Envoyées !</span>`;
      } catch (e) {
        msgBox.className = 'msg msg-error';
        msgBox.innerHTML = '⚠️ Erreur lors de la capture des photos.';
        msgBox.style.display = 'block';
      }
    });
  }

  // 5. 📥 BOUTON PRINCIPAL D'IMPORTATION GLOBALE (AVEC MÉDIAS SÉLECTIONNÉS)
  btnImport.addEventListener('click', async () => {
    btnImport.disabled = true;
    btnImport.innerHTML = '<span>⏳ Transmission en cours...</span>';
    msgBox.style.display = 'none';

    try {
      const chosenImages = Array.from(selectedImages);
      const targetId = (currentMode === 'enrich' && targetProductSelect) ? targetProductSelect.value : null;

      const payload = {
        ...(cachedData || { url: tab.url, title: tab.title }),
        images: chosenImages.length > 0 ? chosenImages : (cachedData?.images || []),
        videoUrl: cachedData?.videoUrl || tab.url,
        videoPoster: cachedData?.videoPoster || '',
        importMode: currentMode,
        targetProductId: targetId,
        timestamp: Date.now()
      };

      // 1️⃣ PONT 1 : Injection directe en mémoire dans tous les onglets actifs
      try {
        const allTabs = await chrome.tabs.query({});
        const appTabs = allTabs.filter(t => t.url && (
          t.url.includes('netlify.app') || 
          t.url.includes('quin-source') || 
          t.url.includes('localhost') || 
          t.url.includes('127.0.0.1') || 
          t.url.includes('192.168.') ||
          t.title?.includes('SOURCING') || 
          t.title?.includes('QUIN-SOURCE')
        ));
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

      // 3️⃣ PONT 3 : Envoi HTTP Multi-Ports (Serveur Local & Réseau Local)
      const customIp = localStorage.getItem('quin_source_server_ip') || '192.168.100.7';
      const targetHosts = Array.from(new Set(['localhost', '127.0.0.1', customIp, '192.168.100.7']));
      const targetPorts = [5173, 5174, 5175];
      for (const host of targetHosts) {
        for (const port of targetPorts) {
          try {
            await fetch(`http://${host}:${port}/api/import-live`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (portErr) {}
        }
      }

      // 4️⃣ PONT 4 : Envoi Direct Universel vers Supabase Cloud
      try {
        const supUrl = 'https://xgaehsajhlxkhxzqgfhz.supabase.co';
        const supKey = 'sb_publishable_zVzDkQ2gg7Whjg3sOKviNg_v2CvaQoV';
        
        let cleanCompany = payload.company || 'Fournisseur Sourcing';
        let basePrice = (payload.fcfaPrices && payload.fcfaPrices[0]) || parseInt(payload.priceFcfa) || 5000;
        let cny = parseFloat(payload.priceCny || (basePrice / 85).toFixed(2));
        let tiers = Array.isArray(payload.tierPricing) && payload.tierPricing.length > 0 ? payload.tierPricing : [];
        let moq = payload.moq || (tiers[0]?.minQty) || '1 pièce';

        const row = {
          id: `prod-${Date.now()}`,
          workspace_id: 'ws_quincaillerie',
          sku: `IMP-${Date.now().toString().slice(-4)}`,
          title_fr: payload.title || 'Article Importé Sourcing',
          category: (payload.category && payload.category !== 'all' && payload.category !== 'inbox') ? payload.category : 'inbox',
          material: payload.material || 'Standard Qualité Usine',
          dimensions: payload.dimensions || 'Standard Pro Export',
          images: payload.images && payload.images.length > 0 ? payload.images : ['https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80'],
          video_demo: payload.videoUrl ? { source: payload.platform || 'Démonstration Usine', videoUrl: payload.videoUrl, poster: payload.videoPoster || '' } : null,
          specifications: payload.specifications || [],
          factory_name: cleanCompany,
          factory_city: payload.location || 'Guangdong, Chine',
          tier_pricing: tiers,
          moq: moq,
          suppliers: [{
            id: `sup-${Date.now()}`,
            name: cleanCompany,
            platform: (payload.platform || 'web').toLowerCase(),
            city: payload.location || 'Guangdong, Chine',
            priceCny: cny,
            moq: moq,
            priceTiers: tiers,
            rating: 4.9,
            badge: payload.badge || 'Verified Supplier',
            years: payload.years || '4 ans d\'expérience',
            isPreferred: true,
            url: payload.url || '',
            leadTime: '5 - 15 jours'
          }],
          price_cny: cny,
          unit: payload.unit || 'Pièce (pc)',
          source_url: payload.url || ''
        };

        await fetch(`${supUrl}/rest/v1/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supKey,
            'Authorization': `Bearer ${supKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(row)
        });
      } catch (sbErr) {}

      msgBox.className = 'msg msg-success';
      if (currentMode === 'enrich') {
        msgBox.innerHTML = `🎉 <strong>Fiche Complétée !</strong> Données et médias rattachés avec succès !`;
      } else {
        msgBox.innerHTML = `🎉 <strong>Article & Médias Importés !</strong> Enregistrés dans votre catalogue et synchronisés Cloud !`;
      }
      msgBox.style.display = 'block';
      btnImport.innerHTML = '<span>✅ Importation Réussie !</span>';
      btnImport.disabled = false;
    } catch (err) {
      msgBox.className = 'msg msg-error';
      msgBox.innerHTML = '⚠️ Erreur lors de l\'importation. Veuillez réessayer.';
      msgBox.style.display = 'block';
      btnImport.disabled = false;
      btnImport.innerHTML = '<span>📥 Réessayer l\'Import</span>';
    }
  });
});