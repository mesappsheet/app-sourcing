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
  onMoveProductToCategory 
}) {
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

  return (
    <div className="card" style={{ padding: '0.85rem' }}>
      {/* En-tête de la barre latérale */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.85rem',
        paddingLeft: '0.2rem'
      }}>
        <span style={{
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-tertiary)',
          fontWeight: 800
        }}>
          Rayons & Magasin
        </span>

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

      <div className="category-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        {/* 🗂️ 1. TOUS LES ARTICLES */}
        <button
          className={category-btn }
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
          className={category-btn  }
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
                className={category-btn  }
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
                        className={category-btn  }
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
