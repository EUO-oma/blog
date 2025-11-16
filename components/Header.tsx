'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  const handleWriteClick = () => {
    const event = new CustomEvent('openWriteModal')
    window.dispatchEvent(event)
  }

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true)
    }
    
    window.addEventListener('openLoginModal', handleOpenLoginModal)
    
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal)
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Home
            </Link>
            <Link href="/schedule" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              일정
            </Link>
            <Link href="/notice" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              공지사항
            </Link>
            <Link href="/youtube" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              YouTube
            </Link>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-sm bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </nav>
      </header>
    
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  )
}