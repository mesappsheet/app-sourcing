import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Video, 
  Image as ImageIcon, 
  Package, 
  Search
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function InboxTrashView({
  trashedItems = [],
  onRestoreItem,
  onPermanentDeleteItem,
  onEmptyTrash,
  showToast
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'product' | 'media'
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);

  const filteredItems = trashedItems.filter(item => {
    if (filterType === 'product' && item.itemType !== 'product') return false;
    if (filterType === 'media' && item.itemType !== 'media') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const title = (item.data?.titleFr || item.data?.title || '').toLowerCase();
      const sku = (item.data?.sku || '').toLowerCase();
      return title.includes(q) || sku.includes(q);
    }
    return true;
  });

  const productsCount = trashedItems.filter(i => i.itemType === 'product').length;
  const mediaCount = trashedItems.filter(i => i.itemType === 'media').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
      
      {/* 1. Header & Actions de la Corbeille */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.8))',
        border: '1.5px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '16px',
        padding: '1.2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F87171'
          }}>
            <Trash2 size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Corbeille du Magasin d'Arrivage</span>
              <span style={{ fontSize: '0.74rem', background: '#EF4444', color: '#FFF', padding: '0.1rem 0.5rem', borderRadius: '10px', fontWeight: 900 }}>
                {trashedItems.length}
              </span>
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
              Les éléments supprimés sont conservés ici. Vous pouvez les restaurer à tout moment ou les purger.
            </p>
          </div>
        </div>

        {trashedItems.length > 0 && (
          <button
            onClick={() => setIsEmptyConfirmOpen(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Trash2 size={14} />
            <span>🧹 Vider la Corbeille ({trashedItems.length})</span>
          </button>
        )}
      </div>

      {/* 2. Filtres & Barre de Recherche */}
      {trashedItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Pills Filtres */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: filterType === 'all' ? '#EF4444' : 'transparent',
                color: filterType === 'all' ? '#FFF' : '#94A3B8'
              }}
            >
              Tous ({trashedItems.length})
            </button>

            <button
              onClick={() => setFilterType('product')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: filterType === 'product' ? '#F59E0B' : 'transparent',
                color: filterType === 'product' ? '#000' : '#94A3B8'
              }}
            >
              📦 Articles ({productsCount})
            </button>

            <button
              onClick={() => setFilterType('media')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: filterType === 'media' ? '#3B82F6' : 'transparent',
                color: filterType === 'media' ? '#FFF' : '#94A3B8'
              }}
            >
              🎬 Photos/Vidéos ({mediaCount})
            </button>
          </div>

          {/* Input Recherche */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la corbeille..."
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem 0.45rem 2rem',
                background: '#0B1120',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.78rem'
              }}
            />
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>
      )}

      {/* 3. Grille des Éléments de la Corbeille */}
      {filteredItems.length === 0 ? (
        <div style={{
          background: '#0B1120',
          border: '1.5px dashed var(--border-subtle)',
          borderRadius: '16px',
          padding: '3.5rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.6rem' }}>🗑️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '0.35rem' }}>
            {trashedItems.length === 0 ? "La Corbeille d'Arrivage est vide" : "Aucun résultat trouvé"}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '480px', margin: '0 auto' }}>
            Les articles et médias que vous supprimez depuis le Magasin d'Arrivage sont automatiquement conservés ici pour éviter toute perte accidentelle.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {filteredItems.map((item) => {
            const isProduct = item.itemType === 'product';
            const data = item.data || {};
            const isVideo = isProduct ? data.hasVideoDemo : (data.type === 'video');
            const thumbUrl = isProduct 
              ? (data.images?.[0] || 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg')
              : (data.poster || data.url || 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg');

            const itemTitle = isProduct ? (data.titleFr || 'Article sans titre') : (data.title || 'Média sans titre');

            return (
              <div
                key={item.trashId}
                style={{
                  background: '#0B1120',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                {/* Visual Thumbnail */}
                <div style={{ position: 'relative', width: '100%', height: '170px', background: '#050811' }}>
                  <img 
                    src={thumbUrl} 
                    alt={itemTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'grayscale(20%)' }}
                  />

                  {/* Badge Type */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: isProduct ? 'rgba(245, 158, 11, 0.95)' : (isVideo ? 'rgba(239, 68, 68, 0.95)' : 'rgba(37, 99, 235, 0.95)'),
                    color: isProduct ? '#000' : '#FFF',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    zIndex: 5
                  }}>
                    {isProduct ? <Package size={12} /> : (isVideo ? <Video size={12} /> : <ImageIcon size={12} />)}
                    <span>{isProduct ? 'ARTICLE' : (isVideo ? 'VIDÉO' : 'PHOTO')}</span>
                  </div>

                  {/* Date de suppression */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#FDA4AF',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    zIndex: 5
                  }}>
                    🗑️ {new Date(item.deletedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {/* Card Content & Action Bar */}
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemTitle}
                    </h4>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      {isProduct ? `SKU: ${data.sku || 'N/A'}` : `Source: ${data.platform || 'Arrivage'}`}
                    </div>
                  </div>

                  {/* Boutons d'Action: Restaurer vs Supprimer Définitivement */}
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => onRestoreItem(item)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        border: 'none',
                        color: 'white',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                      title="Restaurer cet élément dans le Magasin d'Arrivage"
                    >
                      <RotateCcw size={13} />
                      <span>Restaurer ➔</span>
                    </button>

                    <button
                      onClick={() => setItemToDelete(item)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#F87171',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        gap: '0.25rem'
                      }}
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={13} />
                      <span>Purger</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal Confirmation de Suppression Définitive Unitaire */}
      <ConfirmDeleteModal 
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            onPermanentDeleteItem(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="Suppression Définitive"
        message="Êtes-vous sûr de vouloir supprimer définitivement cet élément de la corbeille ?"
        itemName={itemToDelete ? (itemToDelete.data?.titleFr || itemToDelete.data?.title || 'Élément') : ''}
        itemType={itemToDelete?.itemType === 'product' ? 'article' : 'média'}
      />

      {/* 5. Modal Confirmation de Vidage Total de la Corbeille */}
      <ConfirmDeleteModal 
        isOpen={isEmptyConfirmOpen}
        onClose={() => setIsEmptyConfirmOpen(false)}
        onConfirm={() => {
          onEmptyTrash();
          setIsEmptyConfirmOpen(false);
        }}
        title="Vider Complètement la Corbeille"
        message={`Êtes-vous sûr de vouloir vider définitivement les ${trashedItems.length} élément(s) de la corbeille ?`}
        itemName={`${trashedItems.length} éléments en attente`}
        itemType="corbeille complète"
      />

    </div>
  );
}
