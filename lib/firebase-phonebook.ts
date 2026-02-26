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
} from 'firebase/firestore'
import { db } from './firebase'

export interface PhonebookItem {
  id?: string
  company: string
  category: string
  phone: string
  fax?: string
  address?: string
  memo?: string
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const PHONEBOOK_COLLECTION = 'phonebook'

export async function getPhonebookItems(authorEmail: string): Promise<PhonebookItem[]> {
  const toMillis = (value: any) => {
    if (!value) return 0
    if (typeof value?.toMillis === 'function') return value.toMillis()
    if (typeof value?.toDate === 'function') return value.toDate().getTime()
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  try {
    const q = query(
      collection(db, PHONEBOOK_COLLECTION),
      where('authorEmail', '==', authorEmail),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as PhonebookItem))
  } catch (error) {
    console.error('Error fetching phonebook (indexed query):', error)

    try {
      const fallbackQ = query(collection(db, PHONEBOOK_COLLECTION), where('authorEmail', '==', authorEmail))
      const fallbackSnapshot = await getDocs(fallbackQ)
      const rows = fallbackSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as PhonebookItem))

      return rows.sort((a, b) => toMillis((b as any).createdAt) - toMillis((a as any).createdAt))
    } catch (fallbackError) {
      console.error('Error fetching phonebook (fallback):', fallbackError)
      return []
    }
  }
}

export async function createPhonebookItem(
  data: Omit<PhonebookItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = Timestamp.now()
    const ref = await addDoc(collection(db, PHONEBOOK_COLLECTION), {
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    return ref.id
  } catch (error) {
    console.error('Error creating phonebook item:', error)
    throw error
  }
}

export async function updatePhonebookItem(
  id: string,
  data: Pick<PhonebookItem, 'company' | 'category' | 'phone' | 'fax' | 'address' | 'memo'>
): Promise<void> {
  try {
    await updateDoc(doc(db, PHONEBOOK_COLLECTION, id), {
      ...data,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error updating phonebook item:', error)
    throw error
  }
}

export async function deletePhonebookItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PHONEBOOK_COLLECTION, id))
  } catch (error) {
    console.error('Error deleting phonebook item:', error)
    throw error
  }
}
