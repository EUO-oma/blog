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

export async function getPosts(isAdmin = false): Promise<BlogPost[]> {
  try {
    console.log('Fetching posts from Firebase collection:', POSTS_COLLECTION)
    
    // 인덱스 문제를 피하기 위해 orderBy 제거
    const postsRef = collection(db, POSTS_COLLECTION)
    
    const snapshot = await getDocs(postsRef)
    console.log('Found', snapshot.size, 'posts in Firebase')
    
    const posts = snapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Post data:', { id: doc.id, title: data.title, published: data.published })
      return {
        id: doc.id,
        ...data
      } as BlogPost
    })
    
    // 클라이언트 사이드에서 정렬
    posts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0
      const bTime = b.createdAt?.toMillis() || 0
      return bTime - aTime
    })
    
    return posts
  } catch (error) {
    console.error('Error fetching posts - Full error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return []
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
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
    console.error('Error fetching post:', error)
    return null
  }
}

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

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('tags', 'array-contains', tag),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
  } catch (error) {
    console.error('Error fetching posts by tag:', error)
    return []
  }
}