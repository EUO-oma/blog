import { 
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore'
import { db, BlogPost } from './firebase'

const POSTS_COLLECTION = 'posts'
const POSTS_PER_PAGE = 4

export interface PostsPage {
  posts: BlogPost[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}

// 초기 페이지 로드 (처음 4개)
export async function getInitialPosts(): Promise<PostsPage> {
  try {
    console.log('📚 Loading initial posts...')
    
    const postsRef = collection(db, POSTS_COLLECTION)
    // 인덱스 없이 기본 쿼리 사용
    const snapshot = await getDocs(postsRef)
    
    const allPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
    
    // published가 true인 포스트만 필터링하고 날짜순 정렬
    const sortedPosts = allPosts
      .filter(post => post.published !== false)
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
    
    const posts = sortedPosts.slice(0, POSTS_PER_PAGE)
    
    console.log(`📚 Loaded ${posts.length} published posts from ${allPosts.length} total`)
    
    return {
      posts,
      lastDoc: null, // 임시로 페이지네이션 비활성화
      hasMore: false
    }
  } catch (error) {
    console.error('Error fetching initial posts:', error)
    return { posts: [], lastDoc: null, hasMore: false }
  }
}

// 다음 페이지 로드
export async function getMorePosts(lastDoc: DocumentSnapshot): Promise<PostsPage> {
  try {
    console.log('📚 Loading more posts...')
    
    const postsRef = collection(db, POSTS_COLLECTION)
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(POSTS_PER_PAGE * 2)
    )
    
    const snapshot = await getDocs(q)
    const allPosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
    
    // published가 true인 포스트만 필터링
    const posts = allPosts.filter(post => post.published !== false).slice(0, POSTS_PER_PAGE)
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    
    console.log(`📚 Loaded ${posts.length} more published posts from ${allPosts.length} total`)
    
    return {
      posts,
      lastDoc: newLastDoc,
      hasMore: posts.length === POSTS_PER_PAGE
    }
  } catch (error) {
    console.error('Error fetching more posts:', error)
    return { posts: [], lastDoc: null, hasMore: false }
  }
}