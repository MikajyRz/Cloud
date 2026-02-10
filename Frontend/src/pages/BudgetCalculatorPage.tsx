import { useState, useEffect } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

export default function BudgetCalculatorPage() {
  const [niveaux, setNiveaux] = useState<{ id: number, valeur: number, libelle: string }[]>([])
  const [niveauId, setNiveauId] = useState<number | null>(null)
  const [surface, setSurface] = useState('')
  const [budget, setBudget] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/niveaux`)
      .then(res => res.json())
      .then(data => setNiveaux(data))
      .catch(() => setError('Erreur chargement niveaux'))
  }, [])

  const calculateBudget = async () => {
    if (!niveauId || !surface) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/manager/budget?niveauId=${niveauId}&surfaceM2=${surface}`)
      if (!res.ok) throw new Error('Erreur calcul budget')
      const value = await res.json()
      setBudget(value)
    } catch (err) {
      setError('Erreur calcul budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card__body">
        <div className="card__title">Calcul automatique du budget</div>
        <div className="stack" style={{ gap: '16px', maxWidth: 400 }}>
          <select className="input" value={niveauId ?? ''} onChange={e => setNiveauId(Number(e.target.value))}>
            <option value="">Choisir un niveau</option>
            {niveaux.map(n => <option key={n.id} value={n.id}>{n.libelle} (niveau {n.valeur})</option>)}
          </select>
          <input className="input" type="number" min="1" placeholder="Surface en m²" value={surface} onChange={e => setSurface(e.target.value)} />
          <button className="btn btn--primary" onClick={calculateBudget} disabled={loading || !niveauId || !surface}>
            {loading ? 'Calcul...' : 'Calculer le budget'}
          </button>
          {budget !== null && <div className="muted">Budget estimé : <b>{budget} Ar</b></div>}
          {error && <div className="alert alert--error">{error}</div>}
        </div>
      </div>
    </div>
  )
}
