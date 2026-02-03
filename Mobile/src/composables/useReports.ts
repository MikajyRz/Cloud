import { computed } from 'vue'
import {
  addDoc,
  collection,
  type DocumentData,
  onSnapshot,
  query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  serverTimestamp,
  where,
  type Firestore,
  type Unsubscribe,
  updateDoc,
  doc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/composables/useAuth'

// Générer un UUID v4 compatible PostgreSQL
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export type ReportDoc = {
  id: string
  titre: string
  description: string
  latitude: number
  longitude: number
  surfaceM2?: number
  budget?: number
  statut?: string
  nomEntreprise?: string
  deviceId?: string
  userEmail?: string
  userName?: string
  createdAt?: unknown
  dateSignalement?: unknown
}

type CreateReportInput = {
  titre: string
  description: string
  latitude: number
  longitude: number
  surfaceM2?: number
  budget?: number
  nomEntreprise?: string
}

type UpdateReportInput = {
  titre?: string
  description?: string
  surfaceM2?: number
  budget?: number
  statut?: string
  nomEntreprise?: string
}

function getCollectionName() {
  return (import.meta.env.VITE_FIRESTORE_REPORTS_COLLECTION as string | undefined) ?? 'signalements'
}

export function useReports(firestore: Firestore = db) {
  const { currentUser, getCurrentUser } = useAuth()
  const collectionRef = computed(() => collection(firestore, getCollectionName()))

  const createReport = async (input: CreateReportInput) => {
    const u = (await getCurrentUser()) ?? currentUser.value
    if (!u) throw new Error('Veuillez vous identifier d\'abord')

    // Générer un UUID compatible PostgreSQL
    const uuid = generateUUID()

    // Utiliser setDoc avec l'UUID au lieu de addDoc
    const docRef = doc(firestore, getCollectionName(), uuid)
    await setDoc(docRef, {
      titre: input.titre,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      surfaceM2: input.surfaceM2 ?? null,
      budget: input.budget ?? null,
      nomEntreprise: input.nomEntreprise ?? null,
      statut: 'NOUVEAU',
      deviceId: u.deviceId,
      userEmail: u.email ?? null,
      userName: u.nom ?? null,
      createdAt: serverTimestamp(),
      dateSignalement: serverTimestamp(),
    })
  }

  const updateReport = async (reportId: string, updates: UpdateReportInput) => {
    const u = (await getCurrentUser()) ?? currentUser.value
    if (!u) throw new Error('Veuillez vous identifier d\'abord')

    const docRef = doc(firestore, getCollectionName(), reportId)
    await updateDoc(docRef, updates)
  }

  const deleteReport = async (reportId: string) => {
    const u = (await getCurrentUser()) ?? currentUser.value
    if (!u) throw new Error('Veuillez vous identifier d\'abord')

    const docRef = doc(firestore, getCollectionName(), reportId)
    await deleteDoc(docRef)
  }

  const subscribeReports = (
    opts: { mineOnly: boolean },
    cb: (rows: ReportDoc[]) => void,
    onError?: (err: unknown) => void,
  ): Unsubscribe => {
    const deviceId = currentUser.value?.deviceId
    const email = currentUser.value?.email ?? undefined

    const q = !opts.mineOnly
      ? query(collectionRef.value)
      : deviceId
        ? query(collectionRef.value, where('deviceId', '==', deviceId))
        : email
          ? query(collectionRef.value, where('userEmail', '==', email))
          : query(collectionRef.value, where('deviceId', '==', '__no_device__'))

    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rawRows: ReportDoc[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as Omit<ReportDoc, 'id'>
          return {
            id: d.id,
    updateReport,
    deleteReport,
            ...data,
          }
        })

        // Sort client-side (avoids composite index). Firestore Timestamp has toMillis().
        const sorted = [...rawRows].sort((a, b) => {
          const ta = (a.createdAt as any)?.toMillis?.() ?? 0
          const tb = (b.createdAt as any)?.toMillis?.() ?? 0
          return tb - ta
        })

        cb(sorted)
      },
      (err: unknown) => {
        onError?.(err)
      },
    )
  }

  return {
    createReport,
    subscribeReports,
  }
}
