import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { unlockUtilisateurApi } from '@/auth/api'
import ManagerLayout from '@/ui/ManagerLayout'

export default function ManagerPage() {
  const { token } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onUnlock = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!token) {
      setError('Token manquant. Reconnecte-toi.')
      return
    }

    setLoading(true)
    try {
      await unlockUtilisateurApi(token, email)
      setSuccess(`Utilisateur débloqué (si existant): ${email}`)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ManagerLayout title="Dashboard" subtitle="Administration et opérations">
      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      <div className="card">
        <div className="card__body">
          <div className="card__title">Débloquer un utilisateur</div>
          <p className="card__subtitle">Réinitialise l'état de blocage via l'API.</p>

          <form onSubmit={onUnlock} className="stack" style={{ marginTop: 14 }}>
            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domaine.tld"
                type="email"
                required
              />
            </div>
            <button className="btn btn--primary" disabled={loading} type="submit">
              {loading ? 'Traitement...' : 'Débloquer'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <div className="card__title">Accès rapide</div>
          <p className="card__subtitle">Navigation vers les modules de gestion.</p>
          <div className="row" style={{ flexWrap: 'wrap', marginTop: 12 }}>
            <Link className="btn" to="/manager/signalements">Signalements</Link>
            <Link className="btn" to="/manager/utilisateurs">Utilisateurs</Link>
            <Link className="btn" to="/manager/statistiques">Statistiques</Link>
          </div>
        </div>
      </div>
    </ManagerLayout>
  )
}
