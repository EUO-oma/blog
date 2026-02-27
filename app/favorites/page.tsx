'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import {
  createFavoriteSite,
  deleteFavoriteSite,
  FavoriteSite,
  FAVORITES_OWNER_EMAIL,
  getFavoriteSites,
  reorderFavoriteSites,
  updateFavoriteSite,
} from '@/lib/firebase-favorites'

function SortableFavoriteRow({
  item,
  isPressing,
  children,
}: {
  item: FavoriteSite
  isPressing: boolean
  children: (bind: { attributes: any; listeners: any; setActivatorNodeRef: (el: HTMLElement | null) => void; isDragging: boolean }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id || '',
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-4 bg-white dark:bg-gray-800 transition-all duration-200 ${
        isDragging
          ? 'opacity-75 scale-[0.94] border-amber-300 dark:border-amber-500 shadow-[0_10px_30px_rgba(251,191,36,0.25)]'
          : isPressing
          ? 'scale-[0.95] border-amber-200 dark:border-amber-600 bg-gradient-to-r from-white via-amber-50 to-white dark:from-gray-800 dark:via-amber-900/20 dark:to-gray-800 ring-2 ring-amber-200/70 dark:ring-amber-500/30 shadow-[0_0_24px_rgba(251,191,36,0.22)] animate-pulse'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </article>
  )
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FavoriteSite[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineForm, setInlineForm] = useState({ title: '', url: '', note: '' })
  const [pressingId, setPressingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', url: '', note: '' })
  const isOwner = user?.email?.toLowerCase() === FAVORITES_OWNER_EMAIL
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  )

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getFavoriteSites(user?.email || undefined))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(''), 1600)
    return () => clearTimeout(t)
  }, [msg])

  const save = async () => {
    if (!user?.email) return setMsg('로그인 후 사용 가능해요.')
    if (!form.title.trim() || !form.url.trim()) return setMsg('제목/URL은 필수야.')

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      note: form.note.trim(),
    }

    try {
      await createFavoriteSite({ ...payload, authorEmail: user.email }, items.length)
      setMsg('추가 완료')
      setForm({ title: '', url: '', note: '' })
      setShowAddForm(false)
      await load()
    } catch (e: any) {
      setMsg(`저장 실패: ${e?.message || e}`)
    }
  }

  const saveInlineEdit = async (id: string) => {
    const payload = {
      title: inlineForm.title.trim(),
      url: inlineForm.url.trim(),
      note: inlineForm.note.trim(),
    }
    if (!payload.title || !payload.url) {
      setMsg('제목/URL은 필수야.')
      return
    }
    try {
      await updateFavoriteSite(id, payload)
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)))
      setInlineEditId(null)
      setMsg('수정 완료')
    } catch (e: any) {
      setMsg(`수정 실패: ${e?.message || e}`)
    }
  }

  const copyFavorite = async (it: FavoriteSite) => {
    try {
      await navigator.clipboard.writeText(`${it.title}\n${it.url}`)
      setMsg('클립보드에 복사되었습니다')
    } catch {
      setMsg('복사 실패')
    }
  }

  const startInlineTitleEdit = (it: FavoriteSite) => {
    setEditingTitleId(it.id || null)
    setEditingTitle(it.title || '')
  }

  const saveInlineTitle = async (it: FavoriteSite) => {
    if (!it.id) return
    const next = editingTitle.trim()
    if (!next || next === it.title) {
      setEditingTitleId(null)
      return
    }
    try {
      await updateFavoriteSite(it.id, { title: next, url: it.url, note: it.note || '' })
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, title: next } : x)))
      setMsg('제목 수정 완료')
    } catch (e: any) {
      setMsg(`수정 실패: ${e?.message || e}`)
    } finally {
      setEditingTitleId(null)
    }
  }

  const onDragEnd = async (event: any) => {
    setPressingId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return

    const next = arrayMove(items, from, to)
    setItems(next)

    try {
      await reorderFavoriteSites(next)
      setMsg('순서 저장 완료')
    } catch {
      setMsg('순서 저장 실패, 새로고침 후 다시 시도해줘.')
      await load()
    }
  }

  return (
    <main className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">즐겨찾기</h1>
      {!user ? <p className="text-sm text-gray-500 mb-3">공개 즐겨찾기 목록입니다. 수정/추가는 관리자 로그인 시 가능해요.</p> : null}

      {isOwner && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">빠른 추가</p>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"
              title="즐겨찾기 추가"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {showAddForm && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="사이트 이름" className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" />
                <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" />
                <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="메모(선택)" className="px-3 py-2 rounded border md:col-span-2 dark:bg-gray-900 dark:border-gray-700" />
              </div>
              <div className="mt-3 flex gap-2 items-center">
                <button
                  onClick={save}
                  className="p-2 rounded text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                  title="추가 완료"
                  aria-label="추가 완료"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="즐겨찾기 불러오는 중..." /></div>
      ) : items.length === 0 ? (
        <p className="text-gray-500">등록된 즐겨찾기가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{isOwner ? '💡 카드를 길게 눌러(또는 마우스로 드래그) 순서를 바꿀 수 있어.' : '공개 즐겨찾기 목록입니다.'}</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setPressingId(String(e.active.id))}
            onDragEnd={onDragEnd}
            onDragCancel={() => setPressingId(null)}
          >
            <SortableContext items={items.map((i) => i.id || '')} strategy={verticalListSortingStrategy}>
              {items.map((it) => (
                <SortableFavoriteRow key={it.id} item={it} isPressing={pressingId === it.id}>
                  {({ attributes, listeners, setActivatorNodeRef, isDragging }) => (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex items-start gap-2">
                        {isOwner ? (
                          <button
                            type="button"
                            ref={setActivatorNodeRef as any}
                            {...attributes}
                            {...listeners}
                            onPointerDown={() => setPressingId(it.id || null)}
                            onPointerUp={() => setPressingId(null)}
                            onPointerCancel={() => setPressingId(null)}
                            className="mt-0.5 select-none cursor-grab active:cursor-grabbing text-gray-400 text-2xl leading-none p-2 touch-none"
                            title="드래그해서 순서 변경"
                            aria-label="드래그 핸들"
                          >
                            ☰
                          </button>
                        ) : null}
                        <div>
                          {editingTitleId === it.id ? (
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => saveInlineTitle(it)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  saveInlineTitle(it)
                                }
                                if (e.key === 'Escape') setEditingTitleId(null)
                              }}
                              className="font-semibold bg-transparent border-b border-fuchsia-300 outline-none"
                            />
                          ) : (
                            <h2
                              className={`font-semibold ${isOwner ? 'cursor-text' : ''}`}
                              onClick={(e) => {
                                if (!isOwner) return
                                e.stopPropagation()
                                startInlineTitleEdit(it)
                              }}
                              title={isOwner ? '클릭해서 제목 수정' : ''}
                            >
                              {it.title}
                            </h2>
                          )}
                          <a
                            href={it.url}
                            target="_blank"
                            rel="noreferrer"
                            draggable={false}
                            onPointerDown={(e) => isDragging && e.preventDefault()}
                            className="text-sm text-indigo-600 break-all"
                          >
                            {it.url}
                          </a>
                          {it.note ? <p className="text-xs text-gray-500 mt-1">{it.note}</p> : null}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyFavorite(it)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          title="복사"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => {
                                setInlineEditId(it.id || null)
                                setInlineForm({ title: it.title, url: it.url, note: it.note || '' })
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1"
                              title="수정"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={async () => { if (!it.id) return; if (!confirm('삭제할까요?')) return; await deleteFavoriteSite(it.id); await load() }}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                              title="삭제"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : null}
                      </div>
                      </div>

                      {isOwner && inlineEditId === it.id && (
                        <div className="rounded-lg border border-fuchsia-200 dark:border-fuchsia-800 p-3 bg-white/70 dark:bg-gray-900/40">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              value={inlineForm.title}
                              onChange={(e) => setInlineForm((p) => ({ ...p, title: e.target.value }))}
                              onBlur={() => it.id && saveInlineEdit(it.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  it.id && saveInlineEdit(it.id)
                                }
                              }}
                              placeholder="사이트 이름"
                              className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700"
                            />
                            <input
                              value={inlineForm.url}
                              onChange={(e) => setInlineForm((p) => ({ ...p, url: e.target.value }))}
                              onBlur={() => it.id && saveInlineEdit(it.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  it.id && saveInlineEdit(it.id)
                                }
                              }}
                              placeholder="https://..."
                              className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700"
                            />
                            <input
                              value={inlineForm.note}
                              onChange={(e) => setInlineForm((p) => ({ ...p, note: e.target.value }))}
                              onBlur={() => it.id && saveInlineEdit(it.id)}
                              placeholder="메모(선택)"
                              className="px-2 py-1 rounded border md:col-span-2 dark:bg-gray-900 dark:border-gray-700"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SortableFavoriteRow>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </main>
  )
}
