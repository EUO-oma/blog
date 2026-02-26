'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'

const menuItems = [
  { href: '/', icon: '🏠', label: '홈' },
  { href: '/schedule', icon: '📅', label: '일정' },
  { href: '/today', icon: '✅', label: '오늘' },
  { href: '/notice', icon: '📢', label: '공지' },
  { href: '/phonebook', icon: '📞', label: '폰북' },
  { href: '/favorites', icon: '⭐', label: '즐겨찾기' },
  { href: '/youtube', icon: '▶️', label: '유튜브' },
]

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true)
    }

    window.addEventListener('openLoginModal', handleOpenLoginModal)

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal)
    }
  }, [])

  const authButton = (
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
  )

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <nav className="container mx-auto px-4 py-2 md:py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="메뉴 열기"
                title="메뉴"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
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
              {authButton}
            </div>
          </div>
        </nav>
      </header>

      {/* Drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기 배경" />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">메뉴</h2>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="메뉴 닫기">
                ✕
              </button>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {user?.email?.toLowerCase() === 'icandoit13579@gmail.com' && (
                <Link
                  href="/walter-board"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span>🜂</span>
                  <span>Walter Board</span>
                </Link>
              )}
            </nav>
          </aside>
        </div>
      )}

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
