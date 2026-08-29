import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera, Video, Maximize2, Sparkles, Play, Pause, Factory, GripVertical, Tag, Layers, CornerDownRight, AlertTriangle, ImageOff, Loader2 } from 'lucide-react';
import { useCachedMedia, cacheProductImagesAndVideos } from '../utils/indexedMediaDB';

export function formatImportDate(product) {
  if (!product) return 'Récemment';
  if (product.injectedAtFormatted) return product.injectedAtFormatted;
  
  let rawDate = product.injectedAt || product.createdAt || product.created_at || product.injected_at || product.timestamp;
  
  if (!rawDate && product.id && typeof product.id === 'string' && product.id.startsWith('prod-')) {
    const ts = parseInt(product.id.replace('prod-', ''), 10);
    if (!isNaN(ts) && ts > 1600000000000) {
      rawDate = ts;
    }
  }

  if (!rawDate) return 'Aujourd\'hui';

  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return 'Récemment';
  }
}

export function ProductCard({ 
  product, 
  isSelected, 
  onSelect, 
  onOpenImageViewer,
  formatPrice,
  categories = [],
  onMoveProductToCategory,
  onOpenContextMenu,
  isDuplicate = false
}) {
  const cardRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [imgLoading, setImgLoading] = useState(true);

  // ⚡ LAZY LOADING VIA INTERSECTION OBSERVER (0% de charge CPU/RAM hors écran)
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin: '250px' } // Précharge 250px avant l'apparition
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];

  // Résolution automatique depuis le cache IndexedDB local (seulement si la carte est visible)
  const currentImgSrc = useCachedMedia((isInView && images.length > 0) ? images[currentImgIdx] : null);

  // Téléchargement automatique en arrière-plan des photos et vidéos uniquement quand visible
  useEffect(() => {
    if (isInView && images.length > 0) {
      cacheProductImagesAndVideos(product);
    }
  }, [isInView, product, images.length]);

  // Reset loading on currentImgIdx change
  useEffect(() => {
    setImgLoading(true);
  }, [currentImgIdx]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setImgLoading(true);
    setCurrentImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    setImgLoading(true);
    setCurrentImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (images.length > 0 && onOpenImageViewer) {
      onOpenImageViewer(product, currentImgIdx);
    } else {
      onSelect(product);
    }
  };

  // Preferred supplier platform badge (Alibaba or Pinduoduo)
  const supplier = product.suppliers?.[0] || {};
  const isPinduoduo = supplier.platform === 'pinduoduo' || supplier.name?.toLowerCase().includes('pinduoduo');
  const platformName = isPinduoduo ? 'Pinduoduo' : 'Alibaba';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', product.id);
    e.dataTransfer.setData('productId', product.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={cardRef}
      className={`product-item-card ${isSelected ? 'selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onClick={() => onSelect(product)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenContextMenu) onOpenContextMenu(e, product);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '18px',
        padding: '1.25rem',
        background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-card)',
        border: `1.5px solid ${isSelected ? 'var(--blue-light)' : 'var(--border-subtle)'}`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected ? '0 0 20px rgba(37, 99, 235, 0.25)' : 'var(--shadow-sm)',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div>
        {/* GRAND CADRE PHOTO HAUTE DÉFINITION AVEC AUTO-DÉFILEMENT */}
        <div 
          className="product-media-preview" 
          onClick={handleImageClick}
          style={{ 
            position: 'relative', 
            overflow: 'hidden',
            borderRadius: '14px',
            height: '240px',
            background: 'radial-gradient(circle at center, #111827 0%, #070C14 100%)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            cursor: images.length > 0 ? 'zoom-in' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={images.length > 0 ? "Cliquez pour agrandir en plein écran HD" : "Cliquez pour voir la fiche"}
        >
          {images.length === 0 ? (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              background: 'radial-gradient(circle at center, #1E293B 0%, #070C14 100%)',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <Camera size={32} color="#60A5FA" opacity={0.6} />
              <span style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 700 }}>
                Prêt pour nouvelles photos
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                Importez depuis l'extension Chrome
              </span>
            </div>
          ) : (
            <>
              {/* Skeleton / Loading Indicator */}
              {imgLoading && !failedImages[currentImgIdx] && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(11, 17, 32, 0.85)',
                  zIndex: 3
                }}>
                  <Loader2 size={24} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}

              {/* Failed Image Fallback */}
              {failedImages[currentImgIdx] ? (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  background: 'radial-gradient(circle at center, #1E293B 0%, #070C14 100%)',
                  padding: '1rem',
                  textAlign: 'center',
                  zIndex: 2
                }}>
                  <ImageOff size={28} color="#64748B" />
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                    Photo non disponible
                  </span>
                </div>
              ) : (
                <img 
                  key={currentImgIdx}
                  src={currentImgSrc} 
                  alt={`${product.titleFr} - photo ${currentImgIdx + 1}`}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImgLoading(false)}
                  onError={() => {
                    setImgLoading(false);
                    setFailedImages(prev => ({ ...prev, [currentImgIdx]: true }));
                  }}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 0.35s ease, opacity 0.3s ease',
                    opacity: imgLoading ? 0 : 1,
                    animation: 'fadeIn 0.4s ease'
                  }}
                />
              )}
            </>
          )}

          {/* 🎬 POSTER VIDÉO INTERACTIF SUR SURVOL */}
          {product?.videos && product.videos.length > 0 && isHovered && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 8,
                cursor: 'pointer',
                animation: 'fadeIn 0.2s ease'
              }}
              title="Cliquez pour lancer la vidéo démonstration"
            >
              <div style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#0F172A',
                padding: '0.5rem 1rem',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 900,
                fontSize: '0.78rem',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.6)',
                transform: 'scale(1.05)'
              }}>
                <Play size={16} fill="#0F172A" />
                <span>Voir Démo Vidéo</span>
              </div>
            </div>
          )}

          {/* Platform Origin Badge (Alibaba / Pinduoduo) Top Left */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 5
          }}>
            <div style={{
              background: isPinduoduo 
                ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.9), rgba(190, 18, 60, 0.9))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9))',
              backdropFilter: 'blur(6px)',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              <span>{isPinduoduo ? '🔴 Pinduoduo Usine' : '🟡 Alibaba Verified'}</span>
            </div>

            {/* ⚠️ SIGNALEMENT DE DOUBLON */}
            {isDuplicate && (
              <div 
                className="duplicate-badge"
                title="⚠️ Cet article a été importé en plusieurs exemplaires dans votre espace."
              >
                <AlertTriangle size={11} color="#EF4444" />
                <span>Doublon Détecté</span>
              </div>
            )}
          </div>

          {/* Top Right Controls & Badges (Drag Handle + Videos + Photos Counter) */}
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            zIndex: 6
          }}>
            {/* Poignée de Glissement (Drag Handle) */}
            <div 
              className="product-drag-handle"
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '0.2rem 0.45rem',
                borderRadius: '6px',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#93C5FD',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                cursor: 'grab',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
              title="Glissez-déposez cet article sur un rayon à gauche pour le reclasser"
            >
              <GripVertical size={13} />
              <span>Glisser</span>
            </div>

            {/* Badge Vidéo */}
            {product?.videos && product.videos.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.92)',
                backdropFilter: 'blur(8px)',
                padding: '0.2rem 0.45rem',
                borderRadius: '6px',
                fontSize: '0.66rem',
                fontWeight: 900,
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
              title={`${product.videos.length} vidéo(s) disponible(s)`}>
                <Video size={12} />
                <span>{product.videos.length > 1 ? `${product.videos.length} Vids` : 'Vid'}</span>
              </div>
            )}

            {/* Compteur Photos */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Camera size={12} />
              <span>{currentImgIdx + 1}/{images.length}</span>
            </div>
          </div>

          {/* ⬅️ PREV BUTTON */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.92)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 3px 10px rgba(0,0,0,0.7)',
                transition: 'transform 0.15s ease'
              }}
              title="Photo précédente"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* ➡️ NEXT BUTTON */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.92)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 3px 10px rgba(0,0,0,0.7)',
                transition: 'transform 0.15s ease'
              }}
              title="Photo suivante"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Bottom Center: Pagination Dots Indicator */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 5,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {images.map((_, i) => (
                <div 
                  key={i}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setImgLoading(true);
                    setCurrentImgIdx(i); 
                  }}
                  style={{
                    width: i === currentImgIdx ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: failedImages[i] 
                      ? '#EF4444' 
                      : (i === currentImgIdx ? 'var(--blue-light)' : 'rgba(255,255,255,0.4)'),
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  title={failedImages[i] ? `Photo ${i + 1} (inaccessible)` : `Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title & SKU & Multi-Factories Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {product?.sku || 'SKU-001'}
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {/* Badge Catégorie / Magasin d'Arrivage */}
            {product?.category === 'inbox' ? (
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #F59E0B',
                color: '#FCD34D',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.12rem 0.45rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>📥</span>
                <span>Magasin d'Arrivage</span>
              </span>
            ) : (
              <span className="badge badge-blue" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                {product?.category || 'Non Classé'}
              </span>
            )}

            {/* Bouton Clic Droit / Reclassement Rapide */}
            {onOpenContextMenu && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenContextMenu(e, product);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93C5FD',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.12rem 0.45rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title="Faites un clic droit ou cliquez ici pour classer dans une sous-catégorie"
              >
                <span>⚡ Reclasser</span>
                <CornerDownRight size={11} />
              </button>
            )}
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#FCD34D',
              padding: '0.1rem 0.45rem',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: 800
            }}>
              🏢 {Array.isArray(product?.suppliers) ? product.suppliers.length : 1} Usine{(Array.isArray(product?.suppliers) ? product.suppliers.length : 1) > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <h3 className="product-title" style={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.35, margin: '0.2rem 0' }}>
          {product?.titleFr || 'Article sans titre'}
        </h3>

        {/* Ligne Matériau + Date et Heure d'Importation (Emplacement Encadré) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.25rem',
          marginBottom: '0.35rem',
          gap: '0.4rem'
        }}>
          <p className="product-subtitle" style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '52%'
          }}>
            {product?.material || 'Standard Qualité Usine'}
          </p>

          {/* 🕒 Horodatage d'Importation / Date & Heure */}
          <div style={{
            fontSize: '0.68rem',
            color: '#34D399',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.15rem 0.45rem',
            borderRadius: '6px',
            fontFamily: 'var(--font-mono, monospace)',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }} title="Date et heure exactes d'importation de l'article">
            <span style={{ fontSize: '0.72rem' }}>🕒</span>
            <span>{formatImportDate(product)}</span>
          </div>
        </div>

        {/* Nom officiel de l'Usine / Fournisseur */}
        <div style={{
          fontSize: '0.72rem',
          color: '#FCD34D',
          fontWeight: 700,
          marginTop: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          padding: '0.2rem 0.45rem',
          borderRadius: '6px'
        }}>
          <Factory size={12} color="#F59E0B" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product?.suppliers?.[0]?.name && !['afficher plus', 'voir plus', 'avis'].some(w => product.suppliers[0].name.toLowerCase().includes(w))
              ? product.suppliers[0].name
              : (product?.factoryName || 'Fournisseur Vérifié Alibaba')}
          </span>
        </div>
      </div>

      {/* Price Section with Unit & Sourcing Access */}
      <div>
        <div className="product-price-block" style={{ marginTop: '0.75rem', paddingTop: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Prix Usine Chine :
            </div>
            <div className="price-factory" style={{ fontSize: '0.88rem', color: 'var(--amber-light)', fontWeight: 700 }}>
              {(parseFloat(product?.suppliers?.[0]?.priceCny || product?.priceCny || product?.basePriceCny || 8.28) || 0).toFixed(2)} ¥
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Tarif FCFA ({product?.unit || 'Pièce'}) :
            </div>
            <div className="price-resell" style={{ fontSize: '1.2rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
              {formatPrice(parseFloat(product?.suppliers?.[0]?.priceCny || product?.priceCny || product?.basePriceCny || 8.28) || 0)}
            </div>
          </div>
        </div>

        {/* Action Button to Open Full Sourcing Dossier */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          style={{
            width: '100%',
            marginTop: '0.75rem',
            background: isSelected ? 'var(--blue-primary)' : 'rgba(37, 99, 235, 0.12)',
            border: `1px solid ${isSelected ? 'var(--blue-primary)' : 'rgba(37, 99, 235, 0.35)'}`,
            color: isSelected ? 'white' : '#93C5FD',
            borderRadius: '8px',
            padding: '0.45rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={13} color={isSelected ? 'white' : '#F59E0B'} />
          <span>🔍 Voir Dossier Sourcing & Fournisseurs</span>
        </button>
      </div>
    </div>
  );
}
