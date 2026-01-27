import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { unlockUtilisateurApi } from '@/auth/api'

export default function ManagerPage() {
  const { me, token, logout } = useAuth()
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
    <div style={{ padding: 16, maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Manager</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>Retour carte</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <p style={{ marginTop: 8 }}>
        Connecté en tant que: <strong>{me?.email}</strong>
      </p>

      <hr style={{ margin: '16px 0' }} />

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Débloquer un utilisateur</h3>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          Appelle <code>/api/auth/unlock</code> (réservé MANAGER).
        </p>

        <form onSubmit={onUnlock} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email utilisateur à débloquer"
            type="email"
            required
            style={{ flex: '1 1 320px' }}
          />
          <button disabled={loading} type="submit">
            Débloquer
          </button>
        </form>

        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}
        {success ? <div style={{ color: 'green' }}>{success}</div> : null}
      </section>

      <hr style={{ margin: '16px 0' }} />

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Synchronisation Firebase</h3>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          À faire: endpoint backend pour récupérer les signalements depuis Firestore et/ou envoyer des données vers Firestore.
        </p>
        <button disabled type="button">Synchroniser (à implémenter)</button>
      </section>

      <hr style={{ margin: '16px 0' }} />

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Gestion des signalements</h3>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          À faire: endpoints backend pour lister/mettre à jour les champs (statut, surface m², budget, entreprise...).
        </p>
        <button disabled type="button">Charger les signalements (à implémenter)</button>
      </section>
    </div>
  )
}
