import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import '../App.css'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (loc.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      nav(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="login-bg-shape login-bg-shape-1" />
      <div className="login-bg-shape login-bg-shape-2" />
      <div className="login-bg-shape login-bg-shape-3" />

      <div className="login-wrapper">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">🗺️</div>
            </div>
            <h1 className="login-title">Bienvenue</h1>
            <p className="login-subtitle">
              Connectez-vous à votre espace professionnel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@entreprise.com"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span className="checkmark" />
                Se souvenir de moi
              </label>
              <Link to="#" className="forgot-link">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="login-footer">
            <p className="footer-text">
              Nouveau sur la plateforme ?{' '}
              <Link to="/register" className="register-link">
                Créer un compte
              </Link>
            </p>
            <Link to="/" className="guest-link">
              Continuer en tant que visiteur
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="login-info">
          <div className="info-card">
            <h3>Gestion professionnelle des signalements</h3>
            <p>
              Une plateforme moderne pour gérer efficacement vos signalements
              et améliorer la qualité de service.
            </p>
            <div className="info-features">
              <div className="feature-item">
                <span className="feature-icon">📍</span>
                Géolocalisation précise
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                Tableaux de bord détaillés
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                Synchronisation temps réel
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
