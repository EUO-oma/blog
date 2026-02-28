import { initializeApp } from 'firebase/app'
import { getFirestore, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Firebase 초기화 확인용 로그 (개발 모드만)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔥 Firebase Config Status:', {
    apiKey: firebaseConfig.apiKey ? 'configured' : 'missing',
    authDomain: firebaseConfig.authDomain ? `configured: ${firebaseConfig.authDomain}` : 'missing',
    projectId: firebaseConfig.projectId ? `configured: ${firebaseConfig.projectId}` : 'missing',
    storageBucket: firebaseConfig.storageBucket ? 'configured' : 'missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'configured' : 'missing',
    appId: firebaseConfig.appId ? 'configured' : 'missing',
    environment: process.env.NODE_ENV
  })
}

// Firebase Auth 초기화 상태 확인
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key is missing! Authentication will not work.')
}

if (!firebaseConfig.authDomain) {
  console.error('❌ Firebase Auth Domain is missing! Google Sign-in will not work.')
}

// authDomain과 projectId 일치 확인
if (firebaseConfig.authDomain && firebaseConfig.projectId) {
  const expectedAuthDomain = `${firebaseConfig.projectId}.firebaseapp.com`
  if (firebaseConfig.authDomain !== expectedAuthDomain) {
    console.warn(`⚠️ Auth domain mismatch. Expected: ${expectedAuthDomain}, Got: ${firebaseConfig.authDomain}`)
  }
}

let app
let db: Firestore
let auth: Auth

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Firebase initialized successfully')
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  throw new Error('Failed to initialize Firebase. Please check your configuration.')
}

export { db, auth }

export interface BlogPost {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  summaryShort?: string
  summaryLong?: string
  summaryUpdatedAt?: Timestamp
  tags: string[]
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  published: boolean
}

export type ScheduleRepeatType = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Schedule {
  id?: string
  title: string
  description: string
  startDate: Timestamp
  endDate?: Timestamp
  location?: string
  color?: string
  // 반복 설정
  repeatType?: ScheduleRepeatType
  repeatInterval?: number // 기본 1
  repeatUntil?: Timestamp
  repeatWeekdays?: number[] // weekly일 때 사용 (0=일~6=토)
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// YouTube Video type
export interface YouTubeVideo {
  id?: string
  videoId: string
  title: string
  description: string
  thumbnail?: string
  duration?: string
  views?: string
  uploadDate?: string
  sortOrder?: number
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface MusicItem {
  id?: string
  videoId?: string
  sourceType?: 'youtube' | 'audio'
  audioUrl?: string
  objectKey?: string
  title: string
  note?: string
  sortOrder?: number
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FileItem {
  id?: string
  title: string
  fileUrl: string
  objectKey?: string
  contentType?: string
  size?: number
  department?: string
  season?: string
  keywords?: string
  driveSyncStatus?: 'idle' | 'pending' | 'success' | 'failed'
  driveFileId?: string
  driveFolderName?: string
  lastSyncedAt?: string
  lastError?: string
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export { Timestamp }