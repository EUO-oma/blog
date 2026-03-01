import {
  TodoItem,
  createTodo as baseCreateTodo,
  deleteTodo,
  getTodos as baseGetTodos,
  reorderTodos,
  setTodoCompleted,
  setTodoStarred,
  updateTodo,
} from './firebase-todos'

const BUCKET = 'clipboard'

export { deleteTodo, reorderTodos, setTodoCompleted, setTodoStarred, updateTodo }
export type { TodoItem }

export async function getTodos(authorEmail: string): Promise<TodoItem[]> {
  return baseGetTodos(authorEmail, BUCKET)
}

export async function createTodo(input: {
  content: string
  authorEmail: string
  authorName: string
}) {
  return baseCreateTodo(input, BUCKET)
}
