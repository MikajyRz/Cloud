import '../App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { FiMap, FiLogOut, FiLogIn, FiUserPlus, FiSettings, FiUser } from 'react-icons/fi'

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [error, setError] = useState<string | null>(null)
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

      {error && (
        <div className="error-overlay">
          {error}
        </div>
      )}
    </div>
  )
}
