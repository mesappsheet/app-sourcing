// Background Service Worker for App Sourcing Extension
// Context Menus for Right-Click Capture

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // 1. Context Menu for Videos
    chrome.contextMenus.create({
      id: 'capture_video_menu',
      title: '🎬 Envoyer cette Vidéo vers App Sourcing',
      contexts: ['video', 'link']
    });

    // 2. Context Menu for Images
    chrome.contextMenus.create({
      id: 'capture_image_menu',
      title: '📷 Envoyer cette Photo vers App Sourcing',
      contexts: ['image']
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let mediaItem = null;

  if (info.menuItemId === 'capture_video_menu') {
    const videoUrl = info.srcUrl || info.linkUrl || '';
    if (videoUrl) {
      mediaItem = {
        id: 'media-' + Date.now(),
        type: 'video',
        url: videoUrl,
        title: tab?.title ? ('Vidéo : ' + tab.title.slice(0, 45) + '...') : 'Vidéo Web Capturée',
        platform: 'Clic Droit Web',
        createdAt: new Date().toISOString()
      };
    }
  } else if (info.menuItemId === 'capture_image_menu') {
    const imgUrl = info.srcUrl || '';
    if (imgUrl) {
      mediaItem = {
        id: 'media-' + Date.now(),
        type: 'image',
        url: imgUrl,
        title: tab?.title ? ('Photo : ' + tab.title.slice(0, 45) + '...') : 'Photo Web Capturée',
        platform: 'Clic Droit Web',
        createdAt: new Date().toISOString()
      };
    }
  }

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
