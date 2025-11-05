import { initializeApp } from 'firebase/app'
import { getFirestore, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

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
  authDomain: firebaseConfig.authDomain ? 'configured' : 'missing',
  projectId: firebaseConfig.projectId ? 'configured' : 'missing',
  storageBucket: firebaseConfig.storageBucket ? 'configured' : 'missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'configured' : 'missing',
  appId: firebaseConfig.appId ? 'configured' : 'missing',
  environment: process.env.NODE_ENV
})

// Firebase Auth 초기화 상태 확인
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API Key is missing! Authentication will not work.')
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

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

export { Timestamp }