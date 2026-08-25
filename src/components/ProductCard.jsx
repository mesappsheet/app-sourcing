import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera, Video, Maximize2, Sparkles, Play, Pause, Factory, GripVertical, Tag, Layers, CornerDownRight } from 'lucide-react';

export function ProductCard({ 
  product, 
  isSelected, 
  onSelect, 
  onOpenImageViewer,
  formatPrice,
  categories = [],
  onMoveProductToCategory,
  onOpenContextMenu
}) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=85',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=85'
  ];

  // 🔄 DÉFILEMENT AUTOMATIQUE DES PHOTOS (AUTO-SCROLL)
  useEffect(() => {
    if (!isAutoScrollActive || isHovered || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3500); // Change photo every 3.5 seconds

    return () => clearInterval(interval);
  }, [images.length, isHovered, isAutoScrollActive]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (onOpenImageViewer) {
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
            background: '#070C14',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            cursor: 'zoom-in'
          }}
          title="Cliquez pour agrandir en plein écran HD"
        >
          {/* Main Photo with smooth crossfade and subtle zoom */}
          <img 
            key={currentImgIdx}
            src={images[currentImgIdx]} 
            alt={`${product.titleFr} - photo ${currentImgIdx + 1}`}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.35s ease, opacity 0.3s ease',
              animation: 'fadeIn 0.4s ease'
            }}
          />

          {/* Platform Origin Badge (Alibaba / Pinduoduo) Top Left */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            zIndex: 5
          }}>
            <span>{isPinduoduo ? '🔴 Pinduoduo Usine' : '🟡 Alibaba Verified'}</span>
          </div>

          {/* Poignée de Glissement (Drag Handle) Top Right */}
          <div 
            className="product-drag-handle"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.66rem',
              fontWeight: 700,
              color: '#93C5FD',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              zIndex: 6,
              cursor: 'grab',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
            title="Glissez-déposez cet article sur un rayon à gauche pour le reclasser"
          >
            <GripVertical size={13} />
            <span>Glisser</span>
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
                width: '36px',
                height: '36px',
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
              <ChevronLeft size={22} />
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
                width: '36px',
                height: '36px',
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
              <ChevronRight size={22} />
            </button>
          )}

          {/* Top Right: Photos Counter Badge */}
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '0.25rem 0.6rem',
            borderRadius: '8px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 5
          }}>
            <Camera size={13} />
            <span>{currentImgIdx + 1}/{images.length}</span>
          </div>

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
                  onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(i); }}
                  style={{
                    width: i === currentImgIdx ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i === currentImgIdx ? 'var(--blue-light)' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  title={`Photo ${i + 1}`}
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

        <h3 className="product-title" style={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.35 }}>
          {product?.titleFr || 'Article sans titre'}
        </h3>
        <p className="product-subtitle" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {product?.material || 'Matériau usine certifié'}
        </p>

        {/* Nom officiel de l'Usine / Fournisseur */}
        <div style={{
          fontSize: '0.72rem',
          color: '#FCD34D',
          fontWeight: 700,
          marginTop: '0.4rem',
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
