import { useEffect, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

type PrixParM2 = {
  id: number
  valeur: number
  dateModif: string
}

export default function PrixParM2Page() {
  const [prixList, setPrixList] = useState<PrixParM2[]>([])
  const [valeur, setValeur] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadPrix = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/prix-par-m2`)
      if (!res.ok) throw new Error('Erreur chargement')
      setPrixList(await res.json())
    } catch {
      setError('Erreur chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPrix() }, [])

  const addPrix = async () => {
    if (!valeur) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${API_BASE}/api/prix-par-m2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valeur: parseFloat(valeur) })
      })
      if (!res.ok) throw new Error('Erreur ajout')
      setSuccess('Ajouté !')
      setValeur('')
      loadPrix()
    } catch {
      setError('Erreur ajout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card__body">
        <div className="card__title">Prix forfaitaire par m²</div>
        <div className="stack" style={{ gap: 12, maxWidth: 400 }}>
          <input className="input" type="number" min="1" placeholder="Nouveau prix par m²" value={valeur} onChange={e => setValeur(e.target.value)} />
          <button className="btn btn--primary" onClick={addPrix} disabled={loading || !valeur}>Ajouter</button>
          {success && <div className="alert alert--success">{success}</div>}
          {error && <div className="alert alert--error">{error}</div>}
          <table className="table">
            <thead>
              <tr><th>Valeur</th><th>Date</th></tr>
            </thead>
            <tbody>
              {prixList.map(p => (
                <tr key={p.id}>
                  <td>{p.valeur} Ar</td>
                  <td>{new Date(p.dateModif).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
