import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { FiMail, FiLock, FiUser, FiMap, FiArrowRight } from 'react-icons/fi'

export default function RegisterPage() {
  const { signup, loading } = useAuth()
  const nav = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await signup(email, password, fullName)
      nav('/', { replace: true })
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
            <h1>Créer un compte</h1>
            <p>Rejoignez-nous pour signaler des incidents</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="input-group">
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nom complet"
                  required
                />
              </div>
            </div>

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
                  placeholder="Mot de passe (min 6)"
                  type="password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button disabled={loading} type="submit" className="auth-btn">
              {loading ? 'Création...' : 'S\'inscrire'}
              {!loading && <FiArrowRight style={{ marginLeft: 8 }} />}
            </button>
          </form>

          <div className="auth-footer">
            Déjà un compte ?{' '}
            <Link to="/login" className="auth-link">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
