import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db, BlogPost } from './firebase'

const POSTS_COLLECTION = 'posts'
const POSTS_PER_PAGE = 6

export interface PaginatedResult {
  posts: BlogPost[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}

// 페이지네이션으로 포스트 가져오기
export async function getPostsPaginated(
  pageSize: number = POSTS_PER_PAGE,
  lastDoc: DocumentSnapshot | null = null,
  isAdmin: boolean = false
): Promise<PaginatedResult> {
  try {
    console.log('📄 Fetching paginated posts...')
    
    let q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // 다음 페이지 존재 여부 확인을 위해 1개 더 가져옴
    )

    // 관리자가 아니면 published만 보여줌
    if (!isAdmin) {
      q = query(
        collection(db, POSTS_COLLECTION),
        where('published', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1)
      )
    }

    // 이전 페이지가 있으면 그 다음부터 시작
    if (lastDoc) {
      if (!isAdmin) {
        q = query(
          collection(db, POSTS_COLLECTION),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize + 1)
        )
      } else {
        q = query(
          collection(db, POSTS_COLLECTION),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize + 1)
        )
      }
    }

    const snapshot = await getDocs(q)
    const docs = snapshot.docs
    
    // 실제 표시할 포스트
    const posts = docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
    
    // 다음 페이지 존재 여부
    const hasMore = docs.length > pageSize
    
    // 다음 페이지를 위한 마지막 문서
    const lastDocument = docs[Math.min(pageSize - 1, docs.length - 1)] || null
    
    console.log(`📄 Loaded ${posts.length} posts, hasMore: ${hasMore}`)
    
    return {
      posts,
      lastDoc: lastDocument,
      hasMore
    }
  } catch (error) {
    console.error('Error fetching paginated posts:', error)
    return {
      posts: [],
      lastDoc: null,
      hasMore: false
    }
  }
}

// 초기 포스트 로드 (SSR/SSG용)
export async function getInitialPosts(
  pageSize: number = POSTS_PER_PAGE,
  isAdmin: boolean = false
): Promise<BlogPost[]> {
  try {
    const result = await getPostsPaginated(pageSize, null, isAdmin)
    return result.posts
  } catch (error) {
    console.error('Error fetching initial posts:', error)
    return []
  }
}

// 무한 스크롤용 커서 기반 페이지네이션
export async function getMorePosts(
  cursor: DocumentSnapshot,
  pageSize: number = POSTS_PER_PAGE,
  isAdmin: boolean = false
): Promise<PaginatedResult> {
  return getPostsPaginated(pageSize, cursor, isAdmin)
}

// 태그별 포스트 페이지네이션
export async function getPostsByTagPaginated(
  tag: string,
  pageSize: number = POSTS_PER_PAGE,
  lastDoc: DocumentSnapshot | null = null
): Promise<PaginatedResult> {
  try {
    let q = query(
      collection(db, POSTS_COLLECTION),
      where('tags', 'array-contains', tag),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    )

    if (lastDoc) {
      q = query(
        collection(db, POSTS_COLLECTION),
        where('tags', 'array-contains', tag),
        where('published', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize + 1)
      )
    }

    const snapshot = await getDocs(q)
    const docs = snapshot.docs
    
    const posts = docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
    
    const hasMore = docs.length > pageSize
    const lastDocument = docs[Math.min(pageSize - 1, docs.length - 1)] || null
    
    return {
      posts,
      lastDoc: lastDocument,
      hasMore
    }
  } catch (error) {
    console.error('Error fetching posts by tag:', error)
    return {
      posts: [],
      lastDoc: null,
      hasMore: false
    }
  }
}

// 전체 포스트 개수 가져오기 (통계용)
export async function getTotalPostCount(isAdmin: boolean = false): Promise<number> {
  try {
    const q = isAdmin 
      ? query(collection(db, POSTS_COLLECTION))
      : query(collection(db, POSTS_COLLECTION), where('published', '==', true))
    
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('Error getting post count:', error)
    return 0
  }
}