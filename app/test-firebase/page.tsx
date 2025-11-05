'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore'

export default function TestFirebase() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      console.log('테스트: Firebase에서 posts 컬렉션 가져오기 시작')
      const querySnapshot = await getDocs(collection(db, 'posts'))
      const postsData: any[] = []
      
      querySnapshot.forEach((doc) => {
        console.log('문서 ID:', doc.id, '데이터:', doc.data())
        postsData.push({ id: doc.id, ...doc.data() })
      })
      
      setPosts(postsData)
      setError('')
      console.log('총 게시글 수:', postsData.length)
    } catch (err: any) {
      console.error('Firebase 에러:', err)
      setError(err.message || 'Firebase 연결 실패')
    } finally {
      setLoading(false)
    }
  }

  async function addTestPost() {
    try {
      const testPost = {
        title: `테스트 포스트 ${new Date().toLocaleTimeString()}`,
        slug: `test-post-${Date.now()}`,
        excerpt: '이것은 테스트 포스트입니다.',
        content: '# 테스트 내용\n\n테스트 포스트의 본문입니다.',
        tags: ['테스트', 'Firebase'],
        authorEmail: 'test@example.com',
        authorName: '테스트 사용자',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        published: true
      }

      const docRef = await addDoc(collection(db, 'posts'), testPost)
      console.log('새 문서 추가됨, ID:', docRef.id)
      alert('테스트 포스트가 추가되었습니다!')
      loadPosts() // 목록 새로고침
    } catch (err: any) {
      console.error('포스트 추가 에러:', err)
      alert('포스트 추가 실패: ' + err.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Firebase 연결 테스트</h1>
      
      <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="mb-2">프로젝트 ID: euo-oma-blog</p>
        <p className="mb-2">컬렉션: posts</p>
        <p className="mb-4">상태: {loading ? '로딩 중...' : error ? `에러: ${error}` : '연결 성공'}</p>
        
        <button
          onClick={addTestPost}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          테스트 포스트 추가
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          Firebase에 저장된 게시글 ({posts.length}개)
        </h2>
        
        {loading && <p>로딩 중...</p>}
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">
            에러: {error}
          </div>
        )}
        
        {!loading && !error && posts.length === 0 && (
          <p className="text-gray-500">아직 게시글이 없습니다.</p>
        )}
        
        {posts.map((post) => (
          <div key={post.id} className="mb-4 p-4 border rounded-lg">
            <h3 className="text-xl font-bold">{post.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{post.excerpt}</p>
            <p className="text-sm text-gray-500 mt-2">
              ID: {post.id} | 
              Published: {post.published ? 'Yes' : 'No'} | 
              Created: {post.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}