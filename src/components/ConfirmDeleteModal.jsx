import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmation de suppression', 
  message = 'Êtes-vous sûr de vouloir supprimer cet élément ?', 
  itemName = '', 
  itemType = 'élément' 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250000,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{
          maxWidth: '480px',
          width: '100%',
          background: '#0B1120',
          border: '1.5px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(244, 63, 94, 0.2)',
          position: 'relative'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94A3B8',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {/* Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F43F5E',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              {title}
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#F43F5E', fontWeight: 700 }}>
              Action irréversible
            </span>
          </div>
        </div>

        {/* Item name highlight */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          <p style={{ color: '#CBD5E1', fontSize: '0.84rem', lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
          {itemName && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.4rem 0.65rem',
              background: '#070C14',
              borderRadius: '6px',
              borderLeft: '3px solid #F43F5E',
              color: '#F8FAFC',
              fontWeight: 800,
              fontSize: '0.82rem',
              wordBreak: 'break-word'
            }}>
              « {itemName} »
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#CBD5E1',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              flex: 1
            }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #E11D48, #BE123C)',
              border: 'none',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 15px rgba(225, 29, 72, 0.4)',
              flex: 1.3
            }}
          >
            <Trash2 size={16} />
            <span>Confirmer la Suppression</span>
          </button>
        </div>

      </div>
    </div>
  );
}
