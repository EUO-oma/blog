'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { BlogPost } from '@/lib/firebase'
import { getPost } from '@/lib/firebase-posts'

// 빌드 시 정적 경로 생성 (GitHub Pages용)
export async function generateStaticParams() {
  // 빌드 시점에는 Firebase 연결이 안되므로 빈 배열 반환
  // 실제 포스트는 클라이언트에서 동적으로 로드
  return []
}

export default function PostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      try {
        const fetchedPost = await getPost(slug)
        if (!fetchedPost) {
          notFound()
        }
        setPost(fetchedPost)
      } catch (error) {
        console.error('Error loading post:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!post) {
    return notFound()
  }

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <time>{new Date(post.createdAt.toDate()).toLocaleDateString('ko-KR')}</time>
          <span>•</span>
          <span>{post.authorName}</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tags/${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="prose dark:prose-invert prose-lg max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <Link
          href="/blog"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← 목록으로 돌아가기
        </Link>
      </footer>
    </article>
  )
}