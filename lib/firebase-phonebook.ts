import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export interface PhonebookItem {
  id?: string
  company: string
  category: string
  phone: string
  memo?: string
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const PHONEBOOK_COLLECTION = 'phonebook'

export async function getPhonebookItems(authorEmail: string): Promise<PhonebookItem[]> {
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
    console.error('Error fetching phonebook:', error)
    return []
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

export async function deletePhonebookItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PHONEBOOK_COLLECTION, id))
  } catch (error) {
    console.error('Error deleting phonebook item:', error)
    throw error
  }
}
