/**
 * ☁️ SUPABASE STORAGE MANAGER - UPLOAD DIRECT PHOTOS & VIDÉOS
 * Téléversement automatique et permanent des fichiers images et vidéos dans Supabase Storage (Buckets)
 * Génère des URLs CDN mondiales haute vitesse et synchronise avec le cache local IndexedDB.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { cacheMediaUrl } from './indexedMediaDB';

export const BUCKET_MEDIA = 'product-media';
export const BUCKET_IMAGES = 'product-images';
export const BUCKET_VIDEOS = 'product-videos';

/**
 * Nettoie le nom de fichier pour Supabase Storage
 */
function sanitizeStorageFilename(fileName) {
  if (!fileName) return `file_${Date.now()}`;
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * 🚀 Téléverse un fichier physique (File / Blob / Buffer) directement dans Supabase Storage
 * @param {File|Blob} file - Le fichier physique sélectionné depuis le PC ou Mobile
 * @param {Object} options - { bucket, folder, onProgress }
 * @returns {Promise<{ success: boolean, publicUrl: string, error?: string }>}
 */
export async function uploadFileToSupabaseStorage(file, options = {}) {
  const {
    bucket = BUCKET_MEDIA,
    folder = 'uploads',
    customFileName = null
  } = options;

  if (!file) {
    return { success: false, error: 'Aucun fichier fourni' };
  }

  // 1. Si Supabase est configuré
  if (supabase && isSupabaseConfigured) {
    try {
      const originalName = customFileName || file.name || `media_${Date.now()}`;
      const ext = originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : (file.type?.includes('video') ? 'mp4' : 'jpg');
      const baseName = originalName.includes('.') ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
      const cleanBase = sanitizeStorageFilename(baseName);
      const filePath = `${folder}/${Date.now()}_${cleanBase}.${ext}`;

      const contentType = file.type || (ext === 'mp4' ? 'video/mp4' : ext === 'png' ? 'image/png' : 'image/jpeg');

      // Téléversement vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 an de cache CDN
          upsert: true,
          contentType: contentType
        });

      if (error) {
        console.warn(`[Supabase Storage] Upload dans '${bucket}' échoué, essai dans bucket public par défaut...`, error.message);
        
        // Essai de secours dans le bucket générique 'product-media'
        if (bucket !== BUCKET_MEDIA) {
          const fallbackRes = await supabase.storage
            .from(BUCKET_MEDIA)
            .upload(filePath, file, {
              cacheControl: '31536000',
              upsert: true,
              contentType: contentType
            });
            
          if (!fallbackRes.error) {
            const { data: pubData } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(filePath);
            if (pubData && pubData.publicUrl) {
              cacheMediaUrl(pubData.publicUrl);
              return { success: true, publicUrl: pubData.publicUrl, filePath };
            }
          }
        }
        throw error;
      }

      // Récupérer l'URL publique CDN Supabase
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        const finalUrl = publicUrlData.publicUrl;
        // Mettre en cache local pour accès 0ms
        cacheMediaUrl(finalUrl);
        return {
          success: true,
          publicUrl: finalUrl,
          filePath
        };
      }
    } catch (err) {
      console.error('[Supabase Storage Upload Error]:', err);
    }
  }

  // 2. Repli Local (IndexedDB / DataURL / Blob URL) si Supabase non accessible
  try {
    const localBlobUrl = URL.createObjectURL(file);
    cacheMediaUrl(localBlobUrl);
    return {
      success: true,
      publicUrl: localBlobUrl,
      isLocal: true
    };
  } catch (e) {
    return { success: false, error: 'Impossible de traiter le fichier' };
  }
}

/**
 * 🌐 Télécharge une URL distante (Alibaba / TikTok) et l'enregistre de manière permanente dans Supabase Storage
 */
export async function uploadRemoteUrlToSupabaseStorage(remoteUrl, options = {}) {
  if (!remoteUrl || typeof remoteUrl !== 'string') return remoteUrl;

  // Si c'est déjà une URL Supabase
  if (remoteUrl.includes('supabase.co/storage')) {
    return remoteUrl;
  }

  if (!supabase || !isSupabaseConfigured) {
    return remoteUrl;
  }

  try {
    const isVideo = remoteUrl.toLowerCase().includes('.mp4') || remoteUrl.includes('video');
    const folder = isVideo ? 'videos' : 'images';
    const bucket = isVideo ? BUCKET_VIDEOS : BUCKET_IMAGES;

    const res = await fetch(remoteUrl);
    if (!res.ok) return remoteUrl;

    const blob = await res.blob();
    const uploadResult = await uploadFileToSupabaseStorage(blob, {
      bucket: BUCKET_MEDIA,
      folder: folder,
      customFileName: `scraped_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
    });

    if (uploadResult && uploadResult.success && uploadResult.publicUrl) {
      return uploadResult.publicUrl;
    }
  } catch (err) {
    console.warn('[Remote to Supabase Upload Skipped]:', err);
  }

  return remoteUrl;
}
