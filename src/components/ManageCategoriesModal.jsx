import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, FolderPlus, Tag, Layers, ChevronRight, CornerDownRight, ShieldAlert } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function ManageCategoriesModal({ 
  isOpen, 
  onClose, 
  categoriesTree = [], 
  onAddCategory, 
  onAddSubCategory,
  onUpdateCategory, 
  onDeleteCategory,
  activeWorkspaceName = 'Sourcing'
}) {
  const [createType, setCreateType] = useState('sub'); // 'main' | 'sub'
  const [selectedParentId, setSelectedParentId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('🔩');

  const [editingItemId, setEditingItemId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    item: null,
    parentId: null
  });

  if (!isOpen) return null;

  // Filtrer les catégories principales réelles (ignorer 'inbox' et 'all')
  const validMainCategories = categoriesTree.filter(c => c.id !== 'inbox' && c.id !== 'all');

  // Définir la catégorie parente par défaut si vide
  const currentParentId = selectedParentId || (validMainCategories[0]?.id || '');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (createType === 'main') {
      // ➕ Création d'une Catégorie Principale
      const newMain = {
        id: 'cat_' + Date.now(),
        name: newItemName.trim(),
        icon: newItemIcon.trim() || '📁',
        subCategories: []
      };
      onAddCategory(newMain);
    } else {
      // ➕ Création d'une Sous-Catégorie
      const newSub = {
        id: 'sub_' + Date.now(),
        name: newItemName.trim(),
        icon: newItemIcon.trim() || '▫️'
      };
      onAddSubCategory(currentParentId, newSub);
    }

    setNewItemName('');
    setNewItemIcon('🔩');
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditIcon(item.icon || '📁');
  };

  const saveEdit = (itemId, parentId = null) => {
    if (editName.trim()) {
      onUpdateCategory(itemId, { name: editName.trim(), icon: editIcon.trim() || '📁' }, parentId);
      setEditingItemId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 999999 }}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>

        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <FolderPlus size={22} color="#3B82F6" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Gestion des Rayons & Sous-Catégories</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.2rem' }}>
          Personnalisez la structure de classement pour l'espace <strong>« {activeWorkspaceName} »</strong>. Toutes les modifications sont enregistrées en direct sur Supabase Cloud.
        </p>

        {/* ➕ FORMULAIRE DE CRÉATION UNIFIÉ (Catégorie Principale OU Sous-Catégorie) */}
        <form onSubmit={handleCreate} style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1.5px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '14px',
          padding: '1rem 1.1rem',
          marginBottom: '1.25rem'
        }}>
          {/* Sélecteur de type : Catégorie Principale ou Sous-Catégorie */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setCreateType('sub')}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: '8px',
                border: createType === 'sub' ? '1.5px solid #3B82F6' : '1.5px solid rgba(255,255,255,0.1)',
                background: createType === 'sub' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                color: createType === 'sub' ? '#60A5FA' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              ➕ Ajouter une Sous-Catégorie
            </button>

            <button
              type="button"
              onClick={() => setCreateType('main')}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: '8px',
                border: createType === 'main' ? '1.5px solid #F59E0B' : '1.5px solid rgba(255,255,255,0.1)',
                background: createType === 'main' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                color: createType === 'main' ? '#FCD34D' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              📁 Créer une Catégorie Principale
            </button>
          </div>

          {/* Choix de la catégorie parente si on crée une sous-catégorie */}
          {createType === 'sub' && validMainCategories.length > 0 && (
            <div style={{ marginBottom: '0.65rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, marginBottom: '0.25rem' }}>
                Rattacher à la Catégorie Principale :
              </label>
              <select
                value={currentParentId}
                onChange={e => setSelectedParentId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(2, 6, 23, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                {validMainCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Champs Nom et Icône */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Icône"
              value={newItemIcon}
              onChange={e => setNewItemIcon(e.target.value)}
              style={{
                width: '65px',
                textAlign: 'center',
                padding: '0.5rem',
                background: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                fontSize: '1.1rem'
              }}
            />

            <input 
              type="text" 
              required
              placeholder={createType === 'main' ? "Nom de la Catégorie (ex: Quincaillerie Pro...)" : "Nom de la Sous-Catégorie (ex: Charnières 3D...)"}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                background: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.82rem'
              }}
            />

            <button type="submit" className="btn-primary-action" style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              <Plus size={15} />
              <span>Créer</span>
            </button>
          </div>
        </form>

        {/* 🗂️ LISTE ARBORESCENTE DES CATÉGORIES & SOUS-CATÉGORIES */}
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
          Arborescence Actuelle ({validMainCategories.length} Catégories Principales) :
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* 📥 1. Magasin d'Arrivage (Spécial / Fixe) */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px dashed rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            padding: '0.65rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📥</span>
              <div>
                <strong style={{ color: '#FCD34D', fontSize: '0.85rem' }}>Magasin d'Arrivage (Sas de Transit)</strong>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Réception automatique de tous les nouveaux imports extensions</div>
              </div>
            </div>
            <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.2)', color: '#FCD34D', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
              Système Actif
            </span>
          </div>

          {/* 📂 2. Catégories Principales et leurs Sous-Catégories */}
          {validMainCategories.map((mainCat) => {
            const isEditingMain = editingItemId === mainCat.id;
            const subCats = Array.isArray(mainCat.subCategories) ? mainCat.subCategories : [];

            return (
              <div
                key={mainCat.id}
                style={{
                  background: 'var(--bg-card, rgba(15, 23, 42, 0.6))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                {/* Ligne Catégorie Principale */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {isEditingMain ? (
                    <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
                      <input 
                        type="text" 
                        value={editIcon} 
                        onChange={e => setEditIcon(e.target.value)} 
                        style={{ width: '45px', textAlign: 'center', padding: '0.3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #3B82F6', borderRadius: '6px', fontSize: '1rem' }}
                      />
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        style={{ flex: 1, padding: '0.3rem 0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #3B82F6', borderRadius: '6px', color: 'white', fontSize: '0.82rem' }}
                      />
                      <button onClick={() => saveEdit(mainCat.id)} className="btn-primary-action" style={{ padding: '0.3rem 0.6rem' }}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.15rem' }}>{mainCat.icon}</span>
                      <strong style={{ fontSize: '0.88rem', color: '#FFFFFF' }}>{mainCat.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>({subCats.length} sous-catégories)</span>
                    </div>
                  )}

                  {/* Actions Catégorie Principale */}
                  {!isEditingMain && (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button 
                        onClick={() => startEdit(mainCat)}
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                        title="Renommer cette catégorie principale"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmState({ isOpen: true, item: mainCat, parentId: null })}
                        style={{ background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', padding: '4px' }}
                        title="Supprimer cette catégorie principale"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* ↳ Sous-Catégories Indentées */}
                {subCats.length > 0 && (
                  <div style={{
                    marginLeft: '1.25rem',
                    paddingLeft: '0.75rem',
                    borderLeft: '2px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    marginTop: '0.2rem'
                  }}>
                    {subCats.map((sub) => {
                      const isEditingSub = editingItemId === sub.id;
                      return (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          {isEditingSub ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flex: 1 }}>
                              <input 
                                type="text" 
                                value={editIcon} 
                                onChange={e => setEditIcon(e.target.value)} 
                                style={{ width: '40px', textAlign: 'center', padding: '0.25rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #3B82F6', borderRadius: '6px', fontSize: '0.9rem' }}
                              />
                              <input 
                                type="text" 
                                value={editName} 
                                onChange={e => setEditName(e.target.value)} 
                                style={{ flex: 1, padding: '0.25rem 0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #3B82F6', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                              />
                              <button onClick={() => saveEdit(sub.id, mainCat.id)} className="btn-primary-action" style={{ padding: '0.25rem 0.5rem' }}>
                                <Check size={13} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CornerDownRight size={13} color="#60A5FA" />
                              <span>{sub.icon || '▫️'}</span>
                              <span style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>{sub.name}</span>
                            </div>
                          )}

                          {!isEditingSub && (
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              <button 
                                onClick={() => startEdit(sub)}
                                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '3px' }}
                                title="Renommer cette sous-catégorie"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmState({ isOpen: true, item: sub, parentId: mainCat.id })}
                                style={{ background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', padding: '3px' }}
                                title="Supprimer cette sous-catégorie"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal de Confirmation de Suppression Sécurisée */}
        <ConfirmDeleteModal 
          isOpen={deleteConfirmState.isOpen}
          title={`Supprimer « ${deleteConfirmState.item?.name || 'ce rayon'} » ?`}
          message="La suppression est définitive. Tous les articles éventuellement rattachés seront automatiquement redirigés dans le « Magasin d'Arrivage (Sas de Transit) » pour éviter toute perte de données."
          onConfirm={() => {
            if (deleteConfirmState.item) {
              onDeleteCategory(deleteConfirmState.item.id, deleteConfirmState.parentId);
            }
            setDeleteConfirmState({ isOpen: false, item: null, parentId: null });
          }}
          onClose={() => setDeleteConfirmState({ isOpen: false, item: null, parentId: null })}
        />
      </div>
    </div>
  );
}
