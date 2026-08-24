import React, { useState } from 'react';
import { Play, Flame, Factory, Sparkles, Volume2, Clock, CheckCircle2, Search, ArrowUpRight } from 'lucide-react';

export function VideoRadarFeed({ products, onSelectProduct, onOpenVisualSearch, formatPrice }) {
  const [activeVideoId, setActiveVideoId] = useState(products[0]?.id || null);

  const activeProduct = products.find(p => p.id === activeVideoId) || products[0];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            🎬 Radar Vidéos Démo & Tendances Sociales Chinoises
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Veille en direct sur <strong>Douyin</strong> et <strong>Xiaohongshu</strong>. L'IA extrait les mécanismes innovants, traduit les explications et génère vos scripts vidéo de 30 secondes.
          </p>
        </div>

        <span className="badge badge-gold" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          <Flame size={15} />
          <span>Flux Tendances Actif</span>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.75rem' }}>
        
        {/* Left: Video Player & Script Studio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Video Box */}
          <div style={{
            background: '#0B1120',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ position: 'relative', height: '320px', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(37, 99, 235, 0.8)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  boxShadow: 'var(--glow-blue)',
                  cursor: 'pointer'
                }}>
                  <Play size={28} fill="white" style={{ marginLeft: '4px' }} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeProduct.titleFr}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Source: {activeProduct.videoDemo?.source} • {activeProduct.videoDemo?.views}
                </div>
              </div>

              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <span className="badge badge-blue">Vidéo Démo HD Sans Watermark</span>
              </div>

              <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-amber-action" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  onClick={() => onSelectProduct(activeProduct)}
                >
                  <Factory size={14} />
                  <span>Voir Fournisseurs 1688</span>
                </button>
              </div>
            </div>

            {/* Video Info Bar */}
            <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>SKU: {activeProduct.sku}</div>
                  <strong style={{ fontSize: '0.95rem' }}>{activeProduct.titleFr}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Prix Usine Estimé :</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--emerald-light)', fontWeight: 800 }}>
                    {formatPrice(activeProduct.suppliers[0]?.priceCny || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Generated 30s Video Script Box */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#F59E0B" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Script Vidéo Démo Prêt au Tournage (30 Secondes)</h3>
              </div>
              <span className="badge badge-gold">Généré par Antigravity IA</span>
            </div>

            <div className="script-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span className="script-time">[00:00 - 00:05] Accroche Hook :</span>
                <span style={{ color: '#FCD34D', fontWeight: 600 }}>{activeProduct.videoDemo?.script30s?.hook}</span>
              </div>
              <div>
                <span className="script-time">[00:05 - 00:18] Démonstration Visuelle :</span>
                <span>{activeProduct.videoDemo?.script30s?.demo}</span>
              </div>
              <div>
                <span className="script-time">[00:18 - 00:26] Conseil Pose Artisan :</span>
                <span style={{ color: '#93C5FD' }}>{activeProduct.videoDemo?.script30s?.artisanTip}</span>
              </div>
              <div>
                <span className="script-time">[00:26 - 00:30] Appel à l'Action :</span>
                <span style={{ color: '#6EE7B7', fontWeight: 600 }}>{activeProduct.videoDemo?.script30s?.cta}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Video Feed List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            🔥 Nouveautés Quincaillerie Détectées Récemment :
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '620px', overflowY: 'auto' }}>
            {products.map((prod) => (
              <div 
                key={prod.id}
                onClick={() => setActiveVideoId(prod.id)}
                style={{
                  background: prod.id === activeVideoId ? 'var(--bg-surface-hover)' : 'var(--bg-card)',
                  border: `1px solid ${prod.id === activeVideoId ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '10px',
                  background: '#0B1120',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  flexShrink: 0,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {prod.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                      {prod.videoDemo?.views || '150K vues'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{prod.category}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prod.titleFr}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {prod.suppliers.length} usines 1688 identifiées • Dès {formatPrice(prod.suppliers[0]?.priceCny || 0)}
                  </div>
                </div>

                <div style={{ color: prod.id === activeVideoId ? 'var(--blue-light)' : 'var(--text-tertiary)' }}>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
