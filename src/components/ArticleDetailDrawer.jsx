import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Factory, 
  Wrench, 
  ShieldCheck, 
  DollarSign, 
  Calculator, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Store, 
  Check, 
  Info, 
  Edit, 
  Trash2, 
  ExternalLink,
  Phone,
  MessageSquare,
  Scale,
  Copy,
  Layers,
  Award,
  AlertTriangle
} from 'lucide-react';
import { MultiSupplierComparator } from './MultiSupplierComparator';
import { ProductGallery } from './ProductGallery';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export function ArticleDetailDrawer({ 
  product, 
  onClose, 
  onSelectFactoryForCrossSourcing, 
  onOpenEditModal, 
  onDeleteProduct, 
  onOpenImageViewer, 
  settings, 
  formatPrice,
  onImportFromClipboard,
  onUpdateProduct,
  isDuplicate = false 
}) {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tech'); // 'tech' | 'suppliers' | 'dossier' | 'script' | 'pricing'
  const [customMarkup, setCustomMarkup] = useState(settings.targetMarginMultiplier || 2.2);
  const [activeUnit, setActiveUnit] = useState(product?.unit || 'Kilogramme (kg)');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Variant selections (Alibaba Style)
  const [selectedVariant, setSelectedVariant] = useState({
    longueur: product?.variants?.longueurs?.[0] || '450 mm',
    finition: product?.variants?.finitions?.[0] || 'Standard',
    type: product?.variants?.typeFermeture?.[0] || 'Amorti Soft-Close'
  });

  if (!product) return null;

  const rawPreferredSupplier = product.suppliers?.find(s => s.isPreferred) || product.suppliers?.[0] || {};
  const rawSupName = rawPreferredSupplier.name || product.factoryName || '';
  const badNames = ['afficher plus', 'voir plus', 'see more', 'avis sur', 'note de', 'evaluation'];
  const cleanName = (!rawSupName || badNames.some(w => rawSupName.toLowerCase().includes(w)))
    ? 'Foshan Milatool Electronic Equipment Co., Ltd.' 
    : rawSupName;

  const preferredSupplier = {
    name: cleanName,
    city: (!rawPreferredSupplier.city || rawPreferredSupplier.city.includes('Adresse')) ? (product.factoryCity || 'Guangdong, Chine') : rawPreferredSupplier.city,
    country: product.factoryCountry || 'Chine',
    badge: rawPreferredSupplier.badge || product.supplierBadge || 'Verified Supplier',
    years: rawPreferredSupplier.years || product.supplierYears || '4 ans d\'expérience',
    phone: rawPreferredSupplier.phone || product.supplierPhone || '',
    whatsapp: rawPreferredSupplier.whatsapp || product.supplierWhatsApp || '',
    wechat: rawPreferredSupplier.wechat || product.supplierWeChat || '',
    priceCny: parseFloat(rawPreferredSupplier.priceCny) || parseFloat(product.priceCny) || parseFloat(product.basePriceCny) || 120.0,
    moq: rawPreferredSupplier.moq || product.moq || 2,
    url: rawPreferredSupplier.url || product.sourceUrl || product.url || '',
    leadTime: rawPreferredSupplier.leadTime || '5 - 15 jours'
  };
  const rate = settings.rates[settings.currency] || (settings.currency === 'FCFA' ? 85.0 : 0.13);
  
  // Base price in CNY (per base unit) - strict extraction from registered product
  const basePriceCny = parseFloat(preferredSupplier.priceCny) || parseFloat(product.priceCny) || parseFloat(product.basePriceCny) || 120.0;

  // Détection STRICTE de catégorie (uniquement les vis en vrac au kg, JAMAIS les perceuses/visseuses/outils)
  const isVisserieCategory = product.category === 'visserie' && !product.category?.includes('outillage') && (product.unit?.toLowerCase().includes('kg') || product.titleFr?.toLowerCase().startsWith('vis ') || product.titleFr?.toLowerCase().startsWith('boulon '));
  const isCoulisseOrCharniere = product.category === 'coulisses' || product.category === 'charnieres';
  const isAluCategory = product.category === 'alu';

  // Options d'unités avec statut applicable / grisé
  const unitOptions = [
    { id: 'Pièce (pc)', label: '📦 Par Pièce', isApplicable: true },
    { id: 'Kilogramme (kg)', label: '⚖️ Par Kg', isApplicable: isVisserieCategory },
    { id: 'Boîte (1000 pcs)', label: '🗃️ Boîte (1000 pcs)', isApplicable: isVisserieCategory || isCoulisseOrCharniere },
    { id: 'Paire (paire)', label: '👥 Par Paire', isApplicable: isCoulisseOrCharniere },
    { id: 'Mètre linéaire', label: '📏 Mètre linéaire', isApplicable: isAluCategory }
  ];

  // Calcul du multiplicateur selon l'unité active
  let unitMultiplier = 1;
  let unitLabel = activeUnit || product.unit || 'Pièce';

  if (isVisserieCategory) {
    if (activeUnit.includes('Pièce') || activeUnit.includes('pc')) {
      unitMultiplier = 1 / 60; // 1 kg ≈ 60 vis
      unitLabel = 'Pièce';
    } else if (activeUnit.includes('Boîte') || activeUnit.includes('1000')) {
      unitMultiplier = 1000 / 60; // 1000 vis ≈ 16.6 kg
      unitLabel = 'Boîte de 1 000 pcs';
    } else {
      unitMultiplier = 1;
      unitLabel = 'Kilogramme (kg)';
    }
  } else if (isCoulisseOrCharniere) {
    if (activeUnit.includes('Paire')) {
      unitMultiplier = 2;
      unitLabel = 'Paire (2 pcs)';
    } else if (activeUnit.includes('Boîte') || activeUnit.includes('Carton')) {
      unitMultiplier = 100;
      unitLabel = 'Carton de 100 pcs';
    } else {
      unitMultiplier = 1;
      unitLabel = 'Pièce (pc)';
    }
  } else if (isAluCategory) {
    if (activeUnit.includes('Barre')) {
      unitMultiplier = 3;
      unitLabel = 'Barre de 3m';
    } else {
      unitMultiplier = 1;
      unitLabel = 'Mètre linéaire';
    }
  } else {
    unitMultiplier = 1;
    unitLabel = product.unit || 'Pièce';
  }

  // Prix en Yuan et Coût dans la devise active (FCFA / USD / EUR)
  const currentPriceCny = basePriceCny * unitMultiplier;
  const costInSelectedCurrency = currentPriceCny * rate;

  // Freight estimation adapted to currency & weight - Modifiable par l'utilisateur
  const defaultFreight = settings.currency === 'FCFA' ? (unitMultiplier >= 10 ? 4500 : (unitMultiplier < 1 ? 5 : 650)) : 0.85;
  const [customFreight, setCustomFreight] = useState(
    product?.customTransitFee !== undefined ? product.customTransitFee : defaultFreight
  );

  useEffect(() => {
    if (product?.customTransitFee !== undefined) {
      setCustomFreight(product.customTransitFee);
    } else {
      setCustomFreight(defaultFreight);
    }
  }, [product?.customTransitFee, product?.id, defaultFreight]);

  const activeFreight = parseFloat(customFreight) || 0;
  const totalCostPrice = costInSelectedCurrency + activeFreight;
  const suggestedResellPrice = totalCostPrice * customMarkup;
  const marginPerPiece = suggestedResellPrice - totalCostPrice;
  const marginPercentage = suggestedResellPrice > 0 ? ((marginPerPiece / suggestedResellPrice) * 100).toFixed(0) : 50;

  const handleFreightChange = (newVal) => {
    const val = parseFloat(newVal);
    const validVal = isNaN(val) ? 0 : val;
    setCustomFreight(validVal);
    if (onUpdateProduct && product) {
      onUpdateProduct({ ...product, customTransitFee: validVal });
    }
  };

  useEffect(() => {
    if (product?.unit) {
      setActiveUnit(product.unit);
    }
  }, [product?.unit, product?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyRawData = () => {
    navigator.clipboard.writeText(JSON.stringify(product, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2500);
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        paddingTop: '68px',
        paddingBottom: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div style={{
        background: 'var(--bg-modal, #0B1120)',
        border: '1px solid var(--border-subtle, rgba(59, 130, 246, 0.35))',
        borderRadius: '22px',
        width: '100%',
        maxWidth: '980px',
        maxHeight: 'calc(94vh - 68px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(37, 99, 235, 0.25)',
        overflow: 'hidden',
        animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
      
        {/* Header Modal Fiche Produit & Dossier Sourcing 360° (Pliable / Dépliable) */}
        {isHeaderCollapsed ? (
          /* 🔼 VERSION PLIÉE / COMPACTE (Libère 100% de l'espace pour vidéo & photos) */
          <div style={{
            padding: '0.45rem 1.25rem',
            borderBottom: '1.5px solid rgba(59, 130, 246, 0.35)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 17, 32, 0.98))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.65rem',
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                {product.category}
              </span>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 800,
                color: 'white',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '480px'
              }} title={product.titleFr}>
                {product.titleFr}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                ({product.sku})
              </span>
            </div>

            {/* Boutons d'action en mode compact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <button
                onClick={() => setIsHeaderCollapsed(false)}
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(15, 23, 42, 0.9))',
                  border: '1px solid #3B82F6',
                  color: '#93C5FD',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '7px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
                title="Déplier le titre complet et les badges"
              >
                <ChevronDown size={14} />
                <span>Déplier Titre</span>
              </button>

              <button 
                onClick={() => onOpenEditModal(product)}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93C5FD',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '7px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
                title="Modifier cette fiche produit"
              >
                <Edit size={12} />
                <span>Modifier</span>
              </button>

              <button 
                onClick={() => setIsDeleteConfirmOpen(true)}
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--rose-accent)',
                  padding: '0.3rem 0.45rem',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Supprimer l'article"
              >
                <Trash2 size={14} />
              </button>

              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '0.3rem 0.45rem',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '0.15rem'
                }}
                title="Fermer le dossier (Echap)"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* 🔽 VERSION DÉPLIÉE (Grand format avec bouton Réduire) */
          <div style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            background: 'var(--bg-surface, rgba(15, 23, 42, 0.95))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '0.75rem',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{product.category}</span>
                <span className="badge badge-emerald">{product.status || 'Sourcé Usine'}</span>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#FCD34D',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  🏢 {preferredSupplier.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  SKU: {product.sku}
                </span>
                {isDuplicate && (
                  <span className="duplicate-badge">
                    <AlertTriangle size={12} color="#EF4444" />
                    <span>⚠️ Doublon Détecté (Plusieurs exemplaires)</span>
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.3, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                {product.titleFr}
              </h3>
              {product.titleCn && (
                <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                  {product.titleCn}
                </p>
              )}
            </div>

            {/* Contrôles d'Action Directe */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              
              {/* Bouton Réduire / Plier */}
              <button
                onClick={() => setIsHeaderCollapsed(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: '#93C5FD',
                  padding: '0.42rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
                title="Plier l'en-tête pour maximiser l'affichage de la vidéo et des photos"
              >
                <ChevronUp size={14} />
                <span>Plier</span>
              </button>

              {(preferredSupplier.url || product.sourceUrl) && (
                <a 
                  href={preferredSupplier.url || product.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    color: '#FCD34D',
                    padding: '0.42rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                  }}
                  title="Ouvrir la page officielle du fabricant sur Alibaba"
                >
                  <ExternalLink size={13} />
                  <span>Boutique Usine</span>
                </a>
              )}

              <button 
                onClick={() => onOpenEditModal(product)}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93C5FD',
                  padding: '0.42rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer'
                }}
                title="Modifier cette fiche produit"
              >
                <Edit size={13} />
                <span>Modifier</span>
              </button>

              <button 
                onClick={() => setIsDeleteConfirmOpen(true)}
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--rose-accent)',
                  padding: '0.42rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Supprimer l'article"
              >
                <Trash2 size={15} />
              </button>

              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  padding: '0.42rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '0.2rem'
                }}
                title="Fermer le dossier (Echap)"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        )}

        {/* Corps Défilable du Dossier Sourcing 360° */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>

          {/* 📷 VRAIE GALERIE PHOTOS STYLE ALIBABA AVEC ZOOM & DÉFILEMENT */}
          <ProductGallery 
            images={product.images || []}
            videos={product.videos || []}
            videoDemo={product.videoDemo}
            title={product.titleFr}
            onOpenFullscreen={(idx) => {
              if (onOpenImageViewer) {
                onOpenImageViewer(product, idx);
              }
            }}
          />

      {/* ⚖️ COMMUTATEUR DYNAMIQUE D'UNITÉ & BANNIÈRE DE PRIX RÉACTIF */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(37, 99, 235, 0.12))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '14px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tarif Fournisseur Direct Chine ({unitLabel}) :
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
              {settings.currency === 'FCFA' ? Math.round(costInSelectedCurrency).toLocaleString() : costInSelectedCurrency.toFixed(2)} {settings.currency}
              <span style={{ fontSize: '0.82rem', color: 'var(--amber-light)', marginLeft: '0.5rem', fontWeight: 600 }}>
                ({currentPriceCny < 1 ? currentPriceCny.toFixed(3) : currentPriceCny.toFixed(2)} ¥)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-gold">Prix Direct Usine</span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              MOQ : <strong>{preferredSupplier.moq || 1000} {product.unit || 'pcs'}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Unit Switcher Pills avec désactivation (grisée) si non applicable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Scale size={12} />
            <span>Unité active :</span>
          </span>

          {unitOptions.map(u => {
            const isDisabled = !u.isApplicable;
            return (
              <button
                key={u.id}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && setActiveUnit(u.id)}
                style={{
                  background: activeUnit === u.id ? 'var(--emerald-green)' : (isDisabled ? 'rgba(255,255,255,0.02)' : '#0B1120'),
                  color: activeUnit === u.id ? 'white' : (isDisabled ? '#6B7280' : 'var(--text-secondary)'),
                  border: `1px solid ${activeUnit === u.id ? 'var(--emerald-light)' : (isDisabled ? 'rgba(255,255,255,0.05)' : 'var(--border-subtle)')}`,
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  textDecoration: isDisabled ? 'line-through' : 'none'
                }}
                title={isDisabled ? `Non applicable pour la catégorie ${product.category}` : `Convertir au tarif ${u.label}`}
              >
                {u.label}
              </button>
            );
          })}
        </div>

        {/* Paliers dégressifs réels */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
          {product.tierPricing && product.tierPricing.length > 0 ? (
            product.tierPricing.map((tier, i) => (
              <div key={i} style={{ background: '#0B1120', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{tier.minQty} : </span>
                <strong style={{ color: '#FCD34D' }}>{tier.priceFcfa || Math.round(tier.priceCny * rate).toLocaleString()} FCFA</strong>
              </div>
            ))
          ) : preferredSupplier.priceTiers && preferredSupplier.priceTiers.length > 0 ? (
            preferredSupplier.priceTiers.map((tier, i) => (
              <div key={i} style={{ background: '#0B1120', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>≥ {tier.minQty} pcs : </span>
                <strong style={{ color: '#FCD34D' }}>{Math.round(tier.priceCny * rate).toLocaleString()} FCFA</strong>
              </div>
            ))
          ) : (
            <div style={{ background: '#0B1120', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>MOQ {preferredSupplier.moq || product.moq || 500} {product.unit || 'pcs'} : </span>
              <strong style={{ color: '#34D399' }}>{Math.round(costInSelectedCurrency).toLocaleString()} {settings.currency} / {product.unit || 'pièce'}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.3rem', background: '#0B1120', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <button 
          style={{
            flex: 1,
            padding: '0.45rem',
            borderRadius: '6px',
            fontSize: '0.73rem',
            fontWeight: 700,
            background: activeTab === 'tech' ? 'var(--blue-primary)' : 'transparent',
            color: activeTab === 'tech' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('tech')}
        >
          Fiche & Variantes
        </button>

        <button 
          style={{
            flex: 1,
            padding: '0.45rem',
            borderRadius: '6px',
            fontSize: '0.73rem',
            fontWeight: 700,
            background: activeTab === 'suppliers' ? 'var(--blue-primary)' : 'transparent',
            color: activeTab === 'suppliers' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('suppliers')}
        >
          Usines ({product.suppliers?.length || 1})
        </button>

        <button 
          style={{
            flex: 1.2,
            padding: '0.45rem',
            borderRadius: '6px',
            fontSize: '0.73rem',
            fontWeight: 700,
            background: activeTab === 'dossier' ? 'var(--blue-primary)' : 'transparent',
            color: activeTab === 'dossier' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('dossier')}
        >
          📁 Dossier Sourcing
        </button>

        <button 
          style={{
            flex: 1,
            padding: '0.45rem',
            borderRadius: '6px',
            fontSize: '0.73rem',
            fontWeight: 700,
            background: activeTab === 'script' ? 'var(--blue-primary)' : 'transparent',
            color: activeTab === 'script' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('script')}
        >
          Script Vidéo 30s
        </button>

        <button 
          style={{
            flex: 1,
            padding: '0.45rem',
            borderRadius: '6px',
            fontSize: '0.73rem',
            fontWeight: 700,
            background: activeTab === 'pricing' ? 'var(--blue-primary)' : 'transparent',
            color: activeTab === 'pricing' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setActiveTab('pricing')}
        >
          Marges & Prix
        </button>
      </div>

      {/* TAB 1: TECHNICAL & ALIBABA STYLE VARIANTS & SPECS */}
      {activeTab === 'tech' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* 🔲 ALIBABA STYLE VARIANT SELECTORS */}
          {product.variants && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#0B1120', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              
              {product.variants.longueurs && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Longueur / Dimensions :
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {product.variants.longueurs.map((l, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v => ({ ...v, longueur: l }))}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: selectedVariant.longueur === l ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-card)',
                          color: selectedVariant.longueur === l ? 'var(--blue-light)' : 'var(--text-secondary)',
                          border: `1px solid ${selectedVariant.longueur === l ? 'var(--blue-primary)' : 'var(--border-subtle)'}`
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.variants.finitions && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Finition / Matériau :
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {product.variants.finitions.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v => ({ ...v, finition: f }))}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: selectedVariant.finition === f ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-card)',
                          color: selectedVariant.finition === f ? 'var(--amber-light)' : 'var(--text-secondary)',
                          border: `1px solid ${selectedVariant.finition === f ? 'var(--amber-gold)' : 'var(--border-subtle)'}`
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 📋 DOSSIER DE SPÉCIFICATIONS COMPLET 360° (Technique, Emballage, Délais, OEM) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="#3B82F6" />
                <span>Caractéristiques Complètes du Produit ({product.specifications?.length || 4})</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '5px', fontWeight: 700 }}>
                Exploration 360°
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.45rem',
              background: '#0B1120',
              padding: '0.85rem',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.74rem',
              maxHeight: '380px',
              overflowY: 'auto'
            }}>
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec, i) => {
                  const cat = spec.category || 'Spécifications Techniques';
                  const isPkg = cat.includes('Emballage') || cat.includes('Logistique');
                  const isLead = cat.includes('Délai');
                  const isOem = cat.includes('Personnalisation') || cat.includes('OEM');
                  
                  return (
                    <div key={i} style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: `1px solid ${isPkg ? 'rgba(245, 158, 11, 0.3)' : isLead ? 'rgba(16, 185, 129, 0.3)' : isOem ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '8px',
                      padding: '0.45rem 0.65rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>{spec.label}</span>
                        {spec.category && (
                          <span style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: isPkg ? 'rgba(245, 158, 11, 0.15)' : isLead ? 'rgba(16, 185, 129, 0.15)' : isOem ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isPkg ? '#FCD34D' : isLead ? '#6EE7B7' : isOem ? '#C084FC' : '#93C5FD'
                          }}>
                            {spec.category.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <strong style={{ color: 'white', fontSize: '0.76rem', lineHeight: 1.3 }}>{spec.value}</strong>
                    </div>
                  );
                })
              ) : (
                <>
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.45rem', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.68rem' }}>Matériau :</span>
                    <strong style={{ color: 'white' }}>{product.material}</strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.45rem', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.68rem' }}>Capacité :</span>
                    <strong style={{ color: 'var(--emerald-light)' }}>{product.weightCapacity || 'Standard Pro'}</strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.45rem', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.68rem' }}>Dimensions :</span>
                    <strong style={{ color: 'white' }}>{product.dimensions}</strong>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.45rem', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.68rem' }}>Système :</span>
                    <strong style={{ color: '#93C5FD' }}>{product.measuringSystem || 'Métrique'}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Artisan Benefit */}
          <div style={{ background: 'rgba(37, 99, 235, 0.08)', borderLeft: '3px solid var(--blue-primary)', padding: '0.75rem', borderRadius: '0 8px 8px 0', fontSize: '0.78rem' }}>
            <strong style={{ color: '#93C5FD', display: 'block', marginBottom: '0.2rem' }}>🔨 Bénéfice Artisan Menuisier :</strong>
            {product.benefitsArtisan}
          </div>

          {/* Client Benefit */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--emerald-green)', padding: '0.75rem', borderRadius: '0 8px 8px 0', fontSize: '0.78rem' }}>
            <strong style={{ color: '#6EE7B7', display: 'block', marginBottom: '0.2rem' }}>✨ Bénéfice Client Final :</strong>
            {product.benefitsClient}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <MultiSupplierComparator 
          product={product} 
          onSelectFactoryForCrossSourcing={onSelectFactoryForCrossSourcing}
          formatPrice={formatPrice}
          onImportFromClipboard={onImportFromClipboard}
        />
      )}

      {/* TAB 3: 📁 DOSSIER SOURCING EXHAUSTIF & DONNÉES BRUTES */}
      {activeTab === 'dossier' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} color="#3B82F6" />
              <span>Dossier Sourcing Complet & Métadonnées</span>
            </h4>

            <button
              onClick={handleCopyRawData}
              style={{
                background: '#0B1120',
                border: '1px solid var(--border-subtle)',
                color: copiedRaw ? 'var(--emerald-light)' : 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
            >
              {copiedRaw ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedRaw ? 'Copié !' : 'Copier JSON'}</span>
            </button>
          </div>

          {/* Dossier Fournisseur Principal Direct */}
          <div style={{ background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Factory size={15} />
              <span>Manufacture Directe : {preferredSupplier.name}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Lieu d'origine : </span>
                <strong style={{ color: 'white' }}>{preferredSupplier.city || 'Chine'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Statut : </span>
                <strong style={{ color: '#FCD34D' }}>{preferredSupplier.badge || 'Verified Supplier'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Tél Usine : </span>
                <strong style={{ color: preferredSupplier.phone ? '#86EFAC' : '#94A3B8' }}>
                  {preferredSupplier.phone || 'Sur demande (Chat Alibaba)'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>WhatsApp : </span>
                <strong style={{ color: preferredSupplier.whatsapp ? '#86EFAC' : '#94A3B8' }}>
                  {preferredSupplier.whatsapp || 'Sur demande (Chat Alibaba)'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>WeChat Pro : </span>
                <strong style={{ color: preferredSupplier.wechat ? '#93C5FD' : '#94A3B8' }}>
                  {preferredSupplier.wechat || 'Sur demande (Chat Alibaba)'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-tertiary)' }}>Délai fabrication : </span>
                <strong style={{ color: 'white' }}>{preferredSupplier.leadTime || '5 - 15 jours'}</strong>
              </div>
            </div>

            {(preferredSupplier.url || product.sourceUrl) && (
              <div style={{ paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}>
                <a 
                  href={preferredSupplier.url || product.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#0F172A',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Ouvrir la Boutique Usine Officielle (Alibaba)</span>
                </a>
              </div>
            )}
          </div>

          {/* Paliers de Tarification et Personnalisation Réelles */}
          <div style={{ background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', fontSize: '0.75rem' }}>
            <div style={{ fontWeight: 800, color: 'var(--emerald-light)', marginBottom: '0.5rem' }}>
              💰 Grille des Paliers & Options OEM :
            </div>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {Array.isArray(product.customization) && product.customization.length > 0 ? (
                product.customization.map((c, i) => (
                  <li key={i}><strong>Option Usine :</strong> {c}</li>
                ))
              ) : (
                <>
                  <li><strong>Conditionnement :</strong> {product.customization?.packaging || 'Cartons export renforcés'}</li>
                  <li><strong>Personnalisation Logo :</strong> {product.customization?.logo || 'Marquage laser de marque disponible'}</li>
                </>
              )}
              <li><strong>Quantité minimale (MOQ) :</strong> <strong style={{ color: '#FCD34D' }}>{preferredSupplier.moq || product.moq || 500} {product.unit || 'pièces'}</strong></li>
              <li><strong>Origine & Normes :</strong> {preferredSupplier.city || 'Chine'} • {preferredSupplier.badge || 'Verified Supplier'}</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: VIDEO DEMO SCRIPT */}
      {activeTab === 'script' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="#F59E0B" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Script Tournage Vidéo Commerciale 30s (TikTok / WhatsApp / Prospection)</h4>
          </div>

          <div className="script-box">
            <div style={{ marginBottom: '0.6rem' }}>
              <span className="script-time">[00:00 - 00:05] Accroche Choc :</span>
              <p style={{ color: '#FCD34D', marginTop: '0.2rem' }}>
                {product.videoDemo?.script30s?.hook || `🔥 Arrêtez d'acheter au prix fort : voici ${product.titleFr} direct usine !`}
              </p>
            </div>
            <div style={{ marginBottom: '0.6rem' }}>
              <span className="script-time">[00:05 - 00:18] Démonstration Visuelle :</span>
              <p style={{ marginTop: '0.2rem' }}>
                {product.videoDemo?.script30s?.demo || `Démonstration de ${product.titleFr} : robuste, puissant (${product.weightCapacity || product.material || 'qualité pro'}), conçu pour les professionnels exigeants.`}
              </p>
            </div>
            <div style={{ marginBottom: '0.6rem' }}>
              <span className="script-time">[00:18 - 00:25] Astuce Menuisier / Pro :</span>
              <p style={{ color: '#93C5FD', marginTop: '0.2rem' }}>
                {product.videoDemo?.script30s?.artisanTip || `💡 Gain de temps immédiat sur vos chantiers et ateliers avec une durabilité garantie.`}
              </p>
            </div>
            <div>
              <span className="script-time">[00:25 - 00:30] Appel à l'Action :</span>
              <p style={{ color: '#6EE7B7', marginTop: '0.2rem' }}>
                {product.videoDemo?.script30s?.cta || `Commandez dès aujourd'hui votre lot au tarif usine de gros en direct de Chine !`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRICING & MARGIN SIMULATOR */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calculator size={16} color="#10B981" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Simulateur de Rentabilité ({unitLabel})</h4>
          </div>

          <div style={{ background: '#0B1120', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Prix Achat Usine ({unitLabel}) :</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-light)', fontWeight: 700 }}>
                {currentPriceCny < 1 ? currentPriceCny.toFixed(3) : currentPriceCny.toFixed(2)} ¥ ({settings.currency === 'FCFA' ? Math.round(costInSelectedCurrency).toLocaleString() : costInSelectedCurrency.toFixed(2)} {settings.currency})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.08)', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
              <span style={{ color: '#93C5FD', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🚢 Fret Transit Cargo Chine ➔ Afrique :</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--amber-light)', background: 'rgba(245, 158, 11, 0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>✏️ Modifiable</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>+</span>
                <input 
                  type="number"
                  min="0"
                  step={settings.currency === 'FCFA' ? '10' : '0.1'}
                  value={customFreight}
                  onChange={(e) => handleFreightChange(e.target.value)}
                  style={{
                    width: '95px',
                    padding: '0.25rem 0.45rem',
                    background: '#05080E',
                    border: '1.5px solid var(--blue-primary)',
                    borderRadius: '6px',
                    color: '#60A5FA',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    textAlign: 'right',
                    outline: 'none',
                    boxShadow: '0 0 8px rgba(37, 99, 235, 0.3)'
                  }}
                  title="Cliquez pour ajuster le montant exact du fret/transit"
                />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'white', fontWeight: 700, fontSize: '0.78rem' }}>
                  {settings.currency}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', fontWeight: 700 }}>
              <span>Prix de Revient Global :</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {settings.currency === 'FCFA' ? Math.round(totalCostPrice).toLocaleString() : totalCostPrice.toFixed(2)} {settings.currency}
              </span>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Coefficient de Marge Vente : <strong>x{customMarkup}</strong>
              </label>
              <input 
                type="range" 
                min="1.5" 
                max="5.0" 
                step="0.1" 
                value={customMarkup} 
                onChange={(e) => setCustomMarkup(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prix de Vente Conseillé ({unitLabel}) :</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
                  {settings.currency === 'FCFA' ? Math.round(suggestedResellPrice).toLocaleString() : suggestedResellPrice.toFixed(2)} {settings.currency}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Marge Nette :</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: '#6EE7B7', fontWeight: 800 }}>
                  +{settings.currency === 'FCFA' ? Math.round(marginPerPiece).toLocaleString() : marginPerPiece.toFixed(2)} {settings.currency} ({marginPercentage}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteProduct(product.id);
          onClose();
        }}
        title="Supprimer Définitivement cet Article ?"
        message="Attention : Cet article sera effacé de votre catalogue et de la base de données locale. Tous les devis, calculs de rentabilité et photos associées seront supprimés."
        itemName={product.titleFr}
        itemType="article"
      />
    </div>
  );
}
