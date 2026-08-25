import React, { useState } from 'react';
import { Settings, Plus, FolderCog, ChevronDown, ChevronRight, Inbox, Layers } from 'lucide-react';

export function CategoryFilter({ 
  categoriesTree = [], 
  selectedCategory, 
  onSelectCategory, 
  counts = {}, 
  inboxCount = 0,
  totalCount = 0,
  onOpenManageCategories,
  onMoveProductToCategory,
  isCollapsed = false,
  onToggleCollapse
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const activeCollapsed = onToggleCollapse ? isCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const [draggedOverCatId, setDraggedOverCatId] = useState(null);
  const [expandedCats, setExpandedCats] = useState(() => {
    // Par défaut, développer toutes les catégories principales
    const initial = {};
    categoriesTree.forEach(c => { initial[c.id] = true; });
    return initial;
  });

  const toggleExpand = (catId, e) => {
    e.stopPropagation();
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleDragOver = (e, catId) => {
    if (catId === 'all') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverCatId !== catId) {
      setDraggedOverCatId(catId);
    }
  };

  const handleDragLeave = (e, catId) => {
    if (draggedOverCatId === catId) {
      setDraggedOverCatId(null);
    }
  };

  const handleDrop = (e, catId) => {
    e.preventDefault();
    setDraggedOverCatId(null);
    if (catId === 'all') return;

    const productId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('productId');
    if (productId && onMoveProductToCategory) {
      onMoveProductToCategory(productId, catId);
    }
  };

  const validMainCategories = categoriesTree.filter(c => c.id !== 'inbox' && c.id !== 'all');

  // Si le panneau est replié, afficher un onglet vertical ultra-discret et aéré
  if (activeCollapsed) {
    return (
      <div style={{ position: 'sticky', top: '75px', zIndex: 50 }}>
        <button
          onClick={toggleCollapse}
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
            border: '1.5px solid rgba(59, 130, 246, 0.6)',
            color: '#38BDF8',
            padding: '0.65rem 0.5rem',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(56, 189, 248, 0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          title="Déplier le panneau des Rayons & Catégories"
        >
          <ChevronRight size={18} color="#38BDF8" />
          <span style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: '#F8FAFC'
          }}>
            RAYONS ({totalCount})
          </span>
          {inboxCount > 0 && (
            <span style={{
              background: '#F59E0B',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: 900,
              padding: '0.15rem 0.35rem',
              borderRadius: '999px',
              marginTop: '0.2rem'
            }}>
              {inboxCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      className="card" 
      style={{ 
        padding: '0.85rem',
        position: 'sticky',
        top: '75px',
        maxHeight: 'calc(100vh - 95px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
        zIndex: 40
      }}
    >
      {/* En-tête de la barre latérale */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
        paddingLeft: '0.2rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-tertiary)',
            fontWeight: 800
          }}>
            Rayons & Magasin
          </span>
          
          {/* Bouton Replier / Masquer */}
          <button
            onClick={toggleCollapse}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94A3B8',
              padding: '0.15rem 0.4rem',
              borderRadius: '5px',
              fontSize: '0.66rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              cursor: 'pointer'
            }}
            title="Replier le panneau latéral pour aérer l'écran"
          >
            <span>◀</span>
            <span>Replier</span>
          </button>
        </div>

        {/* Bouton Gérer les Catégories */}
        <button
          onClick={onOpenManageCategories}
          style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93C5FD',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            cursor: 'pointer'
          }}
          title="Ajouter, modifier ou supprimer des catégories et sous-catégories"
        >
          <FolderCog size={13} />
          <span>Gérer</span>
        </button>
      </div>

      <div 
        className="category-menu custom-menu-scroll" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          overflowY: 'scroll',
          scrollbarWidth: 'thin',
          scrollbarColor: '#00F0FF rgba(255, 255, 255, 0.15)',
          paddingRight: '4px',
          flex: 1
        }}
      >
        
        {/* 🗂️ 1. TOUS LES ARTICLES */}
        <button
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
          style={{ marginBottom: '2px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🗂️</span>
            <span style={{ fontWeight: 700 }}>Tous les Articles</span>
          </span>
          <span className="count-badge">{totalCount}</span>
        </button>

        {/* 📥 2. MAGASIN D'ARRIVAGE (SAS DE TRANSIT) */}
        <button
          className={`category-btn ${selectedCategory === 'inbox' ? 'active' : ''} ${draggedOverCatId === 'inbox' ? 'drag-over' : ''}`}
          onClick={() => onSelectCategory('inbox')}
          onDragOver={(e) => handleDragOver(e, 'inbox')}
          onDragLeave={(e) => handleDragLeave(e, 'inbox')}
          onDrop={(e) => handleDrop(e, 'inbox')}
          style={{
            background: selectedCategory === 'inbox' 
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.25))' 
              : inboxCount > 0 
                ? 'rgba(245, 158, 11, 0.12)' 
                : 'var(--bg-card)',
            border: selectedCategory === 'inbox' 
              ? '1.5px solid #F59E0B' 
              : inboxCount > 0 
                ? '1px solid rgba(245, 158, 11, 0.35)' 
                : '1px solid var(--border-subtle)',
            marginBottom: '6px'
          }}
          title="Articles nouvellement importés en attente de tri"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.15rem' }}>📥</span>
            <span style={{ fontWeight: 800, color: inboxCount > 0 ? '#FCD34D' : 'inherit' }}>
              Magasin d'Arrivage
            </span>
          </span>

          {draggedOverCatId === 'inbox' ? (
            <span style={{ color: '#FCD34D', fontSize: '0.72rem', fontWeight: 800 }}>📥 Déposer</span>
          ) : (
            <span style={{
              background: inboxCount > 0 ? '#F59E0B' : 'rgba(255,255,255,0.1)',
              color: inboxCount > 0 ? '#000000' : 'var(--text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 900,
              padding: '0.15rem 0.5rem',
              borderRadius: '999px'
            }}>
              {inboxCount}
            </span>
          )}
        </button>

        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0 6px 0' }} />

        {/* 🗂️ 3. CATÉGORIES PRINCIPALES & LEURS SOUS-CATÉGORIES */}
        {validMainCategories.map(mainCat => {
          const isExpanded = expandedCats[mainCat.id] !== false;
          const subCats = Array.isArray(mainCat.subCategories) ? mainCat.subCategories : [];
          
          // Calcul du total d'articles pour la catégorie principale (somme de ses sous-catégories)
          const mainTotal = subCats.reduce((acc, s) => acc + (counts[s.id] || 0), (counts[mainCat.id] || 0));
          const isMainActive = selectedCategory === mainCat.id;
          const isOverMain = draggedOverCatId === mainCat.id;

          return (
            <div key={mainCat.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
              
              {/* Ligne Catégorie Principale */}
              <div
                className={`category-btn ${isMainActive ? 'active' : ''} ${isOverMain ? 'drag-over' : ''}`}
                onClick={() => onSelectCategory(mainCat.id)}
                onDragOver={(e) => handleDragOver(e, mainCat.id)}
                onDragLeave={(e) => handleDragLeave(e, mainCat.id)}
                onDrop={(e) => handleDrop(e, mainCat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                  <button
                    onClick={(e) => toggleExpand(mainCat.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <span style={{ fontSize: '1.1rem' }}>{mainCat.icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem' }}>
                    {mainCat.name}
                  </span>
                </div>

                {isOverMain ? (
                  <span style={{ color: '#34D399', fontSize: '0.72rem', fontWeight: 800 }}>📥 Déposer</span>
                ) : (
                  <span className="count-badge">{mainTotal}</span>
                )}
              </div>

              {/* ↳ Sous-Catégories Indentées */}
              {isExpanded && subCats.length > 0 && (
                <div style={{
                  marginLeft: '1.4rem',
                  paddingLeft: '0.5rem',
                  borderLeft: '2px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  {subCats.map(sub => {
                    const isSubActive = selectedCategory === sub.id;
                    const isOverSub = draggedOverCatId === sub.id;
                    const subCount = counts[sub.id] || 0;

                    return (
                      <button
                        key={sub.id}
                        className={`category-btn ${isSubActive ? 'active' : ''} ${isOverSub ? 'drag-over' : ''}`}
                        onClick={() => onSelectCategory(sub.id)}
                        onDragOver={(e) => handleDragOver(e, sub.id)}
                        onDragLeave={(e) => handleDragLeave(e, sub.id)}
                        onDrop={(e) => handleDrop(e, sub.id)}
                        style={{
                          padding: '0.38rem 0.6rem',
                          fontSize: '0.78rem',
                          borderRadius: '6px'
                        }}
                        title={`Filtrer par « ${sub.name} » ou glissez un article ici`}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.95rem' }}>{sub.icon || '▫️'}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sub.name}
                          </span>
                        </span>

                        {isOverSub ? (
                          <span style={{ color: '#34D399', fontSize: '0.7rem', fontWeight: 800 }}>📥 Déposer</span>
                        ) : (
                          <span className="count-badge" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                            {subCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
