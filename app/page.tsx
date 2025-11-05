'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BlogPost } from '@/lib/firebase'
import { getPosts } from '@/lib/firebase-posts'
import PostModal from '@/components/PostModal'

export default function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadPosts() {
      try {
        // console.log('Loading posts from Firebase...')
        const fetchedPosts = await getPosts()
        // console.log('Fetched posts:', fetchedPosts)
        setPosts(fetchedPosts)
      } catch (error) {
        console.error('Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <>
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to euo-oma</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          다크모드를 지원하는 모던한 블로그입니다.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">최신 포스트</h2>
        
        {posts.length === 0 ? (
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
                        <Link
                          key={tag}
                          href={`/blog/tags?tag=${encodeURIComponent(tag)}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          #{tag}
                        </Link>
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
      />
    </>
  )
}