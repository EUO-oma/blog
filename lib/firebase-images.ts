import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface ImageItem {
  id?: string
  title: string
  imageUrl: string // legacy/original fallback
  imageUrlThumb?: string
  imageUrlMedium?: string
  imageUrlOriginal?: string
  objectKey?: string // legacy/original fallback
  objectKeyThumb?: string
  objectKeyMedium?: string
  objectKeyOriginal?: string
  note?: string
  authorEmail: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COL = 'images'

export async function getImages(): Promise<ImageItem[]> {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ImageItem[]
  } catch {
    const snap = await getDocs(collection(db, COL))
    return (snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ImageItem[]).sort((a, b) => {
      const at = a.createdAt?.toMillis?.() || 0
      const bt = b.createdAt?.toMillis?.() || 0
      return bt - at
    })
  }
}

function withoutUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export async function createImage(data: Omit<ImageItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now()
  const payload = withoutUndefined({ ...data, createdAt: now, updatedAt: now })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updateImage(
  id: string,
  data: Partial<Omit<ImageItem, 'id' | 'createdAt' | 'updatedAt' | 'authorEmail'>>
) {
  const payload = withoutUndefined({ ...data, updatedAt: Timestamp.now() })
  await updateDoc(doc(db, COL, id), payload)
}

export async function deleteImage(id: string) {
  await deleteDoc(doc(db, COL, id))
}
