import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export interface TodoItem {
  id?: string
  content: string
  completed: boolean
  starred: boolean
  authorEmail: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp | null
}

const COL = 'todos'
const AUTO_DELETE_HOURS = 48

export async function getTodos(authorEmail: string): Promise<TodoItem[]> {
  const q = query(collection(db, COL), where('authorEmail', '==', authorEmail))
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TodoItem[]

  const now = Date.now()
  const expireMs = AUTO_DELETE_HOURS * 60 * 60 * 1000

  const deletions: Promise<void>[] = []
  for (const item of rows) {
    const completedAt = item.completedAt?.toMillis?.() ?? 0
    if (item.id && item.completed && !item.starred && completedAt > 0 && now - completedAt > expireMs) {
      deletions.push(deleteTodo(item.id))
    }
  }
  if (deletions.length > 0) await Promise.allSettled(deletions)

  return rows
    .filter((item) => {
      const completedAt = item.completedAt?.toMillis?.() ?? 0
      return !(item.completed && !item.starred && completedAt > 0 && now - completedAt > expireMs)
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
    })
}

export async function createTodo(input: {
  content: string
  authorEmail: string
  authorName: string
}) {
  const now = Timestamp.now()
  const ref = await addDoc(collection(db, COL), {
    content: input.content,
    completed: false,
    starred: false,
    authorEmail: input.authorEmail,
    authorName: input.authorName,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  })
  return ref.id
}

export async function updateTodo(id: string, patch: Partial<TodoItem>) {
  await updateDoc(doc(db, COL, id), {
    ...patch,
    updatedAt: Timestamp.now(),
  })
}

export async function setTodoCompleted(id: string, completed: boolean) {
  await updateDoc(doc(db, COL, id), {
    completed,
    completedAt: completed ? Timestamp.now() : null,
    updatedAt: Timestamp.now(),
  })
}

export async function setTodoStarred(id: string, starred: boolean) {
  await updateDoc(doc(db, COL, id), {
    starred,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteTodo(id: string) {
  await deleteDoc(doc(db, COL, id))
}
