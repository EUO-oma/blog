import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db, Schedule } from './firebase'

const SCHEDULES_COLLECTION = 'schedules'

// 일정 목록 가져오기
export async function getSchedules(): Promise<Schedule[]> {
  try {
    console.log('📅 Fetching schedules from Firebase...')
    
    const schedulesRef = collection(db, SCHEDULES_COLLECTION)
    const q = query(schedulesRef, orderBy('startDate', 'asc'))
    
    const snapshot = await getDocs(q)
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Schedule))
    
    console.log(`📅 Found ${schedules.length} schedules`)
    return schedules
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return []
  }
}

// 특정 날짜 범위의 일정 가져오기
export async function getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<Schedule[]> {
  try {
    const schedulesRef = collection(db, SCHEDULES_COLLECTION)
    const q = query(
      schedulesRef,
      where('startDate', '>=', Timestamp.fromDate(startDate)),
      where('startDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('startDate', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Schedule))
  } catch (error) {
    console.error('Error fetching schedules by date range:', error)
    return []
  }
}

// 일정 생성
export async function createSchedule(data: Omit<Schedule, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, SCHEDULES_COLLECTION), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    console.log('📅 Schedule created:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating schedule:', error)
    throw error
  }
}

// 일정 수정
export async function updateSchedule(id: string, data: Partial<Schedule>): Promise<void> {
  try {
    const scheduleRef = doc(db, SCHEDULES_COLLECTION, id)
    await updateDoc(scheduleRef, {
      ...data,
      updatedAt: Timestamp.now()
    })
    console.log('📅 Schedule updated:', id)
  } catch (error) {
    console.error('Error updating schedule:', error)
    throw error
  }
}

// 일정 삭제
export async function deleteSchedule(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SCHEDULES_COLLECTION, id))
    console.log('📅 Schedule deleted:', id)
  } catch (error) {
    console.error('Error deleting schedule:', error)
    throw error
  }
}