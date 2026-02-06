import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { syncReportsApi, unlockUserApi, type SyncReportsResponse } from '@/auth/api'

export default function ManagerPage() {
  const { me, token, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncReportsResponse | null>(null)

  const onSync = async () => {
    setSyncError(null)
    setSyncResult(null)

    if (!token) {
      setSyncError('Token manquant. Reconnecte-toi.')
      return
    }

    setSyncLoading(true)
    try {
      const res = await syncReportsApi(token)
      setSyncResult(res)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncLoading(false)
    }
  }

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
      await unlockUserApi(token, email)
      setSuccess(`Utilisateur débloqué (si existant): ${email}`)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          padding: 16,
          borderRight: '1px solid rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ margin: 0 }}>Manager</h2>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Connecté: <strong>{me?.email}</strong>
          </div>
        </div>

        <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>Carte</Link>
          <Link to="/manager" style={{ textDecoration: 'none' }}>Panneau manager</Link>
        </nav>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }}>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 16 }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
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
        <button disabled={syncLoading} type="button" onClick={onSync}>
          {syncLoading ? 'Synchronisation…' : 'Synchroniser'}
        </button>

        {syncError ? <div style={{ color: 'crimson' }}>{syncError}</div> : null}
        {syncResult ? (
          <div style={{ color: 'green' }}>
            Import Firestore <code>{syncResult.collection}</code> → Postgres :
            fetched={syncResult.fetched}, inserted={syncResult.inserted}, updated={syncResult.updated}
          </div>
        ) : null}
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
      </main>
    </div>
  )
}
