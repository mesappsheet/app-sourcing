import React, { useState } from 'react';
import { Store, Factory, Plus, Check, ExternalLink, PackageCheck, ShoppingCart, ArrowRight, Eye, Camera } from 'lucide-react';

export function CrossSourcingStore({ factory, onImportProduct, formatPrice }) {
  const [importedItems, setImportedItems] = useState({});

  // Simulated items produced by the same factory with REAL HD Photos
  const factoryItems = [
    {
      id: 'store-item-1',
      titleFr: 'Tiroir Métallique Double Paroi Ultra-Mince (Slim Box) 450mm',
      titleCn: '极简超薄金属抽屉帮 450mm (骑马抽)',
      category: 'coulisses',
      priceCny: 38.50,
      moq: 20,
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80',
      galleryCount: 4,
      material: 'Acier Peint Époxy Gris Anthracite / Charge 45kg',
      specs: 'Paroi slim 13mm • Amortisseur synchronisé intégré'
    },
    {
      id: 'store-item-2',
      titleFr: 'Coulisse Invisible Synchronisée avec Push-to-Open & Amortisseur Combiné',
      titleCn: '反弹加阻尼二合一隐藏滑轨 (同步杆机构)',
      category: 'coulisses',
      priceCny: 18.20,
      moq: 50,
      image: 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg',
      galleryCount: 5,
      material: 'Acier Galvanisé / Mécanisme Double Ressort',
      specs: 'Ouverture sans poignée + fermeture douce 2-en-1'
    },
    {
      id: 'store-item-3',
      titleFr: 'Gabarit Métallique de Repérage & Pose Rapide pour Coulisses',
      titleCn: '隐藏导轨木工安装定位尺 (多功能划线规)',
      category: 'outillage',
      priceCny: 15.00,
      moq: 10,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
      galleryCount: 3,
      material: 'Aluminium CNC et Butées Laiton',
      specs: 'Règle graduée pour entraxes standard 32mm'
    },
    {
      id: 'store-item-4',
      titleFr: 'Loqueteau Magnétique d\'Ouverture par Pression (Push Latch Fort)',
      titleCn: '重型磁吸反弹器 (免拉手按压自弹)',
      category: 'charnieres',
      priceCny: 3.20,
      moq: 100,
      image: 'https://sc04.alicdn.com/kf/H75691060938f4d92982d61cb570eb947Y.jpg_960x960q80.jpg',
      galleryCount: 3,
      material: 'Corps Aluminium et Aimant Néodyme',
      specs: 'Course d\'éjection 45mm pour portes lourdes'
    },
    {
      id: 'store-item-5',
      titleFr: 'Amortisseur Hydraulique Universel pour Portes Coulissantes',
      titleCn: '移门轻柔阻尼缓冲器 (双向静音)',
      category: 'coulisses',
      priceCny: 8.50,
      moq: 50,
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
      galleryCount: 4,
      material: 'Vérin Huile Silicone Aviation',
      specs: 'Absorption de choc jusqu\'à 50 kg de porte'
    }
  ];

  const [toastMessage, setToastMessage] = useState('');

  const handleToggleImport = (item) => {
    const isAlreadyImported = importedItems[item.id];
    setImportedItems(prev => ({
      ...prev,
      [item.id]: !isAlreadyImported
    }));

    if (!isAlreadyImported) {
      onImportProduct({
        id: 'cross-' + item.id + '-' + Date.now(),
        sku: 'QUIN-FAC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        category: item.category,
        titleFr: item.titleFr,
        titleCn: item.titleCn,
        material: item.material,
        weightCapacity: 'Standard Pro Usine',
        dimensions: 'Standards Fabricant',
        icon: '📦',
        images: [item.image, 'https://sc04.alicdn.com/kf/Hb16629d89269477080f4f9f78ea4e414n.jpg_960x960q80.jpg'],
        rating: 4.9,
        status: 'Sourcé Cross-Boutique',
        hasVideoDemo: true,
        suppliers: [
          {
            id: 'sup-cross-' + Date.now(),
            name: factory?.name || 'Usine Partenaire 1688',
            city: factory?.city || 'Foshan (Guangdong)',
            priceCny: item.priceCny,
            moq: item.moq,
            rating: 4.9,
            badge: 'Même Usine Fabricant',
            isPreferred: true,
            url: 'https://1688.com',
            leadTime: '5 jours'
          }
        ],
        videoDemo: {
          source: 'Douyin Usine Pro',
          views: '95K vues',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-kitchen-drawer-opening-and-closing-smoothly-41224-large.mp4',
          transcriptCn: '同厂五金配件，品质统一，安装匹配度高。',
          script30s: {
            hook: '⚡ Optimisez vos coûts en commandant directement chez l\'usine spécialiste !',
            demo: item.titleFr + ' s\'intègre parfaitement avec les autres accessoires du fabricant.',
            artisanTip: '💡 Finition et entraxes 100% compatibles.',
            cta: 'Disponible au prix usine direct.'
          }
        },
        benefitsArtisan: 'Compatibilité parfaite des teintes et fixations avec les autres ferrures de l\'usine.',
        benefitsClient: 'Qualité homogène sur l\'ensemble du mobilier.',
        recommendedTools: 'Outillage menuiserie standard.'
      });

      setToastMessage(`✅ "${item.titleFr}" ajouté au Catalogue !`);
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <div>
      {/* Success Toast */}
      {toastMessage && (
        <div style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.88rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
          animation: 'modalFade 0.25s ease'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Factory Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(139, 92, 246, 0.15))',
        border: '1px solid var(--purple-accent)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C4B5FD',
            fontSize: '1.8rem'
          }}>
            🏭
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {factory?.name || 'Foshan Top Precision Hardware Co., Ltd'}
              </h2>
              <span className="badge badge-purple">Super Factory 1688 (8 ans)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              📍 {factory?.city || 'Foshan, Province du Guangdong (Chine)'} • Spécialiste Glissières & Amortisseurs Meubles
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '220px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avantage Logistique Afrique :</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
            📦 1 Seul Fret Maritime Groupé
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Économie de 15% à 20% sur le transport</div>
        </div>
      </div>

      {/* Cross Sourcing Items Grid with Real Photos */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          📸 Rayon Quincaillerie & Vraies Photos Usine ({factoryItems.length} Articles Disponibles)
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Photos réelles extraites de la boutique du fabricant chinois. Ajoutez ces pièces complémentaires à votre catalogue d'un clic.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {factoryItems.map(item => (
          <div 
            key={item.id}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${importedItems[item.id] ? 'var(--emerald-green)' : 'var(--border-subtle)'}`,
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {/* VRAIE PHOTO HD PACKSHOT AVEC BADGE */}
            <div style={{ position: 'relative', height: '170px', width: '100%', background: '#0B1120' }}>
              <img 
                src={item.image} 
                alt={item.titleFr} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <span className="badge badge-blue">{item.category}</span>
              </div>

              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(6px)',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.68rem',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Camera size={12} />
                <span>{item.galleryCount} Photos HD</span>
              </div>
            </div>

            {/* Content & Specs */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.35 }}>{item.titleFr}</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{item.titleCn}</p>
              
              <div style={{ background: '#0B1120', padding: '0.5rem 0.7rem', borderRadius: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {item.specs}
              </div>
            </div>

            {/* Pricing in FCFA & Action Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--amber-light)', fontWeight: 700 }}>
                  {item.priceCny.toFixed(2)} ¥ (Usine)
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
                  ≈ {formatPrice(item.priceCny)}
                </div>
              </div>

              <button 
                className={importedItems[item.id] ? 'btn-primary-action' : 'btn-amber-action'}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.75rem',
                  background: importedItems[item.id] ? 'var(--emerald-green)' : undefined
                }}
                onClick={() => handleToggleImport(item)}
              >
                {importedItems[item.id] ? (
                  <>
                    <Check size={14} />
                    <span>Ajouté au Catalogue</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Aspirer cet Article</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
