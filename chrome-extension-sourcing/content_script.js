// Passerelle Universelle entre l'Extension et l'Application App Sourcing
(function() {
  // Écouter les messages du background / popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && (request.type === 'EXTENSION_DIRECT_IMPORT' || request.type === 'EXTENSION_INJECT_PRODUCT')) {
      window.postMessage({
        type: 'EXTENSION_DIRECT_IMPORT',
        payload: request.payload
      }, window.location.origin);

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

  // 🔐 Synchronisation sécurisée de la session JWT utilisateur (Origine vérifiée)
  window.addEventListener('message', (event) => {
    // 🛡️ Rejeter tout message ne provenant pas exactement de l'origine de l'application
    if (event.origin !== window.location.origin) return;

    if (event.data && event.data.type === 'APP_SOURCING_SESSION_SYNC' && event.data.token) {
      chrome.storage?.local?.set({
        quin_source_auth_jwt: event.data.token,
        quin_source_auth_user_id: event.data.userId || null,
        quin_source_auth_updated_at: Date.now()
      });
      console.log('[ContentScript] 🔐 Session utilisateur synchronisée avec l\'extension.');
    }
  });

  // Injecter un marqueur pour que le site sache que l'extension est active
  window.__APP_SOURCING_EXTENSION_INSTALLED__ = true;
  document.documentElement.setAttribute('data-sourcing-extension', 'true');
})();
