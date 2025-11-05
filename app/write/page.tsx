'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WritePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 로그인 체크 제거 - 나중에 추가 가능

    setIsSubmitting(true)

    try {
      // 슬러그 생성
      const slug = title
        .toLowerCase()
        .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const postData: any = {
        title,
        slug,
        excerpt,
        content,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        authorEmail: 'guest@example.com',
        authorName: 'Guest Writer',
        published: true
      }

      const { createPost } = await import('@/lib/firebase-posts')
      await createPost(postData)
      
      router.push(`/posts/${slug}`)
    } catch (error) {
      console.error('Error creating post:', error)
      alert('포스트 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">새 포스트 작성</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="포스트 제목을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
            요약
          </label>
          <input
            id="excerpt"
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="포스트 요약을 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            태그 (쉼표로 구분)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="예: Next.js, TypeScript, React"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            내용 (Markdown 지원)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={20}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="마크다운 형식으로 포스트 내용을 작성하세요..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '포스트 발행'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}