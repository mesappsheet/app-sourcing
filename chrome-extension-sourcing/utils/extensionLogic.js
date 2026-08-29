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
 * Les erreurs structurelles (400, 403, 404, 422) ne doivent PAS être rejouées indéfiniment.
 * Exceptions critiques (rejouables) :
 * - 401 : Token JWT expiré (nécessite un rafraîchissement de session, pas un rejet DLQ)
 * - 429 : Rate Limit / Too Many Requests (doit être réessayé avec backoff)
 */
export function isPermanentClientError(statusCode) {
  const code = parseInt(statusCode, 10);
  if (isNaN(code)) return false;
  return code >= 400 && code < 500 && code !== 401 && code !== 429;
}

/**
 * Vérifie si un token JWT est expiré ou sur le point d'expirer (marge de sécurité de 120s)
 */
export function isJwtExpired(jwtToken, bufferSeconds = 120) {
  if (!jwtToken || typeof jwtToken !== "string") return true;
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= (nowSeconds + bufferSeconds);
  } catch (e) {
    return true;
  }
}

/**
 * Rafraîchit de manière autonome le token de session Supabase via l'endpoint auth REST
 * Fonctionne même si l'application web n'est pas ouverte
 */
export async function refreshSupabaseSession(refreshToken, supabaseUrl, supabaseAnonKey) {
  if (!refreshToken) return { success: false, error: "no_refresh_token" };
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "apikey": supabaseAnonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error_description || `http_${res.status}` };
    }
    const data = await res.json();
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      userId: data.user?.id
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
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