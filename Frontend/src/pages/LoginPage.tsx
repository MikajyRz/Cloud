import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

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
    <div style={{ maxWidth: 420, margin: '64px auto', padding: 16 }}>
      <h2>Connexion</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" type="password" required />
        <button disabled={loading} type="submit">Se connecter</button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      <p>
        Pas de compte ? <Link to="/register">Créer un compte</Link>
      </p>
      <p>
        <Link to="/">Continuer en visiteur</Link>
      </p>
    </div>
  )
}
