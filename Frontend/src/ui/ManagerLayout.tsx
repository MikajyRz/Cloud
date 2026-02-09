import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, LayoutDashboard, LogOut, Map, User, Users } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function ManagerLayout({ title, subtitle, actions, children }: Props) {
  const { me, logout } = useAuth()
  const location = useLocation()
  const path = location.pathname
  const isManager = me?.role === 'MANAGER'

  const isActive = (to: string) => path === to

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">Cloud Console</div>

        <nav className="nav">
          <Link className={`nav__link ${isActive('/') ? 'nav__link--active' : ''}`} to="/">
            <Map size={18} />
            <span>Carte</span>
          </Link>
          <Link className={`nav__link ${isActive('/profile') ? 'nav__link--active' : ''}`} to="/profile">
            <User size={18} />
            <span>Profil</span>
          </Link>

          {isManager ? (
            <>
              <Link className={`nav__link ${isActive('/manager') ? 'nav__link--active' : ''}`} to="/manager">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link className={`nav__link ${isActive('/manager/signalements') ? 'nav__link--active' : ''}`} to="/manager/signalements">
                <ClipboardList size={18} />
                <span>Signalements</span>
              </Link>
              <Link className={`nav__link ${isActive('/manager/utilisateurs') ? 'nav__link--active' : ''}`} to="/manager/utilisateurs">
                <Users size={18} />
                <span>Utilisateurs</span>
              </Link>
              <Link className={`nav__link ${isActive('/manager/statistiques') ? 'nav__link--active' : ''}`} to="/manager/statistiques">
                <BarChart3 size={18} />
                <span>Statistiques</span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__me">
            <div className="sidebar__meLabel">Connecté</div>
            <div className="sidebar__meValue">{me?.email ?? '-'}</div>
            <div className="sidebar__meMeta">{me?.role ?? ''}</div>
          </div>
          <button className="btn btn--danger btn--full" onClick={logout} type="button">
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="pageHeader">
          <div>
            <div className="pageTitle">{title}</div>
            {subtitle ? <div className="pageSubtitle">{subtitle}</div> : null}
          </div>
          {actions ? <div className="row">{actions}</div> : null}
        </header>

        <div className="pageBody">{children}</div>
      </main>
    </div>
  )
}
