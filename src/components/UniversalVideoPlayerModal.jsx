import React from 'react';
import { X, Play, ExternalLink, Maximize2, Sparkles, Volume2 } from 'lucide-react';
import { getPlayableVideoSrc } from '../utils/mediaUtils';

export function getUniversalVideoInfo(url) {
  if (!url) return { type: 'unknown', embedUrl: null, directUrl: '' };
  
  const lower = url.toLowerCase();

  // 1. TikTok (Page Web & ID)
  const tiktokMatch = url.match(/\/video\/(\d+)/) || (lower.includes('tiktok') ? url.match(/(\d{15,})/) : null);
  if (tiktokMatch && (lower.includes('tiktok') || lower.includes('douyin'))) {
    const vidId = tiktokMatch[1];
    return {
      type: 'tiktok',
      embedUrl: `https://www.tiktok.com/player/v1/${vidId}?autoplay=1`,
      fallbackEmbedUrl: `https://www.tiktok.com/embed/v2/${vidId}`,
      directUrl: url.startsWith('http') && url.includes('tiktok.com/@') ? url : `https://www.tiktok.com/@user/video/${vidId}`,
      platformName: 'TikTok'
    };
  }

  // 2. YouTube
  let ytId = '';
  const m1 = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  const m3 = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  const m4 = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (m1) ytId = m1[1];
  else if (m2) ytId = m2[1];
  else if (m3) ytId = m3[1];
  else if (m4) ytId = m4[1];

  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
      directUrl: `https://www.youtube.com/watch?v=${ytId}`,
      platformName: 'YouTube'
    };
  }

  // 3. Instagram
  const instaMatch = url.match(/\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  if (instaMatch && lower.includes('instagram.com')) {
    const code = instaMatch[1];
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/reel/${code}/embed/`,
      directUrl: url,
      platformName: 'Instagram'
    };
  }

  // 4. Flux Vidéo Direct MP4 / Alibaba / WebM / Blob
  if (
    lower.includes('.mp4') || 
    lower.includes('mime_type=video') || 
    lower.includes('video/tos') || 
    lower.startsWith('blob:') || 
    lower.startsWith('data:video') || 
    lower.startsWith('/downloaded_videos/') || 
    lower.endsWith('.webm') || 
    lower.endsWith('.mov')
  ) {
    return {
      type: 'mp4',
      embedUrl: url,
      directUrl: url,
      platformName: 'Vidéo MP4 Haute Définition'
    };
  }

  return {
    type: 'web',
    embedUrl: null,
    directUrl: url,
    platformName: 'Flux Web'
  };
}

export function UniversalVideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  poster,
  title = 'Démonstration Vidéo',
  platform = 'Réseaux Sociaux'
}) {
  if (!isOpen || !videoUrl) return null;

  const info = getUniversalVideoInfo(videoUrl);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 260000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          background: '#0B1120',
          border: '1.5px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(245, 158, 11, 0.25)',
          animation: 'scaleUp 0.2s ease'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FCD34D',
              flexShrink: 0
            }}>
              <Play size={16} fill="#FCD34D" style={{ marginLeft: '2px' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#93C5FD' }}>
                Lecteur Vidéo Interactif • {info.platformName || platform}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {info.directUrl && (
              <a
                href={info.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FCD34D',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <ExternalLink size={12} />
                <span>Ouvrir sur {info.platformName || 'Site'} ↗</span>
              </a>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Player Stage */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '520px',
          maxHeight: 'calc(80vh - 80px)',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {info.type === 'mp4' ? (
            <video
              src={getPlayableVideoSrc(info.embedUrl || videoUrl)}
              poster={poster || ''}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : info.embedUrl ? (
            <iframe
              src={info.embedUrl}
              title={title}
              style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={poster || 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg'}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.6 }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', background: 'rgba(0,0,0,0.5)' }}>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.8)',
                    textDecoration: 'none'
                  }}
                >
                  <Play size={28} fill="#000" style={{ marginLeft: '4px' }} />
                </a>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#F59E0B',
                    color: '#000',
                    padding: '0.5rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none'
                  }}
                >
                  Regarder la Vidéo en Direct sur {platform} ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
