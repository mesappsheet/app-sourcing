// Background Service Worker for App Sourcing Extension
// Context Menus for Right-Click Capture (Multi-Platform Resilient)

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // 1. Context Menu for Videos & Social Pages
    chrome.contextMenus.create({
      id: 'capture_video_menu',
      title: '🎬 Envoyer cette Vidéo vers App Sourcing',
      contexts: ['video', 'link', 'page', 'frame']
    });

    // 2. Context Menu for Images
    chrome.contextMenus.create({
      id: 'capture_image_menu',
      title: '📷 Envoyer cette Photo vers App Sourcing',
      contexts: ['image', 'link', 'page']
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  let mediaItem = null;

  if (info.menuItemId === 'capture_video_menu') {
    let videoUrl = info.srcUrl || '';

    // Si clic droit sur overlay (TikTok / Instagram / Facebook), extraction via injection
    if (!videoUrl || videoUrl.startsWith('blob:')) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // 1. Recherche balise video directe
            const videos = Array.from(document.querySelectorAll('video'));
            for (const v of videos) {
              const s = v.src || v.currentSrc;
              if (s && !s.startsWith('blob:')) return { url: s, poster: v.poster || '' };
            }
            // 2. Recherche OpenGraph
            const og = document.querySelector('meta[property="og:video"], meta[property="og:video:url"], meta[property="og:video:secure_url"], meta[name="twitter:player:stream"]');
            if (og) {
              const c = og.getAttribute('content');
              if (c && c.startsWith('http')) return { url: c, poster: '' };
            }
            // 3. YouTube ID
            const ytMatch = window.location.href.match(/(?:shorts\/|[?&]v=|embed\/)([a-zA-Z0-9_-]+)/);
            if (ytMatch) {
              return { 
                url: `https://www.youtube.com/watch?v=${ytMatch[1]}`, 
                poster: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg` 
              };
            }
            // 4. Fallback sur premier flux vidéo
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

  // Transmission vers l'application
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
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
});

