import { isJwtExpired, refreshSupabaseSession, isPermanentClientError, computeBackoffDelay } from './utils/extensionLogic.js';

// ============================================================================
// ⚡ BACKGROUND SERVICE WORKER (MANIFEST V3 ROBUSTNESS ARCHITECTURE)
// Zéro état volatile en mémoire • chrome.storage.local • chrome.alarms • lastError
// ============================================================================

const SUPABASE_URL = 'https://xgaehsajhlxkhxzqgfhz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zVzDkQ2gg7Whjg3sOKviNg_v2CvaQoV';

/**
 * Récupère un token JWT valide avec rafraîchissement autonome et rotation stricte
 * Fonctionne même si l'onglet de l'application est fermé
 */
async function getValidAuthToken() {
  const data = await chrome.storage.local.get(['quin_source_auth_jwt', 'quin_source_auth_refresh_token', 'quin_source_auth_status']);
  let token = data.quin_source_auth_jwt;
  const refreshToken = data.quin_source_auth_refresh_token;

  if (data.quin_source_auth_status === 'relogin_required') {
    return { token: null, isRevoked: true };
  }

  if (!token || isJwtExpired(token)) {
    if (refreshToken) {
      const refreshRes = await refreshSupabaseSession(refreshToken, SUPABASE_URL, SUPABASE_ANON_KEY);
      if (refreshRes.success && refreshRes.accessToken) {
        token = refreshRes.accessToken;
        // 🔄 Rotation stricte : écraser l'ancien refresh_token par le nouveau
        await chrome.storage.local.set({
          quin_source_auth_jwt: token,
          quin_source_auth_refresh_token: refreshRes.refreshToken || refreshToken,
          quin_source_auth_status: 'authenticated',
          quin_source_auth_updated_at: Date.now()
        });
        chrome.action.setBadgeText({ text: '' });
        console.log('[SW] 🔄 Token de session rafraîchi avec rotation stricte du refresh_token.');
      } else {
        // 🛑 Token révoqué ou expiré : stopper les retries et alerter
        console.warn('[SW] ⚠️ Échec critique refresh_token (révoqué ou expiré) :', refreshRes.error);
        await chrome.storage.local.set({
          quin_source_auth_status: 'relogin_required',
          quin_source_auth_jwt: null,
          quin_source_auth_refresh_token: null
        });
        chrome.action.setBadgeText({ text: 'LOG' });
        chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        return { token: null, isRevoked: true };
      }
    } else {
      return { token: null, isRevoked: true };
    }
  }

  return { token: token || SUPABASE_ANON_KEY, isRevoked: false };
}

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

// 3. Traitement robuste des imports avec Backoff Exponentiel & Limite Max (Dead Letter Queue)
const MAX_IMPORT_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 60 * 1000; // 1 minute de base

async function processPendingOfflineImports() {
  try {
    const data = await chrome.storage.local.get(['quin_source_pending_imports', 'quin_source_dead_letter_imports', 'quin_source_auth_refresh_token']);
    const pending = data.quin_source_pending_imports;
    if (!pending || !Array.isArray(pending) || pending.length === 0) return;

    const deadLetter = data.quin_source_dead_letter_imports || [];
    const remaining = [];
    const now = Date.now();

    for (const item of pending) {
      const currentRetries = item.retryCount || 0;
      const lastRetryAt = item.lastRetryAt || 0;

      // ⏱️ Backoff Exponentiel : 1 min, 2 min, 4 min, 8 min, 16 min
      const requiredDelay = computeBackoffDelay(currentRetries, BASE_RETRY_DELAY_MS);
      if (now - lastRetryAt < requiredDelay && lastRetryAt > 0) {
        remaining.push(item);
        continue;
      }

      // 🛑 Limite de 5 tentatives : archivage en Dead Letter Queue
      if (currentRetries >= MAX_IMPORT_RETRIES) {
        console.warn(`[SW][DLQ] ⚠️ Import abandonné après ${MAX_IMPORT_RETRIES} échecs (trace_id: ${item.trace_id || item.sku}):`, item);
        deadLetter.push({
          ...item,
          abandonedAt: new Date().toISOString(),
          reason: 'max_retries_exceeded'
        });
        continue;
      }

      try {
        const authInfo = await getValidAuthToken();
        if (authInfo.isRevoked) {
          // Session révoquée / expirée : garder l'item en attente sans tenter de fetch réseau
          remaining.push(item);
          continue;
        }

        let currentAuthToken = authInfo.token;
        
        let response = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=workspace_id,sku`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${currentAuthToken}`,
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(item)
        });

        // 🔄 Si 401 (token expiré entretemps), tenter un refresh immédiat avec rotation stricte
        if (response.status === 401 && data.quin_source_auth_refresh_token) {
          console.warn('[SW] 401 reçu : tentative de rafraîchissement immédiat du refresh_token...');
          const refreshRes = await refreshSupabaseSession(data.quin_source_auth_refresh_token, SUPABASE_URL, SUPABASE_ANON_KEY);
          if (refreshRes.success && refreshRes.accessToken) {
            currentAuthToken = refreshRes.accessToken;
            await chrome.storage.local.set({
              quin_source_auth_jwt: currentAuthToken,
              quin_source_auth_refresh_token: refreshRes.refreshToken,
              quin_source_auth_status: 'authenticated',
              quin_source_auth_updated_at: Date.now()
            });

            // Re-tentative immédiate avec le nouveau token
            response = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=workspace_id,sku`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${currentAuthToken}`,
                'Prefer': 'resolution=merge-duplicates,return=representation'
              },
              body: JSON.stringify(item)
            });
          } else {
            // Échec du refresh -> marquer la session révoquée
            await chrome.storage.local.set({
              quin_source_auth_status: 'relogin_required',
              quin_source_auth_jwt: null,
              quin_source_auth_refresh_token: null
            });
            chrome.action.setBadgeText({ text: 'LOG' });
            chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
            remaining.push(item);
            continue;
          }
        }

        if (response.ok) {
          console.log(`[SW][Retry] ✅ Import réussi en tâche de fond (trace_id: ${item.trace_id || item.sku})`);
        } else {
          // 🛑 Si erreur structurelle permanente (400, 403, 404, 422 - hors 401 et 429) -> DLQ
          if (isPermanentClientError(response.status)) {
            console.error(`[SW][DLQ] ❌ Erreur permanente ${response.status} sur produit ${item.sku}. Déplacé en DLQ.`);
            deadLetter.push({
              ...item,
              abandonedAt: new Date().toISOString(),
              reason: `http_client_error_${response.status}`
            });
          } else {
            // Erreur temporaire (5xx, 429, ou 401 persistant en attente de reconnexion) -> Retry avec incrément
            remaining.push({
              ...item,
              retryCount: currentRetries + 1,
              lastRetryAt: now
            });
          }
        }
      } catch (err) {
        // Erreur réseau (coupure) -> Retry avec incrément
        remaining.push({
          ...item,
          retryCount: currentRetries + 1,
          lastRetryAt: now
        });
      }
    }

    await chrome.storage.local.set({ 
      quin_source_pending_imports: remaining,
      quin_source_dead_letter_imports: deadLetter.slice(-50)
    });
  } catch (e) {
    console.warn('[SW] Erreur vérification imports en attente:', e);
  }
}

// 4. Gestion de connexion persistante avec surveillance de déconnexion et lastError
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup_sync') {
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        // Géré proprement pour éviter toute exception silencieuse non catchée
        console.log('[SW] Port popup_sync déconnecté:', chrome.runtime.lastError.message);
      }
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

