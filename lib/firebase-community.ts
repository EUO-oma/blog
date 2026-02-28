import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { CommunityPost } from './firebase'

const COL = 'community_posts'

export async function getCommunityPosts(): Promise<CommunityPost[]> {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CommunityPost[]
}

export async function createCommunityPost(data: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now()
  await addDoc(collection(db, COL), { ...data, createdAt: now, updatedAt: now })
}

export async function deleteCommunityPost(id: string) {
  await deleteDoc(doc(db, COL, id))
}
