import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Upload, 
  FolderInput, 
  ChevronRight, 
  Sparkles,
  Link2,
  X,
  Play
} from 'lucide-react';
import { UniversalVideoPlayerModal } from './UniversalVideoPlayerModal';
import { getPlayableVideoSrc, isDirectPlayableVideo } from '../utils/mediaUtils';

export function CapturedMediaHub({
  capturedMedia = [],
  onAddMedia,
  onRemoveMedia,
  onTrashMedia,
  onAssignMediaToProduct,
  onCreateProductFromMedia,
  categoriesTree = [],
  allProducts = [],
  showToast
}) {
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState('auto');
  const [newMediaPlatform, setNewMediaPlatform] = useState('Web / E-commerce');
  const [selectedMediaForDispatch, setSelectedMediaForDispatch] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Dispatch Cascade Navigation State
  const [dispatchMainCatId, setDispatchMainCatId] = useState(null);
  const [dispatchSubCatId, setDispatchSubCatId] = useState(null);

  const fileInputRef = useRef(null);

  const productsInSubCategory = (dispatchSubCatId || dispatchMainCatId)
    ? allProducts.filter(p => p.category === dispatchSubCatId || p.category === dispatchMainCatId)
    : [];

  const validMainCategories = categoriesTree.filter(c => c.id !== 'inbox' && c.id !== 'all');

  const detectMediaType = (url) => {
    if (!url) return 'image';
    const lower = url.toLowerCase();
    if (lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov') || lower.includes('video') || lower.includes('tiktok') || lower.includes('douyin')) {
      return 'video';
    }
    return 'image';
  };

  const handleManualAdd = (e) => {
    e?.preventDefault();
    if (!newMediaUrl.trim()) {
      showToast?.('⚠️ Veuillez saisir ou coller un lien de vidéo ou d\'image.');
      return;
    }

    const type = newMediaType === 'auto' ? detectMediaType(newMediaUrl) : newMediaType;
    const mediaItem = {
      id: 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: type,
      url: newMediaUrl.trim(),
      title: newMediaTitle.trim() || (type === 'video' ? 'Vidéo Capturée' : 'Image Capturée'),
      platform: newMediaPlatform || 'Web / Réseaux Sociaux',
      createdAt: new Date().toISOString()
    };

    onAddMedia(mediaItem);
    setNewMediaUrl('');
    setNewMediaTitle('');
    showToast?.(`✅ Média « ${mediaItem.title} » ajouté dans le Magasin d'Arrivage !`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const mediaItem = {
        id: 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        type: isVideo ? 'video' : 'image',
        url: event.target.result,
        title: file.name.replace(/\.[^/.]+$/, ''),
        platform: 'Fichier Local',
        createdAt: new Date().toISOString()
      };
      onAddMedia(mediaItem);
      showToast?.(`📁 « ${file.name} » importé dans le Magasin d'Arrivage !`);
    };
    reader.readAsDataURL(file);
  };

  const openDispatchMenu = (media) => {
    setSelectedMediaForDispatch(media);
    const firstMain = validMainCategories[0];
    setDispatchMainCatId(firstMain?.id || null);
    setDispatchSubCatId(firstMain?.subCategories?.[0]?.id || null);
  };

  const handleContextMenu = (e, media) => {
    e.preventDefault();
    e.stopPropagation();
    openDispatchMenu(media);
  };

  const handleConfirmAssign = (productId) => {
    if (!selectedMediaForDispatch || !productId) return;
    onAssignMediaToProduct(selectedMediaForDispatch, productId);
    setSelectedMediaForDispatch(null);
  };

  const handleConfirmCreate = () => {
    if (!selectedMediaForDispatch) return;
    onCreateProductFromMedia(selectedMediaForDispatch);
    setSelectedMediaForDispatch(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 📥 1. BARRE DE CAPTURE RAPIDE DE MÉDIAS */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(139, 92, 246, 0.12))',
        border: '1.5px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🎬</span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', margin: 0 }}>
                Capturer une Vidéo ou une Photo dans le Magasin d'Arrivage
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Collez un lien (TikTok, Facebook, Instagram, Alibaba, 1688, MP4) ou importez vos médias bruts pour les classer ensuite par clic droit.
              </p>
            </div>
          </div>

          <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #F59E0B', color: '#FCD34D', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 800 }}>
            {capturedMedia.length} média(s) en attente
          </span>
        </div>

        <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.6rem', alignItems: 'center' }}>
            
            {/* Input URL */}
            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                value={newMediaUrl}
                onChange={e => setNewMediaUrl(e.target.value)}
                placeholder="Collez l'URL (https://...mp4, TikTok, Facebook, Alibaba...)"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.82rem'
                }}
              />
              <Link2 size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Input Titre */}
            <input 
              type="text"
              value={newMediaTitle}
              onChange={e => setNewMediaTitle(e.target.value)}
              placeholder="Titre ou note (optionnel)"
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.82rem'
              }}
            />

            {/* Sélecteur Plateforme */}
            <select
              value={newMediaPlatform}
              onChange={e => setNewMediaPlatform(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.6rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <option value="Douyin / TikTok">📱 TikTok / Douyin</option>
              <option value="Facebook / Insta">🌐 Facebook / Instagram</option>
              <option value="Alibaba / 1688">🏭 Alibaba / 1688</option>
              <option value="E-commerce Direct">🛒 Site E-commerce</option>
              <option value="Lien Direct MP4 / HD">🎥 Lien Direct MP4 / HD</option>
            </select>

            {/* Bouton Ajouter */}
            <button
              type="submit"
              className="btn-primary-action"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            >
              <Plus size={15} />
              <span>+ Capturer</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              <span>💡 Astuce : faites un <strong>Clic Droit</strong> sur n'importe quel média pour l'affecter directement à un article !</span>
            </div>

            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="video/*,image/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Upload size={13} />
                <span>📁 Importer Fichier Local</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 🎬 2. GRILLE DES MÉDIAS CAPTURÉS */}
      {capturedMedia.length === 0 ? (
        <div style={{
          background: '#0B1120',
          border: '1.5px dashed var(--border-subtle)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>🎬</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Aucun média en attente dans le Magasin d'Arrivage
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '500px', margin: '0 auto 1.2rem auto' }}>
            Les vidéos et photos que vous trouvez sur TikTok, Facebook, Alibaba ou le web peuvent être capturées ici avec l'extension ou le formulaire ci-dessus avant d'être affectées à un article.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {capturedMedia.map((media) => {
            const isVideo = media.type === 'video';

            return (
              <div
                key={media.id}
                onContextMenu={(e) => handleContextMenu(e, media)}
                style={{
                  background: '#0B1120',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Visual Area */}
                <div style={{ position: 'relative', width: '100%', height: '190px', background: '#000', overflow: 'hidden' }}>
                  {isVideo ? (
                    (() => {
                      const isPlayableDirect = isDirectPlayableVideo(media.url);
                      const displayPoster = media.poster || (media.url && !media.url.includes('tiktok.com') && !media.url.includes('instagram.com') && !media.url.includes('facebook.com') ? media.url : 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg');

                      if (isPlayableDirect) {
                        return (
                          <video 
                            src={getPlayableVideoSrc(media.url)}
                            poster={media.poster || ''}
                            controls
                            preload="metadata"
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                          />
                        );
                      }

                      // Mode Flux Réseau Social (TikTok / Instagram / YouTube)
                      return (
                        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050811' }}>
                          <img 
                            src={displayPoster}
                            alt={media.title}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                          />
                          
                          {/* Play Button Overlay */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem'
                          }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoModal(media);
                              }}
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                boxShadow: '0 0 22px rgba(245, 158, 11, 0.75)',
                                border: 'none',
                                transition: 'transform 0.15s ease',
                                cursor: 'pointer'
                              }}
                              title="Visionner la vidéo directement"
                            >
                              <Play size={22} fill="#000" style={{ marginLeft: '3px' }} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVideoModal(media);
                              }}
                              style={{
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(245, 158, 11, 0.5)',
                                color: '#FCD34D',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <span>▶ Visionner la Vidéo</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <img 
                      src={media.url}
                      alt={media.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {/* Badge Type */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: isVideo ? 'rgba(245, 158, 11, 0.95)' : 'rgba(37, 99, 235, 0.95)',
                    color: isVideo ? '#000' : '#FFF',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    zIndex: 5
                  }}>
                    {isVideo ? <Video size={12} /> : <ImageIcon size={12} />}
                    <span>{isVideo ? 'VIDÉO' : 'PHOTO'}</span>
                  </div>

                  {/* Badge Platform */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#93C5FD',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    zIndex: 5
                  }}>
                    {media.platform}
                  </div>
                </div>

                {/* Card Content & Action Bar */}
                <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {media.title}
                    </h4>

                    {/* Infos Prix Réel & Usine Extraits */}
                    {(media.priceFcfa || media.productData?.priceFcfa) && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px 6px', borderRadius: '5px' }}>
                        <span style={{ color: '#FCD34D', fontWeight: 800, fontSize: '0.78rem' }}>
                          💰 {(media.priceFcfa || media.productData?.priceFcfa).toLocaleString()} FCFA
                          <span style={{ color: '#94A3B8', fontSize: '0.68rem', marginLeft: '4px', fontWeight: 'normal' }}>
                            ({media.priceCny || media.productData?.priceCny} ¥)
                          </span>
                        </span>
                        <span style={{ color: '#93C5FD', fontSize: '0.68rem', fontWeight: 600 }}>
                          {media.moq ? `MOQ: ${media.moq}` : (media.factoryCity || 'Chine')}
                        </span>
                      </div>
                    )}

                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                      {new Date(media.createdAt).toLocaleDateString('fr-FR')} • {media.factoryName || 'Magasin d\'Arrivage'}
                    </div>
                  </div>

                  {/* Boutons d'action rapides */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => openDispatchMenu(media)}
                      className="btn-primary-action"
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.6rem',
                        fontSize: '0.74rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                      title="Affecter ce média à un article"
                    >
                      <FolderInput size={14} />
                      <span>Balancer dans un Article ➔</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onTrashMedia) {
                          onTrashMedia(media);
                        } else {
                          onRemoveMedia(media.id);
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#F87171',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Mettre ce média à la corbeille"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🎯 3. MODAL CASCADE DE DISPATCH DANS UN ARTICLE */}
      {selectedMediaForDispatch && (
        <div 
          onClick={() => setSelectedMediaForDispatch(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 200020,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0B1120',
              border: '1.5px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🎯</span>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'white', margin: 0 }}>
                    Affecter ce média à un Article
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#93C5FD' }}>
                    {selectedMediaForDispatch.title} ({selectedMediaForDispatch.type === 'video' ? '🎬 Vidéo' : '📷 Photo'})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMediaForDispatch(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Colonnes : Rayon ➔ Sous-Rayon ➔ Articles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1.1fr 1.6fr',
              minHeight: '320px',
              maxHeight: '400px',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              
              {/* Colonne 1: Catégories Principales */}
              <div className="custom-menu-scroll" style={{ borderRight: '1px solid var(--border-subtle)', padding: '0.6rem', overflowY: 'scroll', maxHeight: '320px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.3rem' }}>
                  1. Catégorie :
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {validMainCategories.map(mainCat => {
                    const isSelected = dispatchMainCatId === mainCat.id;
                    return (
                      <button
                        key={mainCat.id}
                        onClick={() => {
                          setDispatchMainCatId(mainCat.id);
                          setDispatchSubCatId(mainCat.subCategories?.[0]?.id || null);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #3B82F6' : '1px solid transparent',
                          background: isSelected ? 'rgba(37, 99, 235, 0.35)' : 'transparent',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{mainCat.icon || '📁'}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{mainCat.name}</span>
                        </span>
                        <ChevronRight size={13} color={isSelected ? '#60A5FA' : '#64748B'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colonne 2: Sous-Catégories */}
              <div className="custom-menu-scroll" style={{ borderRight: '1px solid var(--border-subtle)', padding: '0.6rem', overflowY: 'scroll', maxHeight: '320px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.3rem' }}>
                  2. Sous-Rayon :
                </div>
                {(() => {
                  const activeMain = validMainCategories.find(c => c.id === dispatchMainCatId);
                  const subCats = activeMain?.subCategories || [];

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {subCats.map(sub => {
                        const isSelected = dispatchSubCatId === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setDispatchSubCatId(sub.id)}
                            style={{
                              textAlign: 'left',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #10B981' : '1px solid transparent',
                              background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                              color: isSelected ? '#6EE7B7' : 'var(--text-secondary)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{sub.icon || '📂'}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{sub.name}</span>
                            </span>
                            <ChevronRight size={13} color={isSelected ? '#34D399' : '#64748B'} />
                          </button>
                        );
                      })}
                      {subCats.length === 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', padding: '0.5rem' }}>
                          Aucune sous-catégorie.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Colonne 3: Articles cibles correspondants */}
              <div className="custom-menu-scroll" style={{ padding: '0.6rem', overflowY: 'scroll', maxHeight: '320px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.3rem' }}>
                  3. Choisir l'Article ({productsInSubCategory.length}) :
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {productsInSubCategory.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => handleConfirmAssign(prod.id)}
                      style={{
                        textAlign: 'left',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img 
                        src={prod.images?.[0] || 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg'} 
                        alt="" 
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.titleFr}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: '#93C5FD', fontFamily: 'var(--font-mono)' }}>
                          {prod.sku || 'SKU'} • {(prod.videos || []).length} vids
                        </div>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.45rem', borderRadius: '4px' }}>
                        + Ajouter
                      </span>
                    </button>
                  ))}

                  {productsInSubCategory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-tertiary)', fontSize: '0.74rem' }}>
                      Aucun article dans cette sous-catégorie.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer: Option Créer Nouvel Article */}
            <div style={{
              padding: '0.85rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Ou créez une nouvelle fiche produit avec ce média :
              </span>
              <button
                onClick={handleConfirmCreate}
                className="btn-primary-action"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.75rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)'
                }}
              >
                <Sparkles size={14} />
                <span>✨ Créer Nouvel Article</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🎬 4. LECTEUR VIDÉO INTERACTIF UNIVERSEL (TIKTOK / YOUTUBE / INSTA / MP4) */}
      <UniversalVideoPlayerModal 
        isOpen={Boolean(activeVideoModal)}
        onClose={() => setActiveVideoModal(null)}
        videoUrl={activeVideoModal?.url}
        poster={activeVideoModal?.poster}
        title={activeVideoModal?.title}
        platform={activeVideoModal?.platform}
      />

    </div>
  );
}
