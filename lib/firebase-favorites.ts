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

  // 1) sortOrder 기준 조회 시도
  try {
    const q = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('sortOrder', 'asc'))
    const snap = await getDocs(q)
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
    // 과거 데이터(sortOrder 없음) 때문에 빈 배열이 나올 수 있어 폴백
    if (rows.length > 0) return normalize(rows)
  } catch {
    // ignore and fallback
  }

  // 2) createdAt 폴백 조회(구데이터 포함)
  const q = query(collection(db, COL), where('authorEmail', '==', authorEmail), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FavoriteSite[]
  return normalize(rows)
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
