import { ref, onUnmounted } from 'vue'
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase'

// Nombre max de tentatives (même valeur que app_config backend)
const MAX_LOGIN_ATTEMPTS = 3

// State should be defined outside the composable to be a singleton
const currentUser = ref<User | null>(null)
const initialized = ref(false)

// Listener for auth state changes - NE PAS désabonner, c'est un singleton global
const unsub = onAuthStateChanged(auth, (user) => {
  console.log('🔐 Auth state changed:', user?.email ?? 'null')
  currentUser.value = user
  initialized.value = true
})

/**
 * Génère le doc ID Firestore à partir de l'email
 * Même format que le backend : email.replace(".", "_")
 */
function emailToDocId(email: string): string {
  return email.toLowerCase().replace(/\./g, '_')
}

export function useAuth() {
  // NE PAS désabonner unsub ici - c'est un listener global singleton
  // qui doit rester actif pendant toute la durée de vie de l'app

  /**
   * Lit le document utilisateur dans Firestore pour vérifier le blocage
   */
  const getUserFirestoreDoc = async (email: string) => {
    const docId = emailToDocId(email)
    const userDocRef = doc(db, 'utilisateurs', docId)
    const snapshot = await getDoc(userDocRef)
    return snapshot.exists() ? snapshot.data() : null
  }

  /**
   * Incrémente les tentatives échouées dans Firestore
   * et bloque le compte si >= MAX_LOGIN_ATTEMPTS
   */
  const incrementFailedAttempts = async (email: string) => {
    const docId = emailToDocId(email)
    const userDocRef = doc(db, 'utilisateurs', docId)
    const snapshot = await getDoc(userDocRef)

    if (snapshot.exists()) {
      const data = snapshot.data()
      const currentAttempts = (data.tentativesEchouees || 0) + 1
      const shouldBlock = currentAttempts >= MAX_LOGIN_ATTEMPTS

      await updateDoc(userDocRef, {
        tentativesEchouees: currentAttempts,
        ...(shouldBlock ? { estBloque: true } : {}),
      })

      if (shouldBlock) {
        console.warn(`⚠️ Compte bloqué après ${currentAttempts} tentatives : ${email}`)
      }

      return { attempts: currentAttempts, blocked: shouldBlock }
    }

    // Pas de doc Firestore → on ne peut pas tracker (utilisateur inexistant côté sync)
    return { attempts: 0, blocked: false }
  }

  /**
   * Réinitialise les tentatives après un login réussi
   */
  const resetFailedAttempts = async (email: string) => {
    const docId = emailToDocId(email)
    const userDocRef = doc(db, 'utilisateurs', docId)
    const snapshot = await getDoc(userDocRef)

    if (snapshot.exists()) {
      await updateDoc(userDocRef, {
        tentativesEchouees: 0,
        estBloque: false,
      })
    }
  }

  const login = async (email: string, password: string) => {
    // 1. Vérifier dans Firestore si le compte est bloqué AVANT de tenter le login
    try {
      const userData = await getUserFirestoreDoc(email)
      if (userData && userData.estBloque === true) {
        throw new Error('Votre compte est bloqué. Contactez un administrateur.')
      }
    } catch (error: any) {
      // Si c'est notre erreur de blocage, on la propage
      if (error.message?.includes('bloqué')) {
        throw error
      }
      // Sinon (erreur réseau Firestore), on continue le login
      console.warn('Impossible de vérifier le blocage Firestore:', error.message)
    }

    // 2. Tenter le login Firebase Auth
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      currentUser.value = userCredential.user

      // 3. Login réussi → réinitialiser les tentatives dans Firestore
      try {
        await resetFailedAttempts(email)
      } catch (e) {
        console.warn('Impossible de réinitialiser les tentatives:', e)
      }

      return userCredential.user
    } catch (error: any) {
      // 4. Login échoué (mauvais mot de passe) → incrémenter les tentatives
      if (error.message?.includes('bloqué')) {
        throw error
      }

      const isAuthError = error.code === 'auth/wrong-password' || 
                          error.code === 'auth/invalid-credential' ||
                          error.code === 'auth/user-not-found'

      if (isAuthError) {
        try {
          const result = await incrementFailedAttempts(email)
          if (result.blocked) {
            throw new Error('Votre compte a été bloqué après trop de tentatives. Contactez un administrateur.')
          }
          const remaining = MAX_LOGIN_ATTEMPTS - result.attempts
          if (remaining > 0 && result.attempts > 0) {
            throw new Error(`Identifiants invalides. ${remaining} tentative(s) restante(s).`)
          }
        } catch (syncError: any) {
          if (syncError.message?.includes('bloqué') || syncError.message?.includes('tentative')) {
            throw syncError
          }
          console.warn('Impossible de tracker la tentative:', syncError)
        }
      }

      console.error('Firebase login error:', error)
      throw new Error(mapFirebaseAuthError(error.code))
    }
  }

  const register = async (email: string, password: string, nom?: string, prenom?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      currentUser.value = userCredential.user

      // Save additional user info to Firestore
      // Utiliser le même format de doc ID que le backend : email.replace(".", "_")
      const docId = emailToDocId(email)
      const userDocRef = doc(db, 'utilisateurs', docId)
      await setDoc(userDocRef, {
        email: userCredential.user.email?.toLowerCase() || email.toLowerCase(),
        nom: nom || '',
        prenom: prenom || '',
        role: 'USER',
        tentativesEchouees: 0,
        estBloque: false,
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
    case 'auth/invalid-credential':
      return 'Identifiants invalides.'
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà utilisée.'
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.'
    default:
      return 'Une erreur est survenue. Veuillez réessayer.'
  }
}
