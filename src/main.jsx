import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('quin_source_settings');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleFullRepair = () => {
    localStorage.removeItem('quin_source_products');
    localStorage.removeItem('quin_source_categories');
    localStorage.removeItem('quin_source_workspaces_list');
    localStorage.removeItem('quin_source_active_ws');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#080D1A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#0F172A',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: '#FFFFFF' }}>
              SOURCING-HUB MULTI
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Une interruption d'affichage est survenue. Cliquez ci-dessous pour recharger votre catalogue en toute sécurité.
            </p>

            {this.state.error && (
              <div style={{
                background: '#070C14',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#FDA4AF',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.75rem',
                textAlign: 'left',
                marginBottom: '1.25rem',
                fontFamily: 'monospace',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {this.state.error.toString()}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                }}
              >
                🔄 Recharger l'Application
              </button>
              
              <button
                onClick={this.handleFullRepair}
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#FDA4AF',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                🛠️ Réparer & Réinitialiser Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

