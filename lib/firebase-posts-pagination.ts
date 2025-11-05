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
    const q = query(
      postsRef,
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE)
    )
    
    const snapshot = await getDocs(q)
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
    
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    
    console.log(`📚 Loaded ${posts.length} initial posts`)
    
    return {
      posts,
      lastDoc,
      hasMore: snapshot.docs.length === POSTS_PER_PAGE
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
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(POSTS_PER_PAGE)
    )
    
    const snapshot = await getDocs(q)
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
    
    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    
    console.log(`📚 Loaded ${posts.length} more posts`)
    
    return {
      posts,
      lastDoc: newLastDoc,
      hasMore: snapshot.docs.length === POSTS_PER_PAGE
    }
  } catch (error) {
    console.error('Error fetching more posts:', error)
    return { posts: [], lastDoc: null, hasMore: false }
  }
}