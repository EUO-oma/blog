'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import GuestPlaceholder from '@/components/GuestPlaceholder'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createWord, deleteWord, getWords, updateWord, type WordItem } from '@/lib/firebase-words'

export default function WordPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<WordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ term: '', meaning: '', example: '' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!user?.email) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setItems(await getWords(user.email))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.email])

  const add = async () => {
    if (!user?.email) return setMsg('로그인 후 사용 가능해요.')
    if (!form.term.trim() || !form.meaning.trim()) return setMsg('단어/뜻은 필수야.')
    try {
      await createWord({ term: form.term.trim(), meaning: form.meaning.trim(), example: form.example.trim(), authorEmail: user.email })
      setForm({ term: '', meaning: '', example: '' })
      setMsg('등록 완료')
      await load()
    } catch (e: any) {
      setMsg(`등록 실패: ${e?.message || e}`)
    }
  }

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return items
    return items.filter((i) => `${i.term} ${i.meaning} ${i.example || ''}`.toLowerCase().includes(k))
  }, [q, items])

  if (!user) return <GuestPlaceholder title="Word 단어장은 로그인 후 사용 가능" desc="로그인하면 내 단어장 목록을 볼 수 있어요." emoji="📘" />

  return (
    <main className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Word</h1>
        <button className="px-3 py-1.5 rounded border text-sm" title="다음 단계: 슬라이드쇼">슬라이드쇼(예정)</button>
      </div>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 space-y-2">
        <div className="grid md:grid-cols-3 gap-2">
          <input value={form.term} onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))} placeholder="단어" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
          <input value={form.meaning} onChange={(e) => setForm((p) => ({ ...p, meaning: e.target.value }))} placeholder="뜻" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
          <input value={form.example} onChange={(e) => setForm((p) => ({ ...p, example: e.target.value }))} placeholder="예문(선택)" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
          <button onClick={add} className="px-3 py-1.5 rounded bg-indigo-600 text-white">등록</button>
        </div>
      </section>

      {loading ? (
        <div className="py-6 flex justify-center"><LoaderSwitcher label="단어장 불러오는 중..." /></div>
      ) : (
        <section className="space-y-1">
          {filtered.map((w) => (
            <article key={w.id} className="py-2 border-b border-gray-200/70 dark:border-gray-700/60 flex items-start gap-2">
              <div className="flex-1 grid md:grid-cols-3 gap-2">
                <input defaultValue={w.term} onBlur={(e) => w.id && updateWord(w.id, { term: e.target.value })} className="bg-transparent outline-none" />
                <input defaultValue={w.meaning} onBlur={(e) => w.id && updateWord(w.id, { meaning: e.target.value })} className="bg-transparent outline-none" />
                <input defaultValue={w.example || ''} onBlur={(e) => w.id && updateWord(w.id, { example: e.target.value })} className="bg-transparent outline-none" />
              </div>
              <button onClick={async () => { if (!w.id) return; await deleteWord(w.id); await load() }} className="text-red-600 p-1" title="삭제">🗑️</button>
            </article>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-gray-500">등록된 단어가 없습니다.</p> : null}
        </section>
      )}

      {msg ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded">{msg}</div> : null}
    </main>
  )
}
