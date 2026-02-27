import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface SecretWordItem {
  id?: string
  term: string
  meaning: string
  example?: string
  learned?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COL = 'secret_words'

export async function getSecretWords(): Promise<SecretWordItem[]> {
  const q = query(collection(db, COL), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as SecretWordItem[]
}

export async function createSecretWord(input: { term: string; meaning: string; example?: string }) {
  const now = Timestamp.now()
  await addDoc(collection(db, COL), {
    term: input.term,
    meaning: input.meaning,
    example: input.example || '',
    learned: false,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateSecretWord(id: string, patch: Partial<SecretWordItem>) {
  await updateDoc(doc(db, COL, id), { ...patch, updatedAt: Timestamp.now() })
}

export async function deleteSecretWord(id: string) {
  await deleteDoc(doc(db, COL, id))
}
