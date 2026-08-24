import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  FolderPlus, 
  Layers, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';
import { WORKSPACE_TEMPLATES } from '../data/workspacesData';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function ManageWorkspacesModal({
  isOpen,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  initialCreateMode = false,
  getWorkspaceProductCount
}) {
  const [activeTab, setActiveTab] = useState(initialCreateMode ? 'create' : 'list');
  
  // Create form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_cuisines');
  const [newWsName, setNewWsName] = useState('');
  const [newWsIcon, setNewWsIcon] = useState('');
  const [newWsDomain, setNewWsDomain] = useState('');

  // Edit form state
  const [editingWsId, setEditingWsId] = useState(null);
  const [editWsName, setEditWsName] = useState('');
  const [editWsIcon, setEditWsIcon] = useState('');

  // Delete safety state
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    ws: null
  });

  if (!isOpen) return null;

  const popularIcons = ['🍳', '👗', '👟', '💡', '🪑', '📱', '🚗', '💄', '🧸', '🌿', '🛠️', '⌚', '☕', '🎮', '🧰', '👜', '💎', '🚲', '📦', '⚙️'];

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setNewWsName(tpl.name);
    setNewWsIcon(tpl.icon);
    setNewWsDomain(tpl.domain);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const tpl = WORKSPACE_TEMPLATES.find(t => t.id === selectedTemplateId) || WORKSPACE_TEMPLATES[0];
    const name = (newWsName || tpl.name).trim();
    const icon = (newWsIcon || tpl.icon).trim();
    const domain = (newWsDomain || tpl.domain).trim();

    const newWorkspace = {
      id: 'ws_' + Date.now(),
      name,
      icon,
      domain,
      badge: 'Actif',
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    onCreateWorkspace(newWorkspace, tpl.categories);
    onClose();
  };

  const startEdit = (ws) => {
    setEditingWsId(ws.id);
    setEditWsName(ws.name);
    setEditWsIcon(ws.icon);
  };

  const saveEdit = (wsId) => {
    if (editWsName.trim()) {
      onUpdateWorkspace(wsId, {
        name: editWsName.trim(),
        icon: editWsIcon.trim() || '📦'
      });
      setEditingWsId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '100%', padding: '1.75rem' }}
      >
        <button className="close-btn" onClick={onClose}><X size={18} /></button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)'
          }}>
            🏢
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2 }}>
              Espaces de Sourcing Multi-Projets
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>
              Créez des catalogues dédiés pour chaque univers (Quincaillerie, Cuisines, Vêtements...) avec leurs propres rayons et usines.
            </p>
          </div>
        </div>

        {/* Segmented Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: '#070C16',
          padding: '0.25rem',
          borderRadius: '10px',
          margin: '1.25rem 0 1rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: activeTab === 'create' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent',
              color: activeTab === 'create' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} />
            <span>➕ Créer un Nouvel Espace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: activeTab === 'list' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent',
              color: activeTab === 'list' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={15} />
            <span>📁 Gérer mes Espaces ({workspaces.length})</span>
          </button>
        </div>

        {/* TAB 1: ➕ CRÉER UN NOUVEL ESPACE */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* 1. Sélection d'un Modèle d'Univers */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#93C5FD', marginBottom: '0.45rem' }}>
                1. Choisissez un univers prédéfini (avec ses rayons usines pré-configurés) :
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.45rem' }}>
                {WORKSPACE_TEMPLATES.map(tpl => {
                  const isSel = selectedTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        background: isSel ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(15, 23, 42, 0.95))' : '#0B1120',
                        border: `1.5px solid ${isSel ? '#3B82F6' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{tpl.icon}</span>
                        <strong style={{ fontSize: '0.8rem', color: isSel ? 'white' : '#CBD5E1' }}>
                          {tpl.name}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', lineHeight: 1.2 }}>
                        {tpl.domain}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Nom et Icône */}
            <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '0.6rem', background: '#0B1120', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Icône :
                </label>
                <input
                  type="text"
                  required
                  value={newWsIcon || '📦'}
                  onChange={e => setNewWsIcon(e.target.value)}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    padding: '0.5rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '1.3rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Nom personnalisé de votre Espace de Sourcing :
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cuisines & Sanitaire, Vêtements Streetwear, Sneaker Store..."
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                />
              </div>
            </div>

            {/* Palette rapide d'icônes */}
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginRight: '0.4rem' }}>
                Suggestions d'icônes rapides :
              </span>
              <div style={{ display: 'inline-flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {popularIcons.map((ico, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewWsIcon(ico)}
                    style={{
                      background: newWsIcon === ico ? 'rgba(37, 99, 235, 0.4)' : 'rgba(255, 255, 255, 0.06)',
                      border: newWsIcon === ico ? '1px solid #3B82F6' : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '0.2rem 0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                  >
                    {ico}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton de Validation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="nav-btn" onClick={onClose}>
                Annuler
              </button>

              <button type="submit" className="btn-primary-action" style={{ padding: '0.6rem 1.5rem' }}>
                <Plus size={16} />
                <span>Créer et Ouvrir l'Espace</span>
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: 📁 GÉRER & RENOMMER MES ESPACES */}
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
              Espaces Actuellement Configurés :
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
              {workspaces.map(ws => {
                const isSelected = ws.id === activeWorkspaceId;
                const count = getWorkspaceProductCount ? getWorkspaceProductCount(ws.id) : 0;
                
                return (
                  <div
                    key={ws.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#0B1120',
                      border: isSelected ? '1.5px solid #3B82F6' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      gap: '0.6rem'
                    }}
                  >
                    {editingWsId === ws.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                        <input
                          type="text"
                          value={editWsIcon}
                          onChange={e => setEditWsIcon(e.target.value)}
                          style={{ width: '45px', textAlign: 'center', padding: '0.35rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '1.1rem' }}
                        />
                        <input
                          type="text"
                          value={editWsName}
                          onChange={e => setEditWsName(e.target.value)}
                          style={{ flex: 1, padding: '0.35rem 0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.85rem', fontWeight: 700 }}
                        />
                        <button
                          onClick={() => saveEdit(ws.id)}
                          style={{ background: 'var(--emerald-green)', color: 'white', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          <Check size={13} />
                          <span>Sauver</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>{ws.icon || '📦'}</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ fontSize: '0.88rem', color: isSelected ? '#93C5FD' : 'white' }}>
                                {ws.name}
                              </strong>
                              {isSelected && (
                                <span style={{ background: 'rgba(37, 99, 235, 0.3)', color: '#60A5FA', fontSize: '0.62rem', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '4px' }}>
                                  ACTIF
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              {count} {count > 1 ? 'articles enregistrés' : 'article enregistré'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {!isSelected && (
                            <button
                              onClick={() => {
                                onSelectWorkspace(ws.id);
                                onClose();
                              }}
                              style={{
                                background: 'rgba(37, 99, 235, 0.15)',
                                border: '1px solid rgba(37, 99, 235, 0.3)',
                                color: '#93C5FD',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              Ouvrir
                            </button>
                          )}

                          <button
                            onClick={() => startEdit(ws)}
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
                            title="Renommer l'espace"
                          >
                            <Edit2 size={13} />
                            <span>Renommer</span>
                          </button>

                          {workspaces.length > 1 && (
                            <button
                              onClick={() => setDeleteConfirmState({ isOpen: true, ws })}
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
                              title="Supprimer cet espace"
                            >
                              <Trash2 size={13} />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <button className="btn-primary-action" style={{ padding: '0.5rem 1.3rem' }} onClick={onClose}>
                <span>Fermer</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE CONFIRMATION DE SUPPRESSION D'UN ESPACE */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState({ isOpen: false, ws: null })}
        onConfirm={() => {
          if (deleteConfirmState.ws) {
            onDeleteWorkspace(deleteConfirmState.ws.id);
          }
        }}
        title="Supprimer Définitivement cet Espace de Sourcing ?"
        message="Attention : Tous les articles, devis, fiches techniques et rayons associés à cet espace de sourcing seront supprimés."
        itemName={deleteConfirmState.ws ? `${deleteConfirmState.ws.icon} ${deleteConfirmState.ws.name}` : ''}
        itemType="espace"
      />
    </div>
  );
}
