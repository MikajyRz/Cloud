import { useEffect, useMemo, useState } from 'react'
import ManagerLayout from '@/ui/ManagerLayout'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8180'

type Stats = {
  nombreTotal: number
  surfaceTotale: number
  budgetTotal: number
  avancementPourcentage: number
  nombreNouveau: number
  nombreEnAttente: number
  nombreEnCours: number
  nombreTermine: number
  nombreAnnule: number
}

export default function StatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      stats
        ? [
            {
              key: 'NOUVEAU',
              label: 'Nouveau',
              count: stats.nombreNouveau,
              barClass: 'progress__bar',
            },
            {
              key: 'EN_ATTENTE',
              label: 'En attente',
              count: stats.nombreEnAttente,
              barClass: 'progress__bar progress__bar--warning',
            },
            {
              key: 'EN_COURS',
              label: 'En cours',
              count: stats.nombreEnCours,
              barClass: 'progress__bar progress__bar--warning',
            },
            {
              key: 'TERMINE',
              label: 'Terminé',
              count: stats.nombreTermine,
              barClass: 'progress__bar progress__bar--success',
            },
            {
              key: 'ANNULE',
              label: 'Annulé',
              count: stats.nombreAnnule,
              barClass: 'progress__bar progress__bar--danger',
            },
          ]
        : [],
    [stats]
  )

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/signalements/stats`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <ManagerLayout
      title="Statistiques"
      subtitle="Vue d'ensemble des signalements"
      actions={
        <button className="btn btn--primary" onClick={loadStats} disabled={loading} type="button">
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      }
    >
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!stats && !loading ? (
        <div className="card">
          <div className="card__body">
            <div className="muted">Aucune donnée disponible.</div>
          </div>
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="metrics">
            <div className="card">
              <div className="card__body">
                <div className="metricLabel">Nombre total de points</div>
                <div className="metricValue">{stats.nombreTotal}</div>
              </div>
            </div>
            <div className="card">
              <div className="card__body">
                <div className="metricLabel">Surface totale</div>
                <div className="metricValue">{stats.surfaceTotale.toLocaleString('fr-FR')} m²</div>
              </div>
            </div>
            <div className="card">
              <div className="card__body">
                <div className="metricLabel">Budget total</div>
                <div className="metricValue">{stats.budgetTotal.toLocaleString('fr-FR')} €</div>
              </div>
            </div>
            <div className="card">
              <div className="card__body">
                <div className="metricLabel">Avancement</div>
                <div className="metricValue">{stats.avancementPourcentage.toFixed(1)}%</div>
                <div className="metricMeta">Basé sur les travaux terminés</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__body">
              <div className="card__title">Répartition par statut</div>
              <div className="card__subtitle">Distribution des signalements par étape</div>

              <div className="stack" style={{ marginTop: 14 }}>
                {rows.map((r) => {
                  const pct = stats.nombreTotal > 0 ? (r.count / stats.nombreTotal) * 100 : 0
                  return (
                    <div key={r.key} className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="row" style={{ gap: 12 }}>
                        <span className="badge">{r.label}</span>
                        <span className="muted">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="row" style={{ gap: 12 }}>
                        <div className="progress">
                          <div className={r.barClass} style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ width: 52, textAlign: 'right', fontWeight: 800 }}>{r.count}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </ManagerLayout>
  )
}
