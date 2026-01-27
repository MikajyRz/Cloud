import '../App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

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
          zoom: 11,
        })

        map.on('error', (e: maplibregl.ErrorEvent) => {
          const msg = (e?.error as Error | undefined)?.message ?? 'Map error'
          setError(msg)
        })

        map.addControl(new maplibregl.NavigationControl(), 'top-right')
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
