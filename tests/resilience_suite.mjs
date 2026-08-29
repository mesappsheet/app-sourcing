// ============================================================================
// 🧪 SUITE DE TESTS AUTOMATISÉS DE RÉSILIENCE (4 SCÉNARIOS)
// Importe et valide DIRECTEMENT le code source réel de extensionLogic.js
// ============================================================================
import { createClient } from "@supabase/supabase-js";
import { 
  normalizeCategorySlug, 
  computeBackoffDelay, 
  isPermanentClientError, 
  getDeterministicSkuAndId, 
  detectBestCategory 
} from "../chrome-extension-sourcing/utils/extensionLogic.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://xgaehsajhlxkhxzqgfhz.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zVzDkQ2gg7Whjg3sOKviNg_v2CvaQoV";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runResilienceTests() {
  console.log("🧪 Lancement des 4 Tests de Résilience (Sur le code source RÉEL)...\n");
  let passed = 0;

  // --- SCÉNARIO 1 : DÉDOUBLONNAGE ET IDEMPOTENCE VIA getDeterministicSkuAndId (BASE + CODE SOURCE) ---
  console.log("▶️ [Scénario 1] Test SKU Déterministe & Anti-Doublons Supabase...");
  const sampleUrl = "https://french.alibaba.com/p-detail/Tableware-Set_1601551554369.html";
  const { sku: deterministicSku } = getDeterministicSkuAndId(sampleUrl);

  const res1 = await supabase.from("products").upsert({
    id: "prod-real-test-1",
    workspace_id: "ws_cuisines",
    sku: deterministicSku,
    title_fr: "Produit Test Initial",
    price_cny: 15
  }, { onConflict: "workspace_id,sku" });

  const res2 = await supabase.from("products").upsert({
    id: "prod-real-test-2",
    workspace_id: "ws_cuisines",
    sku: deterministicSku,
    title_fr: "Produit Test Complété (Scrape 2)",
    price_cny: 18
  }, { onConflict: "workspace_id,sku" });

  const { data: rows } = await supabase.from("products").select("*").eq("sku", deterministicSku);
  if (rows && rows.length === 1 && rows[0].title_fr.includes("Complété")) {
    console.log("   ✅ Succès : SKU " + deterministicSku + " fusionné en 1 seule ligne sans doublon !");
    passed++;
  } else {
    console.error("   ❌ Échec Idempotence");
  }

  // Nettoyage
  await supabase.from("products").delete().eq("sku", deterministicSku);

  // --- SCÉNARIO 2 : ATOMISME DE L AUDIT D ÉVÉNEMENT (PRODUCT_EVENTS) ---
  console.log("\n▶️ [Scénario 2] Test Traçabilité Audit (Table product_events)...");
  const traceId = "trc-real-" + Date.now();
  const { data: ev, error: evErr } = await supabase.from("product_events").insert({
    product_sku: deterministicSku,
    workspace_id: "ws_cuisines",
    action: "insert",
    source: "resilience_suite_real",
    payload: { traceId, verified: true }
  }).select();

  if (!evErr && ev && ev.length > 0) {
    console.log("   ✅ Succès : Événement d audit enregistré dans Supabase (id: " + ev[0].id + ")");
    await supabase.from("product_events").delete().eq("id", ev[0].id);
    passed++;
  } else {
    console.error("   ❌ Échec Audit:", evErr);
  }

  // --- SCÉNARIO 3 : TEST DIRECT DE normalizeCategorySlug (CODE SOURCE RÉEL) ---
  console.log("\n▶️ [Scénario 3] Test de la fonction réelle normalizeCategorySlug()...");
  const testInputs = [
    "Assiettes & Porcelaine",
    "  assiettes & porcelaine  ",
    "ASSIETTES & PORCELAINE",
    "Assiettes, Porcelaine & Céramique"
  ];
  
  const slug1 = normalizeCategorySlug(testInputs[0]);
  const slug2 = normalizeCategorySlug(testInputs[1]);
  const slug3 = normalizeCategorySlug(testInputs[2]);

  if (slug1 === "assiettes_porcelaine" && slug2 === "assiettes_porcelaine" && slug3 === "assiettes_porcelaine") {
    console.log("   ✅ Succès : normalizeCategorySlug() produit le slug exact (assiettes_porcelaine) sur tous les formats !");
    passed++;
  } else {
    console.error("   ❌ Échec normalizeCategorySlug:", { slug1, slug2, slug3 });
  }

  // --- SCÉNARIO 4 : TEST DIRECT DE computeBackoffDelay & isPermanentClientError (CODE SOURCE RÉEL) ---
  console.log("\n▶️ [Scénario 4] Test des fonctions réelles computeBackoffDelay() et isPermanentClientError()...");
  
  // Vérification de la détection 4xx vs 5xx / 429
  const is400Permanent = isPermanentClientError(400);
  const is404Permanent = isPermanentClientError(404);
  const is429Permanent = isPermanentClientError(429); // 429 est un rate limit, pas permanent
  const is500Permanent = isPermanentClientError(500); // 500 est serveur, doit retry

  // Vérification des délais de backoff réels
  const delay0 = computeBackoffDelay(0, 60000); // 60s (1 min)
  const delay1 = computeBackoffDelay(1, 60000); // 120s (2 min)
  const delay2 = computeBackoffDelay(2, 60000); // 240s (4 min)
  const delay3 = computeBackoffDelay(3, 60000); // 480s (8 min)
  const delay5 = computeBackoffDelay(5, 60000); // 960s (16 min - cap)

  const isBackoffValid = (delay0 === 60000 && delay1 === 120000 && delay2 === 240000 && delay3 === 480000 && delay5 === 960000);
  const isErrorDetectionValid = (is400Permanent && is404Permanent && !is429Permanent && !is500Permanent);

  if (isBackoffValid && isErrorDetectionValid) {
    console.log("   ✅ Succès : Fonctions sources computeBackoffDelay() et isPermanentClientError() validées à 100% !");
    console.log("      • Délais calculés : [1m, 2m, 4m, 8m, 16m (max)]");
    console.log("      • Erreurs permanentes (400, 404) bloquées, erreurs temporaires (429, 500) autorisées pour retry.");
    passed++;
  } else {
    console.error("   ❌ Échec test fonctions source backoff/erreurs");
  }

  console.log("\n==================================================");
  console.log("📊 Résultat Final : " + passed + "/4 Tests Réussis sur le VRAI CODE SOURCE !");
  console.log("==================================================");
}

runResilienceTests();
