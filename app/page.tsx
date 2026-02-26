'use client'

import { useState, useEffect, useMemo } from 'react'
import { BlogPost } from '@/lib/firebase'
import { getPosts } from '@/lib/firebase-posts'
import PostModal from '@/components/PostModal'
import WriteModal from '@/components/WriteModal'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { useAuth } from '@/contexts/AuthContext'
import { getTodayCalendarCacheItems, type CalendarTodayCacheItem } from '@/lib/firebase-calendar-cache'

type DateFilter = 'all' | '7d' | '30d' | '365d'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [todayItems, setTodayItems] = useState<CalendarTodayCacheItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)
  const [todayMsg, setTodayMsg] = useState('')
  const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || ''
  const gasApiToken = process.env.NEXT_PUBLIC_GAS_SYNC_TOKEN || ''
  const canDeleteCalendar = user?.email?.toLowerCase() === 'icandoit13579@gmail.com'

  const loadPosts = async () => {
    try {
      const [fetchedPosts, fetchedToday] = await Promise.all([
        getPosts(),
        getTodayCalendarCacheItems().catch(() => []),
      ])
      setPosts(fetchedPosts)
      setTodayItems(fetchedToday)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    const handleOpenWriteModal = () => setIsWriteModalOpen(true)
    window.addEventListener('openWriteModal', handleOpenWriteModal)
    return () => window.removeEventListener('openWriteModal', handleOpenWriteModal)
  }, [])

  const copyPostToClipboard = async (post: BlogPost) => {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      const path = process.env.NODE_ENV === 'production' ? '/blog' : ''
      const link = `${base}${path}/${post.slug || ''}`
      const text = `${post.title}\n\n${post.excerpt || ''}\n\n${link}`
      await navigator.clipboard.writeText(text)
      setCopiedPostId(post.id || null)
      setTimeout(() => setCopiedPostId(null), 1500)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const deleteFromGoogleCalendar = async (eventId: string) => {
    if (!canDeleteCalendar) return
    if (!gasWebAppUrl || !gasApiToken) {
      setTodayMsg('GAS 연동 변수 누락')
      return
    }
    if (!confirm('캘린더 원본에서 삭제할까요?')) return

    const payload = JSON.stringify({ action: 'deleteEvent', eventId, token: gasApiToken })

    try {
      const res = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      const data = await res.json()
      if (!data?.ok) {
        setTodayMsg(`삭제 실패: ${data?.error || 'unknown'}`)
        return
      }
      setTodayMsg(data?.deleted === false ? '이미 삭제된 일정이야. 최신화했어.' : '캘린더 원본 삭제 완료')
      const refreshed = await getTodayCalendarCacheItems().catch(() => [])
      setTodayItems(refreshed)
    } catch {
      await fetch(gasWebAppUrl, { method: 'POST', mode: 'no-cors', body: payload })
      setTodayMsg('삭제 요청 전송됨. 잠시 후 최신화할게.')
      setTimeout(async () => {
        const refreshed = await getTodayCalendarCacheItems().catch(() => [])
        setTodayItems(refreshed)
      }, 1500)
    }
  }

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()

    return posts.filter((post) => {
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (dateFilter === 'all') return true
      const created = post.createdAt?.toDate?.()?.getTime?.() ?? 0
      if (!created) return false

      if (dateFilter === '7d') return now - created <= 7 * 24 * 60 * 60 * 1000
      if (dateFilter === '30d') return now - created <= 30 * 24 * 60 * 60 * 1000
      if (dateFilter === '365d') return now - created <= 365 * 24 * 60 * 60 * 1000
      return true
    })
  }, [posts, search, dateFilter])

  const pinnedPosts = filteredPosts.filter((p) => p.tags?.some((t) => ['pin', 'pinned', '고정'].includes(t.toLowerCase())))
  const normalPosts = filteredPosts.filter((p) => !p.tags?.some((t) => ['pin', 'pinned', '고정'].includes(t.toLowerCase())))

  return (
    <>
      <section className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900/40 dark:bg-indigo-900/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">오늘 일정</h2>
          <span className="text-xs text-indigo-700 dark:text-indigo-300">{todayItems.length}건</span>
        </div>
        {todayMsg ? <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2">{todayMsg}</p> : null}
        {todayItems.length === 0 ? (
          <p className="text-sm text-gray-500">동기화된 오늘 일정이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {todayItems.slice(0, 5).map((item) => {
              const time = item.allDay ? '종일' : (item.startAt?.slice(11, 16) || '-')
              return (
                <div key={item.id} className="flex items-center justify-between rounded border border-indigo-100 dark:border-indigo-900/40 bg-white/80 dark:bg-gray-900/30 px-2.5 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">{time}{item.location ? ` · ${item.location}` : ''}</p>
                  </div>
                  <div className="ml-2 shrink-0 flex gap-1">
                    <a
                      href={item.editUrl || `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(`${item.title} ${item.startAt || ''}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2 py-1 rounded border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      열기
                    </a>
                    {canDeleteCalendar ? (
                      <button
                        onClick={() => deleteFromGoogleCalendar(item.eventId)}
                        className="text-xs px-2 py-1 rounded border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900"
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목/요약/태그 검색"
              className="w-64 px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="all">전체 기간</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="365d">최근 1년</option>
            </select>
          </div>

          {user ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                ✍️ 새 글 작성
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <LoaderSwitcher label="포스트를 불러오는 중..." />
          </div>
        ) : filteredPosts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">조건에 맞는 포스트가 없습니다.</p>
        ) : (
          <div className="space-y-8">
            {pinnedPosts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">📌 고정글</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {pinnedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-yellow-200 dark:border-yellow-700"
                      onClick={() => {
                        setSelectedPost(post)
                        setIsModalOpen(true)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyPostToClipboard(post)
                          }}
                          className="text-xs px-2 py-1 rounded border bg-white/70 dark:bg-gray-800"
                        >
                          {copiedPostId === post.id ? '복사됨' : '복사'}
                        </button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
                      <time className="text-sm text-gray-500">{new Date(post.createdAt.toDate()).toLocaleDateString('ko-KR')}</time>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {normalPosts.map((post) => (
                <article
                  key={post.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPost(post)
                    setIsModalOpen(true)
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{post.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyPostToClipboard(post)
                      }}
                      className="text-xs px-2 py-1 rounded border bg-white dark:bg-gray-800"
                    >
                      {copiedPostId === post.id ? '복사됨' : '복사'}
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                    <time>{new Date(post.createdAt.toDate()).toLocaleDateString('ko-KR')}</time>
                    {post.tags.length > 0 && (
                      <div className="flex gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-indigo-600 dark:text-indigo-400">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPost(null)
        }}
        onUpdate={loadPosts}
      />

      <WriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSuccess={() => loadPosts()}
      />
    </>
  )
}
