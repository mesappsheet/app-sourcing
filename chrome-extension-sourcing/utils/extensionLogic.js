// ============================================================================
// ⚡ EXTENSION LOGIC CORE MODULE (SOURCE UNIQUE DE VÉRITÉ)
// Partagé entre l extension Chrome (background, popup) et la suite de tests
// ============================================================================

/**
 * Normalise un nom de rayon pour générer un identifiant slug déterministe et unique
 * Supprime les accents, minuscules, caractères spéciaux et espaces superflus
 */
export function normalizeCategorySlug(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 35);
}

/**
 * Calcule le délai de Backoff Exponentiel pour les retries en arrière-plan
 * Formule : baseDelay * 2^(retryCount), plafonné à 16x baseDelay (ex: 16 min)
 */
export function computeBackoffDelay(retryCount, baseDelayMs = 60000) {
  const count = Math.max(0, parseInt(retryCount, 10) || 0);
  const maxDelay = 16 * baseDelayMs;
  return Math.min(maxDelay, baseDelayMs * Math.pow(2, count));
}

/**
 * Détermine si une réponse HTTP représente une erreur client définitive (4xx)
 * Les erreurs 4xx permanentes (400, 401, 403, 404, 422) ne doivent PAS être rejouées indéfiniment
 * Exception : 429 (Too Many Requests / Rate limit) qui doit être réessayée avec backoff
 */
export function isPermanentClientError(statusCode) {
  const code = parseInt(statusCode, 10);
  if (isNaN(code)) return false;
  return code >= 400 && code < 500 && code !== 429;
}

/**
 * Génère un SKU et un identifiant produit 100% déterministes à partir de l URL source
 * Scraper la même page 10 fois générera exactement le même SKU
 */
export function getDeterministicSkuAndId(url) {
  if (!url || typeof url !== "string") {
    const r = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { sku: "SKU-" + r, id: "prod-" + r };
  }
  try {
    const u = new URL(url);
    const numMatch = u.pathname.match(/(\d{8,20})/);
    if (numMatch) return { sku: "SKU-" + numMatch[1], id: "prod-" + numMatch[1] };
    const searchId = u.searchParams.get("id") || u.searchParams.get("productId") || u.searchParams.get("itemId") || u.searchParams.get("item_id");
    if (searchId && searchId.length >= 4) return { sku: "SKU-" + searchId, id: "prod-" + searchId };
    let hash = 5381;
    const cleanStr = (u.hostname + u.pathname).toLowerCase().replace(/[^a-z0-9]/g, "");
    for (let i = 0; i < cleanStr.length; i++) {
      hash = ((hash << 5) + hash) + cleanStr.charCodeAt(i);
      hash |= 0;
    }
    const cleanHash = Math.abs(hash).toString(36).toUpperCase();
    return { sku: "SKU-" + cleanHash, id: "prod-" + cleanHash };
  } catch (e) {
    return { sku: "SKU-" + Date.now(), id: "prod-" + Date.now() };
  }
}

/**
 * Détecte la catégorie la plus pertinente à partir des métadonnées du produit
 * Renvoie l objet catégorie et le pourcentage de confiance calculé
 */
export function detectBestCategory(data, allCategories = []) {
  if (!data || !Array.isArray(allCategories) || allCategories.length === 0) return null;
  const combinedText = [
    (data.title || ""),
    (data.breadcrumbs ? data.breadcrumbs.join(" ") : ""),
    (data.metaKeywords || ""),
    (data.specifications ? data.specifications.map(s => s.label + " " + s.value).join(" ") : "")
  ].join(" ").toLowerCase();

  let bestMatch = null;
  let highestScore = 0;

  allCategories.forEach(cat => {
    if (cat.isInbox || !cat.keywords) return;
    let score = 0;
    cat.keywords.forEach(kw => {
      const lowerKw = kw.toLowerCase();
      if (combinedText.includes(lowerKw)) {
        if ((data.title || "").toLowerCase().includes(lowerKw)) score += 4;
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
    return { type: "match", category: bestMatch, score: highestScore, confidence: confidencePct };
  }

  return null;
}