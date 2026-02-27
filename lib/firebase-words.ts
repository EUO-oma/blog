import { addDoc, collection, deleteDoc, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

export interface WordItem {
  id?: string
  term: string
  meaning: string
  example?: string
  starred?: boolean
  authorEmail: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COL = 'words'

export async function getWords(authorEmail: string): Promise<WordItem[]> {
  const q = query(collection(db, COL), where('authorEmail', '==', authorEmail))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .sort((a: any, b: any) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)) as WordItem[]
}

export async function createWord(input: { term: string; meaning: string; example?: string; authorEmail: string }) {
  const now = Timestamp.now()
  await addDoc(collection(db, COL), {
    term: input.term,
    meaning: input.meaning,
    example: input.example || '',
    starred: false,
    authorEmail: input.authorEmail,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateWord(id: string, patch: Partial<WordItem>) {
  await updateDoc(doc(db, COL, id), { ...patch, updatedAt: Timestamp.now() })
}

export async function deleteWord(id: string) {
  await deleteDoc(doc(db, COL, id))
}
