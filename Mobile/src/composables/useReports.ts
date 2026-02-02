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
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/composables/useAuth'

export type ReportDoc = {
  id: string
  titre: string
  description: string
  latitude: number
  longitude: number
  uid?: string
  userId?: string
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

  const subscribeReports = (
    opts: { mineOnly: boolean },
    cb: (rows: ReportDoc[]) => void,
    onError?: (err: unknown) => void,
  ): Unsubscribe => {
    const uid = currentUser.value?.uid
    const email = currentUser.value?.email ?? undefined

    const q = !opts.mineOnly
      ? query(collectionRef.value)
      : uid
        ? query(collectionRef.value, where('uid', '==', uid))
        : email
          ? query(collectionRef.value, where('userEmail', '==', email))
          : query(collectionRef.value, where('uid', '==', '__no_user__'))

    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rawRows: ReportDoc[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as Omit<ReportDoc, 'id'>
          return {
            id: d.id,
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
