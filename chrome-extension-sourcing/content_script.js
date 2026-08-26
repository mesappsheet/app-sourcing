// Passerelle Universelle entre l'Extension et l'Application App Sourcing
(function() {
  // Écouter les messages du background / popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && (request.type === 'EXTENSION_DIRECT_IMPORT' || request.type === 'EXTENSION_INJECT_PRODUCT')) {
      window.postMessage({
        type: 'EXTENSION_DIRECT_IMPORT',
        payload: request.payload
      }, '*');

      window.dispatchEvent(new CustomEvent('EXTENSION_IMPORT_EVENT', {
        detail: request.payload
      }));

      try {
        localStorage.setItem('quin_source_latest_import', JSON.stringify({
          ...request.payload,
          timestamp: Date.now()
        }));
      } catch (e) {}

      sendResponse({ status: 'ok', received: true });
    }
  });

  // Injecter un marqueur pour que le site sache que l'extension est active
  window.__APP_SOURCING_EXTENSION_INSTALLED__ = true;
  document.documentElement.setAttribute('data-sourcing-extension', 'true');
})();
