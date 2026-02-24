'use client'

import { useState, useEffect, useMemo } from 'react'
import { BlogPost } from '@/lib/firebase'
import { getPosts } from '@/lib/firebase-posts'
import PostModal from '@/components/PostModal'
import WriteModal from '@/components/WriteModal'
import WalterLineLoader from '@/components/WalterLineLoader'
import { useAuth } from '@/contexts/AuthContext'

type DateFilter = 'all' | '7d' | '30d' | '365d'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPosts()
      setPosts(fetchedPosts)
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

          <div className="flex gap-3">
            {user ? (
              <button
                onClick={() => setIsWriteModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                ✍️ 새 글 작성
              </button>
            ) : (
              <button
                onClick={() => {
                  const event = new CustomEvent('openLoginModal')
                  window.dispatchEvent(event)
                }}
                className="bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                🔐 로그인
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <WalterLineLoader label="포스트를 불러오는 중..." />
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
