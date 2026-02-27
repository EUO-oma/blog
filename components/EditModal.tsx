'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { BlogPost } from '@/lib/firebase'
import { updatePost } from '@/lib/firebase-posts'

interface EditModalProps {
  post: BlogPost
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditModal({ post, isOpen, onClose, onSuccess }: EditModalProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [validationMsg, setValidationMsg] = useState('')
  const [formData, setFormData] = useState({
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags.join(', '),
    published: post.published,
    featured: post.tags.some((t) => t.toLowerCase() === 'featured')
  })

  useEffect(() => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags.join(', '),
      published: post.published,
      featured: post.tags.some((t) => t.toLowerCase() === 'featured')
    })
  }, [post])

  const autoExcerpt = useMemo(() => {
    return formData.content
      .replace(/[#>*`\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120)
  }, [formData.content])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post.id) return

    setLoading(true)
    setValidationMsg('')

    try {
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

      const rawTags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const tagsNoFeatured = rawTags.filter((t) => t.toLowerCase() !== 'featured')
      const mergedTags = formData.featured ? ['featured', ...tagsNoFeatured] : tagsNoFeatured

      const updateData: Partial<BlogPost> = {
        title: formData.title,
        excerpt: formData.excerpt.trim() || autoExcerpt || '요약 없음',
        content: formData.content,
        tags: mergedTags,
        published: formData.published
      }

      await updatePost(post.id, updateData)
      alert('포스트가 성공적으로 수정되었습니다!')

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating post:', error)
      alert('포스트 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] overflow-y-auto">
      <div className="min-h-screen px-2 md:px-6 flex items-center justify-center">
        <div className={`${isFullscreen ? 'fixed inset-2 z-[80]' : 'w-[98vw] md:w-[92vw] max-w-6xl my-4 md:my-6'} bg-white dark:bg-gray-900 rounded-lg p-4 md:p-8 max-h-[94vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">포스트 수정</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen((v) => !v)}
                className="text-xs px-2 py-1 rounded border"
              >
                {isFullscreen ? '일반크기' : '전체화면'}
              </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">제목 *</label>
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
              <label htmlFor="excerpt" className="block text-sm font-medium mb-1">요약 (선택)</label>
              <input
                type="text"
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="비워두면 본문에서 자동 생성"
              />
              <p className="text-xs text-gray-500 mt-1">자동 요약 미리보기: {autoExcerpt || '(없음)'}</p>
              {validationMsg ? <p className="text-xs text-red-500 mt-1">{validationMsg}</p> : null}
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">태그 (쉼표로 구분)</label>
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
                <label htmlFor="content" className="block text-sm font-medium">내용 * (Markdown 지원)</label>
                <button
                  type="button"
                  onClick={() => setPreview((v) => !v)}
                  className="text-xs px-2 py-1 rounded border"
                >
                  {preview ? '편집' : '미리보기'}
                </button>
              </div>
              {preview ? (
                <div className="w-full min-h-[260px] px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 prose prose-sm max-w-none dark:prose-invert overflow-y-auto">
                  <ReactMarkdown>{formData.content || '_내용을 입력하면 여기에 표시돼요._'}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="content"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={16}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                  placeholder="마크다운 형식으로 포스트 내용을 작성하세요..."
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="published" className="text-sm">게시 상태</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="featured" className="text-sm">대표글(메인 포스팅)</label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '수정 중...' : '수정 완료'}
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
