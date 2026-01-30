import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function RequireAuth() {
  const { token, loading } = useAuth()
  const loc = useLocation()

  if (loading) return null

  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  return <Outlet />
}
