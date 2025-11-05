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

// Firebase 초기화 확인용 - 프로덕션에서도 한시적으로 로그 출력
console.log('🔥 Firebase Config Status:', {
  apiKey: firebaseConfig.apiKey ? 'configured' : 'missing',
  authDomain: firebaseConfig.authDomain ? `configured: ${firebaseConfig.authDomain}` : 'missing',
  projectId: firebaseConfig.projectId ? `configured: ${firebaseConfig.projectId}` : 'missing',
  storageBucket: firebaseConfig.storageBucket ? 'configured' : 'missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'configured' : 'missing',
  appId: firebaseConfig.appId ? 'configured' : 'missing',
  environment: process.env.NODE_ENV
})

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
  
  console.log('✅ Firebase initialized successfully')
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
  tags: string[]
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  published: boolean
}

export interface Schedule {
  id?: string
  title: string
  description: string
  startDate: Timestamp
  endDate?: Timestamp
  location?: string
  color?: string
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
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export { Timestamp }