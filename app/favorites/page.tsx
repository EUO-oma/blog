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
  getFavoriteSites,
  reorderFavoriteSites,
  updateFavoriteSite,
} from '@/lib/firebase-favorites'
import GuestPlaceholder from '@/components/GuestPlaceholder'

function SortableFavoriteRow({
  item,
  children,
}: {
  item: FavoriteSite
  children: (bind: { attributes: any; listeners: any; setActivatorNodeRef: (el: HTMLElement | null) => void }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id || '',
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-4 bg-white dark:bg-gray-800 transition-all duration-150 ${
        isDragging
          ? 'opacity-60 scale-[0.98] border-indigo-300 dark:border-indigo-700 shadow'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </article>
  )
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FavoriteSite[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', url: '', note: '' })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const load = async () => {
    if (!user?.email) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setItems(await getFavoriteSites(user.email))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const save = async () => {
    if (!user?.email) return setMsg('로그인 후 사용 가능해요.')
    if (!form.title.trim() || !form.url.trim()) return setMsg('제목/URL은 필수야.')

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      note: form.note.trim(),
    }

    try {
      if (editingId) {
        await updateFavoriteSite(editingId, payload)
        setMsg('수정 완료')
      } else {
        await createFavoriteSite({ ...payload, authorEmail: user.email }, items.length)
        setMsg('추가 완료')
      }

      setEditingId(null)
      setForm({ title: '', url: '', note: '' })
      await load()
    } catch (e: any) {
      setMsg(`저장 실패: ${e?.message || e}`)
    }
  }

  const onDragEnd = async (event: any) => {
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

  if (!user) {
    return <GuestPlaceholder title="즐겨찾기는 로그인 후 사용 가능" desc="로그인하면 저장한 사이트 목록을 바로 불러와요." emoji="⭐" />
  }

  return (
    <main className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">즐겨찾기</h1>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-5 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="사이트 이름" className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" />
          <input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" />
          <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="메모(선택)" className="px-3 py-2 rounded border md:col-span-2 dark:bg-gray-900 dark:border-gray-700" />
        </div>
        <div className="mt-3 flex gap-2 items-center">
          <button onClick={save} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">{editingId ? '수정 저장' : '+ 추가'}</button>
          {editingId ? <button onClick={() => { setEditingId(null); setForm({ title: '', url: '', note: '' }) }} className="px-3 py-2 rounded border text-sm">취소</button> : null}
          {msg ? <span className="text-sm text-gray-500">{msg}</span> : null}
        </div>
      </section>

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="즐겨찾기 불러오는 중..." /></div>
      ) : items.length === 0 ? (
        <p className="text-gray-500">등록된 즐겨찾기가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">💡 카드를 길게 눌러(또는 마우스로 드래그) 순서를 바꿀 수 있어.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id || '')} strategy={verticalListSortingStrategy}>
              {items.map((it) => (
                <SortableFavoriteRow key={it.id} item={it}>
                  {({ attributes, listeners, setActivatorNodeRef }) => (
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex items-start gap-2">
                        <span
                          ref={setActivatorNodeRef as any}
                          {...attributes}
                          {...listeners}
                          className="mt-0.5 select-none cursor-grab active:cursor-grabbing text-gray-400"
                          title="드래그해서 순서 변경"
                          aria-label="드래그 핸들"
                        >
                          ☰
                        </span>
                        <div>
                          <h2 className="font-semibold">{it.title}</h2>
                          <a href={it.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 break-all">{it.url}</a>
                          {it.note ? <p className="text-xs text-gray-500 mt-1">{it.note}</p> : null}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingId(it.id || null); setForm({ title: it.title, url: it.url, note: it.note || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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
                      </div>
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
