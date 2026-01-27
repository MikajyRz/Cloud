import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

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
    <div style={{ maxWidth: 420, margin: '64px auto', padding: 16 }}>
      <h2>Créer un compte</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe (min 6)" type="password" minLength={6} required />
        <button disabled={loading} type="submit">Créer</button>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      <p>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  )
}
