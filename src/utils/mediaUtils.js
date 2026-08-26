/**
 * Utilitaire universel pour résoudre les flux vidéo et contourner les restrictions CORS / Referer (TikTok / Instagram / Alibaba)
 */
export function getPlayableVideoSrc(url) {
  if (!url) return '';
  
  // 1. Flux déjà locaux, Blob ou Base64
  if (
    url.startsWith('blob:') || 
    url.startsWith('data:') || 
    url.startsWith('/downloaded_videos/') || 
    url.includes('127.0.0.1')
  ) {
    return url;
  }

  // 2. Flux CDN protégés (TikTok, ByteDance, Instagram) -> Passage par le Proxy Video local
  const lower = url.toLowerCase();
  if (
    lower.includes('tiktok') || 
    lower.includes('byteoversea') || 
    lower.includes('tiktokcdn') || 
    lower.includes('cdninstagram')
  ) {
    return `/api/proxy-video?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function isDirectPlayableVideo(url) {
  if (!url) return false;
  const lower = url.toLowerCase();

  // Pages web sociales = NON direct MP4 (doivent utiliser l'iframe player ou le modal)
  if (
    lower.includes('tiktok.com/@') || 
    lower.includes('tiktok.com/video/') || 
    lower.includes('instagram.com/reel') || 
    lower.includes('instagram.com/p/') || 
    lower.includes('youtube.com/watch') || 
    lower.includes('youtu.be/') || 
    lower.includes('youtube.com/shorts')
  ) {
    return false;
  }

  return (
    lower.includes('.mp4') || 
    lower.includes('mime_type=video') || 
    lower.includes('video/tos') || 
    url.startsWith('data:video') || 
    url.startsWith('blob:') || 
    url.startsWith('/downloaded_videos/') || 
    lower.endsWith('.webm') || 
    lower.endsWith('.mov')
  );
}
