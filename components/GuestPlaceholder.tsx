'use client'

interface GuestPlaceholderProps {
  title?: string
  desc?: string
  emoji?: string
}

export default function GuestPlaceholder({
  title = '로그인이 필요해요',
  desc = '이 페이지는 개인 데이터 기반이라 로그인 후 내용이 표시돼요.',
  emoji = '✨',
}: GuestPlaceholderProps) {
  return (
    <section className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30 p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{desc}</p>
          <div className="text-xs text-gray-500 mb-3">💡 로그인하면 저장된 내 목록이 바로 동기화돼요.</div>
          <button
            onClick={() => {
              const event = new CustomEvent('openLoginModal')
              window.dispatchEvent(event)
            }}
            className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    </section>
  )
}
