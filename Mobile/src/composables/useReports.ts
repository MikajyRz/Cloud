import { computed } from 'vue'
import {
  addDoc,
  collection,
  type DocumentData,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  serverTimestamp,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/composables/useAuth'

export type ReportDoc = {
  id: string
  titre: string
  description: string
  latitude: number
  longitude: number
  uid: string
  userEmail?: string
  createdAt?: unknown
}

type CreateReportInput = {
  titre: string
  description: string
  latitude: number
  longitude: number
}

function getCollectionName() {
  return (import.meta.env.VITE_FIRESTORE_REPORTS_COLLECTION as string | undefined) ?? 'signalements'
}

export function useReports(firestore: Firestore = db) {
  const { currentUser, getCurrentUser } = useAuth()
  const collectionRef = computed(() => collection(firestore, getCollectionName()))

  const createReport = async (input: CreateReportInput) => {
    const u = (await getCurrentUser()) ?? currentUser.value
    if (!u) throw new Error('Not authenticated')

    await addDoc(collectionRef.value, {
      titre: input.titre,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      uid: u.uid,
      userEmail: u.email ?? null,
      createdAt: serverTimestamp(),
    })
  }

  const subscribeReports = (opts: { mineOnly: boolean }, cb: (rows: ReportDoc[]) => void): Unsubscribe => {
    const base = [orderBy('createdAt', 'desc')]

    if (opts.mineOnly && !currentUser.value?.uid) {
      cb([])
      return () => {}
    }

    const q = opts.mineOnly
      ? query(collectionRef.value, where('uid', '==', currentUser.value?.uid ?? ''), ...base)
      : query(collectionRef.value, ...base)

    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const rows: ReportDoc[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data() as Omit<ReportDoc, 'id'>
        return {
          id: d.id,
          ...data,
        }
      })
      cb(rows)
    })
  }

  return {
    createReport,
    subscribeReports,
  }
}
