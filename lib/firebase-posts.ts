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
import { buildPostSummaries } from './summarize'

const POSTS_COLLECTION = 'posts'

export async function getPosts(isAdmin = false): Promise<BlogPost[]> {
  try {
    const postsRef = collection(db, POSTS_COLLECTION)
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(50))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost))
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function getPost(id: string): Promise<BlogPost | null> {
  try {
    const postRef = doc(db, POSTS_COLLECTION, id)
    const postSnap = await getDoc(postRef)
    
    if (!postSnap.exists()) {
      console.log('No such document!')
      return null
    }
    
    return {
      id: postSnap.id,
      ...postSnap.data()
    } as BlogPost
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

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

export async function createPost(data: Omit<BlogPost, 'id'>): Promise<string> {
  try {
    const now = Timestamp.now()
    const summaries = buildPostSummaries(data.content || '')
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...data,
      ...summaries,
      summaryUpdatedAt: now,
      createdAt: now,
      updatedAt: now
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
    const now = Timestamp.now()
    const summaryPatch = data.content ? { ...buildPostSummaries(data.content), summaryUpdatedAt: now } : {}
    await updateDoc(postRef, {
      ...data,
      ...summaryPatch,
      updatedAt: now
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