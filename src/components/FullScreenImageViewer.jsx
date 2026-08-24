import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Download, 
  Edit3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Camera, 
  Move,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  LayoutGrid,
  Scaling,
  Expand,
  Eye,
  EyeOff,
  Heart
} from 'lucide-react';

export function FullScreenImageViewer({ 
  isOpen, 
  onClose, 
  images = [], 
  videoDemo,
  initialIndex = 0, 
  productTitle = '', 
  onOpenEdit 
}) {
  const [activeMedia, setActiveMedia] = useState('photo'); // 'photo' | 'video'
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLiked, setIsLiked] = useState(false);
  const [fitMode, setFitMode] = useState('auto-fill'); // 'auto-fill' | 'contain' | 'cover'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000);
  const [slideProgress, setSlideProgress] = useState(0);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const thumbnailsRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setActiveMedia('photo');
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsAutoPlaying(false);
    setSlideProgress(0);
  }, [initialIndex, isOpen]);

  const safeImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1600&q=95'
  ];

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setSlideProgress(0);
    setActiveMedia('photo');
    setCurrentIndex(prev => (prev === 0 ? safeImages.length - 1 : prev - 1));
  }, [safeImages.length]);

  const handleNext = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setSlideProgress(0);
    setActiveMedia('photo');
    setCurrentIndex(prev => (prev === safeImages.length - 1 ? 0 : prev + 1));
  }, [safeImages.length]);

  // Scroll thumbnails up & down (Alibaba style)
  const scrollThumbnailsUp = (e) => {
    e?.stopPropagation();
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ top: -90, behavior: 'smooth' });
    }
    handlePrev();
  };

  const scrollThumbnailsDown = (e) => {
    e?.stopPropagation();
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({ top: 90, behavior: 'smooth' });
    }
    handleNext();
  };

  // 🔄 DIAPORAMA AVANCÉ
  useEffect(() => {
    if (!isOpen || !isAutoPlaying || safeImages.length <= 1 || activeMedia !== 'photo') {
      setSlideProgress(0);
      return;
    }

    const intervalTime = 50;
    const step = (intervalTime / slideshowSpeed) * 100;

    const timer = setInterval(() => {
      setSlideProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isAutoPlaying, safeImages.length, slideshowSpeed, handleNext, activeMedia]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying(prev => !prev);
      }
      if (e.key === 'r' || e.key === 'R') {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      }
      if (e.key === '+' || e.key === '=') setZoomLevel(prev => Math.min(prev + 0.5, 4));
      if (e.key === '-') setZoomLevel(prev => Math.max(prev - 0.5, 1));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2.2);
    }
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Download Handler
  const handleDownload = async () => {
    try {
      const currentUrl = safeImages[currentIndex];
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${productTitle.replace(/[^a-zA-Z0-9]/g, '_')}_photo_${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(safeImages[currentIndex], '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#04070D',
        zIndex: 200000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease'
      }}
      onWheel={handleWheel}
    >
      
      {/* 🔝 HEADER TOOLBAR PRO ALIBABA */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: isHeaderCollapsed ? 'translate(-50%, -140%)' : 'translate(-50%, 0)',
        width: 'calc(100vw - 32px)',
        maxWidth: '1380px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(11, 17, 32, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        padding: '0.35rem 0.85rem',
        borderRadius: '14px',
        zIndex: 200010,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.65)',
        opacity: isHeaderCollapsed ? 0 : 1,
        pointerEvents: isHeaderCollapsed ? 'none' : 'auto',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        
        {/* GAUCHE : Fil d'Ariane & Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: '1 1 auto', marginRight: '0.75rem' }}>
          <span style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: 'white',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            fontWeight: 800,
            whiteSpace: 'nowrap'
          }}>
            {activeMedia === 'video' ? '🎥 Vidéo' : `${currentIndex + 1} / ${safeImages.length}`}
          </span>
          <span style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '480px'
          }} title={productTitle}>
            {productTitle}
          </span>
        </div>

        {/* DROITE : Barre d'actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          
          {/* Zoom rapide */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '0.12rem 0.35rem',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={handleZoomIn}
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.25rem', cursor: 'pointer' }}
              title="Zoomer (+)"
            >
              <ZoomIn size={15} />
            </button>
            <span style={{ fontSize: '0.74rem', color: '#93C5FD', fontWeight: 800, minWidth: '38px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              style={{ background: 'transparent', border: 'none', color: zoomLevel <= 1 ? '#64748B' : 'white', padding: '0.25rem', cursor: zoomLevel <= 1 ? 'not-allowed' : 'pointer' }}
              title="Dézoomer (-)"
            >
              <ZoomOut size={15} />
            </button>
          </div>

          {/* Diaporama */}
          {safeImages.length > 1 && (
            <button
              onClick={() => setIsAutoPlaying(p => !p)}
              style={{
                background: isAutoPlaying ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isAutoPlaying ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                color: isAutoPlaying ? '#34D399' : 'white',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
              title="Lancer le Diaporama (Espace)"
            >
              {isAutoPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>Diaporama</span>
            </button>
          )}

          {/* Télécharger */}
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
            }}
            title="Télécharger cette photo HD"
          >
            <Download size={13} />
            <span>Télécharger</span>
          </button>

          {/* Modifier */}
          {onOpenEdit && (
            <button
              onClick={() => {
                onClose();
                onOpenEdit();
              }}
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93C5FD',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer'
              }}
              title="Modifier les photos de l'article"
            >
              <Edit3 size={13} />
              <span>Modifier</span>
            </button>
          )}

          {/* Bouton Fermer */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#FDA4AF',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
            title="Fermer (Échap)"
          >
            <X size={14} />
            <span>Fermer</span>
          </button>
        </div>

      </div>

      {/* 🌟 DISPOSITION ALIBABA : VIGNETTES VERTICALES À GAUCHE + STAGE CENTRAL */}
      <div style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        alignItems: 'center',
        padding: '70px 20px 80px 20px',
        gap: '1.5rem',
        boxSizing: 'border-box'
      }}>
        
        {/* 1️⃣ COLONNE DE VIGNETTES VERTICALES ALIBABA À GAUCHE */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          height: '100%',
          maxHeight: 'calc(100vh - 170px)',
          justifyContent: 'center',
          zIndex: 650
        }}>
          
          {/* Scroll Up Button */}
          <button
            onClick={scrollThumbnailsUp}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              flexShrink: 0
            }}
            title="Photo Précédente"
          >
            <ChevronUp size={22} />
          </button>

          {/* Liste verticale défilable */}
          <div 
            ref={thumbnailsRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              overflowY: 'auto',
              flex: 1,
              width: '100%',
              padding: '2px',
              alignItems: 'center',
              scrollbarWidth: 'none'
            }}
          >
            {safeImages.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                  setCurrentIndex(idx);
                  setActiveMedia('photo');
                }}
                onMouseEnter={() => {
                  setZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                  setCurrentIndex(idx);
                  setActiveMedia('photo');
                }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeMedia === 'photo' && idx === currentIndex ? '3.5px solid #2563EB' : '1.5px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: activeMedia === 'photo' && idx === currentIndex ? '0 0 18px rgba(37, 99, 235, 0.6)' : 'none',
                  transition: 'all 0.2s ease',
                  opacity: activeMedia === 'photo' && idx === currentIndex ? 1 : 0.6,
                  background: '#0B1120',
                  flexShrink: 0
                }}
              >
                <img src={imgUrl} alt={`Vignette ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}

            {/* Vignette Vidéo */}
            {videoDemo && (
              <div
                onClick={() => {
                  setZoomLevel(1);
                  setActiveMedia('video');
                }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeMedia === 'video' ? '3.5px solid #F59E0B' : '1.5px solid rgba(255, 255, 255, 0.15)',
                  background: '#0B1120',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  flexShrink: 0,
                  opacity: activeMedia === 'video' ? 1 : 0.6,
                  boxShadow: activeMedia === 'video' ? '0 0 18px rgba(245, 158, 11, 0.6)' : 'none'
                }}
                title="Lire la vidéo usine"
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Play size={16} fill="#F59E0B" color="#F59E0B" style={{ marginLeft: '2px' }} />
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FCD34D' }}>Vidéo</span>
              </div>
            )}
          </div>

          {/* Scroll Down Button */}
          <button
            onClick={scrollThumbnailsDown}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              flexShrink: 0
            }}
            title="Photo Suivante"
          >
            <ChevronDown size={22} />
          </button>

        </div>

        {/* 2️⃣ GRAND STAGE CENTRAL D'AFFICHAGE MULTIMÉDIA (PHOTOS OU VIDÉO) */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '20px',
            background: '#060A12',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: activeMedia === 'photo' && zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          
          {/* Action Icons Floating Top Right (Heart / Like) */}
          <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 630, display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setIsLiked(!isLiked)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isLiked ? '#F43F5E' : 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
              }}
              title="Ajouter aux Favoris"
            >
              <Heart size={20} fill={isLiked ? '#F43F5E' : 'none'} />
            </button>
          </div>

          {activeMedia === 'photo' ? (
            <>
              {/* ⬅️ PREV BUTTON (ALIBABA STYLE) */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 620,
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.45)',
                  transition: 'all 0.2s ease'
                }}
                title="Photo précédente"
              >
                <ChevronLeft size={30} color="#0F172A" />
              </button>

              {/* 🌟 IMAGE PLEIN FORMAT HD */}
              <img 
                key={currentIndex}
                src={safeImages[currentIndex]} 
                alt={`${productTitle} - Grand Format`}
                style={{
                  width: fitMode === 'cover' ? '100%' : 'auto',
                  height: fitMode === 'cover' ? '100%' : 'auto',
                  maxWidth: '92%',
                  maxHeight: '90%',
                  objectFit: fitMode === 'cover' ? 'cover' : 'contain',
                  borderRadius: '12px',
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  userSelect: 'none',
                  pointerEvents: 'auto',
                  animation: 'fadeIn 0.25s ease'
                }}
                draggable={false}
              />

              {/* ➡️ NEXT BUTTON (ALIBABA STYLE) */}
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 620,
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.45)',
                  transition: 'all 0.2s ease'
                }}
                title="Photo suivante"
              >
                <ChevronRight size={30} color="#0F172A" />
              </button>
            </>
          ) : (
            /* 🎥 REAL VIDEO PLAYER (ALIBABA STYLE) */
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <video 
                src={videoDemo?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-power-drill-screwing-a-screw-into-wood-41712-large.mp4'} 
                controls 
                autoPlay 
                loop 
                style={{ width: '90%', height: '85%', objectFit: 'contain', borderRadius: '12px' }} 
              />
              <div style={{
                position: 'absolute',
                bottom: 24,
                left: 30,
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'white'
              }}>
                🎥 Démonstration Usine Douyin / 1688 ({videoDemo?.views || '240K vues'})
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 🔘 3️⃣ SÉLECTEUR PILULE DU BAS EXACTEMENT COMME SUR ALIBABA [ Photos | Video ] */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200010
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '4px',
          borderRadius: '30px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          gap: '2px'
        }}>
          {/* Bouton Photos */}
          <button
            onClick={() => {
              setZoomLevel(1);
              setActiveMedia('photo');
            }}
            style={{
              padding: '0.5rem 1.6rem',
              borderRadius: '24px',
              fontSize: '0.88rem',
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
            <Camera size={16} />
            <span>Photos ({safeImages.length})</span>
          </button>

          {/* Bouton Vidéo */}
          <button
            onClick={() => {
              setZoomLevel(1);
              setActiveMedia('video');
            }}
            style={{
              padding: '0.5rem 1.6rem',
              borderRadius: '24px',
              fontSize: '0.88rem',
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
            <Play size={16} fill={activeMedia === 'video' ? '#0F172A' : 'currentColor'} />
            <span>Vidéo</span>
          </button>
        </div>
      </div>

    </div>
  );
}
