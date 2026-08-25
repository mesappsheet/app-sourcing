import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { Lock, Mail, Key, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1️⃣ Connexion Google OAuth en 1 Clic
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (!supabase) {
        throw new Error('Supabase non initialisé');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de la connexion Google');
      setIsLoading(false);
    }
  };

  // 2️⃣ Connexion Directe Personnelle (Email / Mot de passe)
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Veuillez saisir votre email et mot de passe');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Essai d'inscription automatique s'il s'agit de votre premier accès
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) throw error;
        if (signUpData?.user) {
          onLoginSuccess(signUpData.user);
          return;
        }
      }

      if (data?.user) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  // 3️⃣ Accès Rapide Direct (Mode Propriétaire)
  const handleDirectAccess = () => {
    const mockUser = {
      id: 'owner-personal',
      email: email || 'proprietaire@quin-source.pro',
      user_metadata: {
        full_name: 'Propriétaire QUIN-SOURCE',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
      }
    };
    localStorage.setItem('quin_source_auth_user', JSON.stringify(mockUser));
    onLoginSuccess(mockUser);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1E3A8A 0%, #0B1120 40%, #070C14 100%)',
      padding: '1.5rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: 'white'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(37, 99, 235, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Top Accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #38BDF8, #F59E0B, transparent)'
        }} />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            borderRadius: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            marginBottom: '1rem'
          }}>
            🏢
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            QUIN-SOURCE <span style={{ color: '#F59E0B', fontSize: '0.9rem', verticalAlign: 'super' }}>PRO</span>
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Espace Privé de Sourcing Quincaillerie & Meubles
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            color: '#FCA5A5',
            padding: '0.65rem 0.9rem',
            borderRadius: '10px',
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 1️⃣ BOUTON GOOGLE OAUTH */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            background: '#FFFFFF',
            color: '#0F172A',
            border: 'none',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            fontSize: '0.92rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem'
          }}
        >
          {/* Official Google SVG Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continuer avec Google</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#64748B',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          fontWeight: 700,
          margin: '1.25rem 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span>ou connexion directe</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* 2️⃣ FORMULAIRE EMAIL / MOT DE PASSE */}
        <form onSubmit={handleEmailLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, marginBottom: '0.35rem' }}>
              Adresse Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0.6rem 0.85rem',
              gap: '0.5rem'
            }}>
              <Mail size={16} color="#64748B" />
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  width: '100%',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, marginBottom: '0.35rem' }}>
              Mot de Passe
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0.6rem 0.85rem',
              gap: '0.5rem'
            }}>
              <Key size={16} color="#64748B" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  width: '100%',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
              marginBottom: '1rem'
            }}
          >
            <span>{isLoading ? 'Connexion en cours...' : 'Se Connecter'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* 3️⃣ ACCÈS DIRECT PROPRIÉTAIRE */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={handleDirectAccess}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38BDF8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ⚡ Accéder directement à mon tableau de bord
          </button>
        </div>

        {/* Security Note */}
        <div style={{
          marginTop: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          fontSize: '0.72rem',
          color: '#64748B'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>Sécurité Cloud Supabase & Accès Chiffré</span>
        </div>
      </div>
    </div>
  );
}
