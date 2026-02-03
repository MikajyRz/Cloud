import '../App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
// import { listPublicReportsApi, type PublicReportResponse, type StatutTravaux } from '@/auth/api'
import { FiMap, FiLogOut, FiLogIn, FiUserPlus, FiSettings, FiUser } from 'react-icons/fi'

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<PublicReportResponse[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const { role, me, logout } = useAuth()

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    const tileserverBaseUrl = (import.meta.env.VITE_TILESERVER_URL as string | undefined) ?? 'http://localhost:8081'
    const base = tileserverBaseUrl.replace(/\/$/, '')

    const init = async () => {
      try {
        let styleUrl = `${base}/styles/basic/style.json`
        const res = await fetch(`${base}/styles.json`)

        if (res.ok) {
          const styles = (await res.json()) as unknown

          if (Array.isArray(styles) && styles.length > 0) {
            const first = styles[0] as { id?: string; identifier?: string; url?: string }
            if (first.url) {
              styleUrl = first.url.startsWith('http') ? first.url : `${base}${first.url.startsWith('/') ? '' : '/'}${first.url}`
            } else {
              const styleId = first.id ?? first.identifier
              if (styleId) styleUrl = `${base}/styles/${styleId}/style.json`
            }
          }
        }

        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: styleUrl,
          center: [47.5079, -18.8792],
          zoom: 12,
        })

        map.on('error', (e: maplibregl.ErrorEvent) => {
          const msg = (e?.error as Error | undefined)?.message ?? 'Map error'
          setError(msg)
        })

        map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
        mapRef.current = map

        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
        popupRef.current = popup

        const loadReports = async () => {
          setReportsLoading(true)
          setError(null)
          const reports = await listPublicReportsApi()
          setReports(reports)
          const features = reports
            .filter((r) => r.longitude != null && r.latitude != null)
            .map((r) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [r.longitude, r.latitude],
              },
              properties: {
                id: r.id,
                statut: r.statut ?? null,
                dateSignalement: r.dateSignalement ?? null,
                surfaceM2: r.surfaceM2 ?? null,
                budget: r.budget ?? null,
                entrepriseNom: r.entrepriseNom ?? null,
              },
            }))

          const sourceData = {
            type: 'FeatureCollection',
            features,
          } as const

          if (map.getSource('reports')) {
            ;(map.getSource('reports') as maplibregl.GeoJSONSource).setData(sourceData)
            return
          }

          map.addSource('reports', {
            type: 'geojson',
            data: sourceData,
          })

          map.addLayer({
            id: 'reports-circle',
            type: 'circle',
            source: 'reports',
            paint: {
              'circle-radius': 7,
              'circle-color': '#ff2d2d',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9,
            },
          })

          const formatStatut = (s: unknown): StatutTravaux | null => {
            if (s === 'NOUVEAU' || s === 'EN_COURS' || s === 'TERMINE') return s
            return null
          }

          const formatNumber = (v: unknown) => {
            if (v == null || v === '') return '—'
            const n = typeof v === 'number' ? v : Number(v)
            return Number.isFinite(n) ? String(n) : '—'
          }

          const formatMga = (v: unknown) => {
            if (v == null || v === '') return '—'
            const n = typeof v === 'number' ? v : Number(v)
            if (!Number.isFinite(n)) return '—'
            return new Intl.NumberFormat('fr-MG', {
              style: 'currency',
              currency: 'MGA',
              maximumFractionDigits: 0,
            }).format(n)
          }

          const formatDate = (v: unknown) => {
            if (!v) return '—'
            const s = String(v)
            return s.length > 19 ? s.slice(0, 19).replace('T', ' ') : s.replace('T', ' ')
          }

          map.on('mousemove', 'reports-circle', (e) => {
            map.getCanvas().style.cursor = 'pointer'
            const f = e.features?.[0]
            if (!f) return

            const p = (f.properties ?? {}) as unknown as PublicReportResponse & {
              statut?: string
            }

            const statut = formatStatut((p as any).statut)
            const html = `
              <div style="font-size:12px; min-width: 220px">
                <div><strong>Date:</strong> ${formatDate((p as any).dateSignalement)}</div>
                <div><strong>Statut:</strong> ${statut ?? '—'}</div>
                <div><strong>Surface:</strong> ${formatNumber((p as any).surfaceM2)} m²</div>
                <div><strong>Budget:</strong> ${formatMga((p as any).budget)}</div>
                <div><strong>Entreprise:</strong> ${(p as any).entrepriseNom ? String((p as any).entrepriseNom) : '—'}</div>
              </div>
            `

            popup.setLngLat(e.lngLat).setHTML(html).addTo(map)
          })

          map.on('mouseleave', 'reports-circle', () => {
            map.getCanvas().style.cursor = ''
            popup.remove()
          })

          setReportsLoading(false)
        }

        map.on('load', () => {
          void loadReports().catch((e) => {
            setError(e instanceof Error ? e.message : String(e))
            setReportsLoading(false)
          })
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    void init()

    return () => {
      popupRef.current?.remove()
      popupRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  const formatNum = (v: number) => {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v)
  }

  const formatMga = (v: number) => {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      maximumFractionDigits: 0,
    }).format(v)
  }

  const points = reports.filter((r: PublicReportResponse) => r.longitude != null && r.latitude != null)
  const pointsCount = points.length
  const totalSurface = points.reduce((acc: number, r: PublicReportResponse) => acc + (r.surfaceM2 ?? 0), 0)
  const totalBudget = points.reduce((acc: number, r: PublicReportResponse) => acc + (r.budget ?? 0), 0)
  const progressPct =
    pointsCount > 0
      ? Math.round(
          (points.reduce((acc: number, r: PublicReportResponse) => {
            if (r.statut === 'TERMINE') return acc + 1
            if (r.statut === 'EN_COURS') return acc + 0.5
            return acc
          }, 0) /
            pointsCount) *
            100,
        )
      : 0

  return (
    <div className="app-shell">
      <div className="map" ref={mapContainerRef} />

      <div className="navbar-overlay">
        <div className="nav-card">
          <div className="nav-brand">
            <FiMap />
            <span>Cloud Map</span>
          </div>

          <div className="nav-user">
            <div className="user-badge">{role}</div>
            {me?.email && (
              <div className="user-email">
                <FiUser style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {me.email}
              </div>
            )}
          </div>
        </div>

        <div className="nav-actions">
          {role === 'VISITEUR' ? (
            <>
              <Link to="/login" className="btn-nav btn-outline">
                <FiLogIn /> Se connecter
              </Link>
              <Link to="/register" className="btn-nav btn-primary">
                <FiUserPlus /> S'inscrire
              </Link>
            </>
          ) : (
            <>
              {role === 'MANAGER' && (
                <Link to="/manager" className="btn-nav btn-outline">
                  <FiSettings /> Manager
                </Link>
              )}
              <button onClick={logout} className="btn-nav btn-danger">
                <FiLogOut /> Déconnexion
              </button>
            </>
          )}
        </div>
      </div>

      {/* <div style={{ position: 'absolute', left: 12, top: 60, padding: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 8, minWidth: 260 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Récapitulatif</div>
        {reportsLoading ? (
          <div style={{ fontSize: 12 }}>Chargement…</div>
        ) : (
          <div style={{ fontSize: 12, display: 'grid', gap: 4 }}>
            <div>Nb de points: <strong>{pointsCount}</strong></div>
            <div>Total surface: <strong>{formatNum(totalSurface)}</strong> m²</div>
            <div>Avancement: <strong>{progressPct}%</strong></div>
            <div>Total budget: <strong>{formatMga(totalBudget)}</strong></div>
          </div>
        )}
      </div> */}

      {error ? (
        <div style={{ position: 'absolute', left: 12, bottom: 12, right: 12, padding: 12, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, borderRadius: 8 }}>
      {error && (
        <div className="error-overlay">
          {error}
        </div>
      )}
    </div>
  )
}
