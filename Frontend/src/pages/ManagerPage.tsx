import { FormEvent, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { syncReportsApi, unlockUserApi, type SyncReportsResponse } from '@/auth/api'
import '../App.css'

export default function ManagerPage() {
  const { me, token, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncReportsResponse | null>(null)

  const location = useLocation()

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside
        className="glass-panel"
        style={{
          width: 280,
          margin: 16,
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          position: 'sticky',
          top: 16,
          height: 'calc(100vh - 32px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 8 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #334155)',
            padding: 10,
            borderRadius: 12,
            color: 'white',
            display: 'flex',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
          }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Manager</h2>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              Panel d'administration
            </div>
          </div>
        </div>

        <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/" style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            color: '#64748b',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '20px' }}>🗺️</span>
            Retour à la carte
          </Link>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
          }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            Dashboard
          </div>
        </nav>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 16 }}>
          <div style={{ 
            padding: 16, 
            background: 'rgba(241, 245, 249, 0.5)', 
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.5)'
          }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>
              Connecté en tant que
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', wordBreak: 'break-all' }}>
              {me?.email}
            </div>
          </div>
          
          <button onClick={logout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px',
            background: 'transparent',
            border: '1px solid #fee2e2',
            color: '#ef4444',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: '18px' }}>🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-1px' }}>
            Vue d'ensemble
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            Gérez les utilisateurs et synchronisez les données de la plateforme.
          </p>
        </header>

        <div style={{ maxWidth: 1000, display: 'grid', gap: 32 }}>
          
          {/* Section 1: Unlock User */}
          <section className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ 
                  background: '#dbeafe', 
                  color: '#2563eb', 
                  padding: 12, 
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 'fit-content'
                }}>
                  <span style={{ fontSize: '24px' }}>🔓</span>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                    Débloquer un utilisateur
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                    Réactivez l'accès d'un utilisateur bloqué via l'API Auth.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={onUnlock} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div className="input-group" style={{ flex: 1, maxWidth: 400 }}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email de l'utilisateur"
                  type="email"
                  required
                  style={{ background: 'white' }}
                />
              </div>
              <button className="btn-primary" disabled={loading} type="submit" style={{ padding: '12px 24px', height: 'fit-content' }}>
                {loading ? 'Traitement...' : 'Débloquer'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#ef4444', borderRadius: 12, display: 'flex', gap: 8, fontSize: 14 }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                {error}
              </div>
            )}
            {success && (
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', color: '#16a34a', borderRadius: 12, display: 'flex', gap: 8, fontSize: 14 }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                {success}
              </div>
            )}
          </section>

          {/* Section 2: Sync Firebase */}
          <section className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)' }}>
             <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ 
                  background: '#fef3c7', 
                  color: '#d97706', 
                  padding: 12, 
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 'fit-content'
                }}>
                  <span style={{ fontSize: '24px' }}>🔄</span>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                    Synchronisation Firebase
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                    Importer les signalements depuis Firestore vers la base Postgres locale.
                  </p>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                disabled={syncLoading} 
                type="button" 
                onClick={onSync}
                style={{ 
                  background: syncLoading ? '#94a3b8' : '#0f172a',
                  padding: '12px 24px'
                }}
              >
                {syncLoading ? 'Synchronisation en cours...' : 'Lancer la synchro'}
              </button>
            </div>

            {syncError && (
              <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#ef4444', borderRadius: 12, display: 'flex', gap: 8, fontSize: 14 }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                {syncError}
              </div>
            )}
            
            {syncResult && (
              <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  Synchronisation réussie
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                  <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Collection</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{syncResult.collection}</div>
                  </div>
                  <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Récupérés</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{syncResult.fetched}</div>
                  </div>
                  <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Insérés</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#16a34a' }}>{syncResult.inserted}</div>
                  </div>
                  <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Mis à jour</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#2563eb' }}>{syncResult.updated}</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Reports Management */}
          <section className="glass-card" style={{ padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.6)', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ 
                  background: '#f1f5f9', 
                  color: '#64748b', 
                  padding: 12, 
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 'fit-content'
                }}>
                  <span style={{ fontSize: '24px' }}>📄</span>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                    Gestion des signalements
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                    Liste et mise à jour des statuts (En développement).
                  </p>
                </div>
              </div>
              
              <button disabled className="btn-primary" style={{ background: '#cbd5e1', cursor: 'not-allowed', boxShadow: 'none' }}>
                Bientôt disponible
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
