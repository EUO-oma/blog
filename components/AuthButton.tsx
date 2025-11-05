'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <button className="px-4 py-2 text-sm font-medium text-gray-500">
        로딩중...
      </button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {session.user?.email}
        </span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Google 로그인
    </button>
  )
}