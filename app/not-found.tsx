import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">페이지를 찾을 수 없습니다</p>
      <Link
        href="/blog"
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}