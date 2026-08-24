import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Trash2, 
  Plus, 
  Image, 
  Sparkles, 
  Factory, 
  Save, 
  Video, 
  Play, 
  Globe, 
  DollarSign, 
  Star,
  ExternalLink,
  Layers,
  Upload
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function EditArticleModal({ isOpen, onClose, product, onSaveProduct, onDeleteProduct, categories }) {
  const [formData, setFormData] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('general'); // 'general' | 'suppliers' | 'video' | 'images'
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    itemType: '',
    onConfirm: () => {}
  });

  const promptDelete = ({ title, message, itemName, itemType, onConfirm }) => {
    setDeleteConfirmState({
      isOpen: true,
      title,
      message,
      itemName,
      itemType,
      onConfirm
    });
  };

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        images: product.images ? [...product.images] : [],
        suppliers: product.suppliers ? product.suppliers.map(s => ({ ...s })) : [
          {
            id: 'sup-1',
            name: 'Usine Partenaire Alibaba',
            platform: 'alibaba',
            city: 'Foshan (Guangdong)',
            priceCny: 15.0,
            moq: 20,
            rating: 4.9,
            badge: '🟡 Alibaba Gold Supplier',
            isPreferred: true,
            url: 'https://alibaba.com',
            leadTime: '5 jours'
          }
        ],
        videoDemo: product.videoDemo ? { ...product.videoDemo } : {
          source: 'Douyin / Démo Vidéo',
          views: '150K vues',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-kitchen-drawer-opening-and-closing-smoothly-41224-large.mp4',
          transcriptCn: '五金配件工厂直发，安装简单。',
          script30s: {
            hook: '🔥 Arrêtez de perdre du temps sur vos chantiers !',
            demo: 'Démonstration de la ferrure en fonctionnement fluide.',
            artisanTip: '💡 Pose ultra-rapide sans outillage complexe.',
            cta: 'Commandez directement au prix usine.'
          }
        }
      });
    }
  }, [product]);

  if (!isOpen || !formData) return null;

  // --- IMAGE & VIDEO HANDLERS ---
  const handlePhotoFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, event.target.result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({
            ...prev,
            videoDemo: {
              ...prev.videoDemo,
              videoUrl: event.target.result
            }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    promptDelete({
      title: 'Supprimer cette Photo ?',
      message: 'Voulez-vous retirer cette photo de la galerie de cet article ?',
      itemName: `Photo #${indexToRemove + 1}`,
      itemType: 'photo',
      onConfirm: () => {
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
      }
    });
  };

  // --- MULTI-SUPPLIER HANDLERS ---
  const handleAddSupplier = () => {
    const newSupplier = {
      id: 'sup-' + Date.now(),
      name: 'Nouveau Fournisseur (Alibaba / Pinduoduo)',
      platform: 'alibaba',
      city: 'Guangzhou',
      priceCny: 12.50,
      moq: 10,
      rating: 4.8,
      badge: 'Fournisseur Vérifié',
      isPreferred: false,
      url: '',
      leadTime: '5-7 jours'
    };
    setFormData(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier]
    }));
  };

  const handleUpdateSupplier = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.suppliers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, suppliers: updated };
    });
  };

  const handleSetPreferredSupplier = (index) => {
    setFormData(prev => {
      const updated = prev.suppliers.map((s, idx) => ({
        ...s,
        isPreferred: idx === index
      }));
      return { ...prev, suppliers: updated };
    });
  };

  const handleRemoveSupplier = (index) => {
    if (formData.suppliers.length <= 1) {
      alert('Vous devez conserver au moins un fournisseur dans la liste comparative.');
      return;
    }
    const sup = formData.suppliers[index];
    promptDelete({
      title: 'Supprimer ce Fournisseur ?',
      message: 'Voulez-vous retirer ce fournisseur de la liste comparative de cet article ?',
      itemName: sup.name || `Fournisseur #${index + 1}`,
      itemType: 'fournisseur',
      onConfirm: () => {
        setFormData(prev => ({
          ...prev,
          suppliers: prev.suppliers.filter((_, idx) => idx !== index)
        }));
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProduct(formData);
    onClose();
  };

  const handleDelete = () => {
    promptDelete({
      title: 'Supprimer Définitivement cet Article ?',
      message: 'Attention : Cet article sera supprimé du catalogue et de la base de données. Tous les paramètres associés seront effacés.',
      itemName: formData.titleFr,
      itemType: 'article',
      onConfirm: () => {
        onDeleteProduct(formData.id);
        onClose();
      }
    });
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '68px',
        paddingBottom: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: 'calc(94vh - 68px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-modal, #0B1120)', border: '1px solid var(--border-subtle, rgba(59, 130, 246, 0.4))', borderRadius: '20px' }}>
        
        {/* Header with Title & Delete Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>✏️ Modifier l'Article & ses Caractéristiques</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>SKU : {formData.sku}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              type="button"
              onClick={handleDelete}
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--rose-accent)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              <span>Supprimer l'Article</span>
            </button>

            <button className="close-btn" style={{ position: 'static' }} onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Tab Selectors */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: '#070D18',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveEditTab('general')}
            style={{
              flex: 1.2,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: activeEditTab === 'general' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent',
              color: activeEditTab === 'general' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Layers size={15} />
            <span>Général & Caractéristiques ({formData.specifications?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEditTab('suppliers')}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: activeEditTab === 'suppliers' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
              color: activeEditTab === 'suppliers' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Factory size={15} />
            <span>Fournisseurs ({formData.suppliers?.length || 1})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEditTab('images')}
            style={{
              flex: 0.9,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: activeEditTab === 'images' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
              color: activeEditTab === 'images' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Image size={15} />
            <span>Photos ({formData.images?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEditTab('video')}
            style={{
              flex: 0.9,
              padding: '0.55rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: activeEditTab === 'video' ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)' : 'transparent',
              color: activeEditTab === 'video' ? 'white' : 'var(--text-secondary)'
            }}
          >
            <Video size={15} />
            <span>Vidéo & Script</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>

          {/* TAB 1: MULTI-FOURNISSEURS ET LEURS PRIX (Alibaba, Pinduoduo, etc.) */}
          {activeEditTab === 'suppliers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--amber-light)' }}>
                    🏭 Fournisseurs & Usines Comparées ({formData.suppliers.length})
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Ajoutez plusieurs fournisseurs (Alibaba, Pinduoduo, 1688) avec leurs prix respectifs pour comparer le meilleur coût.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-amber-action"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                  onClick={handleAddSupplier}
                >
                  <Plus size={14} />
                  <span>+ Ajouter un Fournisseur</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {formData.suppliers.map((sup, idx) => (
                  <div 
                    key={sup.id || idx}
                    style={{
                      background: '#0B1120',
                      border: `1.5px solid ${sup.isPreferred ? 'var(--amber-gold)' : 'var(--border-subtle)'}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: sup.isPreferred ? 'var(--amber-gold)' : 'rgba(255,255,255,0.1)',
                          color: sup.isPreferred ? '#000' : 'white',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}>
                          #{idx + 1} {sup.isPreferred ? '★ Fournisseur Principal' : ''}
                        </span>
                        
                        {!sup.isPreferred && (
                          <button
                            type="button"
                            onClick={() => handleSetPreferredSupplier(idx)}
                            style={{ background: 'transparent', border: '1px solid rgba(245, 158, 11, 0.4)', color: 'var(--amber-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer' }}
                          >
                            Définir comme Fournisseur Préféré
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSupplier(idx)}
                        style={{ background: 'rgba(244, 63, 94, 0.15)', border: 'none', color: 'var(--rose-accent)', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem' }}
                        title="Supprimer ce fournisseur"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          Nom Usine / Fournisseur :
                        </label>
                        <input 
                          type="text"
                          value={sup.name}
                          onChange={e => handleUpdateSupplier(idx, 'name', e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          Plateforme :
                        </label>
                        <select
                          value={sup.platform || 'alibaba'}
                          onChange={e => handleUpdateSupplier(idx, 'platform', e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                        >
                          <option value="alibaba">🟡 Alibaba.com</option>
                          <option value="pinduoduo">🔴 Pinduoduo (拼多多)</option>
                          <option value="1688">🟠 1688 Direct</option>
                          <option value="taobao">🔵 Taobao</option>
                        </select>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            Prix Unitaire (¥ Yuan) :
                          </label>
                          <span style={{ fontSize: '0.68rem', color: '#FCD34D', fontWeight: 800 }}>
                            ≈ {Math.round((parseFloat(sup.priceCny) || 0) * 85).toLocaleString()} FCFA
                          </span>
                        </div>
                        <input 
                          type="number"
                          step="0.01"
                          value={sup.priceCny}
                          onChange={e => handleUpdateSupplier(idx, 'priceCny', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--emerald-light)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                        />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block', marginTop: '0.15rem' }}>
                          ➔ <strong style={{ color: '#34D399' }}>{Math.round((parseFloat(sup.priceCny) || 0) * 85).toLocaleString()} FCFA</strong> / {formData.unit || 'pièce'}
                        </span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          MOQ (Quantité Min) :
                        </label>
                        <input 
                          type="number"
                          value={sup.moq}
                          onChange={e => handleUpdateSupplier(idx, 'moq', parseInt(e.target.value) || 1)}
                          style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          Badge Qualité :
                        </label>
                        <input 
                          type="text"
                          value={sup.badge || 'Fabricant Vérifié'}
                          onChange={e => handleUpdateSupplier(idx, 'badge', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          Ville / Région :
                        </label>
                        <input 
                          type="text"
                          value={sup.city || 'Foshan, Guangdong'}
                          onChange={e => handleUpdateSupplier(idx, 'city', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          Délai Livraison :
                        </label>
                        <input 
                          type="text"
                          value={sup.leadTime || '5 jours'}
                          onChange={e => handleUpdateSupplier(idx, 'leadTime', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VIDÉO DÉMO & SCRIPT 30S */}
          {activeEditTab === 'video' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#0B1120', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--purple-accent)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Video size={16} />
                  <span>Configuration du Lien Vidéo Démo (Douyin / TikTok / MP4) :</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      URL de la Vidéo (Lien direct .mp4 ou lien vidéo démo) :
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input 
                        type="text"
                        value={formData.videoDemo?.videoUrl || ''}
                        onChange={e => setFormData({
                          ...formData,
                          hasVideoDemo: true,
                          videoDemo: { ...formData.videoDemo, videoUrl: e.target.value }
                        })}
                        style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="file" 
                        id="edit-video-upload" 
                        accept="video/*" 
                        onChange={handleVideoFileUpload}
                        style={{ display: 'none' }} 
                      />
                      <label 
                        htmlFor="edit-video-upload"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(139, 92, 246, 0.2)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          color: '#C4B5FD',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Upload size={13} />
                        <span>📁 Importer MP4</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      Source & Vues :
                    </label>
                    <input 
                      type="text"
                      value={formData.videoDemo?.views || '200K vues'}
                      onChange={e => setFormData({
                        ...formData,
                        videoDemo: { ...formData.videoDemo, views: e.target.value }
                      })}
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                    Transcription Chinoise Originale (Douyin) :
                  </label>
                  <input 
                    type="text"
                    value={formData.videoDemo?.transcriptCn || ''}
                    onChange={e => setFormData({
                      ...formData,
                      videoDemo: { ...formData.videoDemo, transcriptCn: e.target.value }
                    })}
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--amber-light)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* SCRIPT COMMERCIAL 30 SECONDES */}
              <div style={{ background: '#0B1120', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--amber-light)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  <span>Script Vidéo Commercial 30s (TikTok / WhatsApp / Prospection) :</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#FCD34D', marginBottom: '0.2rem' }}>
                      [00:00 - 00:05] Accroche Choc (Hook) :
                    </label>
                    <input 
                      type="text"
                      value={formData.videoDemo?.script30s?.hook || ''}
                      onChange={e => setFormData({
                        ...formData,
                        videoDemo: {
                          ...formData.videoDemo,
                          script30s: { ...formData.videoDemo?.script30s, hook: e.target.value }
                        }
                      })}
                      style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'white', marginBottom: '0.2rem' }}>
                      [00:05 - 00:18] Démonstration Visuelle du Produit :
                    </label>
                    <textarea 
                      rows="2"
                      value={formData.videoDemo?.script30s?.demo || ''}
                      onChange={e => setFormData({
                        ...formData,
                        videoDemo: {
                          ...formData.videoDemo,
                          script30s: { ...formData.videoDemo?.script30s, demo: e.target.value }
                        }
                      })}
                      style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#93C5FD', marginBottom: '0.2rem' }}>
                      [00:18 - 00:25] Astuce Menuisier / Gain de Temps :
                    </label>
                    <input 
                      type="text"
                      value={formData.videoDemo?.script30s?.artisanTip || ''}
                      onChange={e => setFormData({
                        ...formData,
                        videoDemo: {
                          ...formData.videoDemo,
                          script30s: { ...formData.videoDemo?.script30s, artisanTip: e.target.value }
                        }
                      })}
                      style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#6EE7B7', marginBottom: '0.2rem' }}>
                      [00:25 - 00:30] Appel à l'Action (CTA Vente) :
                    </label>
                    <input 
                      type="text"
                      value={formData.videoDemo?.script30s?.cta || ''}
                      onChange={e => setFormData({
                        ...formData,
                        videoDemo: {
                          ...formData.videoDemo,
                          script30s: { ...formData.videoDemo?.script30s, cta: e.target.value }
                        }
                      })}
                      style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS HD */}
          {activeEditTab === 'images' && (
            <div style={{ background: '#0B1120', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--blue-light)', marginBottom: '0.6rem' }}>
                📸 Galerie Photos HD ({formData.images.length} photos) :
              </div>

              {/* List of current images */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                {formData.images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: '85px', height: '85px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border-subtle)' }}>
                    <img src={img} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        background: 'rgba(244, 63, 94, 0.92)',
                        border: 'none',
                        color: 'white',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 800
                      }}
                      title="Supprimer cette photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Image URL + Upload Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    placeholder="Coller l'URL d'une nouvelle photo HD (ex: https://...)"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    className="btn-primary-action"
                    style={{ padding: '0.55rem 0.95rem', fontSize: '0.78rem' }}
                    onClick={handleAddImage}
                  >
                    <Plus size={15} />
                    <span>Ajouter Photo</span>
                  </button>
                </div>

                <div>
                  <input 
                    type="file" 
                    id="edit-photo-upload" 
                    multiple 
                    accept="image/*" 
                    onChange={handlePhotoFileUpload}
                    style={{ display: 'none' }} 
                  />
                  <label 
                    htmlFor="edit-photo-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(37, 99, 235, 0.15)',
                      border: '1px solid rgba(37, 99, 235, 0.35)',
                      color: 'var(--blue-light)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={14} />
                    <span>📁 Importer Photos depuis PC / Mobile</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL INFORMATIONS & TOUTES LES CARACTÉRISTIQUES */}
          {activeEditTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Titres Français & Chinois */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, marginBottom: '0.25rem', color: '#93C5FD' }}>
                    Titre Commercial (Français) :
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.titleFr || ''}
                    onChange={e => setFormData({ ...formData, titleFr: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, marginBottom: '0.25rem', color: '#FCD34D' }}>
                    Référence / Titre Original (Chinois 1688) :
                  </label>
                  <input 
                    type="text"
                    value={formData.titleCn || ''}
                    onChange={e => setFormData({ ...formData, titleCn: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#FDE68A', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Catégorie & Statut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Catégorie / Rayon :
                  </label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.8rem' }}
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Statut Catalogue :
                  </label>
                  <input 
                    type="text"
                    value={formData.status || 'Sourcé Usine'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Prix de Base Direct & Unité de Vente */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34D399' }}>
                      Prix de Base Usine (¥ CNY / Yuan) :
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      ≈ {Math.round((parseFloat(formData.basePriceCny ?? formData.priceCny) || 0) * 85).toLocaleString()} FCFA
                    </span>
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.basePriceCny ?? formData.priceCny ?? ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, basePriceCny: val, priceCny: val });
                    }}
                    style={{ width: '100%', padding: '0.55rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#34D399', fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    💡 Équivalent : <strong style={{ color: '#FCD34D' }}>{Math.round((parseFloat(formData.basePriceCny ?? formData.priceCny) || 0) * 85).toLocaleString()} FCFA</strong> (Taux usine : 85 FCFA / 1 ¥)
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Unité de Vente de Base :
                  </label>
                  <select
                    value={formData.unit || 'Pièce (pc)'}
                    onChange={e => setFormData({ ...formData, unit: e.target.value, baseUnit: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontSize: '0.8rem' }}
                  >
                    <option value="Pièce (pc)">📦 Pièce (pc)</option>
                    <option value="Kilogramme (kg)">⚖️ Kilogramme (kg)</option>
                    <option value="Boîte (1000 pcs)">🗃️ Boîte (1000 pcs)</option>
                    <option value="Paire (paire)">👥 Paire (paire)</option>
                    <option value="Mètre linéaire">📏 Mètre linéaire</option>
                    <option value="Carton (100 pcs)">📦 Carton (100 pcs)</option>
                  </select>
                </div>
              </div>

              {/* Matériau & Capacité de Charge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Matériau / Finition :
                  </label>
                  <input 
                    type="text"
                    value={formData.material || ''}
                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Capacité de Charge / Puissance :
                  </label>
                  <input 
                    type="text"
                    value={formData.weightCapacity || ''}
                    onChange={e => setFormData({ ...formData, weightCapacity: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Dimensions & Système de Mesure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Dimensions & Pose :
                  </label>
                  <input 
                    type="text"
                    value={formData.dimensions || ''}
                    onChange={e => setFormData({ ...formData, dimensions: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Système de Mesure / Voltage :
                  </label>
                  <input 
                    type="text"
                    value={formData.measuringSystem || 'Métrique'}
                    onChange={e => setFormData({ ...formData, measuringSystem: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Origine & Empreinte / Mandrin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Origine / Lieu de Fabrication :
                  </label>
                  <input 
                    type="text"
                    value={formData.origin || ''}
                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Type Mandrin / Empreinte :
                  </label>
                  <input 
                    type="text"
                    value={formData.headType || ''}
                    onChange={e => setFormData({ ...formData, headType: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Arguments Commerciaux & Outillage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: '#080D1A', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38BDF8' }}>
                  🎯 Arguments Commerciaux & Recommandations :
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#93C5FD', marginBottom: '0.2rem' }}>
                    Avantage Poseur / Artisan Menuisier :
                  </label>
                  <input 
                    type="text"
                    value={formData.benefitsArtisan || ''}
                    onChange={e => setFormData({ ...formData, benefitsArtisan: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6EE7B7', marginBottom: '0.2rem' }}>
                    Avantage Client Final / Propriétaire :
                  </label>
                  <input 
                    type="text"
                    value={formData.benefitsClient || ''}
                    onChange={e => setFormData({ ...formData, benefitsClient: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#FCD34D', marginBottom: '0.2rem' }}>
                    Outillage & Gabarits Recommandés :
                  </label>
                  <input 
                    type="text"
                    value={formData.recommendedTools || ''}
                    onChange={e => setFormData({ ...formData, recommendedTools: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              {/* 📋 ÉDITEUR INTERACTIF DES CARACTÉRISTIQUES & SPÉCIFICATIONS TECHNIQUES */}
              <div style={{
                background: '#070D18',
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Layers size={15} color="#F59E0B" />
                    <span>Tableau des Caractéristiques ({formData.specifications?.length || 0})</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                    Modifiables individuellement
                  </span>
                </div>

                {/* Formulaire d'ajout rapide d'une nouvelle spécification */}
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Nom du champ (ex: Moteur, Mandrin, Poids...)"
                    value={newSpecLabel}
                    onChange={e => setNewSpecLabel(e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.65rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.76rem' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Valeur (ex: 850W, 13mm SDS-Max...)"
                    value={newSpecValue}
                    onChange={e => setNewSpecValue(e.target.value)}
                    style={{ flex: 1, padding: '0.45rem 0.65rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontSize: '0.76rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSpecLabel.trim() && newSpecValue.trim()) {
                        const newSpec = { label: newSpecLabel.trim(), value: newSpecValue.trim(), category: 'Spécifications Techniques' };
                        setFormData(prev => ({
                          ...prev,
                          specifications: [...(prev.specifications || []), newSpec]
                        }));
                        setNewSpecLabel('');
                        setNewSpecValue('');
                      }
                    }}
                    style={{
                      background: 'rgba(37, 99, 235, 0.25)',
                      border: '1px solid var(--blue-primary)',
                      color: 'var(--blue-light)',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + Ajouter
                  </button>
                </div>

                {/* Liste des spécifications éditables */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '0.45rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '0.2rem'
                }}>
                  {formData.specifications && formData.specifications.length > 0 ? (
                    formData.specifications.map((spec, sIdx) => (
                      <div key={sIdx} style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.55rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={spec.label}
                            onChange={e => {
                              const updated = [...formData.specifications];
                              updated[sIdx] = { ...updated[sIdx], label: e.target.value };
                              setFormData({ ...formData, specifications: updated });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, width: '85%', outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              promptDelete({
                                title: 'Supprimer cette Caractéristique ?',
                                message: 'Voulez-vous retirer cette caractéristique technique de la fiche ?',
                                itemName: `${spec.label || 'Champ'} : ${spec.value || ''}`,
                                itemType: 'caractéristique',
                                onConfirm: () => {
                                  setFormData(prev => ({
                                    ...prev,
                                    specifications: prev.specifications.filter((_, idx) => idx !== sIdx)
                                  }));
                                }
                              });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0.2rem' }}
                            title="Supprimer cette spécification"
                          >
                            ×
                          </button>
                        </div>
                        <input 
                          type="text" 
                          value={spec.value}
                          onChange={e => {
                            const updated = [...formData.specifications];
                            updated[sIdx] = { ...updated[sIdx], value: e.target.value };
                            setFormData({ ...formData, specifications: updated });
                          }}
                          style={{ background: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#F1F5F9', fontSize: '0.74rem', padding: '0.25rem 0.4rem', outline: 'none', width: '100%' }}
                        />
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', gridColumn: 'span 2', textAlign: 'center', padding: '0.5rem' }}>
                      Aucune spécification technique pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button 
              type="button" 
              className="nav-btn"
              style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              onClick={onClose}
            >
              Annuler
            </button>

            <button 
              type="submit" 
              className="btn-primary-action"
              style={{ flex: 2, justifyContent: 'center', padding: '0.75rem' }}
            >
              <Save size={16} />
              <span>Enregistrer Tout (Fournisseurs, Vidéo, Photos)</span>
            </button>
          </div>

        </form>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => setDeleteConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirmState.onConfirm}
        title={deleteConfirmState.title}
        message={deleteConfirmState.message}
        itemName={deleteConfirmState.itemName}
        itemType={deleteConfirmState.itemType}
      />
    </div>
  );
}
