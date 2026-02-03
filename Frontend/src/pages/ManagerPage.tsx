import { FormEvent, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { syncReportsApi, unlockUserApi, type SyncReportsResponse } from '@/auth/api'
import { 
  FiUser, 
  FiMap, 
  FiSettings, 
  FiLogOut, 
  FiUnlock, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle,
  FiDatabase
} from 'react-icons/fi'

export default function ManagerPage() {
  const { me, token, logout } = useAuth()
  const location = useLocation()
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
      setSuccess(`Utilisateur débloqué : ${email}`)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manager-layout">
      <aside className="manager-sidebar">
        <div className="sidebar-header">
          <h2>
            <FiSettings /> Manager
          </h2>
          <div className="sidebar-user-info">
            <FiUser />
            <span>{me?.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/" 
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <FiMap /> Carte interactive
          </Link>
          <Link 
            to="/manager" 
            className={`sidebar-link ${location.pathname === '/manager' ? 'active' : ''}`}
          >
            <FiSettings /> Panneau d'administration
          </Link>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="manager-main">
        <div className="manager-content-container">
          {/* Unlock User Section */}
          <section className="manager-card">
            <div className="card-header">
              <h3><FiUnlock style={{ verticalAlign: 'middle', marginRight: 8 }} /> Débloquer un utilisateur</h3>
              <p>Autoriser un utilisateur dont le compte a été suspendu ou bloqué.</p>
            </div>

            <form onSubmit={onUnlock} className="manager-form">
              <input
                className="manager-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email de l'utilisateur"
                type="email"
                required
              />
              <button disabled={loading} type="submit" className="manager-btn btn-primary-manager">
                {loading ? <FiRefreshCw className="spin" /> : <FiUnlock />}
                {loading ? 'Traitement...' : 'Débloquer'}
              </button>
            </form>

            {error && (
              <div className="status-message status-error">
                <FiAlertCircle /> {error}
              </div>
            )}
            {success && (
              <div className="status-message status-success">
                <FiCheckCircle /> {success}
              </div>
            )}
          </section>

          {/* Firebase Sync Section */}
          <section className="manager-card">
            <div className="card-header">
              <h3><FiDatabase style={{ verticalAlign: 'middle', marginRight: 8 }} /> Synchronisation Firebase</h3>
              <p>Synchroniser les signalements entre Firestore et la base de données locale.</p>
            </div>
            
            <button 
              disabled={syncLoading} 
              type="button" 
              onClick={onSync} 
              className="manager-btn btn-secondary-manager"
              style={{ alignSelf: 'flex-start' }}
            >
              {syncLoading ? <FiRefreshCw className="spin" /> : <FiRefreshCw />}
              {syncLoading ? 'Synchronisation...' : 'Lancer la synchronisation'}
            </button>

            {syncError && (
              <div className="status-message status-error">
                <FiAlertCircle /> {syncError}
              </div>
            )}
            {syncResult && (
              <div className="status-message status-success">
                <FiCheckCircle />
                <span>
                  Import réussi : <strong>{syncResult.fetched}</strong> récupérés, 
                  <strong>{syncResult.inserted}</strong> insérés, 
                  <strong>{syncResult.updated}</strong> mis à jour.
                </span>
              </div>
            )}
          </section>

          {/* Future Features Section */}
          <section className="manager-card" style={{ opacity: 0.7 }}>
            <div className="card-header">
              <h3><FiMap style={{ verticalAlign: 'middle', marginRight: 8 }} /> Gestion des signalements</h3>
              <p>Outils avancés pour la modération et le suivi des incidents (en cours de développement).</p>
            </div>
            <button disabled className="manager-btn btn-secondary-manager" style={{ alignSelf: 'flex-start' }}>
              Charger la liste complète
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
