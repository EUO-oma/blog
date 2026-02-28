import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore'
import { db, FileItem } from './firebase'

const COL = 'files'

function withoutUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export async function getFiles(): Promise<FileItem[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FileItem[]
}

export async function createFileItem(data: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, COL), withoutUndefined({ ...data, createdAt: now, updatedAt: now }))
  return ref.id
}

export async function updateFileItem(id: string, patch: Partial<FileItem>) {
  await updateDoc(doc(db, COL, id), withoutUndefined({ ...patch, updatedAt: Timestamp.now() }))
}

export async function deleteFileItem(id: string) {
  await deleteDoc(doc(db, COL, id))
}
