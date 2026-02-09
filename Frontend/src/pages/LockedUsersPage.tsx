import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listLockedUsersApi, unlockUtilisateurApi, type LockedUserResponse } from '@/auth/api'
import { useAuth } from '@/auth/AuthContext'

export default function LockedUsersPage() {
  const { me, token, logout } = useAuth()

  const [rows, setRows] = useState<LockedUserResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unlockingEmail, setUnlockingEmail] = useState<string | null>(null)

  const load = async () => {
    setError(null)

    if (!token) {
      setError('Token manquant. Reconnecte-toi.')
      return
    }

    setLoading(true)
    try {
      const res = await listLockedUsersApi(token)
      setRows(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onUnlock = async (email: string) => {
    setError(null)

    if (!token) {
      setError('Token manquant. Reconnecte-toi.')
      return
    }

    setUnlockingEmail(email)
    try {
      await unlockUtilisateurApi(token, email)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUnlockingEmail(null)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          padding: 16,
          borderRight: '1px solid rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ margin: 0 }}>Manager</h2>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Connecté: <strong>{me?.email}</strong>
          </div>
        </div>

        <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            Carte
          </Link>
          <Link to="/manager" style={{ textDecoration: 'none' }}>
            Panneau manager
          </Link>
          <Link to="/manager/locked-users" style={{ textDecoration: 'none' }}>
            Utilisateurs bloqués
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }}>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 16 }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Utilisateurs bloqués</h3>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
              Liste des comptes avec <code>est_bloque=true</code>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={loading} onClick={load}>
              {loading ? 'Chargement…' : 'Rafraîchir'}
            </button>
          </div>

          {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

          <div style={{ overflow: 'auto', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Prénom</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Rôle</th>
                  <th style={{ textAlign: 'right', padding: 10 }}>Tentatives</th>
                  <th style={{ textAlign: 'right', padding: 10 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 12, opacity: 0.8 }}>
                      Aucun utilisateur bloqué.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => (
                    <tr key={u.email} style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                      <td style={{ padding: 10 }}>{u.email}</td>
                      <td style={{ padding: 10 }}>{u.nom ?? ''}</td>
                      <td style={{ padding: 10 }}>{u.prenom ?? ''}</td>
                      <td style={{ padding: 10 }}>{u.role}</td>
                      <td style={{ padding: 10, textAlign: 'right' }}>{u.tentativesEchouees}</td>
                      <td style={{ padding: 10, textAlign: 'right' }}>
                        <button
                          disabled={unlockingEmail === u.email}
                          onClick={() => onUnlock(u.email)}
                        >
                          {unlockingEmail === u.email ? 'Déblocage…' : 'Débloquer'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
