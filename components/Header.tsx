'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import AuthButton from './AuthButton'
// import { useSession } from 'next-auth/react'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  // const { data: session } = useSession()
  const session = null // 임시로 비활성화
  
  const handleWriteClick = () => {
    console.log('글쓰기 버튼 클릭됨')
    router.push('/blog/write')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/blog" className="text-2xl font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            euo-oma
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Home
            </Link>
            <Link href="/blog/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              About
            </Link>
            <Link href="/blog/tags" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Tags
            </Link>
            <button
              onClick={handleWriteClick}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium cursor-pointer relative z-10"
            >
              ✍️ 글쓰기
            </button>
            
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
            
            <AuthButton />
          </div>
        </div>
      </nav>
    </header>
  )
}