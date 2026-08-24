import React, { useState } from 'react';
import { Factory, Award, ExternalLink, ShieldCheck, CheckCircle2, TrendingDown, Store, Star, DollarSign, Layers, Zap } from 'lucide-react';

export function MultiSupplierComparator({ product, onSelectFactoryForCrossSourcing, formatPrice, onImportFromClipboard }) {
  const suppliers = (product.suppliers && product.suppliers.length > 0) ? product.suppliers : [
    {
      id: 'sup-pref',
      name: product.factoryName || 'Fournisseur Vérifié Alibaba',
      platform: (product.sourceUrl?.includes('pinduoduo') ? 'pinduoduo' : 'alibaba'),
      city: product.factoryCity || 'Zhejiang, Chine',
      priceCny: parseFloat(product.priceCny) || parseFloat(product.basePriceCny) || 8.28,
      moq: parseInt(product.moq) || 500,
      rating: 4.9,
      badge: product.supplierBadge || 'Verified Supplier',
      years: product.supplierYears || '8 ans d\'expérience',
      isPreferred: true,
      url: product.sourceUrl || product.url || '',
      leadTime: '5-15 jours'
    }
  ];

  const [selectedSupplierId, setSelectedSupplierId] = useState(
    suppliers.find(s => s.isPreferred)?.id || suppliers[0]?.id
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Factory size={16} color="#F59E0B" />
            <span>Comparateur Multi-Fournisseurs ({suppliers.length} Usines Réunies)</span>
          </h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Comparez les prix unitaires en FCFA, les quantités minimales (MOQ) et les garanties de chaque manufacture.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text && onImportFromClipboard) {
                onImportFromClipboard(text, product.id);
                return;
              }
              const res = await fetch('/api/import-live');
              if (res.ok) {
                const data = await res.json();
                if (data && (data.title || data.url) && onImportFromClipboard) {
                  onImportFromClipboard({ ...data, importMode: 'enrich', targetProductId: product.id }, product.id);
                  return;
                }
              }
              alert("💡 Sur votre onglet Alibaba/1688, ouvrez l'extension et cliquez sur « Compléter Fiche » !");
            } catch (e) {
              alert("💡 Sur votre onglet Alibaba/1688, ouvrez l'extension et cliquez sur « Compléter Fiche » !");
            }
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
            border: '1px solid #10B981',
            color: '#34D399',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer'
          }}
          title="Rattacher directement un nouveau fournisseur depuis l'extension Chrome"
        >
          <Zap size={14} color="#34D399" />
          <span>+ Aspirer Fournisseur (Extension)</span>
        </button>
      </div>

      {/* Suppliers Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {suppliers.map((sup, index) => {
          const isSelected = selectedSupplierId === sup.id;
          const isPinduoduo = sup.platform === 'pinduoduo' || sup.name?.toLowerCase().includes('pinduoduo');
          const isAlibaba = sup.platform === 'alibaba' || (!isPinduoduo && !sup.platform);

          return (
            <div 
              key={sup.id || index}
              onClick={() => setSelectedSupplierId(sup.id)}
              style={{
                background: isSelected ? 'rgba(37, 99, 235, 0.1)' : '#0B1120',
                border: `1.5px solid ${isSelected ? 'var(--blue-primary)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Platform Badge */}
                  <span style={{
                    background: isPinduoduo ? 'rgba(225, 29, 72, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isPinduoduo ? '#FDA4AF' : '#FCD34D',
                    border: `1px solid ${isPinduoduo ? 'rgba(225, 29, 72, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}>
                    {isPinduoduo ? '🔴 Pinduoduo' : isAlibaba ? '🟡 Alibaba.com' : '🟠 1688 Usine'}
                  </span>

                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>
                    {sup.name}
                  </span>

                  {sup.isPreferred && (
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                      ★ Fournisseur Principal
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#FBBF24', fontSize: '0.78rem', fontWeight: 800 }}>
                  <Star size={14} fill="#FBBF24" />
                  <span>{sup.rating || 4.9}</span>
                </div>
              </div>

              {/* Location & Badge */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                📍 {sup.city || 'Foshan, Guangdong (Chine)'} • {sup.badge || 'Fabricant Certifié'} • Délai : {sup.leadTime || '5 jours'}
              </div>

              {/* Pricing & MOQ Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.4fr',
                background: 'var(--bg-card)',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>Prix Usine :</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--amber-light)', fontWeight: 800 }}>
                    {(parseFloat(sup.priceCny) || 0).toFixed(2)} ¥
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>Coût Estimé :</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
                    ≈ {formatPrice(parseFloat(sup.priceCny) || 0)}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>Commande Min :</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'white', fontWeight: 700 }}>
                    {sup.moq || '1 pièce'}
                  </span>
                </div>
              </div>

              {/* Paliers Tarifaires Dégressifs Spécifiques à cette manufacture */}
              {Array.isArray(sup.priceTiers) && sup.priceTiers.length > 0 && (
                <div style={{ marginTop: '0.65rem', padding: '0.55rem 0.75rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#93C5FD', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Layers size={12} color="#38BDF8" />
                    <span>📊 Paliers & Remises sur Quantité de cette Usine :</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {sup.priceTiers.map((tier, ti) => (
                      <div key={ti} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <span style={{ color: '#CBD5E1', marginRight: '0.25rem' }}>{tier.minQty} :</span>
                        <strong style={{ color: '#FCD34D' }}>
                          {tier.priceFcfa ? tier.priceFcfa.toLocaleString() + ' FCFA' : formatPrice(parseFloat(tier.priceCny) || 0)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Supplier Contacts */}
              {(sup.phone || sup.whatsapp || sup.wechat || sup.url) && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {sup.phone && (
                    <a
                      href={`tel:${sup.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6EE7B7',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        textDecoration: 'none'
                      }}
                      title="Appeler l'usine"
                    >
                      📞 {sup.phone}
                    </a>
                  )}

                  {sup.whatsapp && (
                    <a
                      href={`https://wa.me/${sup.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        color: '#86EFAC',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        textDecoration: 'none'
                      }}
                      title="Contacter sur WhatsApp"
                    >
                      💬 WhatsApp: {sup.whatsapp}
                    </a>
                  )}

                  {sup.wechat && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(sup.wechat);
                        alert(`ID WeChat copié : ${sup.wechat}`);
                      }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#93C5FD',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                      title="Cliquer pour copier l'ID WeChat"
                    >
                      📱 WeChat: {sup.wechat} (Copier)
                    </span>
                  )}
                </div>
              )}

              {/* Cross-Sourcing Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFactoryForCrossSourcing(sup);
                  }}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: '#93C5FD',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                  title="Voir tous les autres articles fabriqués par cette même usine"
                >
                  <Store size={13} />
                  <span>Explorer Boutique Usine (Cross-Sourcing)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
