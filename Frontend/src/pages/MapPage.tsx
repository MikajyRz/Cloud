import '../App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { listPublicReportsApi, type PublicReportResponse, type StatutTravaux } from '@/auth/api'
import { FiMap, FiLogOut, FiLogIn, FiUserPlus, FiSettings, FiUser, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<PublicReportResponse[]>([])
  const { role, me, logout } = useAuth()
  const [recapOpen, setRecapOpen] = useState(true)

  const ensureAlertIcon = async (map: maplibregl.Map) => {
    if (map.hasImage('alert-triangle')) return

    const img = new Image()
    img.decoding = 'async'
    img.src = new URL('../assets/alert-triangle.svg', import.meta.url).toString()

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load alert icon'))
    })

    map.addImage('alert-triangle', img, { pixelRatio: 2 })
  }
  
  // Lightbox state pour les photos
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Fonction globale pour ouvrir la lightbox (appelée depuis le popup)
  useEffect(() => {
    (window as any).__openLightbox = (imagesJson: string, index: number) => {
      try {
        const images = JSON.parse(imagesJson)
        if (Array.isArray(images) && images.length > 0) {
          setLightboxImages(images)
          setLightboxIndex(index)
          setLightboxOpen(true)
        }
      } catch (e) {
        console.error('Erreur parsing images:', e)
      }
    }
    return () => {
      delete (window as any).__openLightbox
    }
  }, [])

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
          maxBounds: [
            [47.3, -19.1],
            [47.7, -18.7],
          ],
          maxBoundsViscosity: 1.0,
          minZoom: 12,
        })

        map.on('error', (e: maplibregl.ErrorEvent) => {
          const msg = (e?.error as Error | undefined)?.message ?? 'Map error'
          setError(msg)
        })

        map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
        mapRef.current = map

        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: 'hover-popup' })
        popupRef.current = popup

        // Timer pour le délai de fermeture du popup hover
        let hoverTimeout: ReturnType<typeof setTimeout> | null = null

        // Fonction pour fermer le popup avec délai
        const closePopupWithDelay = () => {
          if (hoverTimeout) clearTimeout(hoverTimeout)
          hoverTimeout = setTimeout(() => {
            if (!(window as any).__hoverPopup) {
              popup.remove()
            }
          }, 800)
        }

        // Écouter quand la souris quitte le popup
        popup.on('open', () => {
          setTimeout(() => {
            const popupEl = popup.getElement()
            if (popupEl) {
              popupEl.addEventListener('mouseenter', () => {
                (window as any).__hoverPopup = true
                if (hoverTimeout) clearTimeout(hoverTimeout)
              })
              popupEl.addEventListener('mouseleave', () => {
                (window as any).__hoverPopup = false
                closePopupWithDelay()
              })
            }
          }, 10)
        })

        const loadReports = async () => {
          await ensureAlertIcon(map)

          const reports = await listPublicReportsApi()
          setReports(reports)
          const features = reports
            .filter((r) => r.longitude != null && r.latitude != null)
            .map((r) => ({
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [r.longitude!, r.latitude!],
              },
              properties: {
                id: r.id,
                statut: r.statut ?? null,
                dateSignalement: r.dateSignalement ?? null,
                surfaceM2: r.surfaceM2 ?? null,
                budget: r.budget ?? null,
                entrepriseNom: r.entrepriseNom ?? null,
                imageCount: r.imageUrls?.length ?? 0,
                imageUrls: r.imageUrls ? JSON.stringify(r.imageUrls) : '[]',
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
            id: 'reports-halo',
            type: 'circle',
            source: 'reports',
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 14, 15, 22, 18, 30],
              'circle-color': '#ef1d25',
              'circle-opacity': 0.18,
              'circle-blur': 0.9,
            },
          })

          map.addLayer({
            id: 'reports-icon',
            type: 'symbol',
            source: 'reports',
            layout: {
              'icon-image': 'alert-triangle',
              'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.26, 15, 0.34, 18, 0.42],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
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

          const formatDate = (v: unknown) => {
            if (!v) return '—'
            const s = String(v)
            return s.length > 19 ? s.slice(0, 19).replace('T', ' ') : s.replace('T', ' ')
          }

          map.on('mousemove', 'reports-icon', (e) => {
            map.getCanvas().style.cursor = 'pointer'
            const f = e.features?.[0]
            if (!f) return

            // Annuler le timeout de fermeture si on revient sur un marqueur
            if (hoverTimeout) {
              clearTimeout(hoverTimeout)
              hoverTimeout = null
            }

            const p = (f.properties ?? {}) as unknown as PublicReportResponse & {
              statut?: string
            }

            const statut = formatStatut((p as any).statut)
            const photoCount = Number((p as any).imageCount) || 0
            const statutClass = statut ? `popup-badge popup-badge--${statut}` : 'popup-badge'

            let hoverPhotosHtml = ''
            try {
              const raw = (p as any).imageUrls
              const urls = raw ? (typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])) : []
              if (Array.isArray(urls) && urls.length > 0) {
                const imagesJson = JSON.stringify(urls).replace(/"/g, '&quot;')
                hoverPhotosHtml = `<button class=\"popup-link\" onclick=\"window.__openLightbox('${imagesJson}', 0)\">Voir les photos</button>`
              }
            } catch {
              hoverPhotosHtml = ''
            }

            const html = `
              <div class="popup-card">
                <div class="popup-title">Signalement</div>
                <div class="popup-grid">
                  <div class="popup-label">Date</div>
                  <div class="popup-value">${formatDate((p as any).dateSignalement)}</div>

                  <div class="popup-label">Statut</div>
                  <div class="popup-value"><span class="${statutClass}">${statut ?? '—'}</span></div>

                  <div class="popup-label">Surface</div>
                  <div class="popup-value">${formatNumber((p as any).surfaceM2)} m²</div>

                  <div class="popup-label">Budget</div>
                  <div class="popup-value">${formatNumber((p as any).budget)}</div>

                  <div class="popup-label">Entreprise</div>
                  <div class="popup-value">${(p as any).entrepriseNom ? String((p as any).entrepriseNom) : '—'}</div>

                  <div class="popup-label">Photos</div>
                  <div class="popup-value">${photoCount > 0 ? photoCount + ' photo(s)' : 'Aucune'}${hoverPhotosHtml ? ` <span class=\"popup-sep\">•</span> ${hoverPhotosHtml}` : ''}</div>
                </div>
              </div>
            `

            popup.setLngLat(e.lngLat).setHTML(html).addTo(map)
          })

          map.on('mouseleave', 'reports-icon', () => {
            map.getCanvas().style.cursor = ''
            closePopupWithDelay()
          })

          // Ajuster la vue pour englober tous les signalements
          if (features.length > 0) {
            const bounds = new maplibregl.LngLatBounds()
            features.forEach((f) => {
              bounds.extend(f.geometry.coordinates as [number, number])
            })
            map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
          }
        }

        map.on('load', () => {
          void loadReports().catch((e) => {
            setError(e instanceof Error ? e.message : String(e))
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

  const points = reports.filter((r: PublicReportResponse) => r.longitude != null && r.latitude != null)
  const pointsCount = points.length
  const totalSurface = points.reduce((acc: number, r: PublicReportResponse) => acc + (r.surfaceM2 ?? 0), 0)
  const totalBudget = points.reduce((acc: number, r: PublicReportResponse) => acc + (r.budget ?? 0), 0)
  const doneCount = points.filter((r: PublicReportResponse) => r.statut === 'TERMINE').length
  const progressPct = pointsCount > 0 ? Math.round((doneCount / pointsCount) * 100) : 0

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

      <div className={`recap-card${recapOpen ? '' : ' recap-card--closed'}`}>
        <div className="recap-header">
          <div className="recap-title">Récapitulatif</div>
          <button className="recap-toggle" onClick={() => setRecapOpen((v: boolean) => !v)}>
            {recapOpen ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        {recapOpen && (
          <div className="recap-grid">
            <div className="recap-row">
              <div className="recap-label">Nb de points</div>
              <div className="recap-value">{pointsCount}</div>
            </div>
            <div className="recap-row">
              <div className="recap-label">Total surface</div>
              <div className="recap-value">{formatNum(totalSurface)} <span className="recap-unit">m²</span></div>
            </div>
            <div className="recap-row">
              <div className="recap-label">Avancement</div>
              <div className="recap-value">{progressPct}<span className="recap-unit">%</span></div>
            </div>
            <div className="recap-row">
              <div className="recap-label">Total budget</div>
              <div className="recap-value">{formatNum(totalBudget)}</div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            right: 12,
            padding: 12,
            background: 'rgba(0,0,0,0.65)',
            color: '#fff',
            fontSize: 12,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Lightbox pour afficher les photos en grand */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div 
          className="lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="lightbox-container" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            {/* Bouton fermer */}
            <button 
              className="lightbox-close"
              onClick={() => setLightboxOpen(false)}
            >
              <FiX />
            </button>

            {/* Navigation gauche */}
            {lightboxImages.length > 1 && (
              <button 
                className="lightbox-nav lightbox-prev"
                onClick={() => setLightboxIndex((prev: number) => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
              >
                <FiChevronLeft />
              </button>
            )}

            {/* Image principale */}
            <img 
              src={lightboxImages[lightboxIndex]} 
              alt={`Photo ${lightboxIndex + 1}`}
              className="lightbox-image"
            />

            {/* Navigation droite */}
            {lightboxImages.length > 1 && (
              <button 
                className="lightbox-nav lightbox-next"
                onClick={() => setLightboxIndex((prev: number) => (prev + 1) % lightboxImages.length)}
              >
                <FiChevronRight />
              </button>
            )}

            {/* Compteur */}
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>

            {/* Miniatures */}
            {lightboxImages.length > 1 && (
              <div className="lightbox-thumbnails">
                {lightboxImages.map((img: string, i: number) => (
                  <div
                    key={i}
                    className={`lightbox-thumb ${i === lightboxIndex ? 'active' : ''}`}
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={img} alt={`Miniature ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
