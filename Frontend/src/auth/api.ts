export type AuthResponse = {
  token: string
  expiresAt: string
}

export type UserRole = 'VISITEUR' | 'UTILISATEUR' | 'MANAGER'

export type UserMeResponse = {
  email: string
  nom: string | null
  prenom: string | null
  role: UserRole
}

type LoginRequest = {
  email: string
  password: string
}

type SignupRequest = {
  email: string
  password: string
  fullName: string
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

async function http<T>(path: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (opts.headers) {
    const h = opts.headers as Record<string, string>
    Object.assign(headers, h)
  }

  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  const contentLength = res.headers.get('content-length')
  if (contentLength === '0') return undefined as T

  const text = await res.text().catch(() => '')
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function loginApi(req: LoginRequest): Promise<AuthResponse> {
  return http<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function signupApi(req: SignupRequest): Promise<void> {
  await http<void>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function unlockUtilisateurApi(token: string, email: string): Promise<void> {
  await http<void>('/api/auth/unlock', {
    method: 'POST',
    token,
    body: JSON.stringify({ email }),
  })
}

export async function meApi(token: string): Promise<UserMeResponse> {
  return http<UserMeResponse>('/api/utilisateurs/me', {
    method: 'GET',
    token,
  })
}

export type SyncResultDto = {
  success: boolean
  message: string
  utilisateurs: {
    nouveauxDepuisFirestore: number
    misAJourVersFirestore: number
    total: number
  }
  signalements: {
    nouveauxDepuisFirestore: number
    misAJourVersFirestore: number
    total: number
  }
  logs: string[]
  errors: string[]
}

export async function synchronizeBidirectionalApi(token: string): Promise<SyncResultDto> {
  return http<SyncResultDto>('/api/sync/synchronize', {
    method: 'POST',
    token,
  })
}
