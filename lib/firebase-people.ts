import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface PeopleItem {
  id?: string
  person: string
  related: string
  region?: string
  children?: string
  role?: string
  likes?: string
  dislikes?: string
  note?: string
  learned?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

const COL = 'people'

export async function getPeople(): Promise<PeopleItem[]> {
  const q = query(collection(db, COL), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PeopleItem[]
}

export async function createPeople(input: { person: string; related: string; region?: string; children?: string; role?: string; likes?: string; dislikes?: string; note?: string }) {
  const now = Timestamp.now()
  await addDoc(collection(db, COL), {
    person: input.person,
    related: input.related,
    region: input.region || '',
    children: input.children || '',
    role: input.role || '',
    likes: input.likes || '',
    dislikes: input.dislikes || '',
    note: input.note || '',
    learned: false,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updatePeople(id: string, patch: Partial<PeopleItem>) {
  await updateDoc(doc(db, COL, id), { ...patch, updatedAt: Timestamp.now() })
}

export async function deletePeople(id: string) {
  await deleteDoc(doc(db, COL, id))
}
