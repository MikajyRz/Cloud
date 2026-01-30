import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { unlockUtilisateurApi, synchronizeBidirectionalApi, type SyncResultDto } from '@/auth/api'
import ManagerLayout from '@/ui/ManagerLayout'

export default function ManagerPage() {
  const { token } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // États pour la synchronisation
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResultDto | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

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

  const onSynchronize = async () => {
    setSyncError(null)
    setSyncResult(null)

    if (!token) {
      setSyncError('Token manquant. Reconnecte-toi.')
      return
    }

    setSyncLoading(true)
    try {
      const result = await synchronizeBidirectionalApi(token)
      setSyncResult(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <ManagerLayout title="Dashboard" subtitle="Administration et opérations">
      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      {/* Section Synchronisation Firestore ↔ PostgreSQL */}
      <div className="card">
        <div className="card__body">
          <div className="card__title"> Synchronisation Firestore ↔ PostgreSQL</div>
          <p className="card__subtitle">
            Synchronise les données entre Firestore et la base de données PostgreSQL
          </p>

          <button 
            className="btn btn--primary" 
            onClick={onSynchronize}
            disabled={syncLoading}
            style={{ marginBottom: '16px' }}
          >
            {syncLoading ? 'Synchronisation en cours...' : '🔄 Synchroniser'}
          </button>

          {syncError && (
            <div className="alert alert--error" style={{ marginTop: '12px' }}>
              {syncError}
            </div>
          )}

          {syncResult && (
            <div className={`alert ${syncResult.success ? 'alert--success' : 'alert--error'}`} style={{ marginTop: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {syncResult.success ? '✅ Synchronisation réussie' : '❌ Échec de la synchronisation'}
              </div>
              <div style={{ marginBottom: '8px' }}>{syncResult.message}</div>
              
              {syncResult.success && (
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <div><strong>Utilisateurs :</strong></div>
                  <ul style={{ marginLeft: '20px' }}>
                    <li>➕ Nouveaux depuis Firestore : {syncResult.utilisateurs.nouveauxDepuisFirestore}</li>
                    <li>🔄 Mis à jour vers Firestore : {syncResult.utilisateurs.misAJourVersFirestore}</li>
                    <li>📊 Total : {syncResult.utilisateurs.total}</li>
                  </ul>
                  
                  <div style={{ marginTop: '8px' }}><strong>Signalements :</strong></div>
                  <ul style={{ marginLeft: '20px' }}>
                    <li>➕ Nouveaux depuis Firestore : {syncResult.signalements.nouveauxDepuisFirestore}</li>
                    <li>🔄 Mis à jour vers Firestore : {syncResult.signalements.misAJourVersFirestore}</li>
                    <li>📊 Total : {syncResult.signalements.total}</li>
                  </ul>
                  
                  {syncResult.logs.length > 0 && (
                    <details style={{ marginTop: '12px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 Voir les logs ({syncResult.logs.length})</summary>
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px', 
                        backgroundColor: 'rgba(0,0,0,0.05)', 
                        borderRadius: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace'
                      }}>
                        {syncResult.logs.map((log, idx) => (
                          <div key={idx}>{log}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {syncResult.errors.length > 0 && (
                <div style={{ marginTop: '12px', color: '#d32f2f' }}>
                  <strong>⚠️ Erreurs :</strong>
                  <ul style={{ marginLeft: '20px', fontSize: '0.9rem' }}>
                    {syncResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
