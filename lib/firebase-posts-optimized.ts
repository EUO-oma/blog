import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore'
import { db, BlogPost } from './firebase'

const POSTS_COLLECTION = 'posts'

// 리스트용 간단한 타입
export interface BlogPostSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  published: boolean
}

// 포스트 목록 가져오기 (excerpt만 포함)
export async function getPostSummaries(isAdmin = false): Promise<BlogPostSummary[]> {
  try {
    const postsRef = collection(db, POSTS_COLLECTION)
    const snapshot = await getDocs(postsRef)
    
    const posts = snapshot.docs.map(doc => {
      const data = doc.data()
      // content 필드를 제외한 데이터만 반환
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        tags: data.tags,
        authorEmail: data.authorEmail,
        authorName: data.authorName,
        createdAt: data.createdAt,
        published: data.published
      } as BlogPostSummary
    })
    
    // 클라이언트 사이드에서 정렬
    posts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0
      const bTime = b.createdAt?.toMillis() || 0
      return bTime - aTime
    })
    
    return isAdmin ? posts : posts.filter(post => post.published)
  } catch (error) {
    console.error('Error fetching post summaries:', error)
    return []
  }
}

// 특정 포스트의 전체 데이터 가져오기
export async function getFullPost(postId: string): Promise<BlogPost | null> {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId)
    const postDoc = await getDoc(postRef)
    
    if (!postDoc.exists()) {
      return null
    }
    
    return {
      id: postDoc.id,
      ...postDoc.data()
    } as BlogPost
  } catch (error) {
    console.error('Error fetching full post:', error)
    return null
  }
}

// slug로 포스트 가져오기
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('slug', '==', slug),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as BlogPost
  } catch (error) {
    console.error('Error fetching post by slug:', error)
    return null
  }
}

// 기존 함수들은 그대로 유지
export async function createPost(data: Omit<BlogPost, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

export async function updatePost(id: string, data: Partial<BlogPost>): Promise<void> {
  try {
    const postRef = doc(db, POSTS_COLLECTION, id)
    await updateDoc(postRef, {
      ...data,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, POSTS_COLLECTION, id))
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

export async function getPostsByTag(tag: string): Promise<BlogPostSummary[]> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('tags', 'array-contains', tag),
      where('published', '==', true)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        tags: data.tags,
        authorEmail: data.authorEmail,
        authorName: data.authorName,
        createdAt: data.createdAt,
        published: data.published
      } as BlogPostSummary
    }).sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0
      const bTime = b.createdAt?.toMillis() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('Error fetching posts by tag:', error)
    return []
  }
}