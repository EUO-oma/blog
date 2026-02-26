'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import {
  createFavoriteSite,
  deleteFavoriteSite,
  FavoriteSite,
  getFavoriteSites,
  updateFavoriteSite,
} from '@/lib/firebase-favorites'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FavoriteSite[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ title: '', url: '', note: '' })

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

    if (editingId) {
      await updateFavoriteSite(editingId, payload)
      setMsg('수정 완료')
    } else {
      await createFavoriteSite({ ...payload, authorEmail: user.email })
      setMsg('추가 완료')
    }

    setEditingId(null)
    setForm({ title: '', url: '', note: '' })
    await load()
  }

  if (!user) {
    return <p className="text-gray-500">로그인 후 즐겨찾기를 사용할 수 있어요.</p>
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
          {items.map((it) => (
            <article key={it.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <h2 className="font-semibold">{it.title}</h2>
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 break-all">{it.url}</a>
                  {it.note ? <p className="text-xs text-gray-500 mt-1">{it.note}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(it.id || null); setForm({ title: it.title, url: it.url, note: it.note || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm">수정</button>
                  <button onClick={async () => { if (!it.id) return; if (!confirm('삭제할까요?')) return; await deleteFavoriteSite(it.id); await load() }} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm">삭제</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
