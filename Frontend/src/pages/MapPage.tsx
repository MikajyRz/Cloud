import '../App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { role, me, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const nav = useNavigate()

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
          attributionControl: false
        })

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
        
        map.on('error', (e: maplibregl.ErrorEvent) => {
          const msg = (e?.error as Error | undefined)?.message ?? 'Map error'
          setError(msg)
        })

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
    <div className="app-shell" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className="map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Header Bar */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        padding: '12px 24px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            padding: '4px 8px',
            borderRadius: 10,
            color: 'white',
            display: 'flex',
            fontSize: '20px'
          }}>
            🗺️
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            GeoSignal
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
           {/* Desktop Menu */}
          <div className="desktop-menu" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role === 'VISITEUR' ? (
              <>
                <Link to="/login" className="btn-ghost" style={{ 
                  textDecoration: 'none', 
                  color: '#475569', 
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 10,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '16px' }}>🔑</span>
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary" style={{ 
                  textDecoration: 'none', 
                  fontSize: 14,
                  padding: '8px 20px',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: '16px' }}>➕</span>
                  Créer un compte
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  background: 'rgba(255,255,255,0.5)', 
                  padding: '6px 12px', 
                  borderRadius: 20,
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <div style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '50%', fontSize: '12px' }}>
                    👤
                  </div>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                    {me?.email?.split('@')[0]}
                  </span>
                  <span style={{ 
                    fontSize: 10, 
                    background: role === 'MANAGER' ? '#dbeafe' : '#f1f5f9', 
                    color: role === 'MANAGER' ? '#1e40af' : '#475569',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5
                  }}>
                    {role}
                  </span>
                </div>

                {role === 'MANAGER' && (
                  <Link to="/manager" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#0f172a',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
                  }}>
                    <span style={{ fontSize: '14px' }}>🛡️</span>
                    Manager
                  </Link>
                )}

                <button onClick={logout} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#ef4444',
                  padding: '6px 10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  🚪
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          position: 'absolute', 
          bottom: 30, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          padding: '12px 24px', 
          background: '#ef4444', 
          color: 'white', 
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 500,
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 20
        }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, fontSize: '14px' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
