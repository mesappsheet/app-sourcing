// ============================================================================
// ⚡ BACKGROUND SERVICE WORKER (MANIFEST V3 ROBUSTNESS ARCHITECTURE)
// Zéro état volatile en mémoire • chrome.storage.local • chrome.alarms • lastError
// ============================================================================

const SUPABASE_URL = 'https://xgaehsajhlxkhxzqgfhz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zVzDkQ2gg7Whjg3sOKviNg_v2CvaQoV';

// 1. Initialisation des menus contextuels et des alarmes au démarrage
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'capture_video_menu',
      title: '🎬 Envoyer cette Vidéo vers App Sourcing',
      contexts: ['video', 'link', 'page', 'frame']
    });

    chrome.contextMenus.create({
      id: 'capture_image_menu',
      title: '📷 Envoyer cette Photo vers App Sourcing',
      contexts: ['image', 'link', 'page']
    });
  });

  // Alarme récurrente pour purger / rejouer les imports en attente (survit aux kills du worker)
  chrome.alarms.create('checkPendingImports', { periodInMinutes: 1 });
});

// 2. Gestionnaire d'alarmes (Réveil automatique du Service Worker par Chrome)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkPendingImports') {
    await processPendingOfflineImports();
  }
});

// 3. Traitement robuste des imports en attente dans chrome.storage.local
async function processPendingOfflineImports() {
  try {
    const data = await chrome.storage.local.get(['quin_source_pending_imports']);
    const pending = data.quin_source_pending_imports;
    if (!pending || !Array.isArray(pending) || pending.length === 0) return;

    const remaining = [];

    for (const item of pending) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=workspace_id,sku`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(item)
        });

        if (!response.ok) {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    await chrome.storage.local.set({ quin_source_pending_imports: remaining });
  } catch (e) {
    console.warn('[SW] Erreur vérification imports en attente:', e);
  }
}

// 4. Gestion de connexion pour surveiller la fermeture impromptue de la popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup_sync') {
    port.onDisconnect.addListener(() => {
      // Si la popup est fermée en plein vol, le service worker traite les données persistées
      processPendingOfflineImports();
    });
  }
});

// 5. Menus contextuels (Clic Droit) avec extraction résiliente
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  let mediaItem = null;

  if (info.menuItemId === 'capture_video_menu') {
    let videoUrl = info.srcUrl || '';

    if (!videoUrl || videoUrl.startsWith('blob:')) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const videos = Array.from(document.querySelectorAll('video'));
            for (const v of videos) {
              const s = v.src || v.currentSrc;
              if (s && !s.startsWith('blob:')) return { url: s, poster: v.poster || '' };
            }
            const og = document.querySelector('meta[property="og:video"], meta[property="og:video:url"], meta[property="og:video:secure_url"], meta[name="twitter:player:stream"]');
            if (og) {
              const c = og.getAttribute('content');
              if (c && c.startsWith('http')) return { url: c, poster: '' };
            }
            const ytMatch = window.location.href.match(/(?:shorts\/|[?&]v=|embed\/)([a-zA-Z0-9_-]+)/);
            if (ytMatch) {
              return { 
                url: `https://www.youtube.com/watch?v=${ytMatch[1]}`, 
                poster: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg` 
              };
            }
            if (videos[0]) {
              return { url: videos[0].src || videos[0].currentSrc || '', poster: videos[0].poster || '' };
            }
            return null;
          }
        });

        if (results && results[0]?.result?.url) {
          videoUrl = results[0].result.url;
        }
      } catch (e) {}
    }

    if (videoUrl) {
      mediaItem = {
        id: 'media-' + Date.now(),
        type: 'video',
        url: videoUrl,
        title: tab?.title ? ('Vidéo : ' + tab.title.slice(0, 45) + '...') : 'Vidéo Capturée',
        platform: 'Clic Droit Web',
        createdAt: new Date().toISOString()
      };
    }
  } else if (info.menuItemId === 'capture_image_menu') {
    let imgUrl = info.srcUrl || '';

    if (!imgUrl) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const og = document.querySelector('meta[property="og:image"], meta[name="twitter:image"]');
            if (og) return og.getAttribute('content');
            const firstImg = document.querySelector('article img, [role="main"] img, img');
            return firstImg ? (firstImg.src || firstImg.getAttribute('data-src')) : null;
          }
        });
        if (results && results[0]?.result) {
          imgUrl = results[0].result;
        }
      } catch (e) {}
    }

    if (imgUrl) {
      mediaItem = {
        id: 'media-' + Date.now(),
        type: 'image',
        url: imgUrl,
        title: tab?.title ? ('Photo : ' + tab.title.slice(0, 45) + '...') : 'Photo Capturée',
        platform: 'Clic Droit Web',
        createdAt: new Date().toISOString()
      };
    }
  }

  // Transmission sécurisée vers l'application ouverte
  if (mediaItem) {
    try {
      const allTabs = await chrome.tabs.query({});
      for (const t of allTabs) {
        if (t.url && (t.url.includes('localhost') || t.url.includes('127.0.0.1') || t.url.includes('quin-source') || t.url.includes('netlify.app'))) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: t.id },
              func: (item) => {
                window.postMessage({ type: 'CAPTURE_MEDIA', payload: item }, '*');
                window.dispatchEvent(new CustomEvent('CAPTURE_MEDIA_EVENT', { detail: item }));
                try {
                  const raw = localStorage.getItem('quin_source_captured_media');
                  const arr = raw ? JSON.parse(raw) : [];
                  arr.unshift(item);
                  localStorage.setItem('quin_source_captured_media', JSON.stringify(arr));
                } catch (e) {}
              },
              args: [mediaItem]
            });
          } catch (e) {
            console.warn('[SW] Erreur injection média dans onglet:', e);
          }
        }
      }
    } catch (e) {}
  }
});

