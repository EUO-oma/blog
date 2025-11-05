'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { BlogPost } from '@/lib/firebase'
import { getInitialPosts, getMorePosts, PostsPage } from '@/lib/firebase-posts-pagination'
import { DocumentSnapshot } from 'firebase/firestore'

interface InfiniteScrollPostsProps {
  onPostClick: (post: BlogPost) => void
}

export default function InfiniteScrollPosts({ onPostClick }: InfiniteScrollPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  
  // 스크롤 감지를 위한 ref
  const observerTarget = useRef<HTMLDivElement>(null)
  
  // 초기 로드
  useEffect(() => {
    loadInitialPosts()
  }, [])
  
  const loadInitialPosts = async () => {
    setLoading(true)
    try {
      const result = await getInitialPosts()
      setPosts(result.posts)
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading initial posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return
    
    setLoadingMore(true)
    try {
      const result = await getMorePosts(lastDoc)
      setPosts(prev => [...prev, ...result.posts])
      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [lastDoc, hasMore, loadingMore])
  
  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [loadMore, hasMore, loadingMore])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }
  
  if (posts.length === 0) {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        아직 작성된 포스트가 없습니다.
      </p>
    )
  }
  
  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <article 
            key={post.id} 
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onPostClick(post)}
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
                      onClick={(e) => e.stopPropagation()}
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
      
      {/* 스크롤 감지 타겟 */}
      {hasMore && (
        <div 
          ref={observerTarget} 
          className="h-20 flex items-center justify-center"
        >
          {loadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          )}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-500 mt-8">
          모든 포스트를 불러왔습니다.
        </p>
      )}
    </>
  )
}