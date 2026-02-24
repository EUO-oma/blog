'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createPost, getPostBySlug } from '@/lib/firebase-posts'
import { useAuth } from '@/contexts/AuthContext'

interface WriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function WriteModal({ isOpen, onClose, onSuccess }: WriteModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [preview, setPreview] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    published: true
  })
  const [validationMsg, setValidationMsg] = useState('')
  const draftKey = 'walter_blog_write_draft_v1'

  useEffect(() => {
    if (!isOpen) return
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        setFormData((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData))
    } catch {}
  }, [formData, isOpen])

  const generatedSlug = useMemo(() => {
    return (formData.slug || formData.title)
      .toLowerCase()
      .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }, [formData.slug, formData.title])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      setSlugError('')
      setValidationMsg('')

      if (formData.content.trim().length < 20) {
        setValidationMsg('본문은 최소 20자 이상 입력해줘.')
        setLoading(false)
        return
      }

      const tagCount = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag).length
      if (tagCount > 8) {
        setValidationMsg('태그는 최대 8개까지 권장해.')
        setLoading(false)
        return
      }

      const slug = generatedSlug
      if (!slug) {
        setSlugError('slug를 만들 수 없어요. 제목을 확인해줘.')
        setLoading(false)
        return
      }

      const existed = await getPostBySlug(slug)
      if (existed) {
        setSlugError('이미 같은 slug가 있어. 제목/slug를 바꿔줘.')
        setLoading(false)
        return
      }

      const autoExcerpt = formData.content
        .replace(/[#>*`\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120)

      const postData: any = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt.trim() || autoExcerpt || '요약 없음',
        content: formData.content,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        authorEmail: user?.email || 'guest@example.com',
        authorName: user?.displayName || user?.email || 'Guest Writer',
        published: formData.published
      }

      await createPost(postData)
      alert('포스트가 성공적으로 작성되었습니다!')
      
      // 폼 초기화
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        tags: '',
        published: true
      })
      try { localStorage.removeItem(draftKey) } catch {}
      
      onSuccess() // 부모 컴포넌트에서 글 목록 새로고침
      onClose()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('포스트 작성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full my-8 p-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">새 포스트 작성</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="포스트 제목을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-1">
                슬러그(선택)
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="비워두면 제목으로 자동 생성"
              />
              <p className="text-xs text-gray-500 mt-1">생성 슬러그: {generatedSlug || '(없음)'}</p>
              {slugError ? <p className="text-xs text-red-500 mt-1">{slugError}</p> : null}
              {validationMsg ? <p className="text-xs text-red-500 mt-1">{validationMsg}</p> : null}
            </div>

            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium mb-1">
                요약 (선택)
              </label>
              <input
                type="text"
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="비워두면 본문 첫 문단으로 자동 생성"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="예: Next.js, React, Firebase"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="content" className="block text-sm font-medium">
                  내용 * (Markdown 지원)
                </label>
                <button
                  type="button"
                  onClick={() => setPreview((v) => !v)}
                  className="text-xs px-2 py-1 rounded border"
                >
                  {preview ? '편집' : '미리보기'}
                </button>
              </div>
              {preview ? (
                <div className="w-full min-h-[220px] px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 prose prose-sm max-w-none dark:prose-invert overflow-y-auto">
                  <ReactMarkdown>{formData.content || '_내용을 입력하면 여기에 표시돼요._'}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="content"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                  placeholder="마크다운 형식으로 포스트 내용을 작성하세요..."
                />
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="published" className="text-sm">
                즉시 게시
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '저장 중...' : '포스트 발행'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({ title: '', slug: '', excerpt: '', content: '', tags: '', published: true })
                  try { localStorage.removeItem(draftKey) } catch {}
                  setValidationMsg('임시저장을 비웠어.')
                }}
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                임시저장 비우기
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}