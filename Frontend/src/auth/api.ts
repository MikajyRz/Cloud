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

export type LockedUserResponse = {
  email: string
  nom: string | null
  prenom: string | null
  role: UserRole
  tentativesEchouees: number
}

export type StatutTravaux = 'NOUVEAU' | 'EN_COURS' | 'TERMINE'

export type ManagerReportResponse = {
  id: string
  firestoreId: string | null
  titre: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  surfaceM2: number | null
  budget: number | null
  statut: StatutTravaux | null
  dateSignalement: string | null
  idUtilisateur: string | null
  idEntreprise: string | null
}

export type UpdateReportRequest = {
  surfaceM2: number | null
  budget: number | null
  idEntreprise: string | null
  statut: StatutTravaux | null
}

export type SyncReportsResponse = {
  fetched: number
  inserted: number
  updated: number
  pushed: number
  collection: string
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

export async function unlockUserApi(token: string, email: string): Promise<void> {
  await http<void>('/api/auth/unlock', {
    method: 'POST',
    token,
    body: JSON.stringify({ email }),
  })
}

export async function meApi(token: string): Promise<UserMeResponse> {
  return http<UserMeResponse>('/api/users/me', {
    method: 'GET',
    token,
  })
}

export async function syncReportsApi(token: string): Promise<SyncReportsResponse> {
  return http<SyncReportsResponse>('/api/manager/sync-reports', {
    method: 'POST',
    token,
  })
}

export async function listLockedUsersApi(token: string): Promise<LockedUserResponse[]> {
  return http<LockedUserResponse[]>('/api/manager/locked-users', {
    method: 'GET',
    token,
  })
}

export async function listManagerReportsApi(token: string): Promise<ManagerReportResponse[]> {
  return http<ManagerReportResponse[]>('/api/manager/reports', {
    method: 'GET',
    token,
  })
}

export async function updateManagerReportApi(
  token: string,
  id: string,
  req: UpdateReportRequest,
): Promise<ManagerReportResponse> {
  return http<ManagerReportResponse>(`/api/manager/reports/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(req),
  })
}
