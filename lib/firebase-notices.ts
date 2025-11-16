import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

export interface Notice {
  id?: string
  title: string
  content: string
  date: Timestamp
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const NOTICES_COLLECTION = 'notices'

export async function getNotices(): Promise<Notice[]> {
  try {
    const q = query(
      collection(db, NOTICES_COLLECTION),
      orderBy('date', 'desc')
    )
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notice))
  } catch (error) {
    console.error('Error fetching notices:', error)
    return []
  }
}

export async function createNotice(data: Omit<Notice, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, NOTICES_COLLECTION), data)
    return docRef.id
  } catch (error) {
    console.error('Error creating notice:', error)
    throw error
  }
}

export async function updateNotice(id: string, data: Partial<Notice>): Promise<void> {
  try {
    const docRef = doc(db, NOTICES_COLLECTION, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating notice:', error)
    throw error
  }
}

export async function deleteNotice(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, NOTICES_COLLECTION, id))
  } catch (error) {
    console.error('Error deleting notice:', error)
    throw error
  }
}