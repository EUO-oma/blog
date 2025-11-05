'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: '서버 설정에 문제가 있습니다.',
    AccessDenied: '접근 권한이 없습니다.',
    Verification: '인증 링크가 만료되었거나 이미 사용되었습니다.',
    Default: '로그인 중 오류가 발생했습니다.',
  }

  const message = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
            로그인 오류
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        <Link
          href="/blog"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}