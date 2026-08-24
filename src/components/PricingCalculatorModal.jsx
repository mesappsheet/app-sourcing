import React from 'react';
import { X, DollarSign, Settings, Check, Ship, Plane } from 'lucide-react';

export function PricingCalculatorModal({ isOpen, onClose, settings, setSettings }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Settings size={22} color="#3B82F6" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Paramètres Financiers & Logistiques</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Ajustez les taux de change Yuan (¥) et les coûts de transport pour un calcul automatique précis de vos marges.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Default Currency */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              Devise d'Affichage Principale
            </label>
            <select 
              value={settings.currency} 
              onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: '#0B1120',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'white',
                fontFamily: 'inherit'
              }}
            >
              <option value="EUR">Euro (€) - France / Europe</option>
              <option value="FCFA">Franc CFA (XOF / XAF) - Afrique de l'Ouest / Centrale</option>
              <option value="USD">Dollar US ($) - International</option>
              <option value="CNY">Yuan Chinois (¥) - Prix Usine Brut</option>
            </select>
          </div>

          {/* Exchange Rates */}
          <div style={{ background: '#0B1120', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--amber-light)' }}>
              Taux de Conversion (1 Yuan CNY = ) :
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Vers Euro (€) :</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={settings.rates.EUR}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setSettings(s => ({ ...s, rates: { ...s.rates, EUR: val } }));
                  }}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Vers Franc CFA :</label>
                <input 
                  type="number" 
                  step="1" 
                  value={settings.rates.FCFA}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setSettings(s => ({ ...s, rates: { ...s.rates, FCFA: val } }));
                  }}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'white', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          {/* Freight & Multiplier */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Fret Maritime Chine ➔ Afrique / kg :
              </label>
              <input 
                type="number" 
                step="50" 
                value={settings.freightCostPerKg}
                onChange={e => setSettings(s => ({ ...s, freightCostPerKg: parseFloat(e.target.value) }))}
                style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>FCFA / kg (Cargo maritime groupé)</span>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Coefficient Multiplicateur Vente :
              </label>
              <input 
                type="number" 
                step="0.1" 
                value={settings.targetMarginMultiplier}
                onChange={e => setSettings(s => ({ ...s, targetMarginMultiplier: parseFloat(e.target.value) }))}
                style={{ width: '100%', padding: '0.5rem', background: '#0B1120', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'white', fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Marge revente aux artisans locaux</span>
            </div>
          </div>

          <button 
            className="btn-primary-action" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            onClick={onClose}
          >
            <Check size={16} />
            <span>Enregistrer les Paramètres</span>
          </button>

        </div>
      </div>
    </div>
  );
}
