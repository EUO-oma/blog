import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db, YouTubeVideo } from './firebase'

const YOUTUBE_COLLECTION = 'youtube'

// YouTube 비디오 목록 가져오기
export async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
  try {
    console.log('📺 Fetching YouTube videos from Firebase...')
    
    const videosRef = collection(db, YOUTUBE_COLLECTION)
    const q = query(videosRef, orderBy('createdAt', 'desc'))
    
    const snapshot = await getDocs(q)
    const videos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as YouTubeVideo))
    
    console.log(`📺 Found ${videos.length} YouTube videos`)
    return videos
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    return []
  }
}

// YouTube 비디오 생성
export async function createYouTubeVideo(data: Omit<YouTubeVideo, 'id'>): Promise<string> {
  try {
    console.log('📺 Creating YouTube video with data:', data)
    
    // 데이터 검증
    if (!data.videoId || !data.title) {
      throw new Error('비디오 ID와 제목은 필수입니다.')
    }
    
    // YouTube 썸네일 URL 자동 생성
    if (!data.thumbnail) {
      data.thumbnail = `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`
    }
    
    const videoData = {
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    console.log('📺 Final video data:', videoData)
    
    const docRef = await addDoc(collection(db, YOUTUBE_COLLECTION), videoData)
    console.log('📺 YouTube video created successfully:', docRef.id)
    return docRef.id
  } catch (error: any) {
    console.error('❌ Error creating YouTube video:', error)
    console.error('Error details:', error.message)
    throw error
  }
}

// YouTube 비디오 수정
export async function updateYouTubeVideo(id: string, data: Partial<YouTubeVideo>): Promise<void> {
  try {
    const videoRef = doc(db, YOUTUBE_COLLECTION, id)
    
    // YouTube 썸네일 URL 업데이트
    if (data.videoId && !data.thumbnail) {
      data.thumbnail = `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`
    }
    
    await updateDoc(videoRef, {
      ...data,
      updatedAt: Timestamp.now()
    })
    console.log('📺 YouTube video updated:', id)
  } catch (error) {
    console.error('Error updating YouTube video:', error)
    throw error
  }
}

// YouTube 비디오 삭제
export async function deleteYouTubeVideo(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, YOUTUBE_COLLECTION, id))
    console.log('📺 YouTube video deleted:', id)
  } catch (error) {
    console.error('Error deleting YouTube video:', error)
    throw error
  }
}

// YouTube URL에서 비디오 ID 추출
export function extractVideoId(url: string): string | null {
  // 일반 YouTube URL
  const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/)
  if (match1) return match1[1]
  
  // 짧은 URL (youtu.be)
  const match2 = url.match(/youtu\.be\/([^&\n?#]+)/)
  if (match2) return match2[1]
  
  // 이미 비디오 ID인 경우
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  
  return null
}