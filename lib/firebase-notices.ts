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
  const toMillis = (value: any) => {
    if (!value) return 0
    if (typeof value?.toMillis === 'function') return value.toMillis()
    if (typeof value?.toDate === 'function') return value.toDate().getTime()
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  try {
    // "최근 게시글" 기준으로 createdAt 내림차순 정렬
    const q = query(collection(db, NOTICES_COLLECTION), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const notices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notice))

    return notices.sort((a, b) => {
      const aTime = toMillis((a as any).createdAt) || toMillis((a as any).date)
      const bTime = toMillis((b as any).createdAt) || toMillis((b as any).date)
      return bTime - aTime
    })
  } catch (error) {
    console.error('Error fetching notices (createdAt):', error)

    // 기존 데이터 호환: createdAt이 없는 문서가 있을 경우 date 기준으로 폴백
    try {
      const fallbackQ = query(collection(db, NOTICES_COLLECTION), orderBy('date', 'desc'))
      const fallbackSnapshot = await getDocs(fallbackQ)

      const notices = fallbackSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notice))

      return notices.sort((a, b) => {
        const aTime = toMillis((a as any).createdAt) || toMillis((a as any).date)
        const bTime = toMillis((b as any).createdAt) || toMillis((b as any).date)
        return bTime - aTime
      })
    } catch (fallbackError) {
      console.error('Error fetching notices (fallback):', fallbackError)
      return []
    }
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