import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, 
  ChevronRight, 
  Inbox, 
  Check, 
  Trash2, 
  Sparkles, 
  ExternalLink, 
  Tag, 
  GripHorizontal, 
  X, 
  Layers, 
  CornerDownRight 
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
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const menuRef = useRef(null);

  const validMainCategories = categoriesTree.filter(cat => cat.id !== 'inbox' && cat.id !== 'all');

  // Initialisation et repositionnement automatique
  useEffect(() => {
    if (!isOpen) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const totalMenuWidth = 520;
    const menuHeight = 390;

    let posX = position.x || 100;
    let posY = position.y || 100;

    if (posX + totalMenuWidth > screenWidth) {
      posX = Math.max(10, screenWidth - totalMenuWidth - 20);
    }
    if (posY + menuHeight > screenHeight) {
      posY = Math.max(10, screenHeight - menuHeight - 20);
    }

    setDragPos({ x: posX, y: posY });
    // Pré-sélectionner la première catégorie par défaut pour affichage immédiat
    if (validMainCategories.length > 0) {
      setActiveHoverCategory(validMainCategories[0].id);
    }
  }, [isOpen, position]);

  // Gestion du Déplacement (Drag & Drop de la fenêtre)
  const handleMouseDownHeader = (e) => {
    if (e.button !== 0) return; // Clic gauche uniquement
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: dragPos.x,
      posY: dragPos.y
    };
  };

  const handleTouchStartHeader = (e) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.touches[0].clientX,
      mouseY: e.touches[0].clientY,
      posX: dragPos.x,
      posY: dragPos.y
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 270, dragStartRef.current.posX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.posY + deltaY));
      setDragPos({ x: newX, y: newY });
    };

    const handleTouchMove = (e) => {
      if (!e.touches[0]) return;
      const deltaX = e.touches[0].clientX - dragStartRef.current.mouseX;
      const deltaY = e.touches[0].clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 270, dragStartRef.current.posX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.posY + deltaY));
      setDragPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Fermer sur clic à l'extérieur ou touche Echap
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (isDragging) return;
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
  }, [isOpen, onClose, isDragging]);

  if (!isOpen || !product) return null;

  const isFlyoutLeft = dragPos.x + 510 > window.innerWidth;
  const currentCatId = product.category || 'inbox';
  const activeMainCat = validMainCategories.find(c => c.id === activeHoverCategory) || validMainCategories[0];
  const subCats = Array.isArray(activeMainCat?.subCategories) ? activeMainCat.subCategories : [];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${dragPos.y}px`,
        left: `${dragPos.x}px`,
        display: 'flex',
        flexDirection: isFlyoutLeft ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: '8px',
        zIndex: 999999,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        userSelect: isDragging ? 'none' : 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 🟦 COLONNE 1 : MENU PRINCIPAL (Catégories Principales + Déplacement) */}
      <div style={{
        width: '250px',
        background: 'rgba(15, 23, 42, 0.97)',
        backdropFilter: 'blur(25px)',
        border: '1.5px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '16px',
        boxShadow: isDragging 
          ? '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(59, 130, 246, 0.6)' 
          : '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(37, 99, 235, 0.35)',
        padding: '0.45rem',
        fontSize: '0.8rem',
        color: '#FFFFFF'
      }}>
        {/* ⠿ BARRE DE DÉPLACEMENT D'EN-TÊTE (DRAGGABLE HEADER) */}
        <div 
          onMouseDown={handleMouseDownHeader}
          onTouchStart={handleTouchStartHeader}
          style={{
            padding: '0.4rem 0.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '0.35rem',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          title="Maintenez le clic pour déplacer cette fenêtre"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
            <GripHorizontal size={14} color="#60A5FA" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.66rem', color: '#60A5FA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {product.sku || 'ARTICLE'} • DÉPLAÇABLE
              </div>
              <div style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '170px'
              }}>
                {product.titleFr || 'Article'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Fermer"
          >
            <X size={14} />
          </button>
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
            padding: '0.45rem 0.65rem',
            borderRadius: '8px',
            border: 'none',
            background: currentCatId === 'inbox' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
            color: currentCatId === 'inbox' ? '#FCD34D' : '#E2E8F0',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 700,
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span>📥</span>
            <span>Magasin d'Arrivage (Transit)</span>
          </div>
          {currentCatId === 'inbox' && <Check size={14} color="#FCD34D" />}
        </button>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.35rem 0' }} />

        <div style={{
          padding: '0.15rem 0.6rem',
          fontSize: '0.64rem',
          color: '#94A3B8',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Rayons Principaux ➔
        </div>

        {/* 🗂️ 2. LISTE DÉFILANTE DES CATÉGORIES PRINCIPALES */}
        <div 
          className="custom-menu-scroll"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            maxHeight: '175px',
            overflowY: 'scroll',
            scrollbarWidth: 'thin',
            scrollbarColor: '#00F0FF rgba(255, 255, 255, 0.15)',
            paddingRight: '4px'
          }}
        >
          {validMainCategories.map((mainCat) => {
            const isSelected = activeHoverCategory === mainCat.id;
            const hasChildren = Array.isArray(mainCat.subCategories) && mainCat.subCategories.length > 0;

            return (
              <button
                key={mainCat.id}
                onClick={() => {
                  setActiveHoverCategory(mainCat.id);
                  if (!hasChildren) {
                    onSelectCategory(product, mainCat.id, mainCat.id);
                    onClose();
                  }
                }}
                onMouseEnter={() => setActiveHoverCategory(mainCat.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.48rem 0.65rem',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid transparent',
                  background: isSelected ? 'rgba(37, 99, 235, 0.45)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#E2E8F0',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <span style={{ fontSize: '1rem' }}>{mainCat.icon || '📁'}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '155px' }}>
                    {mainCat.name}
                  </span>
                </div>
                {hasChildren && (
                  <ChevronRight size={14} color={isSelected ? '#60A5FA' : '#64748B'} />
                )}
              </button>
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

      {/* 🟩 COLONNE 2 : SOUS-CATÉGORIES DÉPLOYÉES (ATTACHÉES SOLIDAIRES SANS MASQUAGE) */}
      {activeMainCat && subCats.length > 0 && (
        <div style={{
          width: '250px',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(25px)',
          border: '1.5px solid rgba(59, 130, 246, 0.55)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 25px rgba(37, 99, 235, 0.4)',
          padding: '0.45rem',
          fontSize: '0.8rem',
          color: '#FFFFFF',
          animation: 'modalFade 0.12s ease'
        }}>
          {/* En-tête de la colonne des sous-catégories */}
          <div style={{
            padding: '0.35rem 0.55rem',
            fontSize: '0.68rem',
            color: '#38BDF8',
            fontWeight: 800,
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span>{activeMainCat.icon}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeMainCat.name}
            </span>
          </div>

          {/* 📜 LISTE DÉFILANTE DES SOUS-CATÉGORIES */}
          <div 
            className="custom-menu-scroll"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              maxHeight: '180px',
              overflowY: 'scroll',
              scrollbarWidth: 'thin',
              scrollbarColor: '#00F0FF rgba(255, 255, 255, 0.15)',
              paddingRight: '4px'
            }}
          >
            {subCats.map((sub) => {
              const isSelected = currentCatId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    onSelectCategory(product, activeMainCat.id, sub.id);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.48rem 0.6rem',
                    borderRadius: '7px',
                    border: 'none',
                    background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    color: isSelected ? '#34D399' : '#F1F5F9',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : 600,
                    textAlign: 'left',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                    <span>{sub.icon || '▫️'}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.name}
                    </span>
                  </div>
                  {isSelected && <Check size={13} color="#34D399" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
