'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

const OWNER_EMAIL = 'icandoit13579@gmail.com'

function SortableTodoRow({
  item,
  children,
  completing,
  isPressing,
  staleLevel,
}: {
  item: TodoItem
  children: (bind: { attributes: any; listeners: any; setActivatorNodeRef: (el: HTMLElement | null) => void; isDragging: boolean }) => ReactNode
  completing: boolean
  isPressing: boolean
  staleLevel: 0 | 2 | 3
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id || '',
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`p-1 border-b transition-all duration-100 ${
        completing
          ? 'opacity-0 -translate-y-1 scale-[0.98] border-gray-200/70 dark:border-gray-700/60 bg-transparent'
          : isDragging
          ? 'opacity-80 scale-[0.97] border-indigo-300 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-900/10'
          : isPressing
          ? 'scale-[0.98] border-indigo-200 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10'
          : staleLevel === 3
          ? 'border-red-300/80 dark:border-red-600/70 bg-red-50/50 dark:bg-red-900/20'
          : staleLevel === 2
          ? 'border-amber-300/80 dark:border-amber-600/70 bg-amber-50/50 dark:bg-amber-900/20'
          : 'border-gray-200/70 dark:border-gray-700/60 bg-transparent'
      }`}
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </article>
  )
}

export default function TodoPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [msg, setMsg] = useState('')
  const [adding, setAdding] = useState(false)
  const [completingIds, setCompletingIds] = useState<string[]>([])
  const [pressingId, setPressingId] = useState<string | null>(null)
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [isSlideVisible, setIsSlideVisible] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [slideMs, setSlideMs] = useState(2800)
  const [sortMode, setSortMode] = useState<'latest' | 'oldest' | 'alpha' | 'starred'>('latest')
  const [isTodoOnlyHost, setIsTodoOnlyHost] = useState(false)
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapTrackerRef = useRef<Record<string, { count: number; timer: ReturnType<typeof setTimeout> | null }>>({})

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

  const flashMsg = (text: string, ms = 1600) => {
    setMsg(text)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMsg(''), ms)
  }

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
      Object.values(tapTrackerRef.current).forEach((v) => {
        if (v?.timer) clearTimeout(v.timer)
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('todo_sort_mode')
    if (saved === 'latest' || saved === 'oldest' || saved === 'alpha' || saved === 'starred') {
      setSortMode(saved)
    }
    const host = window.location.host || ''
    setIsTodoOnlyHost(host.includes('todolist-page.web.app') || host.includes('todolist-page.firebaseapp.com'))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('todo_sort_mode', sortMode)
  }, [sortMode])

  const addTodo = async () => {
    if (adding) return
    if (!user?.email) return flashMsg('로그인 후 사용 가능해요.')
    const content = newText.trim()
    if (!content) {
      flashMsg('내용을 입력해줘.')
      return
    }

    setAdding(true)
    try {
      const id = await createTodo({
        content,
        authorEmail: user.email,
        authorName: user.displayName || user.email,
      })

      const now = new Date()
      const tsLike = {
        toMillis: () => now.getTime(),
        toDate: () => now,
      } as any

      const newItem: TodoItem = {
        id,
        content,
        completed: false,
        starred: false,
        authorEmail: user.email,
        authorName: user.displayName || user.email,
        createdAt: tsLike,
        updatedAt: tsLike,
        completedAt: null,
        sortOrder: -1,
      }

      // 새 항목은 즉시 입력폼 아래(활성 목록 맨 위)에 끼워 넣기
      setItems((prev) => [newItem, ...prev])
      setNewText('')
      flashMsg('추가 완료')
    } catch (e: any) {
      console.error('todo add failed:', e)
      flashMsg(`등록 실패: ${e?.message || e}`, 2400)
    } finally {
      setAdding(false)
    }
  }

  const saveOnBlur = async (id: string | undefined, content: string) => {
    if (!id) return
    const next = content.trim()
    if (!next) {
      setItems((prev) => prev.filter((it) => it.id !== id))
      flashMsg('비워진 항목은 숨김 처리됨 (완료 항목 자동정리)')
      return
    }
    await updateTodo(id, { content: next })
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, content: next } : it)))
  }

  const deleteAllCompleted = async () => {
    const targets = completedItems.filter((i) => i.id && !i.starred)
    if (targets.length === 0) {
      flashMsg('삭제할 완료 항목이 없어. (중요 별표 항목은 유지됨)')
      return
    }
    if (!confirm(`완료 항목 ${targets.length}개(별표 제외)를 삭제할까요?`)) return

    try {
      await Promise.all(targets.map((i) => deleteTodo(i.id!)))
      setItems((prev) => prev.filter((i) => !(i.completed && !i.starred)))
      flashMsg('완료 목록에서 별표 제외 항목을 모두 삭제했어.')
    } catch (e: any) {
      flashMsg(`일괄 삭제 실패: ${e?.message || e}`, 2400)
    }
  }

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    flashMsg('클립보드에 복사되었습니다', 1200)
  }

  const autoResizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleTapGesture = (item: TodoItem) => {
    const id = item.id || ''
    if (!id) return
    const windowMs = 420
    const current = tapTrackerRef.current[id] || { count: 0, timer: null }

    current.count += 1
    if (current.timer) clearTimeout(current.timer)

    current.timer = setTimeout(async () => {
      const finalCount = current.count
      tapTrackerRef.current[id] = { count: 0, timer: null }

      if (finalCount >= 3) {
        try {
          await setTodoStarred(id, !item.starred)
          setItems((prev) => prev.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x)))
          flashMsg(item.starred ? '중요 해제(탭x3)' : '중요 표시(탭x3)')
        } catch {
          flashMsg('중요 표시 변경 실패', 1800)
        }
        return
      }

      if (finalCount === 2) {
        await copyText(item.content)
      }
    }, windowMs)

    tapTrackerRef.current[id] = current
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

  const getCreatedMs = (item: TodoItem) => {
    const createdAt = item.createdAt as any
    return createdAt?.toMillis?.() ?? createdAt?.toDate?.()?.getTime?.() ?? 0
  }

  const activeItems = useMemo(() => items.filter((i) => !i.completed), [items])
  const completedItems = useMemo(() => items.filter((i) => i.completed), [items])

  const sortedActiveItems = useMemo(() => {
    const arr = [...activeItems]
    if (sortMode === 'latest') return arr.sort((a, b) => getCreatedMs(b) - getCreatedMs(a))
    if (sortMode === 'oldest') return arr.sort((a, b) => getCreatedMs(a) - getCreatedMs(b))
    if (sortMode === 'alpha') return arr.sort((a, b) => (a.content || '').localeCompare(b.content || '', 'ko'))
    return arr.sort((a, b) => {
      const sa = a.starred ? 1 : 0
      const sb = b.starred ? 1 : 0
      if (sa !== sb) return sb - sa
      return getCreatedMs(b) - getCreatedMs(a)
    })
  }, [activeItems, sortMode])

  const getStaleLevel = (item: TodoItem): 0 | 2 | 3 => {
    const createdMs = getCreatedMs(item)
    if (!createdMs) return 0
    const ageDays = (Date.now() - createdMs) / (24 * 60 * 60 * 1000)
    if (ageDays >= 3) return 3
    if (ageDays >= 2) return 2
    return 0
  }
  const slideshowItems = useMemo(() => (activeItems.length > 0 ? activeItems : completedItems), [activeItems, completedItems])

  useEffect(() => {
    if (slideIndex >= slideshowItems.length) setSlideIndex(0)
  }, [slideIndex, slideshowItems.length])

  useEffect(() => {
    if (!isSlideshowOpen || isPaused || slideshowItems.length <= 1) return
    const t = setInterval(() => {
      setIsSlideVisible(false)
      setTimeout(() => {
        setSlideIndex((prev) => (prev + 1) % slideshowItems.length)
        setIsSlideVisible(true)
      }, 220)
    }, slideMs)
    return () => clearInterval(t)
  }, [isSlideshowOpen, isPaused, slideshowItems.length, slideMs])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  )

  const onDragEnd = async (event: any) => {
    setPressingId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (sortMode !== 'latest') {
      flashMsg('드래그 정렬은 최신순 모드에서만 사용해줘.')
      return
    }

    const from = sortedActiveItems.findIndex((i) => i.id === active.id)
    const to = sortedActiveItems.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return

    const nextActive = arrayMove(sortedActiveItems, from, to)
    setItems([...nextActive, ...completedItems])

    if (isTodoOnlyHost) {
      flashMsg('전용 페이지에서는 순서를 저장하지 않아요.')
      return
    }

    try {
      await reorderTodos(nextActive)
      flashMsg('순서 저장 완료')
    } catch {
      flashMsg('순서 저장 실패, 새로고침 후 다시 시도해줘.', 2200)
      await load()
    }
  }

  if (!user) return <GuestPlaceholder title="Login to use Todo" desc="Your tasks appear after sign-in." hint="U need login" buttonLabel="Login" emoji="☑️" />

  return (
    <main className="w-full max-w-none mx-0 px-0 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 pl-[10px]">
          <h1 className="text-2xl sm:text-3xl font-bold">Todo List</h1>
          <button
            onClick={async () => {
              await load()
              flashMsg('동기화 완료')
            }}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"
            title="새로고침 동기화"
            aria-label="새로고침 동기화"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8A8 8 0 006.4 5.6L4 8m0 8a8 8 0 0013.6 2.4L20 16" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => {
            if (slideshowItems.length === 0) {
              flashMsg('표시할 Todo가 없어요.')
              return
            }
            setSlideIndex(0)
            setIsPaused(false)
            setIsSlideshowOpen(true)
          }}
          className="px-3 py-1.5 rounded border bg-black text-white dark:bg-white dark:text-black text-sm"
        >
          슬라이드쇼
        </button>
      </div>

      <section className="p-1 bg-transparent pl-[10px]">
        <form
          className="flex items-center gap-1 min-h-[40px] pr-[10px]"
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
            className="flex-1 px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <button
            type="submit"
            disabled={adding}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 mr-[10px]"
            title="등록하기"
            aria-label="등록하기"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">💡 정렬: 최신순/등록순/가나다/별표우선 (기본: 최신순)</p>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="text-xs px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="latest">최신순</option>
                <option value="oldest">등록순</option>
                <option value="alpha">가나다순</option>
                <option value="starred">별표우선</option>
              </select>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => setPressingId(String(e.active.id))}
              onDragEnd={onDragEnd}
              onDragCancel={() => setPressingId(null)}
            >
              <SortableContext items={sortedActiveItems.map((i) => i.id || '')} strategy={verticalListSortingStrategy}>
                {sortedActiveItems.map((item) => (
                  <SortableTodoRow key={item.id} item={item} staleLevel={getStaleLevel(item)} completing={completingIds.includes(item.id || '')} isPressing={pressingId === item.id}>
                    {({ attributes, listeners, setActivatorNodeRef }) => {
                const staleLevel = getStaleLevel(item)
                return (
                <div className="flex items-center gap-1 min-h-[40px]">
                  <button
                    type="button"
                    ref={setActivatorNodeRef as any}
                    {...(sortMode === 'latest' ? attributes : {})}
                    {...(sortMode === 'latest' ? listeners : {})}
                    onPointerDown={() => sortMode === 'latest' && setPressingId(item.id || null)}
                    onPointerUp={() => setPressingId(null)}
                    onPointerCancel={() => setPressingId(null)}
                    className={`text-2xl leading-none p-2 self-center touch-none ${sortMode === 'latest' ? 'text-gray-400 cursor-grab active:cursor-grabbing' : 'text-gray-300 cursor-not-allowed'}`}
                    title={sortMode === 'latest' ? '드래그해서 순서 변경' : '드래그는 최신순에서만 가능'}
                  >☰</button>
                  <button
                    onClick={async () => {
                      if (!item.id) return
                      setCompletingIds((prev) => [...prev, item.id!])

                      // 먼저 화면에서 숨김(체감 우선)
                      const prevItems = items
                      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, completed: true, completedAt: new Date() as any } : x)))

                      setTimeout(async () => {
                        try {
                          await setTodoCompleted(item.id!, true)
                        } catch {
                          // 실패 시 롤백
                          setItems(prevItems)
                          flashMsg('완료 처리 실패, 다시 시도해줘.', 1800)
                        } finally {
                          setCompletingIds((prev) => prev.filter((id) => id !== item.id))
                        }
                      }, 180)
                    }}
                    className="self-center text-emerald-500 hover:text-emerald-700 p-1"
                    title="완료 처리"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={2} />
                    </svg>
                  </button>
                  <textarea
                    ref={(el) => { if (el) autoResizeTextarea(el) }}
                    defaultValue={item.content}
                    rows={1}
                    onInput={(e) => autoResizeTextarea(e.currentTarget)}
                    onFocus={(e) => autoResizeTextarea(e.currentTarget)}
                    onBlur={(e) => saveOnBlur(item.id, e.target.value)}
                    className="flex-1 bg-transparent outline-none resize-none overflow-hidden leading-6 py-2 self-center align-middle"
                  />
                  <div className="flex flex-col items-center justify-center gap-0.5 self-center">
                    <button
                      onClick={() => copyText(item.content)}
                      title="복사"
                      className="p-1 text-blue-600 hover:text-blue-900"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button
                      onClick={async () => {
                        await setTodoStarred(item.id!, !item.starred)
                        await load()
                      }}
                      title="중요"
                      className="p-1"
                    >
                      <svg className={`w-4 h-4 ${item.starred ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill={item.starred ? 'currentColor' : 'none'}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.5 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" />
                      </svg>
                    </button>
                  </div>
                  {staleLevel === 2 ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">2일+</span> : null}
                  {staleLevel === 3 ? <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">3일+</span> : null}
                  {/* 삭제 버튼 제거: 비움/완료 자동정리 흐름 사용 */}
                </div>
                    )}}
                  </SortableTodoRow>
                ))}
              </SortableContext>
            </DndContext>
          </section>

          <section className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">완료 목록 (수동 삭제 가능)</h2>
              <button
                onClick={deleteAllCompleted}
                disabled={completedItems.length === 0}
                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                완료된 목록 모두 삭제
              </button>
            </div>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <article key={item.id} className="p-1 bg-transparent opacity-80 border-b border-gray-200/70 dark:border-gray-700/60">
                  <div className="flex items-center gap-1 min-h-[40px]">
                    <button
                      onClick={async () => {
                        if (!item.id) return
                        await setTodoCompleted(item.id!, false)
                        await load()
                      }}
                      className="self-center text-gray-400 hover:text-gray-600 p-1"
                      title="완료 해제"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={2} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                    </button>
                    <textarea
                      ref={(el) => { if (el) autoResizeTextarea(el) }}
                      defaultValue={item.content}
                      rows={1}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      onFocus={(e) => autoResizeTextarea(e.currentTarget)}
                      onBlur={(e) => saveOnBlur(item.id, e.target.value)}
                        className="flex-1 bg-transparent outline-none resize-none overflow-hidden line-through text-gray-500 leading-6 py-2 self-center align-middle"
                    />
                    {item.starred ? <span className="text-yellow-500">★</span> : null}
                    <button
                      onClick={async () => {
                        if (!item.id) return
                        await deleteTodo(item.id)
                        await load()
                      }}
                      title="삭제"
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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

      {isOwner && (
        <section className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-500 space-y-1">
          <p><b>TodoList DB 안내(관리자 전용)</b></p>
          <p>- DB 엔진: Firebase Firestore</p>
          <p>- 컬렉션: <code>todos</code></p>
          <p>- 앱 경로: <code>lib/firebase-todos.ts</code> → create/get/update/reorder API 사용</p>
          <p>- 정렬 저장: <code>sortOrder</code> 필드</p>
        </section>
      )}

      {isSlideshowOpen && slideshowItems.length > 0 ? (
        <div className="fixed inset-0 z-[90] bg-black text-white flex flex-col items-center justify-center px-6 overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <button
              onClick={() => setSlideMs((prev) => Math.min(6000, prev + 400))}
              className="text-white/80 hover:text-white text-sm border border-white/40 rounded px-2 py-1"
              title="속도 느리게"
            >
              -
            </button>
            <button
              onClick={() => setSlideMs((prev) => Math.max(1000, prev - 400))}
              className="text-white/80 hover:text-white text-sm border border-white/40 rounded px-2 py-1"
              title="속도 빠르게"
            >
              +
            </button>
            <button
              onClick={() => setIsSlideshowOpen(false)}
              className="text-white/80 hover:text-white text-sm border border-white/40 rounded px-2 py-1"
            >
              닫기
            </button>
          </div>
          <div className="text-xs text-white/60 mb-3">{slideIndex + 1} / {slideshowItems.length} · {isPaused ? '일시정지' : '반복재생'} · {(slideMs / 1000).toFixed(1)}s</div>
          <div className="w-40 h-1.5 rounded-full bg-white/20 overflow-hidden mb-6">
            <div className="h-full bg-white/80 animate-pulse" />
          </div>
          <div className={`max-w-3xl text-center text-3xl sm:text-5xl font-semibold leading-tight whitespace-pre-wrap break-words transition-all duration-300 ${isSlideVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.985]'}`}>
            {slideshowItems[slideIndex]?.content}
          </div>
          <div className="absolute inset-0 z-10 grid grid-cols-3">
            <button
              aria-label="이전 슬라이드"
              className="h-full w-full"
              onClick={() => {
                setIsSlideVisible(false)
                setTimeout(() => {
                  setSlideIndex((prev) => (prev - 1 + slideshowItems.length) % slideshowItems.length)
                  setIsSlideVisible(true)
                }, 180)
              }}
            />
            <button
              aria-label="재생/일시정지"
              className="h-full w-full"
              onClick={() => setIsPaused((p) => !p)}
            />
            <button
              aria-label="다음 슬라이드"
              className="h-full w-full"
              onClick={() => {
                setIsSlideVisible(false)
                setTimeout(() => {
                  setSlideIndex((prev) => (prev + 1) % slideshowItems.length)
                  setIsSlideVisible(true)
                }, 180)
              }}
            />
          </div>
        </div>
      ) : null}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
