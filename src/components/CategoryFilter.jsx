import React, { useState } from 'react';
import { Settings, Plus, FolderCog, CornerDownLeft, Sparkles } from 'lucide-react';

export function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  counts, 
  onOpenManageCategories,
  onMoveProductToCategory 
}) {
  const [draggedOverCatId, setDraggedOverCatId] = useState(null);

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

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.85rem',
        paddingLeft: '0.35rem'
      }}>
        <span style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-tertiary)',
          fontWeight: 800
        }}>
          Rayons Quincaillerie
        </span>

        {/* Manage Categories Button */}
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
          title="Ajouter, modifier ou supprimer des catégories"
        >
          <FolderCog size={13} />
          <span>Gérer</span>
        </button>
      </div>

      <div className="category-menu">
        {categories.map(cat => {
          const isOver = draggedOverCatId === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''} ${isOver ? 'drag-over' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              onDragOver={(e) => handleDragOver(e, cat.id)}
              onDragLeave={(e) => handleDragLeave(e, cat.id)}
              onDrop={(e) => handleDrop(e, cat.id)}
              title={cat.id !== 'all' ? `Glissez un article ici pour le classer dans « ${cat.name} »` : 'Afficher tous les articles'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
              
              {isOver && cat.id !== 'all' ? (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#38BDF8',
                  background: 'rgba(56, 189, 248, 0.2)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  📥 Déposer
                </span>
              ) : (
                <span className="category-count">
                  {counts[cat.id] || 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: '0.9rem',
        padding: '0.5rem 0.65rem',
        background: 'rgba(59, 130, 246, 0.06)',
        border: '1px dashed rgba(59, 130, 246, 0.25)',
        borderRadius: '8px',
        fontSize: '0.7rem',
        color: '#94A3B8',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        lineHeight: 1.3
      }}>
        <Sparkles size={13} color="#60A5FA" style={{ flexShrink: 0 }} />
        <span><strong>Glisser-Déposer actif :</strong> Glissez une carte produit sur un rayon pour la reclasser.</span>
      </div>
    </div>
  );
}
