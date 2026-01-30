import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import AuthLayout from '@/ui/AuthLayout'

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
    <AuthLayout title="Connexion" subtitle="Accès sécurisé à la plateforme">
      <form onSubmit={onSubmit} className="stack">
        <div className="field">
          <div className="label">Email</div>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="field">
          <div className="label">Mot de passe</div>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <button className="btn btn--primary btn--full" disabled={loading} type="submit">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {error ? <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div> : null}

      <div className="stack" style={{ marginTop: 12 }}>
        <div className="muted">
          Pas de compte ? <Link to="/register">Créer un compte</Link>
        </div>
        <div className="muted">
          <Link to={from}>Continuer en visiteur</Link>
        </div>
      </div>
    </AuthLayout>
  )
}
