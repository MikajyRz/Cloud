import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  listEntreprisesApi,
  listManagerReportsApi,
  syncReportsApi,
  unlockUserApi,
  updateManagerReportApi,
  type EntrepriseResponse,
  type ManagerReportResponse,
  type StatutTravaux,
  type SyncReportsResponse,
  type UpdateReportRequest,
} from '@/auth/api'

import {
  FiAlertCircle,
  FiCheckCircle,
  FiDatabase,
  FiLogOut,
  FiMap,
  FiRefreshCw,
  FiSettings,
  FiUnlock,
  FiUser,
} from 'react-icons/fi'


export default function ManagerPage() {
  const { me, token, logout } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncReportsResponse | null>(null)

  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [reports, setReports] = useState<ManagerReportResponse[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, UpdateReportRequest>>({})

  const [entreprisesLoading, setEntreprisesLoading] = useState(false)
  const [entreprises, setEntreprises] = useState<EntrepriseResponse[]>([])

  useEffect(() => {
    if (!token) return
    void loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const loadEntreprises = async () => {
    if (!token) {
      return
    }

    setEntreprisesLoading(true)
    try {
      const rows = await listEntreprisesApi(token)
      setEntreprises(rows)
    } catch {
      // best-effort: the reports screen can still function without entreprises list
      setEntreprises([])
    } finally {
      setEntreprisesLoading(false)
    }
  }

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
      await loadReports()
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err))
    } finally {
      setSyncLoading(false)
    }
  }

  const loadReports = async () => {
    setReportsError(null)
    if (!token) {
      setReportsError('Token manquant. Reconnecte-toi.')
      return
    }

    setReportsLoading(true)
    try {
      await loadEntreprises()
      const rows = await listManagerReportsApi(token)
      setReports(rows)
      setEdits({})
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : String(err))
    } finally {
      setReportsLoading(false)
    }
  }

  const setEdit = (id: string, patch: Partial<UpdateReportRequest>, base: ManagerReportResponse) => {
    setEdits((prev: Record<string, UpdateReportRequest>) => {
      const current: UpdateReportRequest =
        prev[id] ??
        ({
          surfaceM2: base.surfaceM2 ?? null,
          budget: base.budget ?? null,
          idEntreprise: base.idEntreprise ?? null,
          statut: (base.statut ?? 'NOUVEAU') as StatutTravaux,
        } satisfies UpdateReportRequest)

      return {
        ...prev,
        [id]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  const onSaveReport = async (r: ManagerReportResponse) => {
    setReportsError(null)
    if (!token) {
      setReportsError('Token manquant. Reconnecte-toi.')
      return
    }

    const payload: UpdateReportRequest = edits[r.id] ?? {
      surfaceM2: r.surfaceM2 ?? null,
      budget: r.budget ?? null,
      idEntreprise: r.idEntreprise ?? null,
      statut: (r.statut ?? 'NOUVEAU') as StatutTravaux,
    }

    setSavingId(r.id)
    try {
      const updated = await updateManagerReportApi(token, r.id, payload)
      setReports((prev: ManagerReportResponse[]) => prev.map((x) => (x.id === r.id ? updated : x)))
      setEdits((prev: Record<string, UpdateReportRequest>) => {
        const { [r.id]: _, ...rest } = prev
        return rest
      })
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingId(null)
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
      setSuccess(`Utilisateur débloqué : ${email}`)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manager-layout">
      <aside className="manager-sidebar">
        <div className="sidebar-header">
          <h2>
            <FiSettings /> Manager
          </h2>
          <div className="sidebar-user-info">
            <FiUser />
            <span>{me?.email}</span>
          </div>
        </div>

        {/* <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>Carte</Link>
          <Link to="/manager" style={{ textDecoration: 'none' }}>Panneau manager</Link>
          <Link to="/manager/locked-users" style={{ textDecoration: 'none' }}>Utilisateurs bloqués</Link> */}
        <nav className="sidebar-nav">
          <Link 
            to="/" 
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <FiMap /> Carte interactive
          </Link>
          <Link 
            to="/manager" 
            className={`sidebar-link ${location.pathname === '/manager' ? 'active' : ''}`}
          >
            <FiSettings /> Panneau d'administration
          </Link>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
            <FiLogOut /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="manager-main">
        <div className="manager-content-container">
          {/* Unlock User Section */}
          <section className="manager-card">
            <div className="card-header">
              <h3><FiUnlock style={{ verticalAlign: 'middle', marginRight: 8 }} /> Débloquer un utilisateur</h3>
              <p>Autoriser un utilisateur dont le compte a été suspendu ou bloqué.</p>
            </div>

            <form onSubmit={onUnlock} className="manager-form">
              <input
                className="manager-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email de l'utilisateur"
                type="email"
                required
              />
              <button disabled={loading} type="submit" className="manager-btn btn-primary-manager">
                {loading ? <FiRefreshCw className="spin" /> : <FiUnlock />}
                {loading ? 'Traitement...' : 'Débloquer'}
              </button>
            </form>

            {error && (
              <div className="status-message status-error">
                <FiAlertCircle /> {error}
              </div>
            )}
            {success && (
              <div className="status-message status-success">
                <FiCheckCircle /> {success}
              </div>
            )}
          </section>

          {/* Firebase Sync Section */}
          <section className="manager-card">
            <div className="card-header">
              <h3><FiDatabase style={{ verticalAlign: 'middle', marginRight: 8 }} /> Synchronisation Firebase</h3>
              <p>Synchroniser les signalements entre Firestore et la base de données locale.</p>
            </div>
            
            <button 
              disabled={syncLoading} 
              type="button" 
              onClick={onSync} 
              className="manager-btn btn-secondary-manager"
              style={{ alignSelf: 'flex-start' }}
            >
              {syncLoading ? <FiRefreshCw className="spin" /> : <FiRefreshCw />}
              {syncLoading ? 'Synchronisation...' : 'Lancer la synchronisation'}
            </button>

      {/* <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Synchronisation Firebase</h3>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          À faire: endpoint backend pour récupérer les signalements depuis Firestore et/ou envoyer des données vers Firestore.
        </p>
        <button disabled={syncLoading} type="button" onClick={onSync}>
          {syncLoading ? 'Synchronisation…' : 'Synchroniser'}
        </button>

        {syncError ? <div style={{ color: 'crimson' }}>{syncError}</div> : null}
        {syncResult ? (
          <div style={{ color: 'green' }}>
            Import Firestore <code>{syncResult.collection}</code> → Postgres :
            fetched={syncResult.fetched}, inserted={syncResult.inserted}, updated={syncResult.updated}, pushed={
              syncResult.pushed
            }
          </div>
        ) : null}
      </section>

      <hr style={{ margin: '16px 0' }} />

      <section style={{ display: 'grid', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Gestion des signalements</h3>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>
          À faire: endpoints backend pour lister/mettre à jour les champs (statut, surface m², budget, entreprise...).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button disabled={reportsLoading} type="button" onClick={loadReports}>
            {reportsLoading ? 'Chargement…' : 'Charger les signalements'}
          </button>
        </div>

        {reportsError ? <div style={{ color: 'crimson' }}>{reportsError}</div> : null}

        {reports.length > 0 ? (
          <div style={{ overflow: 'auto', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Titre</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Statut</th>
                  <th style={{ textAlign: 'right', padding: 10 }}>Surface (m²)</th>
                  <th style={{ textAlign: 'right', padding: 10 }}>Budget</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>Entreprise</th>
                  <th style={{ textAlign: 'right', padding: 10 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: ManagerReportResponse) => {
                  const e = edits[r.id]
                  const statut = (e?.statut ?? r.statut ?? 'NOUVEAU') as StatutTravaux
                  const surfaceVal = e?.surfaceM2 ?? r.surfaceM2 ?? null
                  const budgetVal = e?.budget ?? r.budget ?? null
                  const entVal = e?.idEntreprise ?? r.idEntreprise ?? ''
                  const missingEntreprise =
                    entVal && !entreprises.some((en: EntrepriseResponse) => en.id === entVal)

                  return (
                    <tr key={r.id} style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                      <td style={{ padding: 10, maxWidth: 280 }}>
                        <div style={{ fontWeight: 600 }}>{r.titre ?? '—'}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>{r.firestoreId ?? r.id}</div>
                      </td>

                      <td style={{ padding: 10 }}>
                        <select
                          value={statut}
                          onChange={(ev: ChangeEvent<HTMLSelectElement>) =>
                            setEdit(r.id, { statut: ev.target.value as StatutTravaux }, r)
                          }
                        >
                          <option value="NOUVEAU">NOUVEAU</option>
                          <option value="EN_COURS">EN_COURS</option>
                          <option value="TERMINE">TERMINE</option>
                        </select>
                      </td>

                      <td style={{ padding: 10, textAlign: 'right' }}>
                        <input
                          style={{ width: 110, textAlign: 'right' }}
                          type="number"
                          value={surfaceVal ?? ''}
                          onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            setEdit(
                              r.id,
                              { surfaceM2: ev.target.value === '' ? null : Number(ev.target.value) },
                              r,
                            )
                          }
                        />
                      </td>

                      <td style={{ padding: 10, textAlign: 'right' }}>
                        <input
                          style={{ width: 110, textAlign: 'right' }}
                          type="number"
                          value={budgetVal ?? ''}
                          onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                            setEdit(
                              r.id,
                              { budget: ev.target.value === '' ? null : Number(ev.target.value) },
                              r,
                            )
                          }
                        />
                      </td>

                      <td style={{ padding: 10 }}>
                        <select
                          disabled={entreprisesLoading}
                          style={{ width: 260 }}
                          value={entVal}
                          onChange={(ev: ChangeEvent<HTMLSelectElement>) =>
                            setEdit(r.id, { idEntreprise: ev.target.value || null }, r)
                          }
                        >
                          <option value="">Aucune</option>
                          {missingEntreprise ? (
                            <option value={entVal}>Inconnue ({entVal})</option>
                          ) : null}
                          {entreprises.map((en: EntrepriseResponse) => (
                            <option key={en.id} value={en.id}>
                              {en.nom}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: 10, textAlign: 'right' }}>
                        <button disabled={savingId === r.id} onClick={() => onSaveReport(r)}>
                          {savingId === r.id ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section> */}
            {syncError && (
              <div className="status-message status-error">
                <FiAlertCircle /> {syncError}
              </div>
            )}
            {syncResult && (
              <div className="status-message status-success">
                <FiCheckCircle />
                <span>
                  Import réussi : <strong>{syncResult.fetched}</strong> récupérés, 
                  <strong>{syncResult.inserted}</strong> insérés, 
                  <strong>{syncResult.updated}</strong> mis à jour.
                </span>
              </div>
            )}
          </section>

          <section className="manager-card">
            <div className="card-header">
              <h3>
                <FiMap style={{ verticalAlign: 'middle', marginRight: 8 }} /> Gestion des signalements
              </h3>
              <p>Liste et édition des champs (statut, surface, budget, entreprise).</p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                disabled={reportsLoading}
                type="button"
                onClick={loadReports}
                className="manager-btn btn-secondary-manager"
                style={{ alignSelf: 'flex-start' }}
              >
                {reportsLoading ? <FiRefreshCw className="spin" /> : <FiRefreshCw />}
                {reportsLoading ? 'Chargement...' : 'Charger les signalements'}
              </button>
            </div>

            {reportsError && (
              <div className="status-message status-error" style={{ marginTop: 10 }}>
                <FiAlertCircle /> {reportsError}
              </div>
            )}

            {reports.length > 0 ? (
              <div style={{ overflow: 'auto', marginTop: 12, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <th style={{ textAlign: 'left', padding: 10 }}>Titre</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Statut</th>
                      <th style={{ textAlign: 'right', padding: 10 }}>Surface (m²)</th>
                      <th style={{ textAlign: 'right', padding: 10 }}>Budget</th>
                      <th style={{ textAlign: 'left', padding: 10 }}>Entreprise</th>
                      <th style={{ textAlign: 'right', padding: 10 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r: ManagerReportResponse) => {
                      const e = edits[r.id]
                      const statut = (e?.statut ?? r.statut ?? 'NOUVEAU') as StatutTravaux
                      const surfaceVal = e?.surfaceM2 ?? r.surfaceM2 ?? null
                      const budgetVal = e?.budget ?? r.budget ?? null
                      const entVal = e?.idEntreprise ?? r.idEntreprise ?? ''
                      const missingEntreprise = entVal && !entreprises.some((en: EntrepriseResponse) => en.id === entVal)

                      return (
                        <tr key={r.id} style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                          <td style={{ padding: 10, maxWidth: 280 }}>
                            <div style={{ fontWeight: 600 }}>{r.titre ?? '—'}</div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>{r.firestoreId ?? r.id}</div>
                          </td>

                          <td style={{ padding: 10 }}>
                            <select
                              value={statut}
                              onChange={(ev: ChangeEvent<HTMLSelectElement>) =>
                                setEdit(r.id, { statut: ev.target.value as StatutTravaux }, r)
                              }
                            >
                              <option value="NOUVEAU">NOUVEAU</option>
                              <option value="EN_COURS">EN_COURS</option>
                              <option value="TERMINE">TERMINE</option>
                            </select>
                          </td>

                          <td style={{ padding: 10, textAlign: 'right' }}>
                            <input
                              style={{ width: 110, textAlign: 'right' }}
                              type="number"
                              value={surfaceVal ?? ''}
                              onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                                setEdit(r.id, { surfaceM2: ev.target.value === '' ? null : Number(ev.target.value) }, r)
                              }
                            />
                          </td>

                          <td style={{ padding: 10, textAlign: 'right' }}>
                            <input
                              style={{ width: 110, textAlign: 'right' }}
                              type="number"
                              value={budgetVal ?? ''}
                              onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                                setEdit(r.id, { budget: ev.target.value === '' ? null : Number(ev.target.value) }, r)
                              }
                            />
                          </td>

                          <td style={{ padding: 10 }}>
                            <select
                              disabled={entreprisesLoading}
                              style={{ width: 260 }}
                              value={entVal}
                              onChange={(ev: ChangeEvent<HTMLSelectElement>) =>
                                setEdit(r.id, { idEntreprise: ev.target.value || null }, r)
                              }
                            >
                              <option value="">Aucune</option>
                              {missingEntreprise ? <option value={entVal}>Inconnue ({entVal})</option> : null}
                              {entreprises.map((en: EntrepriseResponse) => (
                                <option key={en.id} value={en.id}>
                                  {en.nom}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td style={{ padding: 10, textAlign: 'right' }}>
                            <button
                              className="manager-btn btn-primary-manager"
                              disabled={savingId === r.id}
                              onClick={() => onSaveReport(r)}
                              type="button"
                            >
                              {savingId === r.id ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ marginTop: 10, opacity: 0.8 }}>Aucun signalement à afficher.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
