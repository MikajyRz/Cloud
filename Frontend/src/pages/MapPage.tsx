import '../App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

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
  dateSignalement?: string
  nomEntreprise?: string
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { role, me, logout, token } = useAuth()

  const getMarkerColor = (statut: string) => {
    switch (statut) {
      case 'NOUVEAU': return '#3498db' // Bleu
      case 'EN_ATTENTE': return '#f39c12' // Orange
      case 'EN_COURS': return '#e67e22' // Orange foncé
      case 'TERMINE': return '#27ae60' // Vert
      case 'ANNULE': return '#e74c3c' // Rouge
      default: return '#95a5a6' // Gris
    }
  }

  const getMarkerLabel = (statut: string) => {
    switch (statut) {
      case 'NOUVEAU': return 'N'
      case 'EN_ATTENTE': return 'A'
      case 'EN_COURS': return 'C'
      case 'TERMINE': return 'T'
      case 'ANNULE': return 'X'
      default: return '•'
    }
  }

  const loadSignalements = async () => {
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/signalements`, { headers })
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des signalements')
        return
      }

      const data = await response.json()
      displaySignalementsOnMap(data)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const displaySignalementsOnMap = (sigs: Signalement[]) => {
    if (!mapRef.current) return

    sigs.forEach((sig) => {
      const el = document.createElement('div')
      el.style.width = '32px'
      el.style.height = '32px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = getMarkerColor(sig.statut)
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '12px'
      el.style.fontWeight = '700'
      el.style.color = 'white'
      el.textContent = getMarkerLabel(sig.statut)

      const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
      }

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 12px; min-width: 250px;">
          <h3 style="margin: 0 0 10px; font-size: 15px; font-weight: 600; color: #2c3e50;">${sig.titre}</h3>
          <p style="margin: 0 0 10px; font-size: 13px; color: #666; line-height: 1.4;">${sig.description}</p>
          
          <div style="font-size: 12px; color: #555; line-height: 1.8;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 600;">📅 Date:</span>
              <span>${formatDate(sig.dateSignalement)}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
              <span style="font-weight: 600;">📊 Statut:</span>
              <span style="padding: 3px 8px; background: ${getMarkerColor(sig.statut)}; color: white; border-radius: 4px; font-size: 11px; font-weight: 500;">
                ${sig.statut.replace('_', ' ')}
              </span>
            </div>
            
            ${sig.surfaceM2 ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                <span style="font-weight: 600;">📏 Surface:</span>
                <span>${sig.surfaceM2} m²</span>
              </div>
            ` : ''}
            
            ${sig.budget ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                <span style="font-weight: 600;">💰 Budget:</span>
                <span>${sig.budget.toLocaleString('fr-FR')} €</span>
              </div>
            ` : ''}
            
            ${sig.nomEntreprise ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                <span style="font-weight: 600;">🏢 Entreprise:</span>
                <span>${sig.nomEntreprise}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([sig.longitude, sig.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!)

      // Afficher les infos au survol (et pas uniquement au clic)
      el.addEventListener('mouseenter', () => {
        if (!marker.getPopup().isOpen()) marker.togglePopup()
      })
      el.addEventListener('mouseleave', () => {
        if (marker.getPopup().isOpen()) marker.togglePopup()
      })
    })
  }

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
          zoom: 11,
        })

        map.on('error', (e: maplibregl.ErrorEvent) => {
          const msg = (e?.error as Error | undefined)?.message ?? 'Map error'
          setError(msg)
        })

        map.addControl(new maplibregl.NavigationControl(), 'top-right')
        mapRef.current = map

        // Charger les signalements après que la carte soit prête
        map.on('load', () => {
          loadSignalements()
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    }

    void init()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="app-shell">
      <div className="map" ref={mapContainerRef} />

      <div style={{ position: 'absolute', left: 12, top: 12, display: 'flex', gap: 8, alignItems: 'center', padding: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 8 }}>
        <span style={{ fontSize: 12 }}>Profil: <strong>{role}</strong>{me?.email ? ` (${me.email})` : ''}</span>
        {role === 'VISITEUR' ? (
          <>
            <Link to="/login" style={{ color: '#fff' }}>Login</Link>
            <Link to="/register" style={{ color: '#fff' }}>Register</Link>
          </>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
        {role === 'MANAGER' ? <Link to="/manager" style={{ color: '#fff' }}>Manager</Link> : null}
      </div>

      {error ? (
        <div style={{ position: 'absolute', left: 12, bottom: 12, right: 12, padding: 12, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, borderRadius: 8 }}>
          {error}
        </div>
      ) : null}
    </div>
  )
}
