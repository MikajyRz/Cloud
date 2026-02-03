import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { FiMail, FiLock, FiMap, FiArrowRight } from 'react-icons/fi'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="auth-page-content">
      <div className="background-decor">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-circle">
              <FiMap />
            </div>
            <h1>Bon retour</h1>
            <p>Connectez-vous pour accéder à la plateforme</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="input-group">
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  type="password"
                  required
                />
              </div>
            </div>

            <button disabled={loading} type="submit" className="auth-btn">
              {loading ? 'Connexion...' : 'Se connecter'}
              {!loading && <FiArrowRight style={{ marginLeft: 8 }} />}
            </button>
          </form>

          <div className="auth-footer">
            Pas de compte ?{' '}
            <Link to="/register" className="auth-link">
              Créer un compte
            </Link>
            <Link to="/" className="visitor-link">
              Continuer en visiteur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
