import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

export interface FavoriteSite {
  id?: string
  title: string
  url: string
  note?: string
  sortOrder?: number
  authorEmail: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COL = 'favorites'

export async function getFavoriteSites(authorEmail: string): Promise<FavoriteSite[]> {
  try {
    const q = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('sortOrder', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
  } catch {
    const q = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
    return rows
      .sort((a: any, b: any) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
      .map((r, i) => ({ ...r, sortOrder: Number.isFinite(r.sortOrder) ? r.sortOrder : i }))
  }
}

export async function createFavoriteSite(
  data: Omit<FavoriteSite, 'id' | 'createdAt' | 'updatedAt'>,
  currentCount = 0
) {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, COL), {
    ...data,
    sortOrder: data.sortOrder ?? currentCount,
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}

export async function updateFavoriteSite(id: string, data: Pick<FavoriteSite, 'title' | 'url' | 'note'>) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function reorderFavoriteSites(items: FavoriteSite[]) {
  const batch = writeBatch(db)
  items.forEach((item, index) => {
    if (!item.id) return
    batch.update(doc(db, COL, item.id), {
      sortOrder: index,
      updatedAt: Timestamp.now(),
    })
  })
  await batch.commit()
}

export async function deleteFavoriteSite(id: string) {
  await deleteDoc(doc(db, COL, id))
}
