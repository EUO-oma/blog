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
    
    // Firebase 초기화 확인
    if (!db) {
      console.error('Firebase database not initialized')
      throw new Error('Database connection not ready')
    }
    
    const schedulesRef = collection(db, SCHEDULES_COLLECTION)
    const q = query(schedulesRef, orderBy('startDate', 'asc'))
    
    const snapshot = await getDocs(q)
    const schedules = snapshot.docs.map(doc => {
      const data = doc.data()
      // Timestamp 객체 검증
      if (data.startDate && !(data.startDate instanceof Timestamp)) {
        console.warn(`Invalid startDate for document ${doc.id}:`, data.startDate)
      }
      return {
        id: doc.id,
        ...data
      } as Schedule
    })
    
    console.log(`📅 Found ${schedules.length} schedules`)
    return schedules
  } catch (error: any) {
    console.error('Error fetching schedules:', error)
    console.error('Error details:', error.message, error.code)
    
    // Firebase 권한 오류 처리
    if (error.code === 'permission-denied') {
      throw new Error('일정을 불러올 권한이 없습니다.')
    }
    
    // 네트워크 오류 처리
    if (error.code === 'unavailable') {
      throw new Error('네트워크 연결을 확인해주세요.')
    }
    
    throw error
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
    console.log('📅 Creating schedule with data:', data)
    
    // 데이터 검증
    if (!data.title || !data.description) {
      throw new Error('제목과 설명은 필수입니다.')
    }
    
    // undefined 필드 제거
    const scheduleData: any = {
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    // 필수 필드 추가
    Object.keys(data).forEach(key => {
      const value = (data as any)[key]
      if (value !== undefined && value !== null) {
        scheduleData[key] = value
      }
    })
    
    console.log('📅 Final schedule data:', scheduleData)
    
    const docRef = await addDoc(collection(db, SCHEDULES_COLLECTION), scheduleData)
    console.log('📅 Schedule created successfully:', docRef.id)
    return docRef.id
  } catch (error: any) {
    console.error('❌ Error creating schedule:', error)
    console.error('Error details:', error.message)
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