import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">{title}</div>
          {subtitle ? <div className="authSubtitle">{subtitle}</div> : null}
        </div>
        {children}
      </div>
    </div>
  )
}
