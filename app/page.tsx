'use client'

import { useState, useEffect } from 'react'
import { BlogPost } from '@/lib/firebase'
import { getPosts } from '@/lib/firebase-posts'
import PostModal from '@/components/PostModal'
import WriteModal from '@/components/WriteModal'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  
  // 디버그용 로그
  useEffect(() => {
    console.log('🏠 HomePage: Current user state', user ? `Logged in as ${user.email}` : 'Not logged in')
  }, [user])

  const loadPosts = async () => {
    try {
      console.log('Loading posts from Firebase...')
      const fetchedPosts = await getPosts()
      console.log('Fetched posts:', fetchedPosts)
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
    const handleOpenWriteModal = () => {
      setIsWriteModalOpen(true)
    }
    
    window.addEventListener('openWriteModal', handleOpenWriteModal)
    
    return () => {
      window.removeEventListener('openWriteModal', handleOpenWriteModal)
    }
  }, [])
  

  return (
    <>
      <section className="mb-12">
        <div className="flex justify-end items-center mb-4">
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
        <h2 className="text-2xl font-bold mb-6">최신 포스트</h2>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            아직 작성된 포스트가 없습니다.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <article 
                key={post.id} 
                className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedPost(post)
                  setIsModalOpen(true)
                }}
              >
                <h3 className="text-xl font-semibold mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                  <time>{new Date(post.createdAt.toDate()).toLocaleDateString('ko-KR')}</time>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-indigo-600 dark:text-indigo-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
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
        onSuccess={() => {
          loadPosts() // 글 작성 후 목록 새로고침
        }}
      />
    </>
  )
}