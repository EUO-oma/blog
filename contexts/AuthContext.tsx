'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 AuthContext: Setting up auth state listener')
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 AuthContext: Auth state changed', user ? `User: ${user.email}` : 'No user')
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('로그인 오류:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName })
    } catch (error) {
      console.error('회원가입 오류:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Google Sign-in: Starting authentication process')
      const provider = new GoogleAuthProvider()
      
      // 추가 스코프 설정 (선택사항)
      provider.addScope('profile')
      provider.addScope('email')
      
      // 로그인 프롬프트 강제 표시
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      console.log('🔐 Google Sign-in: Provider configured, attempting sign-in')
      const result = await signInWithPopup(auth, provider)
      console.log('🔐 Google Sign-in: Success', result.user.email)
    } catch (error: any) {
      console.error('🔐 Google Sign-in Error:', {
        code: error.code,
        message: error.message,
        fullError: error
      })
      
      // 특정 오류에 대한 더 자세한 메시지 제공
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase 인증 설정을 찾을 수 없습니다. Firebase Console에서 Google 로그인을 활성화했는지 확인해주세요.')
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        // 모바일/인앱브라우저에서는 popup이 불안정하므로 redirect로 폴백
        await signInWithRedirect(auth, provider)
        return
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('로그인이 취소되었습니다.')
      }
      
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('로그아웃 오류:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}