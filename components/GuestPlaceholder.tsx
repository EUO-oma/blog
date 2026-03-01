'use client'

interface GuestPlaceholderProps {
  title?: string
  desc?: string
  emoji?: string
  hint?: string
  buttonLabel?: string
}

export default function GuestPlaceholder({
  title = 'Login required',
  desc = 'Sign in to continue.',
  emoji = '✨',
  hint = 'Synced after login.',
  buttonLabel = 'Login',
}: GuestPlaceholderProps) {
  return (
    <section className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30 p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{emoji}</div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{desc}</p>
          <div className="text-xs text-gray-500 mb-3">{hint}</div>
          <button
            onClick={() => {
              const event = new CustomEvent('openLoginModal')
              window.dispatchEvent(event)
            }}
            className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  )
}
