'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import GuestPlaceholder from '@/components/GuestPlaceholder'
import {
  createTodo,
  deleteTodo,
  getTodos,
  setTodoCompleted,
  setTodoStarred,
  TodoItem,
  updateTodo,
  reorderTodos,
} from '@/lib/firebase-todos'

export default function TodoPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [msg, setMsg] = useState('')
  const [adding, setAdding] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [completingIds, setCompletingIds] = useState<string[]>([])

  const load = async () => {
    if (!user?.email) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const rows = await getTodos(user.email)
      setItems(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const addTodo = async () => {
    if (adding) return
    if (!user?.email) return setMsg('로그인 후 사용 가능해요.')
    const content = newText.trim()
    if (!content) {
      setMsg('내용을 입력해줘.')
      return
    }

    setAdding(true)
    try {
      await createTodo({
        content,
        authorEmail: user.email,
        authorName: user.displayName || user.email,
      })
      setNewText('')
      setMsg('추가 완료')
      await load()
    } catch (e: any) {
      console.error('todo add failed:', e)
      setMsg(`등록 실패: ${e?.message || e}`)
    } finally {
      setAdding(false)
    }
  }

  const saveOnBlur = async (id: string | undefined, content: string) => {
    if (!id) return
    const next = content.trim()
    if (!next) {
      setItems((prev) => prev.filter((it) => it.id !== id))
      setMsg('비워진 항목은 숨김 처리됨 (완료 항목 자동정리)')
      return
    }
    await updateTodo(id, { content: next })
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, content: next } : it)))
  }

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setMsg('클립보드에 복사되었습니다')
    setTimeout(() => setMsg(''), 1200)
  }

  const longPressCopy = (text: string) => {
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(async () => {
      await copyText(text)
    }, 450)

    const clear = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      window.removeEventListener('touchend', clear)
      window.removeEventListener('touchcancel', clear)
    }

    window.addEventListener('touchend', clear, { once: true })
    window.addEventListener('touchcancel', clear, { once: true })
  }

  const activeItems = useMemo(() => items.filter((i) => !i.completed), [items])
  const completedItems = useMemo(() => items.filter((i) => i.completed), [items])

  const onDropReorder = async (targetId?: string) => {
    if (!draggingId || !targetId || draggingId === targetId) return

    const from = activeItems.findIndex((i) => i.id === draggingId)
    const to = activeItems.findIndex((i) => i.id === targetId)
    if (from < 0 || to < 0) return

    const nextActive = [...activeItems]
    const [moved] = nextActive.splice(from, 1)
    nextActive.splice(to, 0, moved)
    const next = [...nextActive, ...completedItems]

    setItems(next)
    setDraggingId(null)
    setOverId(null)

    try {
      await reorderTodos(nextActive)
      setMsg('순서 저장 완료')
    } catch {
      setMsg('순서 저장 실패, 새로고침 후 다시 시도해줘.')
      await load()
    }
  }

  if (!user) return <GuestPlaceholder title="Todo List는 로그인 후 사용 가능" desc="할 일은 개인 데이터라 로그인하면 내 Todo가 나타나요." emoji="☑️" />

  return (
    <main className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Todo List</h1>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
        <form
          className="flex items-center gap-2 min-h-[56px]"
          onSubmit={(e) => {
            e.preventDefault()
            addTodo()
          }}
        >
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onBlur={addTodo}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent as KeyboardEvent).isComposing) return
            }}
            placeholder="할 일 입력 후 Enter 또는 다른 영역 클릭"
            className="flex-1 px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <button
            type="submit"
            disabled={adding}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            title="등록하기"
            aria-label="등록하기"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4Z" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">입력 후 포커스가 벗어나면 자동 저장돼요.</p>
      </section>

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="Todo 불러오는 중..." /></div>
      ) : (
        <>
          <section className="space-y-2">
            <p className="text-xs text-gray-500">💡 항목을 드래그해서 순서를 바꿀 수 있어.</p>
            {activeItems.map((item) => (
              <article
                key={item.id}
                draggable
                onDragStart={() => setDraggingId(item.id || null)}
                onDragEnd={() => {
                  setDraggingId(null)
                  setOverId(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverId(item.id || null)
                }}
                onDrop={() => onDropReorder(item.id)}
                className={`rounded-lg border p-3 transition-all duration-300 bg-white dark:bg-gray-800 ${
                  completingIds.includes(item.id || '')
                    ? 'opacity-0 -translate-y-1 scale-[0.98]'
                    : draggingId === item.id
                    ? 'opacity-60 scale-[0.98] border-indigo-300 dark:border-indigo-700 shadow'
                    : overId === item.id
                    ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 min-h-[56px]">
                  <span className="text-gray-400 cursor-grab active:cursor-grabbing text-lg leading-none px-1 self-center" title="드래그해서 순서 변경">☰</span>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    className="w-5 h-5 self-center"
                    onChange={async (e) => {
                      const checked = e.target.checked
                      if (checked && item.id) {
                        setCompletingIds((prev) => [...prev, item.id!])
                        setTimeout(async () => {
                          await setTodoCompleted(item.id!, true)
                          setCompletingIds((prev) => prev.filter((id) => id !== item.id))
                          await load()
                        }, 220)
                        return
                      }
                      await setTodoCompleted(item.id!, checked)
                      await load()
                    }}
                  />
                  <textarea
                    defaultValue={item.content}
                    rows={2}
                    onBlur={(e) => saveOnBlur(item.id, e.target.value)}
                    onTouchStart={() => longPressCopy(item.content)}
                    className="flex-1 bg-transparent outline-none resize-none leading-5 self-center"
                  />
                  <button
                    onClick={() => copyText(item.content)}
                    title="복사"
                    className="p-1.5 rounded border self-center"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button
                    onClick={async () => {
                      await setTodoStarred(item.id!, !item.starred)
                      await load()
                    }}
                    title="중요"
                    className="p-1.5 rounded border self-center"
                  >
                    <svg className={`w-4 h-4 ${item.starred ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill={item.starred ? 'currentColor' : 'none'}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.5 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" />
                    </svg>
                  </button>
                  {/* 삭제 버튼 제거: 비움/완료 자동정리 흐름 사용 */}
                </div>
              </article>
            ))}
          </section>

          <section className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">완료 목록 (수동 삭제 가능)</h2>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <article key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40 opacity-80">
                  <div className="flex items-center gap-2 min-h-[56px]">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      className="w-5 h-5 self-center"
                      onChange={async (e) => {
                        await setTodoCompleted(item.id!, e.target.checked)
                        await load()
                      }}
                    />
                    <textarea
                      defaultValue={item.content}
                      rows={2}
                      onBlur={(e) => saveOnBlur(item.id, e.target.value)}
                      onTouchStart={() => longPressCopy(item.content)}
                      className="flex-1 bg-transparent outline-none resize-none line-through text-gray-500 leading-5"
                    />
                    {item.starred ? <span className="text-yellow-500">★</span> : null}
                    <button
                      onClick={async () => {
                        if (!item.id) return
                        await deleteTodo(item.id)
                        await load()
                      }}
                      title="삭제"
                      className="px-2 py-1 rounded border text-xs text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
              {completedItems.length === 0 ? <p className="text-xs text-gray-500">완료된 항목이 없어요.</p> : null}
              <p className="text-xs text-gray-500">완료 항목은 일정 시간이 지나면 자동 삭제돼요. (중요 표시된 항목은 유지)</p>
            </div>
          </section>
        </>
      )}

      {msg ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded">{msg}</div> : null}
    </main>
  )
}
