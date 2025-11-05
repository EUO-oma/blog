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
    
    // 임시로 모든 게시글 가져오기 (published 필터 제거)
    const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'))
    
    const snapshot = await getDocs(q)
    console.log('Found', snapshot.size, 'posts in Firebase')
    
    const posts = snapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Post data:', { id: doc.id, title: data.title, published: data.published })
      return {
        id: doc.id,
        ...data
      } as BlogPost
    })
    
    return posts
  } catch (error) {
    console.error('Error fetching posts:', error)
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