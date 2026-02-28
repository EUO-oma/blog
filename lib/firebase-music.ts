import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore'
import { db, MusicItem } from './firebase'

const MUSIC_COLLECTION = 'music'

export async function getMusicItems(): Promise<MusicItem[]> {
  try {
    const q = query(collection(db, MUSIC_COLLECTION), orderBy('sortOrder', 'asc'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MusicItem[]
  } catch {
    const q = query(collection(db, MUSIC_COLLECTION), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MusicItem[]
  }
}

function withoutUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export async function createMusicItem(data: Omit<MusicItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, MUSIC_COLLECTION), withoutUndefined({
    ...data,
    createdAt: now,
    updatedAt: now,
  }))
  return ref.id
}

export async function updateMusicItem(id: string, data: Partial<MusicItem>) {
  await updateDoc(doc(db, MUSIC_COLLECTION, id), withoutUndefined({
    ...data,
    updatedAt: Timestamp.now(),
  }))
}

export async function deleteMusicItem(id: string) {
  await deleteDoc(doc(db, MUSIC_COLLECTION, id))
}

export function extractVideoId(url: string): string | null {
  const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/)
  if (match1) return match1[1]
  const match2 = url.match(/youtu\.be\/([^&\n?#]+)/)
  if (match2) return match2[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  return null
}
