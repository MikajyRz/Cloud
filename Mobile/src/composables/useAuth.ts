import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

// Utilisateur local (stocké dans le device, pas d'auth Firebase)
type LocalUser = {
  email: string
  nom: string
  deviceId: string
}

const currentUser = ref<LocalUser | null>(null)
const initialized = ref(false)

// Charger l'utilisateur local depuis le stockage du device
async function loadLocalUser(): Promise<LocalUser | null> {
  const { value } = await Preferences.get({ key: 'local_user' })
  if (value) {
    return JSON.parse(value) as LocalUser
  }
  return null
}

// Sauvegarder l'utilisateur local
async function saveLocalUser(user: LocalUser): Promise<void> {
  await Preferences.set({ key: 'local_user', value: JSON.stringify(user) })
}

// Générer un ID unique pour le device
function generateDeviceId(): string {
  return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

export function useAuth() {
  const isAuthenticated = () => !!currentUser.value

  // "Login" = créer/récupérer un profil local
  const login = async (email: string, nom: string) => {
    // Vérifier si l'utilisateur est bloqué dans Firestore
    try {
      const docId = email.replace('.', '_')
      const userDoc = await getDoc(doc(db, 'utilisateurs', docId))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.estBloque === true) {
          throw new Error('Votre compte est bloqué. Contactez un administrateur.')
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('bloqué')) {
        throw err
      }
      // Si Firestore est inaccessible, continuer (mode offline)
    }
    
    let user = await loadLocalUser()
    
    if (!user) {
      user = {
        email,
        nom,
        deviceId: generateDeviceId(),
      }
      await saveLocalUser(user)
    } else {
      // Mettre à jour les infos si changées
      user.email = email
      user.nom = nom
      await saveLocalUser(user)
    }
    
    currentUser.value = user
    initialized.value = true
    return user
  }

  // Pas de register séparé, même comportement que login
  const register = async (email: string, nom: string) => {
    return login(email, nom)
  }

  const logout = async () => {
    // On ne supprime pas le profil local, juste on le déconnecte en mémoire
    currentUser.value = null
  }

  const getCurrentUser = async () => {
    if (!initialized.value) {
      currentUser.value = await loadLocalUser()
      initialized.value = true
    }
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
