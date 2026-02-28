'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import LoginModal from './LoginModal'

const menuItems = [
  { href: '/', label: '홈' },
  { href: '/posting', label: '포스팅' },
  { href: '/todo', label: 'Todo' },
  { href: '/schedule', label: '일정' },
  { href: '/today', label: '오늘' },
  { href: '/notice', label: '공지' },
  { href: '/phonebook', label: '폰북' },
  { href: '/favorites', label: '즐겨찾기' },
  { href: '/youtube', label: '유튜브' },
  { href: '/music', label: 'Music' },
  { href: '/word', label: 'Word' },
  { href: '/img', label: 'IMG' },
  { href: '/secret-word', label: 'Secret Word', ownerOnly: true },
]

function MenuIcon({ href }: { href: string }) {
  const cls = 'w-4 h-4'
  switch (href) {
    case '/':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /></svg>
    case '/posting':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    case '/todo':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 014 0m-5 7l2 2 4-4" /></svg>
    case '/schedule':
    case '/today':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    case '/notice':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.07A7 7 0 004 12v4l-1 2h18l-1-2v-4a7 7 0 00-7-6.93zM9 21h6" /></svg>
    case '/phonebook':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2h-1C9.82 19 5 14.18 5 8V7a2 2 0 01-2-2z" /></svg>
    case '/favorites':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.5 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" /></svg>
    case '/youtube':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12l-5 3V9l5 3zm6-3.5a3 3 0 00-2.1-2.1C17 6 12 6 12 6s-5 0-6.9.4A3 3 0 003 8.5 31 31 0 003 12a31 31 0 00.1 3.5A3 3 0 005.2 17.6C7 18 12 18 12 18s5 0 6.9-.4a3 3 0 002.1-2.1c.1-1.1.1-2.3.1-3.5s0-2.4-.1-3.5z" /></svg>
    case '/music':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13M9 19a2 2 0 11-4 0 2 2 0 014 0zm12-2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    case '/word':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 17A2.5 2.5 0 004 19.5V5a2 2 0 012-2h14v16H6.5z" /></svg>
    case '/img':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 3 3 5-6 4 7M4 6h16v12H4z" /></svg>
    case '/secret-word':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v9H5z"/></svg>
    default:
      return <span className="w-4 h-4" />
  }
}

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerLeft, setDrawerLeft] = useState(0)

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true)
    }

    window.addEventListener('openLoginModal', handleOpenLoginModal)

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal)
    }
  }, [])

  useEffect(() => {
    const updateDrawerLeft = () => {
      if (typeof window === 'undefined') return
      const vw = window.innerWidth
      if (vw < 768) {
        setDrawerLeft(0)
        return
      }

      const contentStart = Math.max(0, (vw - 1024) / 2 + 16) // max-w-5xl + container px-4
      setDrawerLeft(contentStart)
    }

    updateDrawerLeft()
    window.addEventListener('resize', updateDrawerLeft)
    return () => window.removeEventListener('resize', updateDrawerLeft)
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
            <div className="flex items-center gap-1 sm:gap-2">
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

              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-rose-600 dark:text-rose-400"
                aria-label="홈 바로가기"
                title="홈"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
                </svg>
              </Link>

              <Link
                href="/todo"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400"
                aria-label="Todo 바로가기"
                title="Todo"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 104 0M9 5a2 2 0 014 0m-5 7l2 2 4-4" />
                </svg>
              </Link>

              <Link
                href="/schedule"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-600 dark:text-purple-400"
                aria-label="일정 바로가기"
                title="일정"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>

              <Link
                href="/img"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sky-600 dark:text-sky-400"
                aria-label="이미지 바로가기"
                title="IMG"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 3 3 5-6 4 7M4 6h16v12H4z" />
                </svg>
              </Link>

              <Link
                href="/youtube"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                aria-label="유튜브 바로가기"
                title="유튜브"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12l-5 3V9l5 3zm6-3.5a3 3 0 00-2.1-2.1C17 6 12 6 12 6s-5 0-6.9.4A3 3 0 003 8.5 31 31 0 003 12a31 31 0 00.1 3.5A3 3 0 005.2 17.6C7 18 12 18 12 18s5 0 6.9-.4a3 3 0 002.1-2.1c.1-1.1.1-2.3.1-3.5s0-2.4-.1-3.5z" />
                </svg>
              </Link>

              <Link
                href="/music"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-emerald-600 dark:text-emerald-400"
                aria-label="뮤직 바로가기"
                title="뮤직"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13M9 19a2 2 0 11-4 0 2 2 0 014 0zm12-2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
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
          <aside
            className="absolute top-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 shadow-xl"
            style={{ left: drawerLeft }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">메뉴</h2>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="메뉴 닫기">
                ✕
              </button>
            </div>

            <nav className="space-y-1">
              {menuItems
                .filter((item) => !(item as any).ownerOnly || user?.email?.toLowerCase() === 'icandoit13579@gmail.com')
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="text-gray-600 dark:text-gray-300"><MenuIcon href={item.href} /></span>
                    <span>{item.label}</span>
                  </Link>
                ))}

              {user?.email?.toLowerCase() === 'icandoit13579@gmail.com' && (
                <Link
                  href="/walter-board"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.9 7.1 18.2 8 12.7 4 8.8 9.5 8z" />
                    </svg>
                  </span>
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
