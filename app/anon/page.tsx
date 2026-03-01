'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createAnonPost, deleteAnonPost, getAnonPosts, type AnonPost } from '@/lib/firebase-anon'

const OWNER_EMAIL = 'icandoit13579@gmail.com'

async function makeAuthorKey() {
  const cached = localStorage.getItem('anon_author_key')
  if (cached) return cached

  const base = `${navigator.userAgent}|${navigator.language}|${Intl.DateTimeFormat().resolvedOptions().timeZone}|${Math.random()}`
  const bytes = new TextEncoder().encode(base)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const key = `anon-${hex.slice(0, 10)}`
  localStorage.setItem('anon_author_key', key)
  return key
}

export default function AnonPage() {
  const { user } = useAuth()
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL

  const [rows, setRows] = useState<AnonPost[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [authorKey, setAuthorKey] = useState('')
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const vibePhrases = ['오늘의 속마음', '익명 TMI', '한줄 썰', '퇴근각?', '소소한 고백']

  const flash = (t: string) => {
    setMsg(t)
    setTimeout(() => setMsg(''), 1300)
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAnonPosts()
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-anon'
    void makeAuthorKey().then(setAuthorKey)
    void load()
  }, [])

  const onSubmit = async () => {
    const content = draft.trim()
    if (!content) return
    if (!authorKey) return flash('익명 키 준비 중이야. 다시 시도해줘')
    await createAnonPost({ content, authorKey })
    setDraft('')
    flash('등록 완료')
    await load()
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      await onSubmit()
    }
  }

  const emojiList = ['😀', '😅', '😂', '🥲', '😍', '😎', '🤔', '🙏', '👍', '🔥', '❤️', '🎉', '✅', '❗']

  const addEmoji = (emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`)
  }

  const addVibe = (text: string) => {
    setDraft((prev) => (prev ? `${prev}\n${text} ` : `${text} `))
  }

  const badgeColor = (key: string) => {
    const seed = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const palette = [
      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    ]
    return palette[seed % palette.length]
  }

  const myBadge = useMemo(() => (authorKey ? authorKey.replace('anon-', '익명-') : '익명-준비중'), [authorKey])

  return (
    <main className="max-w-3xl mx-auto space-y-3">
      <section className="rounded-2xl border border-fuchsia-200/80 dark:border-fuchsia-800/60 bg-gradient-to-r from-fuchsia-50 via-violet-50 to-indigo-50 dark:from-fuchsia-900/20 dark:via-violet-900/20 dark:to-indigo-900/20 p-4">
        <h1 className="text-2xl sm:text-3xl font-bold">익명게시판 ✨</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">엔터 전송 · Shift+Enter 줄바꿈 · 삭제는 관리자만 가능</p>
      </section>

      <section className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2">
        <p className="text-xs text-gray-500">내 익명키: {myBadge}</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="익명으로 남길 내용을 입력해줘"
          rows={4}
          className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmojiPanel((v) => !v)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 p-1"
              title="이모지"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <span className="text-xs text-gray-500">텔레그램처럼 전송 버튼으로 등록</span>
          </div>

          <button
            onClick={onSubmit}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition shadow-sm"
            title="전송"
            aria-label="전송"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.426 11.095 4.23 3.488a1 1 0 0 0-1.37 1.16l1.7 5.95a1 1 0 0 0 .74.7l7.13 1.54-7.13 1.54a1 1 0 0 0-.74.7l-1.7 5.95a1 1 0 0 0 1.37 1.16l17.196-7.607a1 1 0 0 0 0-1.828z" />
            </svg>
          </button>
        </div>

        {showEmojiPanel && (
          <div className="space-y-2 rounded border border-gray-200 dark:border-gray-700 p-2 bg-white/70 dark:bg-gray-900/40">
            <div className="flex flex-wrap gap-1">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  title={`이모지 ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {vibePhrases.map((v) => (
                <button
                  key={v}
                  onClick={() => addVibe(v)}
                  className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:opacity-80"
                >
                  #{v}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="불러오는 중..." /></div>
      ) : (
        <section className="space-y-0">
          {rows.map((r) => (
            <article key={r.id} className="py-3 border-b border-gray-200/80 dark:border-gray-700/80">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${badgeColor(String(r.authorKey || ''))}`}>
                  {String(r.authorKey || '').replace('anon-', '익명-')}
                </span>
                <span className="text-[11px] text-gray-400">익명 토크</span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-6">{r.content}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span />
                <div className="flex items-center gap-2">
                  <span>{(r.createdAt as any)?.toDate?.()?.toLocaleString?.('ko-KR') || ''}</span>
                  {isOwner && r.id ? (
                    <button onClick={() => deleteAnonPost(r.id!).then(load)} className="text-red-600 hover:text-red-800 p-1" title="삭제">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {rows.length === 0 && <p className="text-sm text-gray-500 py-3">아직 글이 없습니다.</p>}
        </section>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
