import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, 
  ChevronRight, 
  Inbox, 
  Check, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Tag
} from 'lucide-react';

export function ContextMenuCascade({
  isOpen,
  position,
  product,
  categoriesTree = [],
  onSelectCategory,
  onDeleteProduct,
  onClose
}) {
  const [activeHoverCategory, setActiveHoverCategory] = useState(null);
  const menuRef = useRef(null);

  // Fermer sur clic à l'extérieur ou touche Echap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Calcul intelligent des coordonnées pour éviter de sortir de l'écran
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const menuWidth = 240;
  const menuHeight = 360;

  let posX = position.x;
  let posY = position.y;

  if (posX + menuWidth + 220 > screenWidth) {
    posX = Math.max(10, posX - menuWidth);
  }
  if (posY + menuHeight > screenHeight) {
    posY = Math.max(10, screenHeight - menuHeight - 20);
  }

  const isFlyoutLeft = posX + menuWidth + 220 > screenWidth;

  const currentCatId = product.category || 'inbox';

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${posY}px`,
        left: `${posX}px`,
        width: `${menuWidth}px`,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(37, 99, 235, 0.3)',
        zIndex: 999999,
        padding: '0.45rem',
        fontSize: '0.8rem',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'modalFade 0.12s ease'
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 🏷️ En-tête de l'article ciblé */}
      <div style={{
        padding: '0.45rem 0.6rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '0.35rem'
      }}>
        <div style={{ fontSize: '0.68rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {product.sku || 'ARTICLE'}
        </div>
        <div style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#F8FAFC',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '210px'
        }}>
          {product.titleFr || 'Article sans nom'}
        </div>
      </div>

      {/* 📥 1. Option Rapide : Déplacer vers Magasin d'Arrivage (Inbox) */}
      <button
        onClick={() => {
          onSelectCategory(product, 'inbox', 'inbox');
          onClose();
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.65rem',
          borderRadius: '8px',
          border: 'none',
          background: currentCatId === 'inbox' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
          color: currentCatId === 'inbox' ? '#FCD34D' : '#E2E8F0',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 700,
          textAlign: 'left',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={() => setActiveHoverCategory(null)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span>📥</span>
          <span>Magasin d'Arrivage (Transit)</span>
        </div>
        {currentCatId === 'inbox' && <Check size={14} color="#FCD34D" />}
      </button>

      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.35rem 0' }} />

      <div style={{
        padding: '0.2rem 0.6rem',
        fontSize: '0.65rem',
        color: '#94A3B8',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Classer dans un Rayon ➔
      </div>

      {/* 🗂️ 2. Liste des Catégories Principales avec Cascade de Sous-Catégories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {categoriesTree
          .filter(cat => cat.id !== 'inbox' && cat.id !== 'all')
          .map((mainCat) => {
            const isHovered = activeHoverCategory === mainCat.id;
            const subCats = Array.isArray(mainCat.subCategories) ? mainCat.subCategories : [];
            const hasSubs = subCats.length > 0;

            return (
              <div
                key={mainCat.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setActiveHoverCategory(mainCat.id)}
              >
                <button
                  onClick={() => {
                    if (!hasSubs) {
                      onSelectCategory(product, mainCat.id, mainCat.id);
                      onClose();
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isHovered ? 'rgba(37, 99, 235, 0.35)' : 'transparent',
                    color: isHovered ? '#FFFFFF' : '#E2E8F0',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{mainCat.icon || '📁'}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                      {mainCat.name}
                    </span>
                  </div>
                  {hasSubs && (
                    <ChevronRight size={14} color={isHovered ? '#60A5FA' : '#64748B'} />
                  )}
                </button>

                {/* 🌟 SOUS-MENU EN CASCADE (Flyout Sub-Categories) */}
                {isHovered && hasSubs && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: isFlyoutLeft ? 'auto' : 'calc(100% + 6px)',
                      right: isFlyoutLeft ? 'calc(100% + 6px)' : 'auto',
                      width: '230px',
                      background: 'rgba(15, 23, 42, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1.5px solid rgba(59, 130, 246, 0.45)',
                      borderRadius: '12px',
                      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(37, 99, 235, 0.3)',
                      padding: '0.4rem',
                      zIndex: 1000000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      animation: 'modalFade 0.1s ease'
                    }}
                  >
                    <div style={{
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.66rem',
                      color: '#38BDF8',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <span>{mainCat.icon}</span>
                      <span>Sous-Catégories :</span>
                    </div>

                    {subCats.map((sub) => {
                      const isSelected = currentCatId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSelectCategory(product, mainCat.id, sub.id);
                            onClose();
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                            color: isSelected ? '#34D399' : '#F1F5F9',
                            cursor: 'pointer',
                            fontSize: '0.76rem',
                            fontWeight: isSelected ? 800 : 600,
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span>{sub.icon || '▫️'}</span>
                            <span>{sub.name}</span>
                          </div>
                          {isSelected && <Check size={13} color="#34D399" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* 🗑️ 3. Option Supprimer l'Article */}
      {onDeleteProduct && (
        <>
          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.35rem 0' }} />
          <button
            onClick={() => {
              onDeleteProduct(product);
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#F87171',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 700,
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 size={13} />
            <span>Supprimer du Catalogue</span>
          </button>
        </>
      )}
    </div>
  );
}
