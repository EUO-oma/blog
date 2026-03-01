'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const OWNER = 'icandoit13579@gmail.com'

const DB_HINTS: Array<{ match: RegExp; text: string }> = [
  { match: /^\/todo(\/|$)/, text: 'DB: Firebase Firestore (todos)' },
  { match: /^\/schedule(\/|$)/, text: 'DB: Firebase Firestore (schedules, calendar_cache)' },
  { match: /^\/posting(\/|$)|^\/(\?|$)/, text: 'DB: Firebase Firestore (posts)' },
  { match: /^\/notice(\/|$)/, text: 'DB: Firebase Firestore (notices)' },
  { match: /^\/favorites(\/|$)/, text: 'DB: Firebase Firestore (favorites)' },
  { match: /^\/phonebook(\/|$)/, text: 'DB: Firebase Firestore (phonebook)' },
  { match: /^\/word(\/|$)/, text: 'DB: Firebase Firestore (words)' },
  { match: /^\/secret-word(\/|$)/, text: 'DB: Firebase Firestore (secret_words)' },
  { match: /^\/youtube(\/|$)/, text: 'DB: Firebase Firestore (youtube_videos)' },
  { match: /^\/music(\/|$)/, text: 'DB: Firebase Firestore (music)' },
  { match: /^\/img(\/|$)/, text: 'DB: Firebase Firestore (images) + Cloudflare R2' },
  { match: /^\/file(\/|$)/, text: 'DB: Firebase Firestore (files) + R2/Drive/GitHub link channels' },
  { match: /^\/community(\/|$)/, text: 'DB: Firebase Firestore (community_posts, user_approvals)' },
  { match: /^\/anon(\/|$)/, text: 'DB: Firebase Firestore (anon_posts)' },
  { match: /^\/people(\/|$)/, text: 'DB: Firebase Firestore (people)' },
  { match: /^\/walter-board(\/|$)/, text: 'DB: Supabase (walter_commands)' },
]

export default function DbUsageHint() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isOwner = user?.email?.toLowerCase() === OWNER

  const hint = useMemo(() => {
    const p = pathname || '/'
    const found = DB_HINTS.find((h) => h.match.test(p))
    return found?.text || 'DB: Firebase Firestore (기본)'
  }, [pathname])

  if (!isOwner) return null

  return (
    <div className="max-w-5xl mx-auto px-4 pb-2 text-[11px] text-gray-500">
      <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
        관리자 DB 힌트 · {hint}
      </div>
    </div>
  )
}
