'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { BlogPost } from '@/lib/firebase'
import { deletePost, getPost, getPosts, updatePost } from '@/lib/firebase-posts'
import EditModal from '@/components/EditModal'
import WriteModal from '@/components/WriteModal'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { useAuth } from '@/contexts/AuthContext'
import { getTodayCalendarCacheItems, type CalendarTodayCacheItem } from '@/lib/firebase-calendar-cache'
import { getFavoriteSites, type FavoriteSite } from '@/lib/firebase-favorites'

type DateFilter = 'all' | '7d' | '30d' | '365d'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [todayItems, setTodayItems] = useState<CalendarTodayCacheItem[]>([])
  const [favoriteSites, setFavoriteSites] = useState<FavoriteSite[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPost, setExpandedPost] = useState<BlogPost | null>(null)
  const [isInlineEditModalOpen, setIsInlineEditModalOpen] = useState(false)
  const [isDeletingExpanded, setIsDeletingExpanded] = useState(false)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)
  const [todayMsg, setTodayMsg] = useState('')
  const [copyToast, setCopyToast] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingExcerptPostId, setEditingExcerptPostId] = useState<string | null>(null)
  const [editingExcerpt, setEditingExcerpt] = useState('')
  const [editingContentPostId, setEditingContentPostId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || ''
  const gasApiToken = process.env.NEXT_PUBLIC_GAS_SYNC_TOKEN || ''
  const canDeleteCalendar = user?.email?.toLowerCase() === 'icandoit13579@gmail.com'
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressCopiedRef = useRef(false)

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
    const loadFavorites = async () => {
      if (!user?.email) {
        setFavoriteSites([])
        return
      }
      try {
        const rows = await getFavoriteSites(user.email)
        setFavoriteSites(rows)
      } catch (e) {
        console.error('Error loading favorites:', e)
      }
    }
    loadFavorites()
  }, [user?.email])

  useEffect(() => {
    if (loading || posts.length === 0 || typeof window === 'undefined') return
    const postId = new URLSearchParams(window.location.search).get('post')
    if (!postId) return
    const target = posts.find((p) => p.id === postId)
    if (target) {
      setExpandedPost(target)
    }
  }, [loading, posts])

  useEffect(() => {
    const handleOpenWriteModal = () => setIsWriteModalOpen(true)
    window.addEventListener('openWriteModal', handleOpenWriteModal)
    return () => window.removeEventListener('openWriteModal', handleOpenWriteModal)
  }, [])

  const copyPostToClipboard = async (post: BlogPost) => {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      const path = process.env.NODE_ENV === 'production' ? '/blog' : ''
      const link = `${base}${path}/?post=${encodeURIComponent(post.id || '')}`
      const text = `${post.title}\n\n${post.content || ''}\n\n${link}`
      await navigator.clipboard.writeText(text)
      setCopiedPostId(post.id || null)
      setCopyToast('클립보드에 복사되었습니다')
      setTimeout(() => setCopiedPostId(null), 1500)
      setTimeout(() => setCopyToast(''), 1200)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const copyTitleToClipboard = async (post: BlogPost) => {
    try {
      await navigator.clipboard.writeText(post.title || '')
      setCopiedPostId(post.id || null)
      setCopyToast('제목이 복사되었습니다')
      setTimeout(() => setCopiedPostId(null), 1500)
      setTimeout(() => setCopyToast(''), 1200)
    } catch (e) {
      console.error('Copy title failed', e)
    }
  }

  const copyContentToClipboard = async (post: BlogPost) => {
    try {
      await navigator.clipboard.writeText(post.content || '')
      setCopiedPostId(post.id || null)
      setCopyToast('본문을 클립보드에 복사했습니다')
      setTimeout(() => setCopiedPostId(null), 1500)
      setTimeout(() => setCopyToast(''), 1200)
    } catch (e) {
      console.error('Copy content failed', e)
    }
  }

  const startLongPressCopy = (kind: 'title' | 'content', post: BlogPost) => {
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return
    longPressCopiedRef.current = false
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(async () => {
      longPressCopiedRef.current = true
      if (kind === 'title') await copyTitleToClipboard(post)
      else await copyContentToClipboard(post)
    }, 450)
  }

  const endLongPressCopy = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
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
      // 삭제 직후 즉시 동기화 트리거
      await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncNow', token: gasApiToken }),
      }).catch(() => {})

      setTodayMsg(data?.deleted === false ? '캘린더 원본에서 이벤트를 찾지 못했어. 목록은 최신화했어.' : '캘린더 원본 삭제 완료')
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

  const isAuthor = (post: BlogPost) => user?.email?.toLowerCase() === post.authorEmail?.toLowerCase()

  const startInlineEdit = (post: BlogPost) => {
    if (!isAuthor(post)) return
    setEditingPostId(post.id || null)
    setEditingTitle(post.title || '')
  }

  const startInlineExcerptEdit = (post: BlogPost) => {
    if (!isAuthor(post)) return
    setEditingExcerptPostId(post.id || null)
    setEditingExcerpt(post.excerpt || '')
  }

  const startInlineContentEdit = (post: BlogPost) => {
    if (!isAuthor(post)) return
    setEditingContentPostId(post.id || null)
    setEditingContent(post.content || '')
  }

  const saveInlineTitle = async (post: BlogPost) => {
    if (!post.id) return
    const next = editingTitle.trim()
    if (!next || next === post.title) {
      setEditingPostId(null)
      return
    }
    try {
      await updatePost(post.id, { title: next })
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, title: next } : p)))
      if (expandedPost?.id === post.id) setExpandedPost((prev) => (prev ? { ...prev, title: next } : prev))
    } catch (e) {
      console.error('inline title update failed', e)
    } finally {
      setEditingPostId(null)
    }
  }

  const saveInlineExcerpt = async (post: BlogPost) => {
    if (!post.id) return
    const next = editingExcerpt.trim()
    if (!next || next === post.excerpt) {
      setEditingExcerptPostId(null)
      return
    }
    try {
      await updatePost(post.id, { excerpt: next })
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, excerpt: next } : p)))
      if (expandedPost?.id === post.id) setExpandedPost((prev) => (prev ? { ...prev, excerpt: next } : prev))
    } catch (e) {
      console.error('inline excerpt update failed', e)
    } finally {
      setEditingExcerptPostId(null)
    }
  }

  const saveInlineContent = async (post: BlogPost) => {
    if (!post.id) return
    const next = editingContent.trim()
    if (!next || next === post.content) {
      setEditingContentPostId(null)
      return
    }
    try {
      await updatePost(post.id, { content: next })
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, content: next } : p)))
      if (expandedPost?.id === post.id) setExpandedPost((prev) => (prev ? { ...prev, content: next } : prev))
    } catch (e) {
      console.error('inline content update failed', e)
    } finally {
      setEditingContentPostId(null)
    }
  }

  const refreshExpandedPost = async () => {
    if (!expandedPost?.id) return
    const latest = await getPost(expandedPost.id)
    if (latest) {
      setExpandedPost(latest)
      setPosts((prev) => prev.map((p) => (p.id === latest.id ? latest : p)))
    }
  }

  const deleteExpandedPost = async () => {
    if (!expandedPost?.id) return
    if (!window.confirm('이 포스트를 삭제할까요?')) return
    setIsDeletingExpanded(true)
    try {
      await deletePost(expandedPost.id)
      setPosts((prev) => prev.filter((p) => p.id !== expandedPost.id))
      setExpandedPost(null)
    } catch (e) {
      console.error('delete expanded post failed', e)
    } finally {
      setIsDeletingExpanded(false)
    }
  }

  const openPostEditor = async (post: BlogPost) => {
    if (expandedPost && expandedPost.id === post.id) {
      setExpandedPost(null)
      return
    }

    if (expandedPost?.id) {
      if (editingContentPostId === expandedPost.id) await saveInlineContent(expandedPost)
      if (editingExcerptPostId === expandedPost.id) await saveInlineExcerpt(expandedPost)
      if (editingPostId === expandedPost.id) await saveInlineTitle(expandedPost)
    }

    setExpandedPost(post)
  }

  const getContentPreview = (content: string, limit = 100) =>
    content
      .replace(/[#>*`\-\[\]()!]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, limit)

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

  const explicitFeatured = filteredPosts.filter((p) => p.tags?.some((t) => t.toLowerCase() === 'featured'))
  const featuredPosts = (explicitFeatured.length > 0 ? explicitFeatured : filteredPosts.slice(0, 1)).slice(0, 3)
  const featuredIdSet = new Set(featuredPosts.map((p) => p.id))
  const restPosts = filteredPosts.filter((p) => !featuredIdSet.has(p.id))
  const pinnedPosts = restPosts.filter((p) => p.tags?.some((t) => ['pin', 'pinned', '고정'].includes(t.toLowerCase())))
  const normalPosts = restPosts.filter((p) => !p.tags?.some((t) => ['pin', 'pinned', '고정'].includes(t.toLowerCase())))

  const renderExpandedInline = (post: BlogPost) => {
    if (expandedPost?.id !== post.id) return null
    return (
      <div className="md:col-span-2 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 bg-white dark:bg-gray-900 shadow-lg p-4 md:p-6 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-full">
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); copyTitleToClipboard(post) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="제목 복사">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
              </button>
              <h2
                className={`text-2xl font-bold ${isAuthor(post) ? 'cursor-text' : ''}`}
                onTouchStart={() => startLongPressCopy('title', post)}
                onTouchEnd={endLongPressCopy}
                onTouchCancel={endLongPressCopy}
                onClick={(e) => {
                  if (longPressCopiedRef.current) {
                    longPressCopiedRef.current = false
                    return
                  }
                  if (isAuthor(post)) {
                    e.stopPropagation()
                    startInlineEdit(post)
                  }
                }}
                title={isAuthor(post) ? '클릭해서 제목 수정 (모바일 길게 누르면 복사)' : '모바일 길게 누르면 복사'}
              >
                {post.title}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">{new Date(post.createdAt.toDate()).toLocaleString('ko-KR')} · {post.authorName}</p>
          </div>
          <div className="flex items-center gap-1">
            {user?.email?.toLowerCase() === post.authorEmail?.toLowerCase() && (
              <>
                <button onClick={() => setIsInlineEditModalOpen(true)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1" title="수정">✏️</button>
                <button onClick={deleteExpandedPost} disabled={isDeletingExpanded} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1" title="삭제">🗑️</button>
              </>
            )}
            {/* 닫기 버튼 제거: 다른 카드 선택/저장 흐름 사용 */}
          </div>
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">#{tag}</span>
            ))}
          </div>
        )}

        <div className="max-h-[52vh] overflow-y-auto pr-1">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={(e) => { e.stopPropagation(); copyContentToClipboard(post) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="본문 복사">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
            </button>
            <span className="text-xs text-gray-500">본문</span>
          </div>
          {editingContentPostId === post.id ? (
            <textarea
              autoFocus
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => saveInlineContent(post)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingContentPostId(null)
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  saveInlineContent(post)
                }
              }}
              className="w-full min-h-[220px] rounded border border-fuchsia-300 p-3 text-sm focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
            />
          ) : (
            <div
              className={`prose dark:prose-invert max-w-none ${isAuthor(post) ? 'cursor-text' : ''}`}
              onTouchStart={() => startLongPressCopy('content', post)}
              onTouchEnd={endLongPressCopy}
              onTouchCancel={endLongPressCopy}
              onClick={(e) => {
                if (longPressCopiedRef.current) {
                  longPressCopiedRef.current = false
                  return
                }
                if (isAuthor(post)) {
                  e.stopPropagation()
                  startInlineContentEdit(post)
                }
              }}
              title={isAuthor(post) ? '클릭해서 본문 수정 (Ctrl+Enter 저장, 모바일 길게 누르면 복사)' : '모바일 길게 누르면 복사'}
            >
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); copyPostToClipboard(post) }}
            className="text-xs px-2 py-1 rounded border bg-white/70 dark:bg-gray-800"
            title="제목+본문+링크 복사"
          >
            copy
          </button>
        </div>
      </div>
    )
  }

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

      

      {featuredPosts.length > 0 && !loading && (
        <section className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {featuredPosts.map((featuredPost) => (
              <div key={featuredPost.id} className={featuredPosts.length === 1 ? 'md:col-span-2' : ''}>
                {expandedPost?.id === featuredPost.id ? (
                  renderExpandedInline(featuredPost)
                ) : (
                  <article
                    className="relative p-6 md:p-8 bg-transparent cursor-pointer"
                    onClick={() => { void openPostEditor(featuredPost) }}
                  >
                    <span className="absolute top-0 left-0 w-12 h-12 border-t-[10px] border-l-[10px] border-gray-400/85" />
                    <span className="absolute bottom-0 right-0 w-12 h-12 border-b-[10px] border-r-[10px] border-gray-400/85" />

                    <div className="flex items-start gap-3">
                      {editingPostId === featuredPost.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => saveInlineTitle(featuredPost)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveInlineTitle(featuredPost)
                            }
                            if (e.key === 'Escape') setEditingPostId(null)
                          }}
                          className="text-2xl md:text-3xl font-bold mb-2 w-full px-2 py-1 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <button onClick={(e) => { e.stopPropagation(); copyTitleToClipboard(featuredPost) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="제목 복사">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
                          </button>
                          <h3
                            className={`text-2xl md:text-3xl font-bold ${isAuthor(featuredPost) ? 'cursor-text' : ''}`}
                            onTouchStart={() => startLongPressCopy('title', featuredPost)}
                            onTouchEnd={endLongPressCopy}
                            onTouchCancel={endLongPressCopy}
                            onClick={(e) => {
                              if (longPressCopiedRef.current) {
                                longPressCopiedRef.current = false
                                return
                              }
                              if (isAuthor(featuredPost)) {
                                e.stopPropagation()
                                startInlineEdit(featuredPost)
                              }
                            }}
                            title={isAuthor(featuredPost) ? '클릭해서 제목 수정 (모바일 길게 누르면 복사)' : '모바일 길게 누르면 복사'}
                          >
                            {featuredPost.title}
                          </h3>
                        </div>
                      )}
                    </div>

                    {editingExcerptPostId === featuredPost.id ? (
                      <input
                        autoFocus
                        value={editingExcerpt}
                        onChange={(e) => setEditingExcerpt(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveInlineExcerpt(featuredPost)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveInlineExcerpt(featuredPost)
                          }
                          if (e.key === 'Escape') setEditingExcerptPostId(null)
                        }}
                        className="text-gray-700 dark:text-gray-300 mb-2 text-base w-full px-2 py-1 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
                      />
                    ) : (
                      <p
                        className={`text-gray-700 dark:text-gray-300 mb-2 text-base ${isAuthor(featuredPost) ? 'cursor-text' : ''}`}
                        onClick={(e) => {
                          if (isAuthor(featuredPost)) {
                            e.stopPropagation()
                            startInlineExcerptEdit(featuredPost)
                          }
                        }}
                        title={isAuthor(featuredPost) ? '클릭해서 요약 수정' : ''}
                      >
                        {featuredPost.excerpt}
                      </p>
                    )}

                    <div className="flex items-start gap-2 mb-3">
                      <button onClick={(e) => { e.stopPropagation(); copyContentToClipboard(featuredPost) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 mt-0.5" title="본문 복사">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getContentPreview(featuredPost.content || '', 140)}</p>
                    </div>
                  </article>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
                    <div key={post.id} className="space-y-2 md:col-span-2">
                    {expandedPost?.id === post.id ? (
                      renderExpandedInline(post)
                    ) : (
                    <article
                      className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-yellow-200 dark:border-yellow-700"
                      onClick={() => {
                        void openPostEditor(post)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {editingPostId === post.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => saveInlineTitle(post)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                saveInlineTitle(post)
                              }
                              if (e.key === 'Escape') setEditingPostId(null)
                            }}
                            className="text-xl font-semibold mb-2 w-full px-2 py-1 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
                          />
                        ) : (
                          <div className="flex items-center gap-2 mb-2">
                            <button onClick={(e) => { e.stopPropagation(); copyTitleToClipboard(post) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="제목 복사">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
                            </button>
                            <h3
                              className="text-xl font-semibold"
                              onTouchStart={() => startLongPressCopy('title', post)}
                              onTouchEnd={endLongPressCopy}
                              onTouchCancel={endLongPressCopy}
                              onClick={(e) => {
                                if (longPressCopiedRef.current) {
                                  longPressCopiedRef.current = false
                                  return
                                }
                                if (user?.email?.toLowerCase() === post.authorEmail?.toLowerCase()) {
                                  e.stopPropagation()
                                  startInlineEdit(post)
                                }
                              }}
                              title={user?.email?.toLowerCase() === post.authorEmail?.toLowerCase() ? '클릭해서 제목 수정 (모바일 길게 누르면 복사)' : '모바일 길게 누르면 복사'}
                            >
                              {post.title}
                            </h3>
                          </div>
                        )}
                      </div>
                      {editingExcerptPostId === post.id ? (
                        <input
                          autoFocus
                          value={editingExcerpt}
                          onChange={(e) => setEditingExcerpt(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => saveInlineExcerpt(post)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveInlineExcerpt(post)
                            }
                            if (e.key === 'Escape') setEditingExcerptPostId(null)
                          }}
                          className="text-gray-600 dark:text-gray-300 mb-2 w-full px-2 py-1 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
                        />
                      ) : (
                        <p
                          className={`text-gray-600 dark:text-gray-300 mb-2 ${isAuthor(post) ? 'cursor-text' : ''}`}
                          onClick={(e) => {
                            if (isAuthor(post)) {
                              e.stopPropagation()
                              startInlineExcerptEdit(post)
                            }
                          }}
                          title={isAuthor(post) ? '클릭해서 요약 수정' : ''}
                        >
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-start gap-2 mb-4">
                        <button onClick={(e) => { e.stopPropagation(); copyContentToClipboard(post) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 mt-0.5" title="본문 복사">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
                        </button>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getContentPreview(post.content || '', 100)}</p>
                      </div>
                    </article>
                    )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {normalPosts.map((post) => (
                <div key={post.id} className={`space-y-2 ${expandedPost?.id === post.id ? 'md:col-span-2' : ''}`}>
                {expandedPost?.id === post.id ? (
                  renderExpandedInline(post)
                ) : (
                <article
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                        void openPostEditor(post)
                      }}
                >
                  <div className="flex items-start justify-between gap-3">
                    {editingPostId === post.id ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveInlineTitle(post)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveInlineTitle(post)
                          }
                          if (e.key === 'Escape') setEditingPostId(null)
                        }}
                        className="text-xl font-semibold mb-2 w-full px-2 py-1 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={(e) => { e.stopPropagation(); copyTitleToClipboard(post) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="제목 복사">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="4" width="8" height="4" rx="1"/><path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3"/></svg>
                        </button>
                        <h3
                          className="text-xl font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          onTouchStart={() => startLongPressCopy('title', post)}
                          onTouchEnd={endLongPressCopy}
                          onTouchCancel={endLongPressCopy}
                          onClick={(e) => {
                            if (longPressCopiedRef.current) {
                              longPressCopiedRef.current = false
                              return
                            }
                            if (user?.email?.toLowerCase() === post.authorEmail?.toLowerCase()) {
                              e.stopPropagation()
                              startInlineEdit(post)
                            }
                          }}
                          title={user?.email?.toLowerCase() === post.authorEmail?.toLowerCase() ? '클릭해서 제목 수정 (모바일 길게 누르면 복사)' : '모바일 길게 누르면 복사'}
                        >
                          {post.title}
                        </h3>
                      </div>
                    )}
                  </div>
                  {editingExcerptPostId === post.id ? (
                    <input
                      autoFocus
                      value={editingExcerpt}
                      onChange={(e) => setEditingExcerpt(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => saveInlineExcerpt(post)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          saveInlineExcerpt(post)
                        }
                        if (e.key === 'Escape') setEditingExcerptPostId(null)
                      }}
                      className="text-gray-600 dark:text-gray-400 mb-2 w-full px-2 py-1 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-900 dark:border-fuchsia-700"
                    />
                  ) : (
                    <p
                      className={`text-gray-600 dark:text-gray-400 mb-2 ${isAuthor(post) ? 'cursor-text' : ''}`}
                      onClick={(e) => {
                        if (isAuthor(post)) {
                          e.stopPropagation()
                          startInlineExcerptEdit(post)
                        }
                      }}
                      title={isAuthor(post) ? '클릭해서 요약 수정' : ''}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-start gap-2 mb-4">
                    <button onClick={(e) => { e.stopPropagation(); copyContentToClipboard(post) }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 mt-0.5" title="본문 복사">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="4" width="8" height="4" rx="1"/><path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3"/></svg>
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{getContentPreview(post.content || '', 100)}</p>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-500">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-indigo-600 dark:text-indigo-400">#{tag}</span>
                      ))}
                    </div>
                  )}
                </article>
                )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10 border-t border-gray-200 dark:border-gray-800 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⭐ 즐겨찾기</h3>
        {favoriteSites.length === 0 ? (
          <p className="text-xs text-gray-500">등록된 즐겨찾기가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2 text-sm">
            {favoriteSites.slice(0, 12).map((site) => (
              <a
                key={site.id}
                href={site.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-full border bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                title={site.url}
              >
                {site.title}
              </a>
            ))}
          </div>
        )}
      </section>

      {copyToast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-3 py-2 rounded-lg bg-black/80 text-white text-xs shadow-lg">
          {copyToast}
        </div>
      ) : null}

      {expandedPost && (
        <EditModal
          post={expandedPost}
          isOpen={isInlineEditModalOpen}
          onClose={() => setIsInlineEditModalOpen(false)}
          onSuccess={async () => {
            setIsInlineEditModalOpen(false)
            await refreshExpandedPost()
          }}
        />
      )}

      <WriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSuccess={() => loadPosts()}
      />
    </>
  )
}
