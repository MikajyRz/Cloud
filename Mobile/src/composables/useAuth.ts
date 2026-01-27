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

export function useAuth() {
  const isAuthenticated = () => !!currentUser.value

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    currentUser.value = cred.user
    return cred.user
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
