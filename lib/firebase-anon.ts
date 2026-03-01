import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface AnonPost {
  id?: string
  content: string
  authorKey: string
  createdAt: Timestamp
  spamStatus?: 'clean' | 'spam'
  spamReason?: string
}

const COL = 'anon_posts'

export async function getAnonPosts(): Promise<AnonPost[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((x) => x.spamStatus !== 'spam') as AnonPost[]
}

export async function createAnonPost(input: { content: string; authorKey: string }) {
  await addDoc(collection(db, COL), {
    content: input.content,
    authorKey: input.authorKey,
    createdAt: Timestamp.now(),
  })
}

export async function deleteAnonPost(id: string) {
  await deleteDoc(doc(db, COL, id))
}
