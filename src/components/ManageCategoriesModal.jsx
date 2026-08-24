import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, FolderPlus, Tag } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function ManageCategoriesModal({ 
  isOpen, 
  onClose, 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🗄️');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    cat: null
  });

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory = {
      id: 'cat_' + Date.now(),
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '📁',
      count: 0
    };

    onAddCategory(newCategory);
    setNewCatName('');
    setNewCatIcon('🗄️');
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  };

  const saveEdit = (id) => {
    if (editName.trim()) {
      onUpdateCategory(id, { name: editName.trim(), icon: editIcon.trim() || '📁' });
      setEditingId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <FolderPlus size={22} color="#3B82F6" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Gestion des Rayons & Catégories</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Ajoutez, renommez ou supprimez les catégories de quincaillerie pour organiser votre catalogue selon vos besoins.
        </p>

        {/* ➕ AJOUTER NOUVELLE CATÉGORIE */}
        <form onSubmit={handleCreate} style={{
          background: '#0B1120',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-light)', marginBottom: '0.5rem' }}>
            ➕ Créer un Nouveau Rayon :
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Icône (ex: 🔩, 🪚, 🚪)"
              value={newCatIcon}
              onChange={e => setNewCatIcon(e.target.value)}
              style={{ width: '70px', textAlign: 'center', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '1.2rem' }}
            />

            <input 
              type="text" 
              required
              placeholder="Nom du rayon (ex: Poignées & Boutons, Vis & Fixations...)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
            />

            <button type="submit" className="btn-primary-action" style={{ padding: '0.5rem 0.9rem', fontSize: '0.78rem' }}>
              <Plus size={15} />
              <span>Créer</span>
            </button>
          </div>
        </form>

        {/* 📋 LISTE DES CATÉGORIES EXISTANTES */}
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Rayons Actuels ({categories.filter(c => c.id !== 'all').length}) :
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
          {categories.filter(c => c.id !== 'all').map(cat => (
            <div 
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: '#0B1120',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                gap: '0.5rem'
              }}
            >
              {editingId === cat.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                  <input 
                    type="text" 
                    value={editIcon}
                    onChange={e => setEditIcon(e.target.value)}
                    style={{ width: '45px', textAlign: 'center', padding: '0.3rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white' }}
                  />
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ flex: 1, padding: '0.3rem 0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.82rem' }}
                  />
                  <button 
                    onClick={() => saveEdit(cat.id)}
                    style={{ background: 'var(--emerald-green)', color: 'white', border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    <Check size={13} />
                    <span>Sauver</span>
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                    <strong style={{ fontSize: '0.85rem' }}>{cat.name}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button 
                      onClick={() => startEdit(cat)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem'
                      }}
                      title="Modifier cette catégorie"
                    >
                      <Edit2 size={13} />
                      <span>Renommer</span>
                    </button>

                    <button 
                      onClick={() => setDeleteConfirmState({ isOpen: true, cat })}
                      style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        color: 'var(--rose-accent)',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem'
                      }}
                      title="Supprimer cette catégorie"
                    >
                      <Trash2 size={13} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button className="btn-primary-action" style={{ padding: '0.5rem 1.2rem' }} onClick={onClose}>
            <span>Fermer</span>
          </button>
        </div>

      </div>

      <ConfirmDeleteModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, cat: null })}
        onConfirm={() => {
          if (deleteConfirmState.cat) {
            onDeleteCategory(deleteConfirmState.cat.id);
          }
        }}
        title="Supprimer ce Rayon / Catégorie ?"
        message="Attention : La suppression de ce rayon peut impacter l'organisation et le filtrage des articles associés."
        itemName={deleteConfirmState.cat ? `${deleteConfirmState.cat.icon} ${deleteConfirmState.cat.name}` : ''}
        itemType="catégorie"
      />
    </div>
  );
}
