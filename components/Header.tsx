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
        <nav className="container mx-auto px-4 py-2 md:py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm sm:text-base">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Home
              </Link>
              <Link href="/schedule" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                일정
              </Link>
              <Link href="/today" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                오늘
              </Link>
              <Link href="/notice" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                공지
              </Link>
              <Link href="/phonebook" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                폰북
              </Link>
              <Link href="/youtube" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="유튜브">
                ▶️
              </Link>
              {user?.email?.toLowerCase() === 'icandoit13579@gmail.com' && (
                <Link href="/walter-board" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Walter Board">
                  🜂
                </Link>
              )}

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

              <button
                onClick={() => {
                  if (user) logout()
                  else setShowLoginModal(true)
                }}
                className={`p-2 rounded-lg border transition-colors ${
                  user
                    ? 'text-green-600 border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                    : 'text-gray-500 border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={user ? '로그아웃' : '로그인'}
                title={user ? '로그인됨 (클릭 시 로그아웃)' : '로그아웃 상태 (클릭 시 로그인)'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v8m6.364-4.364a9 9 0 11-12.728 0"
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
