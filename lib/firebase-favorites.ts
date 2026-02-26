import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

export interface FavoriteSite {
  id?: string
  title: string
  url: string
  note?: string
  authorEmail: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COL = 'favorites'

export async function getFavoriteSites(authorEmail: string): Promise<FavoriteSite[]> {
  try {
    const q = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
  } catch {
    const q = query(collection(db, COL), where('authorEmail', '==', authorEmail))
    const snap = await getDocs(q)
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
    return rows.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
  }
}

export async function createFavoriteSite(data: Omit<FavoriteSite, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: now, updatedAt: now })
  return ref.id
}

export async function updateFavoriteSite(id: string, data: Pick<FavoriteSite, 'title' | 'url' | 'note'>) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteFavoriteSite(id: string) {
  await deleteDoc(doc(db, COL, id))
}
