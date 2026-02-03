import { ref } from 'vue'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/firebase'

const currentUser = ref<User | null>(auth.currentUser)
const initialized = ref(false)
let initPromise: Promise<User | null> | null = null

function ensureInit(): Promise<User | null> {
  if (initPromise) return initPromise

  initPromise = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u: User | null) => {
      currentUser.value = u
      initialized.value = true
      unsub()
      resolve(u)
    })
  })

  return initPromise
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

async function postJson(path: string, body: unknown, headers: Record<string, string> = {}): Promise<void> {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })
  } catch {
    // ignore network errors (should not block UI)
  }
}

function isInvalidCredentialsError(err: unknown): boolean {
  const code = (err as any)?.code as string | undefined
  return code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential'
}

function isUserDisabledError(err: unknown): boolean {
  const code = (err as any)?.code as string | undefined
  return code === 'auth/user-disabled'
}

export function useAuth() {
  const isAuthenticated = () => !!currentUser.value

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      currentUser.value = cred.user

      const token = await cred.user.getIdToken()
      await postJson('/api/auth/reset-attempts', { email }, { Authorization: `Bearer ${token}` })

      return cred.user
    } catch (err: unknown) {
      if (isUserDisabledError(err)) {
        throw new Error('Compte bloqué')
      }

      if (isInvalidCredentialsError(err)) {
        await postJson('/api/auth/failed-login', { email })
        throw new Error('Identifiants invalides')
      }

      throw err
    }
  }

  const register = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    currentUser.value = cred.user
    return cred.user
  }

  const logout = async () => {
    await signOut(auth)
    currentUser.value = null
  }

  const getCurrentUser = async () => {
    await ensureInit()
    return currentUser.value
  }

  return {
    currentUser,
    initialized,
    isAuthenticated,
    login,
    register,
    logout,
    getCurrentUser,
  }
}
