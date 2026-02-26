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
  const normalize = (rows: FavoriteSite[]) =>
    rows
      .sort((a: any, b: any) => {
        const ao = Number.isFinite(a?.sortOrder) ? a.sortOrder : 9999
        const bo = Number.isFinite(b?.sortOrder) ? b.sortOrder : 9999
        if (ao !== bo) return ao - bo
        const at = a?.createdAt?.toMillis?.() || 0
        const bt = b?.createdAt?.toMillis?.() || 0
        return bt - at
      })
      .map((r, i) => ({ ...r, sortOrder: Number.isFinite((r as any).sortOrder) ? (r as any).sortOrder : i }))

  try {
    // 1) sortOrder 기준 조회 시도
    try {
      const q1 = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('sortOrder', 'asc'))
      const snap1 = await getDocs(q1)
      const rows1 = snap1.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
      if (rows1.length > 0) return normalize(rows1)
    } catch (e) {
      console.warn('favorites q1 fallback:', e)
    }

    // 2) createdAt 폴백 조회(구데이터 포함)
    try {
      const q2 = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('createdAt', 'desc'))
      const snap2 = await getDocs(q2)
      const rows2 = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
      if (rows2.length > 0) return normalize(rows2)
    } catch (e) {
      console.warn('favorites q2 fallback:', e)
    }

    // 3) 마지막 폴백: owner는 전체 조회
    if (authorEmail.toLowerCase() === 'icandoit13579@gmail.com') {
      const allSnap = await getDocs(collection(db, COL))
      const allRows = allSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
      return normalize(allRows)
    }

    return []
  } catch (error) {
    console.error('favorites load failed:', error)
    return []
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
