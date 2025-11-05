'use client'

import { BlogPost } from '@/lib/firebase'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { deletePost } from '@/lib/firebase-posts'
import EditModal from './EditModal'

interface PostModalProps {
  post: BlogPost | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export default function PostModal({ post, isOpen, onClose, onUpdate }: PostModalProps) {
  const { user } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  if (!isOpen || !post) return null
  
  const isAuthor = user && post.authorEmail === user.email
  
  // 디버깅용 로그
  console.log('📝 PostModal Debug:', {
    currentUserEmail: user?.email,
    postAuthorEmail: post.authorEmail,
    isAuthor: isAuthor
  })
  
  const handleDelete = async () => {
    if (!post.id || !window.confirm('정말로 이 포스트를 삭제하시겠습니까?')) return
    
    setIsDeleting(true)
    try {
      await deletePost(post.id)
      onClose()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('포스트 삭제 오류:', error)
      alert('포스트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

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
          <div className="flex justify-between items-start">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="수정하기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="삭제하기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

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
      
      {isEditModalOpen && (
        <EditModal
          post={post}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            if (onUpdate) onUpdate()
          }}
        />
      )}
    </div>
  )
}