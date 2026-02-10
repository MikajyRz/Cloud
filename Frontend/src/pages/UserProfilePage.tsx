import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import ManagerLayout from '@/ui/ManagerLayout'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || ''

export default function UserProfilePage() {
  const { me, token } = useAuth()

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (me) {
      setFullName(me.nom || '')
    }
  }, [me])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!token) {
      setError('Non authentifié')
      return
    }

    setLoading(true)
    try {
      const body: { nomComplet?: string; motDePasse?: string } = {}
      if (fullName && fullName !== me?.nom) {
        body.nomComplet = fullName
      }
      if (password) {
        body.motDePasse = password
      }

      const response = await fetch(`${API_BASE}/api/utilisateurs/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      setSuccess('Profil mis à jour avec succès')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ManagerLayout title="Profil" subtitle="Gérer vos informations">
      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      <div className="card" style={{ maxWidth: 860 }}>
        <div className="card__body">
          <form onSubmit={onSubmit} className="stack">
            <div className="field">
              <div className="label">Email</div>
              <input className="input" type="email" value={me?.email || ''} disabled />
              <div className="muted" style={{ fontSize: 12 }}>L'email ne peut pas être modifié.</div>
            </div>

            <div className="field">
              <div className="label">Nom complet</div>
              <input
                className="input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>

            <div className="field">
              <div className="label">Rôle</div>
              <input className="input" type="text" value={me?.role || ''} disabled />
            </div>

            <div className="card" style={{ boxShadow: 'none' }}>
              <div className="card__body" style={{ padding: 0 }}>
                <div className="card__title">Changer le mot de passe</div>
                <div className="card__subtitle">Laisser vide pour ne pas modifier.</div>

                <div className="stack" style={{ marginTop: 12 }}>
                  <div className="field">
                    <div className="label">Nouveau mot de passe</div>
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      placeholder="Minimum 6 caractères"
                    />
                  </div>

                  <div className="field">
                    <div className="label">Confirmer</div>
                    <input
                      className="input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      placeholder="Confirmer le mot de passe"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn--primary" type="submit" disabled={loading}>
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </ManagerLayout>
  )
}
