import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Camera, 
  Heart, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Move
} from 'lucide-react';
import { UniversalVideoPlayerModal } from './UniversalVideoPlayerModal';
import { getPlayableVideoSrc } from '../utils/mediaUtils';

export function ProductGallery({ images = [], videos = [], videoDemo, title, onOpenFullscreen }) {
  const [activeMedia, setActiveMedia] = useState('photo'); // 'photo' | 'video'
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  const allVideos = (Array.isArray(videos) && videos.length > 0)
    ? videos
    : (videoDemo?.videoUrl ? [videoDemo.videoUrl] : (typeof videoDemo === 'string' ? [videoDemo] : []));
  
  // Interactive Zoom State
  const [zoomLevel, setZoomLevel] = useState(1); // 1 to 3x
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const thumbnailsRef = useRef(null);

  const safeImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1200&q=90',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1200&q=90',
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1200&q=90',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=90'
  ];

  // Navigation main photo
  const handlePrevImage = (e) => {
    e?.stopPropagation();
    resetZoom();
    setCurrentImageIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    setActiveMedia('photo');
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    resetZoom();
    setCurrentImageIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
    setActiveMedia('photo');
  };

  // Zoom controls
  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = (e) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan / Drag handlers when zoomed
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Scroll thumbnails up & down (Alibaba style)
  const scrollThumbnailsUp = (e) => {
    e?.stopPropagation();
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ top: -85, behavior: 'smooth' });
    }
    resetZoom();
    setCurrentImageIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    setActiveMedia('photo');
  };

  const scrollThumbnailsDown = (e) => {
    e?.stopPropagation();
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ top: 85, behavior: 'smooth' });
    }
    resetZoom();
    setCurrentImageIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
    setActiveMedia('photo');
  };

  const triggerFullscreen = (e) => {
    e?.stopPropagation();
    if (onOpenFullscreen) {
      onOpenFullscreen(currentImageIndex);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      
      {/* GRAND ESPACE VISUEL HD STYLE ALIBABA */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '84px 1fr', 
        gap: '1rem', 
        position: 'relative',
        alignItems: 'stretch'
      }}>
        
        {/* LEFT COLUMN: Vertical Scrollable Thumbnails */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          height: '420px'
        }}>
          
          {/* Scroll Up Button */}
          <button
            onClick={scrollThumbnailsUp}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#0B1120',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Photo Précédente"
          >
            <ChevronUp size={22} />
          </button>

          {/* Vertical Scroll List */}
          <div 
            ref={thumbnailsRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto',
              flex: 1,
              width: '100%',
              padding: '2px',
              scrollbarWidth: 'none'
            }}
          >
            {safeImages.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  resetZoom();
                  setCurrentImageIndex(idx);
                  setActiveMedia('photo');
                }}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeMedia === 'photo' && currentImageIndex === idx 
                    ? '3px solid var(--blue-primary)' 
                    : '1px solid var(--border-subtle)',
                  boxShadow: activeMedia === 'photo' && currentImageIndex === idx 
                    ? '0 0 14px var(--primary-glow)' 
                    : 'none',
                  background: '#0B1120',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  position: 'relative'
                }}
              >
                <img 
                  src={imgUrl} 
                  alt={`Vignette ${idx + 1}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            ))}

            {/* Video Thumbnail Buttons (Multi-Vidéos) */}
            {allVideos.map((vidUrl, vIdx) => (
              <div
                key={`vid-${vIdx}`}
                onClick={() => {
                  resetZoom();
                  setCurrentVideoIndex(vIdx);
                  setActiveMedia('video');
                }}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeMedia === 'video' && currentVideoIndex === vIdx 
                    ? '3px solid var(--amber-gold)' 
                    : '1px solid var(--border-subtle)',
                  background: '#0B1120',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.2rem',
                  flexShrink: 0,
                  boxShadow: activeMedia === 'video' && currentVideoIndex === vIdx 
                    ? '0 0 14px var(--glow-amber)' 
                    : 'none'
                }}
                title={`Voir la vidéo #${vIdx + 1}`}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Play size={16} fill="#F59E0B" color="#F59E0B" style={{ marginLeft: '2px' }} />
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--amber-light)' }}>
                  {allVideos.length > 1 ? `Vidéo #${vIdx + 1}` : 'Vidéo'}
                </span>
              </div>
            ))}
          </div>

          {/* Scroll Down Button */}
          <button
            onClick={scrollThumbnailsDown}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#0B1120',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Photo Suivante"
          >
            <ChevronDown size={22} />
          </button>

        </div>

        {/* RIGHT: GRAND CADRE PHOTO HAUTE RÉSOLUTION AVEC OUTILS */}
        <div style={{
          position: 'relative',
          height: '420px',
          background: '#05080E',
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
        }}>

          {/* 🔍 BARRE D'OUTILS ZOOM & DEZOOM FLOTTANTE */}
          {activeMedia === 'photo' && (
            <div style={{
              position: 'absolute',
              top: 14,
              left: 14,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.3rem 0.5rem',
              borderRadius: '10px',
              zIndex: 25,
              boxShadow: 'var(--shadow-md)'
            }}>
              <button
                onClick={handleZoomIn}
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="Zoomer (+)"
              >
                <ZoomIn size={18} />
              </button>

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: zoomLevel > 1 ? 'var(--amber-light)' : 'white', fontWeight: 700, padding: '0 0.35rem', minWidth: '42px', textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                style={{ background: zoomLevel <= 1 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.1)', border: 'none', color: zoomLevel <= 1 ? 'var(--text-tertiary)' : 'white', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: zoomLevel <= 1 ? 'not-allowed' : 'pointer' }}
                title="Dézoomer (-)"
              >
                <ZoomOut size={18} />
              </button>

              {zoomLevel > 1 && (
                <button
                  onClick={resetZoom}
                  style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93C5FD', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  title="Réinitialiser"
                >
                  <RotateCcw size={12} />
                  <span>100%</span>
                </button>
              )}
            </div>
          )}

          {/* Top Floating Controls (Heart & Fullscreen Lightbox) */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: '0.5rem', zIndex: 25 }}>
            <button
              onClick={() => setIsLiked(!isLiked)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isLiked ? 'var(--rose-accent)' : 'white',
                boxShadow: 'var(--shadow-sm)'
              }}
              title="Favoris"
            >
              <Heart size={18} fill={isLiked ? 'var(--rose-accent)' : 'none'} />
            </button>

            <button
              onClick={triggerFullscreen}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                boxShadow: 'var(--glow-blue)'
              }}
              title="Ouvrir en Plein Écran Total (Télécharger / Modifier)"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Main Photo Container */}
          {activeMedia === 'photo' ? (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={zoomLevel === 1 ? triggerFullscreen : undefined}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                src={safeImages[currentImageIndex]} 
                alt={title || 'Photo Quincaillerie HD'} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transition: isDragging ? 'none' : 'transform 0.25s ease',
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
                draggable={false}
              />

              {/* ⬅️ PREV BUTTON (ALIBABA STYLE) */}
              <button
                onClick={handlePrevImage}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 20,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                title="Photo Précédente"
              >
                <ChevronLeft size={24} color="#0F172A" />
              </button>

              {/* ➡️ NEXT BUTTON (ALIBABA STYLE) */}
              <button
                onClick={handleNextImage}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 20,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                title="Photo Suivante"
              >
                <ChevronRight size={24} color="#0F172A" />
              </button>

              {/* Photo Index Indicator */}
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 14,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: 'white',
                fontFamily: 'var(--font-mono)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 20
              }}>
                📷 {currentImageIndex + 1} / {safeImages.length}
              </div>
            </div>
          ) : (
            /* 🎥 REAL VIDEO PLAYER STAGE (ALIBABA MULTI-VIDÉO STYLE & FLUX RÉSEAUX) */
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const rawVidUrl = allVideos[currentVideoIndex] || videoDemo?.videoUrl || '';
                const lower = (rawVidUrl || '').toLowerCase();
                const isDirectMp4 = rawVidUrl && (
                  lower.includes('.mp4') || 
                  lower.includes('mime_type=video') || 
                  lower.includes('video/tos') || 
                  lower.includes('tiktokcdn') || 
                  lower.includes('byteoversea') || 
                  lower.includes('alicdn') || 
                  rawVidUrl.startsWith('blob:') || 
                  rawVidUrl.startsWith('data:video') || 
                  lower.endsWith('.webm') || 
                  lower.endsWith('.mov')
                );
                const isYouTube = rawVidUrl && (rawVidUrl.includes('youtube.com') || rawVidUrl.includes('youtu.be'));
                const poster = videoDemo?.poster || safeImages[0] || '';

                if (isDirectMp4) {
                  return (
                    <video 
                      key={rawVidUrl || currentVideoIndex}
                      src={getPlayableVideoSrc(rawVidUrl)} 
                      poster={poster}
                      controls 
                      autoPlay 
                      loop 
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  );
                }

                if (isYouTube) {
                  let ytEmbedId = '';
                  const m1 = rawVidUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
                  const m2 = rawVidUrl.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
                  const m3 = rawVidUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
                  if (m1) ytEmbedId = m1[1];
                  else if (m2) ytEmbedId = m2[1];
                  else if (m3) ytEmbedId = m3[1];

                  if (ytEmbedId) {
                    return (
                      <iframe 
                        src={`https://www.youtube.com/embed/${ytEmbedId}?autoplay=1`}
                        title="Démonstration Vidéo YouTube"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                }

                // Flux Réseau Social Sécurisé (TikTok / Instagram / Facebook)
                return (
                  <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050811' }}>
                    <img 
                      src={poster} 
                      alt="Aperçu Démonstration"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem'
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoModalOpen(true);
                        }}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          boxShadow: '0 0 25px rgba(245, 158, 11, 0.8)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                        title="Visionner la vidéo en direct"
                      >
                        <Play size={24} fill="#000" style={{ marginLeft: '4px' }} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVideoModalOpen(true);
                        }}
                        style={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1.5px solid rgba(245, 158, 11, 0.5)',
                          color: '#FCD34D',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '0.35rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                        }}
                      >
                        <span>▶ Visionner la Vidéo sur {videoDemo?.source || 'TikTok / Réseau'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div style={{
                position: 'absolute',
                top: 12,
                left: 14,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                zIndex: 10,
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.95)',
                  color: '#0F172A',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Play size={12} fill="#0F172A" />
                  <span>VIDÉO {allVideos.length > 1 ? `${currentVideoIndex + 1}/${allVideos.length}` : 'USINE RÉELLE'}</span>
                </div>

                {allVideos.length > 1 && (
                  <div style={{ display: 'flex', gap: '3px', background: 'rgba(15, 23, 42, 0.9)', padding: '2px 4px', borderRadius: '6px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    {allVideos.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentVideoIndex(idx); }}
                        style={{
                          background: currentVideoIndex === idx ? '#F59E0B' : 'rgba(255,255,255,0.1)',
                          color: currentVideoIndex === idx ? '#000' : '#FFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 🔘 SÉLECTEUR PILULE DU BAS EXACTEMENT COMME SUR ALIBABA [ Photos | Video ] */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.35rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '4px',
          borderRadius: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          gap: '2px'
        }}>
          {/* Bouton Photos */}
          <button
            onClick={() => {
              resetZoom();
              setActiveMedia('photo');
            }}
            style={{
              padding: '0.45rem 1.35rem',
              borderRadius: '24px',
              fontSize: '0.84rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: activeMedia === 'photo' ? '#0F172A' : 'transparent',
              color: activeMedia === 'photo' ? '#FFFFFF' : '#475569',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeMedia === 'photo' ? '0 2px 10px rgba(15, 23, 42, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Camera size={15} />
            <span>Photos ({safeImages.length})</span>
          </button>

          {/* Bouton Vidéo */}
          <button
            onClick={() => {
              resetZoom();
              setActiveMedia('video');
            }}
            style={{
              padding: '0.45rem 1.35rem',
              borderRadius: '24px',
              fontSize: '0.84rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: activeMedia === 'video' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
              color: activeMedia === 'video' ? '#0F172A' : '#475569',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeMedia === 'video' ? '0 2px 10px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Play size={15} fill={activeMedia === 'video' ? '#0F172A' : 'currentColor'} />
            <span>Vidéo</span>
          </button>
        </div>
      </div>

      {/* 🎬 Lecteur Vidéo Universel Plein Écran */}
      <UniversalVideoPlayerModal 
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={allVideos[currentVideoIndex] || (typeof videoDemo === 'object' ? videoDemo?.videoUrl : videoDemo)}
        poster={images[0] || (typeof videoDemo === 'object' ? videoDemo?.poster : '')}
        title={title || 'Démonstration Vidéo'}
        platform={typeof videoDemo === 'object' ? videoDemo?.source : 'Réseaux Sociaux'}
      />

    </div>
  );
}
