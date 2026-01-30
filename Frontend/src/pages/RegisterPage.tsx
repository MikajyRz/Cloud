import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import AuthLayout from '@/ui/AuthLayout'

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
    <AuthLayout title="Créer un compte" subtitle="Créer un accès utilisateur">
      <form onSubmit={onSubmit} className="stack">
        <div className="field">
          <div className="label">Nom complet</div>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="field">
          <div className="label">Email</div>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="field">
          <div className="label">Mot de passe</div>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} required />
        </div>
        <button className="btn btn--primary btn--full" disabled={loading} type="submit">
          {loading ? 'Création...' : 'Créer'}
        </button>
      </form>

      {error ? <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div> : null}

      <div className="muted" style={{ marginTop: 12 }}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </div>
    </AuthLayout>
  )
}
