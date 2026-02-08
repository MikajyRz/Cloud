import { ref, onUnmounted } from 'vue'
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase'

// State should be defined outside the composable to be a singleton
const currentUser = ref<User | null>(null)
const initialized = ref(false)

// Listener for auth state changes
const unsub = onAuthStateChanged(auth, (user) => {
  currentUser.value = user
  initialized.value = true
})

export function useAuth() {
  onUnmounted(() => {
    unsub()
  })

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      currentUser.value = userCredential.user
      return userCredential.user
    } catch (error: any) {
      console.error('Firebase login error:', error)
      throw new Error(mapFirebaseAuthError(error.code))
    }
  }

  const register = async (email: string, password: string, nom?: string, prenom?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      currentUser.value = userCredential.user

      // Save additional user info to Firestore
      const userDocRef = doc(db, 'utilisateurs', userCredential.user.uid)
      await setDoc(userDocRef, {
        email: userCredential.user.email,
        nom: nom || '',
        prenom: prenom || '',
        role: 'user', // default role
      })

      return userCredential.user
    } catch (error: any) {
      console.error('Firebase register error:', error)
      throw new Error(mapFirebaseAuthError(error.code))
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      currentUser.value = null
    } catch (error) {
      console.error('Firebase logout error:', error)
    }
  }

  const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
      if (initialized.value) {
        resolve(currentUser.value)
      } else {
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub()
          resolve(user)
        })
      }
    })
  }

  return {
    currentUser,
    initialized,
    login,
    register,
    logout,
    getCurrentUser,
  }
}

function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse e-mail invalide.'
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.'
    case 'auth/user-not-found':
      return 'Aucun utilisateur trouvé avec cet e-mail.'
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.'
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée.'
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}
