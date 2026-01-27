import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import type { UserRole } from '@/auth/api'

export default function RequireRole({ role }: { role: UserRole }) {
  const { role: currentRole, loading } = useAuth()
  const loc = useLocation()

  if (loading) return null

  if (currentRole !== role) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  return <Outlet />
}
