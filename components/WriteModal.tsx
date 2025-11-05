'use client'

import { useState } from 'react'
import { createPost } from '@/lib/firebase-posts'

interface WriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function WriteModal({ isOpen, onClose, onSuccess }: WriteModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    published: true
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const slug = formData.slug || formData.title
        .toLowerCase()
        .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const postData: any = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt,
        content: formData.content,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        authorEmail: 'guest@example.com',
        authorName: 'Guest Writer',
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
      onClick={onClose}
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full my-8 p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
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
              <label htmlFor="excerpt" className="block text-sm font-medium mb-1">
                요약 *
              </label>
              <input
                type="text"
                id="excerpt"
                required
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="포스트 요약을 입력하세요"
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
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                내용 * (Markdown 지원)
              </label>
              <textarea
                id="content"
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                placeholder="마크다운 형식으로 포스트 내용을 작성하세요..."
              />
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