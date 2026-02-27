'use client'

import { useEffect, useMemo, useState } from 'react'
import { BlogPost } from '@/lib/firebase'
import { deletePost, getPosts, updatePost } from '@/lib/firebase-posts'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { useAuth } from '@/contexts/AuthContext'

export default function PostingPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState('')

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [published, setPublished] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)

  useEffect(() => {
    document.title = 'euo-post'
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await getPosts()
        setPosts(rows)
        if (rows[0]?.id) setSelectedId(rows[0].id)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [posts, query])

  const selected = useMemo(() => posts.find((p) => p.id === selectedId) || null, [posts, selectedId])
  const canEdit = !!selected && user?.email?.toLowerCase() === selected.authorEmail?.toLowerCase()

  useEffect(() => {
    if (!selected) return
    setTitle(selected.title || '')
    setExcerpt(selected.excerpt || '')
    setContent(selected.content || '')
    setTagsText((selected.tags || []).join(', '))
    setPublished(!!selected.published)
    setIsFeatured((selected.tags || []).map((t) => t.toLowerCase()).includes('featured'))
    setMsg('')
  }, [selected?.id])

  const save = async () => {
    if (!selected?.id || !canEdit) return
    setSaving(true)
    setMsg('')
    try {
      const baseTags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const tagsNoFeatured = baseTags.filter((t) => t.toLowerCase() !== 'featured')
      const tags = isFeatured ? ['featured', ...tagsNoFeatured] : tagsNoFeatured

      await updatePost(selected.id, {
        title: title.trim() || '제목 없음',
        excerpt: excerpt.trim(),
        content,
        tags,
        published,
      })

      setPosts((prev) =>
        prev.map((p) =>
          p.id === selected.id
            ? { ...p, title: title.trim() || '제목 없음', excerpt: excerpt.trim(), content, tags, published }
            : p
        )
      )
      setMsg('저장 완료')
    } catch (e) {
      console.error(e)
      setMsg('저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!selected?.id || !canEdit) return
    if (!window.confirm('이 포스트를 삭제할까요?')) return
    setDeleting(true)
    setMsg('')
    try {
      await deletePost(selected.id)
      const next = posts.filter((p) => p.id !== selected.id)
      setPosts(next)
      setSelectedId(next[0]?.id || null)
      setMsg('삭제 완료')
    } catch (e) {
      console.error(e)
      setMsg('삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoaderSwitcher label="포스팅 불러오는 중..." />
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">포스팅 관리</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목/요약/태그/본문 검색"
          className="w-72 px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <aside className="md:col-span-1 border rounded-xl p-3 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-[72vh] overflow-y-auto">
          <p className="text-xs text-gray-500 mb-2">총 {filtered.length}개</p>
          <div className="space-y-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id || null)}
                className={`w-full text-left rounded-lg border p-2 transition ${selectedId === p.id ? 'border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <p className="font-medium line-clamp-1">{(p.tags || []).some(t => t.toLowerCase() === 'featured') ? '⭐ ' : ''}{p.title}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{p.excerpt}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt.toDate()).toLocaleDateString('ko-KR')}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="md:col-span-2 border rounded-xl p-4 dark:border-gray-700 bg-white dark:bg-gray-900">
          {!selected ? (
            <p className="text-gray-500">선택된 포스트가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">작성자: {selected.authorName} ({selected.authorEmail})</p>
                <div className="flex items-center gap-3">
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} disabled={!canEdit} />
                    공개
                  </label>
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} disabled={!canEdit} />
                    대표글(메인 포스팅)
                  </label>
                </div>
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-800 dark:border-fuchsia-700"
                placeholder="제목"
              />

              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-800 dark:border-fuchsia-700"
                placeholder="요약"
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEdit}
                className="w-full min-h-[360px] px-3 py-2 rounded border border-fuchsia-300 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 dark:bg-gray-800 dark:border-fuchsia-700"
                placeholder="본문"
              />

              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
                placeholder="태그 (쉼표로 구분, featured는 위 체크박스로 관리)"
              />

              <div className="flex items-center justify-between">
                <p className={`text-sm ${msg.includes('실패') ? 'text-red-500' : 'text-gray-500'}`}>{msg}</p>
                <div className="flex gap-2">
                  <button
                    onClick={save}
                    disabled={!canEdit || saving}
                    className="px-4 py-2 rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50"
                  >
                    {saving ? '저장중...' : '저장'}
                  </button>
                  <button
                    onClick={remove}
                    disabled={!canEdit || deleting}
                    className="px-4 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? '삭제중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
