import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import ManagerLayout from '@/ui/ManagerLayout'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8180'

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
}

export default function SignalementsPage() {
  const { token } = useAuth()
  const [signalements, setSignalements] = useState<Signalement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statuts = useMemo(() => ['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE'] as const, [])

  const labelStatut = (s: string) => {
    switch (s) {
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
                  <th>Titre</th>
                  <th>Description</th>
                  <th>Coordonnées</th>
                  <th>Surface</th>
                  <th>Budget</th>
                  <th>Utilisateur</th>
                  <th style={{ width: 180 }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map((sig) => (
                  <tr key={sig.id}>
                    <td>{sig.titre}</td>
                    <td className="muted">{sig.description}</td>
                    <td className="muted">
                      {sig.latitude.toFixed(4)}, {sig.longitude.toFixed(4)}
                    </td>
                    <td>{sig.surfaceM2 != null ? `${sig.surfaceM2} m²` : '-'}</td>
                    <td>{sig.budget != null ? `${sig.budget} €` : '-'}</td>
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
