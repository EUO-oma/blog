'use client'

import { useState, useEffect } from 'react'
import { BlogPost } from '@/lib/firebase'
import { getPosts } from '@/lib/firebase-posts'
import PostModal from '@/components/PostModal'
import WriteModal from '@/components/WriteModal'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 디버그용 로그
  useEffect(() => {
    console.log('🏠 HomePage: Current user state', user ? `Logged in as ${user.email}` : 'Not logged in')
  }, [user])

  useEffect(() => {
    const handleOpenWriteModal = () => {
      setIsWriteModalOpen(true)
    }
    
    window.addEventListener('openWriteModal', handleOpenWriteModal)
    
    return () => {
      window.removeEventListener('openWriteModal', handleOpenWriteModal)
    }
  }, [])
  
  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post)
    setIsModalOpen(true)
  }
  
  const handlePostUpdate = () => {
    // 포스트 목록 새로고침을 위해 key 변경
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold">Welcome to euo-oma</h1>
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
        <p className="text-lg text-gray-600 dark:text-gray-400">
          다크모드를 지원하는 모던한 블로그입니다.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">최신 포스트</h2>
        
        <InfiniteScrollPosts 
          key={refreshKey}
          onPostClick={handlePostClick} 
        />
      </section>

      <PostModal 
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPost(null)
        }}
        onUpdate={handlePostUpdate}
      />

      <WriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onSuccess={() => {
          handlePostUpdate() // 글 작성 후 목록 새로고침
        }}
      />
    </>
  )
}