import { ref } from 'vue'
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export interface NotificationItem {
  id: string
  titre: string
  message: string
  signalementId: string | null
  dateCreation: string
  lu: boolean
}

// État global partagé (singleton) - évite les conflits de listeners
const notifications = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const loading = ref(false)
let unsubscribe: (() => void) | null = null
let isInitialized = false

const loadNotifications = () => {
  // Éviter de créer plusieurs listeners
  if (unsubscribe) {
    return
  }

  loading.value = true
  const q = query(
    collection(db, 'notifications'),
    orderBy('dateCreation', 'desc')
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    notifications.value = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      titre: docSnap.data().titre || '',
      message: docSnap.data().message || '',
      signalementId: docSnap.data().signalementId || null,
      dateCreation: docSnap.data().dateCreation || '',
      lu: docSnap.data().lu || false,
    }))
    unreadCount.value = notifications.value.filter((n) => !n.lu).length
    loading.value = false
  }, (error) => {
    console.error('Erreur chargement notifications:', error)
    loading.value = false
  })
}

const markAsRead = async (id: string) => {
  try {
    const notifRef = doc(db, 'notifications', id)
    await updateDoc(notifRef, { lu: true })
    // Pas besoin de mettre à jour manuellement, onSnapshot le fera
  } catch (error) {
    console.error('Erreur markAsRead:', error)
  }
}

const markAllAsRead = async () => {
  try {
    const unread = notifications.value.filter((n) => !n.lu)
    for (const n of unread) {
      const notifRef = doc(db, 'notifications', n.id)
      await updateDoc(notifRef, { lu: true })
    }
    // Pas besoin de mettre à jour manuellement, onSnapshot le fera
  } catch (error) {
    console.error('Erreur markAllAsRead:', error)
  }
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffD = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `Il y a ${diffMin} min`
    if (diffH < 24) return `Il y a ${diffH}h`
    if (diffD < 7) return `Il y a ${diffD}j`
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function useNotifications() {
  // Initialiser le listener une seule fois
  if (!isInitialized) {
    isInitialized = true
    loadNotifications()
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    formatDate,
    loadNotifications,
  }
}
