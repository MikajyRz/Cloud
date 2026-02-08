import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import ManagerLayout from '@/ui/ManagerLayout'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

type Signalement = {
  id: string
  titre: string
  description: string
  latitude: number
  longitude: number
  surfaceM2?: number
  budget?: number
  statut: string
  emailUtilisateur?: string
  nomEntreprise?: string
  dateSignalement?: string
  dateEnCours?: string
  dateTermine?: string
  imageUrls?: string[]
}

export default function SignalementsPage() {
  const { token } = useAuth()
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statuts = useMemo(() => ['NOUVEAU', 'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE'] as const, [])

  const labelStatut = (s: string) => {
    switch (s) {
      case 'NOUVEAU':
        return 'Nouveau'
      case 'EN_ATTENTE':
        return 'En attente'
      case 'EN_COURS':
        return 'En cours'
      case 'TERMINE':
        return 'Terminé'
      case 'ANNULE':
        return 'Annulé'
      default:
        return s
    }
  }

  const loadSignalements = async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/signalements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }

      const data = await response.json()
      setSignalements(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const updateStatut = async (id: string, newStatut: string) => {
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/signalements/${id}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statut: newStatut })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Recharger la liste
      await loadSignalements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour')
    }
  }

  const updateField = async (id: string, field: string, value: string) => {
    if (!token) return

    const body: Record<string, unknown> = {}
    if (field === 'surfaceM2' || field === 'budget') {
      const num = parseFloat(value)
      if (isNaN(num)) return
      body[field] = num
    } else {
      body[field] = value
    }

    try {
      const response = await fetch(`${API_BASE}/api/signalements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      await loadSignalements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour')
    }
  }

  useEffect(() => {
    loadSignalements()
  }, [])

  return (
    <ManagerLayout
      title="Signalements"
      subtitle="Liste et mise à jour des statuts"
      actions={
        <button className="btn btn--primary" onClick={loadSignalements} disabled={loading} type="button">
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      }
    >
      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="card">
        <div className="card__body">
          {signalements.length === 0 && !loading ? (
            <div className="muted">Aucun signalement trouvé.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Images</th>
                  <th>Titre</th>
                  <th>Description</th>
                  <th>Coordonnées</th>
                  <th>Surface</th>
                  <th>Budget</th>
                  <th>Entreprise</th>
                  <th>Utilisateur</th>
                  <th style={{ width: 180 }}>Statut</th>
                  <th>Historique</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map((sig) => (
                  <tr key={sig.id}>
                    <td>
                      {sig.imageUrls && sig.imageUrls.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {sig.imageUrls.slice(0, 3).map((url, idx) => (
                            <img 
                              key={idx} 
                              src={url} 
                              alt={`Image ${idx + 1}`}
                              style={{ 
                                width: '50px', 
                                height: '50px', 
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                          {sig.imageUrls.length > 3 && (
                            <span className="badge">+{sig.imageUrls.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                    <td>{sig.titre}</td>
                    <td className="muted">{sig.description}</td>
                    <td className="muted">
                      {sig.latitude.toFixed(4)}, {sig.longitude.toFixed(4)}
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        style={{ width: 80 }}
                        defaultValue={sig.surfaceM2 ?? ''}
                        placeholder="m²"
                        onBlur={(e) => updateField(sig.id, 'surfaceM2', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        style={{ width: 90 }}
                        defaultValue={sig.budget ?? ''}
                        placeholder="€"
                        onBlur={(e) => updateField(sig.id, 'budget', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="text"
                        style={{ width: 120 }}
                        defaultValue={sig.nomEntreprise ?? ''}
                        placeholder="Entreprise"
                        onBlur={(e) => updateField(sig.id, 'nomEntreprise', e.target.value)}
                      />
                    </td>
                    <td className="muted">{sig.emailUtilisateur ?? '-'}</td>
                    <td>
                      <select
                        className="input"
                        value={sig.statut}
                        onChange={(e) => updateStatut(sig.id, e.target.value)}
                      >
                        {statuts.map((s) => (
                          <option key={s} value={s}>
                            {labelStatut(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                        {sig.dateSignalement && (
                          <div>
                            <span className="badge" style={{ fontSize: '0.75rem' }}>Créé</span>{' '}
                            <span className="muted">
                              {new Date(sig.dateSignalement).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {sig.dateEnCours && (
                          <div>
                            <span className="badge badge--warning" style={{ fontSize: '0.75rem' }}>En cours</span>{' '}
                            <span className="muted">
                              {new Date(sig.dateEnCours).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {sig.dateTermine && (
                          <div>
                            <span className="badge badge--success" style={{ fontSize: '0.75rem' }}>Terminé</span>{' '}
                            <span className="muted">
                              {new Date(sig.dateTermine).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {!sig.dateSignalement && !sig.dateEnCours && !sig.dateTermine && (
                          <span className="muted">Aucun historique</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ManagerLayout>
  )
}
