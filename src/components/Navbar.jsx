import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Sparkles,
  ChevronUp,
  ChevronDown,
  Coins,
  Palette,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { WorkspaceSelector } from './WorkspaceSelector';

export function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currency, 
  setCurrency,
  theme = 'dark-midnight',
  setTheme,
  onOpenAddModal, 
  onOpenSettingsModal,
  articlesCount,
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenManageWorkspaces,
  getWorkspaceProductCount,
  user,
  onLogout,
  installPrompt,
  onInstallPwa
}) {
  const [navMode, setNavMode] = useState('full'); // 'full' | 'compact' | 'hidden'
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const themeOptions = [
    { id: 'dark-midnight', name: 'Sombre Nuit (OLED)', icon: '🌙', desc: 'Noir profond & contrastes vifs', bg: '#080D1A', text: '#F8FAFC' },
    { id: 'dark-slate', name: 'Sombre Ardoise (Doux)', icon: '🌑', desc: 'Gris-bleu reposant pour les yeux', bg: '#1E293B', text: '#CBD5E1' },
    { id: 'light-pro', name: 'Clair Épuré (Jour)', icon: '☀️', desc: 'Blanc moderne & haute lisibilité', bg: '#FFFFFF', text: '#0F172A' },
    { id: 'hybrid', name: 'Hybride Studio', icon: '🌓', desc: 'Navigation sombre + fiches nettes', bg: '#131E33', text: '#38BDF8' }
  ];

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100050, width: '100%' }}>
      
      {/* 🌟 VERSION DÉPLIÉE : DESIGN MODERNE, HORIZONTAL & ÉPURÉ */}
      {navMode === 'full' ? (
        <header style={{
          background: 'var(--bg-header, rgba(11, 17, 32, 0.94))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          padding: '0 1.25rem',
          height: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.45)',
          position: 'relative'
        }}>
          
          {/* 1️⃣ GAUCHE : Logo & Identité Visuelle */}
          <div 
            onClick={() => setCurrentTab('catalog')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0, cursor: 'pointer' }}
            title="Plateforme Sourcing Multi-Projets"
          >
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              🏢
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  SOURCING-HUB
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#000',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  MULTI
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
                Plateforme Sourcing Usines
              </div>
            </div>
          </div>

          {/* 2️⃣ CENTRE : SÉLECTEUR D'ESPACES DE SOURCING (Multi-Projets) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <WorkspaceSelector 
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={onSelectWorkspace}
              onOpenManageWorkspaces={onOpenManageWorkspaces}
              getWorkspaceProductCount={getWorkspaceProductCount}
            />
          </div>

          {/* 3️⃣ DROITE : Actions Claires + MENU DÉROULANT TOUT-EN-UN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            
            {/* 📲 Bouton d'Installation PWA */}
            {installPrompt && (
              <button
                onClick={onInstallPwa}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))',
                  border: '1.5px solid #10B981',
                  color: '#34D399',
                  padding: '0.42rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)'
                }}
                title="Installer l'application sur votre écran d'accueil (PWA)"
              >
                <span>📲</span>
                <span>Installer l'App</span>
              </button>
            )}

            {/* Bouton Ajouter Article */}
            <button 
              onClick={onOpenAddModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s'
              }}
              title="Ajouter un article manuellement ou par URL"
            >
              <Plus size={15} />
              <span>+ Ajouter un Article</span>
            </button>

            {/* 👤 Profil & Déconnexion */}
            {user && (
              <button
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  padding: '0.42rem 0.65rem',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title={`Connecté : ${user.email || 'Propriétaire'} - Cliquer pour se déconnecter`}
              >
                <LogOut size={13} />
                <span>Déconnexion</span>
              </button>
            )}

            {/* 🌟 BOUTON MAÎTRE DU MENU DÉROULANT : THÈMES, DEVISES & RÉGLAGES */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: isMenuOpen ? 'var(--blue-primary)' : 'var(--bg-inner, rgba(255, 255, 255, 0.08))',
                  color: isMenuOpen ? '#FFFFFF' : 'var(--text-primary)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isMenuOpen ? '0 0 15px rgba(37, 99, 235, 0.4)' : 'none'
                }}
                title="Ouvrir le menu des thèmes et options"
              >
                <Palette size={15} color={isMenuOpen ? '#FFFFFF' : '#60A5FA'} />
                <span>{theme === 'light-pro' ? '☀️ Clair' : theme === 'dark-slate' ? '🌑 Ardoise' : theme === 'hybrid' ? '🌓 Hybride' : '🌙 Sombre'}</span>
                <span style={{ color: '#34D399', fontSize: '0.7rem' }}>• {currency}</span>
                <ChevronDown size={14} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* 📂 PANNEAU FLOTTANT DU MENU DÉROULANT (DROPDOWN POPOVER) */}
              {isMenuOpen && (
                <div 
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    background: 'var(--bg-modal, #0E172A)',
                    border: '1.5px solid var(--border-focus, #3B82F6)',
                    borderRadius: '16px',
                    padding: '1.1rem',
                    boxShadow: '0 16px 45px rgba(0, 0, 0, 0.75)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    animation: 'modalFade 0.15s ease'
                  }}
                >
                  {/* Titre & Bouton Fermer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Palette size={16} color="#60A5FA" />
                      <span>Modes d'Affichage & Thèmes</span>
                    </span>
                    <button 
                      onClick={() => setIsMenuOpen(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* 1. SÉLECTION DU THÈME VISUEL (4 OPTIONS) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Choisissez votre Thème :
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                      {themeOptions.map(t => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              if (setTheme) setTheme(t.id);
                              setIsMenuOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              padding: '0.6rem',
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? 'var(--blue-primary)' : 'var(--border-subtle)'}`,
                              background: isSelected ? 'var(--blue-bg, rgba(37, 99, 235, 0.2))' : 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                              {isSelected && <span style={{ color: '#34D399', fontSize: '0.75rem', fontWeight: 800 }}>✓ Actif</span>}
                            </div>
                            <strong style={{ fontSize: '0.76rem', fontWeight: 800 }}>{t.name.split(' ')[0]} {t.name.split(' ')[1]}</strong>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.2 }}>{t.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. SÉLECTION DE LA DEVISE (FCFA, EUR, USD, CNY) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Coins size={13} color="#34D399" />
                      <span>Devise de Calcul :</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                      {[
                        { id: 'FCFA', label: 'FCFA', color: '#34D399' },
                        { id: 'EUR', label: 'EUR €', color: '#93C5FD' },
                        { id: 'USD', label: 'USD $', color: '#FCD34D' },
                        { id: 'CNY', label: 'CNY ¥', color: '#F87171' }
                      ].map(curr => (
                        <button
                          key={curr.id}
                          onClick={() => {
                            setCurrency(curr.id);
                            setIsMenuOpen(false);
                          }}
                          style={{
                            padding: '0.45rem 0.2rem',
                            borderRadius: '8px',
                            border: `1.5px solid ${currency === curr.id ? curr.color : 'var(--border-subtle)'}`,
                            background: currency === curr.id ? 'rgba(255,255,255,0.08)' : 'var(--bg-card)',
                            color: currency === curr.id ? curr.color : 'var(--text-secondary)',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          {curr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. BOUTON PARAMÈTRES & MARGES */}
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettingsModal();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <SlidersHorizontal size={14} color="#F59E0B" />
                      <span>Régler Fret & Marges Cibles</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Replier la Barre */}
            <button
              onClick={() => setNavMode('compact')}
              style={{
                background: 'var(--bg-inner, rgba(255, 255, 255, 0.06))',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.4rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Replier la barre de navigation (Mode compact)"
            >
              <ChevronUp size={15} />
            </button>

            {/* 👁️ BOUTON MASQUER TOTALEMENT (MODE PLEIN ÉCRAN / IMMERSION) */}
            <button
              onClick={() => setNavMode('hidden')}
              style={{
                background: 'var(--bg-inner, rgba(255, 255, 255, 0.06))',
                border: '1px solid var(--border-subtle)',
                color: '#94A3B8',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
              title="Masquer totalement la barre (Libérer 100% de l'écran)"
            >
              <EyeOff size={14} />
              <span>Masquer</span>
            </button>
          </div>
        </header>
      ) : navMode === 'compact' ? (
        /* 🔽 VERSION REPLIÉE ULTRA-FINE (38px) */
        <div style={{
          background: 'var(--bg-header, rgba(11, 17, 32, 0.94))',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.35rem 1.25rem',
          height: '42px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          whiteSpace: 'nowrap'
        }}>
          {/* Logo compact + Sélecteur d'espace */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span 
              onClick={() => setCurrentTab('catalog')}
              style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              title="Retour au Catalogue"
            >
              🏢 SOURCING-HUB
            </span>
            
            <WorkspaceSelector 
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={onSelectWorkspace}
              onOpenManageWorkspaces={onOpenManageWorkspaces}
              getWorkspaceProductCount={getWorkspaceProductCount}
            />
          </div>

          {/* Raccourcis Rapides + Thème + Déplier + Masquer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            
            {/* Bouton Thème & Devise en mode replié */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                background: 'var(--bg-inner, rgba(255, 255, 255, 0.08))',
                border: '1px solid var(--border-subtle)',
                color: '#93C5FD',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Changer de thème"
            >
              <Palette size={13} color="#60A5FA" />
              <span>{theme === 'light-pro' ? '☀️ Clair' : theme === 'dark-slate' ? '🌑 Ardoise' : theme === 'hybrid' ? '🌓 Hybride' : '🌙 Sombre'}</span>
            </button>

            <button 
              onClick={onOpenAddModal}
              style={{
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white',
                border: 'none',
                padding: '0.22rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Ajouter un Article"
            >
              <Plus size={13} />
              <span>+ Article</span>
            </button>

            {/* Déplier */}
            <button
              onClick={() => setNavMode('full')}
              style={{
                background: 'var(--bg-inner, rgba(255, 255, 255, 0.08))',
                border: '1px solid var(--border-subtle)',
                color: '#38BDF8',
                padding: '0.22rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.74rem',
                fontWeight: 800
              }}
              title="Afficher la barre complète"
            >
              <ChevronDown size={14} />
              <span>Déplier</span>
            </button>

            {/* Masquer */}
            <button
              onClick={() => setNavMode('hidden')}
              style={{
                background: 'var(--bg-inner, rgba(255, 255, 255, 0.08))',
                border: '1px solid var(--border-subtle)',
                color: '#94A3B8',
                padding: '0.22rem 0.55rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
              title="Masquer totalement la barre"
            >
              <EyeOff size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* 👁️ VERSION TOTALEMENT MASQUÉE (0px) - BOUTON FLOTTANT DISCRET */
        <div style={{
          position: 'fixed',
          top: '12px',
          right: '18px',
          zIndex: 100050,
          animation: 'fadeIn 0.2s ease'
        }}>
          <button 
            onClick={() => setNavMode('full')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
              border: '1.5px solid rgba(59, 130, 246, 0.5)',
              color: '#38BDF8',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.75), 0 0 15px rgba(56, 189, 248, 0.3)',
              backdropFilter: 'blur(16px)',
              transition: 'all 0.2s ease'
            }}
            title="Faire réapparaître la barre de navigation QUIN-SOURCE"
          >
            <Eye size={14} color="#38BDF8" />
            <span>Afficher la Barre</span>
          </button>
        </div>
      )}
    </div>
  );
}
