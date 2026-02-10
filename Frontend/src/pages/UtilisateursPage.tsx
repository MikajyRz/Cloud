import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { unlockUtilisateurApi, createUserApi } from '@/auth/api'
import ManagerLayout from '@/ui/ManagerLayout'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || ''

type Utilisateur = {
  email: string
  nom: string | null
  prenom: string | null
  role: string
  estBloque?: boolean
  tentativesEchouees?: number
}

export default function UtilisateursPage() {
  const { token } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // États pour le formulaire de création
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'UTILISATEUR' | 'MANAGER'>('UTILISATEUR')
  const [createLoading, setCreateLoading] = useState(false)

  const loadUtilisateurs = async () => {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/api/utilisateurs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }

      const data = await response.json()
      setUtilisateurs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const unlockUser = async (email: string) => {
    if (!token) return

    setError(null)
    setSuccess(null)
    try {
      await unlockUtilisateurApi(token, email)
      setSuccess(`Utilisateur ${email} débloqué avec succès`)
      await loadUtilisateurs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de déblocage')
    }
  }

  const onCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return

    setError(null)
    setSuccess(null)
    setCreateLoading(true)
    try {
      await createUserApi(token, {
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        role: newRole,
      })
      setSuccess(`Utilisateur ${newEmail} créé avec succès (${newRole})`)
      setNewEmail('')
      setNewFullName('')
      setNewPassword('')
      setNewRole('UTILISATEUR')
      setShowCreateForm(false)
      await loadUtilisateurs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setCreateLoading(false)
    }
  }

  useEffect(() => {
    loadUtilisateurs()
  }, [])

  return (
    <ManagerLayout
      title="Utilisateurs"
      subtitle="Gestion et déblocage des comptes"
      actions={
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn--primary" onClick={() => setShowCreateForm(!showCreateForm)} type="button">
            {showCreateForm ? 'Annuler' : '+ Créer un utilisateur'}
          </button>
          <button className="btn" onClick={loadUtilisateurs} disabled={loading} type="button">
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      }
    >
      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__body">
            <div className="card__title">Créer un utilisateur</div>
            <p className="card__subtitle">Créer un compte pour un utilisateur (web ou mobile)</p>
            <form onSubmit={onCreateUser} className="stack" style={{ marginTop: 14, gap: 12 }}>
              <div className="field">
                <div className="label">Nom complet</div>
                <input className="input" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Jean Dupont" required minLength={2} />
              </div>
              <div className="field">
                <div className="label">Email</div>
                <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="utilisateur@email.com" required />
              </div>
              <div className="field">
                <div className="label">Mot de passe</div>
                <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 caractères" required minLength={6} />
              </div>
              <div className="field">
                <div className="label">Rôle</div>
                <select className="input" value={newRole} onChange={(e) => setNewRole(e.target.value as 'UTILISATEUR' | 'MANAGER')}>
                  <option value="UTILISATEUR">UTILISATEUR</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>
              <button className="btn btn--primary" type="submit" disabled={createLoading}>
                {createLoading ? 'Création en cours...' : 'Créer le compte'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card__body">
          {utilisateurs.length === 0 && !loading ? (
            <div className="muted">Aucun utilisateur trouvé.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Tentatives</th>
                  <th style={{ width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((user) => (
                  <tr key={user.email}>
                    <td>{user.email}</td>
                    <td>{user.nom || '-'}</td>
                    <td>
                      <span className={user.role === 'MANAGER' ? 'badge badge--info' : 'badge'}>{user.role}</span>
                    </td>
                    <td>
                      {user.estBloque ? (
                        <span className="badge badge--danger">Bloqué</span>
                      ) : (
                        <span className="badge badge--success">Actif</span>
                      )}
                    </td>
                    <td className="muted">{user.tentativesEchouees || 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      {user.estBloque ? (
                        <button className="btn btn--primary" onClick={() => unlockUser(user.email)} type="button">
                          Débloquer
                        </button>
                      ) : null}
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
