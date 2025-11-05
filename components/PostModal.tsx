'use client'

import { BlogPost } from '@/lib/firebase'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

interface PostModalProps {
  post: BlogPost | null
  isOpen: boolean
  onClose: () => void
}

export default function PostModal({ post, isOpen, onClose }: PostModalProps) {
  if (!isOpen || !post) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="min-h-screen px-4 flex items-center justify-center"
      >
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full my-8 p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <article>
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
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="prose dark:prose-invert prose-lg max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}