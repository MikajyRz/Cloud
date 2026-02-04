import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import '../App.css'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (loc.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      nav(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="app-shell" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        borderRadius: '24px',
        zIndex: 1,
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          color: 'white',
          fontSize: '32px',
          boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
        }}>
          🗺️
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Bon retour
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '15px' }}>
          Connectez-vous pour accéder à la plateforme
        </p>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '20px', textAlign: 'left' }}>
          <div className="input-group">
            <span style={{ fontSize: '18px', color: '#94a3b8', marginRight: '8px' }}>📧</span>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email professionnel" 
              type="email" 
              required 
            />
          </div>

          <div className="input-group">
            <span style={{ fontSize: '18px', color: '#94a3b8', marginRight: '8px' }}>🔒</span>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Mot de passe" 
              type={showPassword ? 'text' : 'password'} 
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8', fontSize: '18px' }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              Se souvenir de moi
            </label>
            <Link to="#" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
              Oublié ?
            </Link>
          </div>

          <button className="btn-primary" disabled={loading} type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? 'Connexion...' : (
              <>
                Se connecter
                <span style={{ fontSize: '18px' }}>→</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            borderRadius: '10px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '24px', fontSize: '15px' }}>
          <p style={{ color: '#64748b' }}>
            Pas encore de compte ? {' '}
            <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
              S'inscrire
            </Link>
          </p>
          <Link to="/" style={{ display: 'block', marginTop: '12px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
            Continuer en tant que visiteur
          </Link>
        </div>
      </div>
    </div>
  )
}
