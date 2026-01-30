import { ref } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const currentUser = ref<any | null>(null)
const initialized = ref(false)
const authToken = ref<string | null>(localStorage.getItem('auth_token'))

interface UtilisateurFirestore {
  email: string
  nom?: string
  prenom?: string
  role?: string
  telephone?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8180'

export function useAuth() {
  const isAuthenticated = () => !!authToken.value

  const login = async (email: string, password: string) => {
    try {
      // Appeler l'API backend pour se connecter
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur login:', errorText)
        throw new Error(errorText || 'Email ou mot de passe incorrect')
      }

      const data = await response.json()
      authToken.value = data.token
      localStorage.setItem('auth_token', data.token)

      // Récupérer les informations de l'utilisateur
      const meResponse = await fetch(`${API_URL}/api/utilisateurs/me`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
      })

      if (meResponse.ok) {
        currentUser.value = await meResponse.json()
      }

      initialized.value = true
      return currentUser.value
    } catch (error: any) {
      console.error('Erreur complète:', error)
      throw new Error(error.message || 'Erreur de connexion')
    }
  }

  const register = async (email: string, password: string, nom?: string, prenom?: string) => {
    try {
      // Créer le nom complet
      const fullName = `${prenom || ''} ${nom || ''}`.trim()

      // Appeler l'API backend pour l'inscription
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          fullName: fullName || email 
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Erreur lors de l\'inscription')
      }

      // Après l'inscription, se connecter automatiquement
      return await login(email, password)
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de l\'inscription')
    }
  }

  const logout = async () => {
    authToken.value = null
    currentUser.value = null
    localStorage.removeItem('auth_token')
  }

  const getCurrentUser = async () => {
    if (!authToken.value) {
      initialized.value = true
      return null
    }

    if (currentUser.value) {
      return currentUser.value
    }

    try {
      const response = await fetch(`${API_URL}/api/utilisateurs/me`, {
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
        },
      })

      if (response.ok) {
        currentUser.value = await response.json()
      } else {
        // Token invalide, déconnexion
        await logout()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      await logout()
    }

    initialized.value = true
    return currentUser.value
  }

  const getUserFromFirestore = async (email: string): Promise<UtilisateurFirestore | null> => {
    try {
      const emailKey = email.replace(/\./g, '_')
      const userDocRef = doc(db, 'utilisateurs', emailKey)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        return userDoc.data() as UtilisateurFirestore
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      return null
    }
  }

  return {
    currentUser,
    initialized,
    authToken,
    isAuthenticated,
    login,
    register,
    logout,
    getCurrentUser,
    getUserFromFirestore,
  }
}
