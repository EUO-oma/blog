'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createSecretWord, deleteSecretWord, getSecretWords, updateSecretWord, type SecretWordItem } from '@/lib/firebase-secret-words'

const OWNER_EMAIL = 'icandoit13579@gmail.com'

export default function SecretWordPage() {
  const { user } = useAuth()
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL

  const [items, setItems] = useState<SecretWordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ term: '', meaning: '', example: '' })

  const load = async () => {
    if (!isOwner) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setItems(await getSecretWords())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(''), 1600)
    return () => clearTimeout(t)
  }, [msg])

  const add = async () => {
    if (!isOwner) return
    if (!form.term.trim() || !form.meaning.trim()) return setMsg('단어/뜻은 필수야.')
    try {
      await createSecretWord({ term: form.term.trim(), meaning: form.meaning.trim(), example: form.example.trim() })
      setForm({ term: '', meaning: '', example: '' })
      setShowAddForm(false)
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

  if (!user) return <p className="text-gray-500">로그인 필요</p>
  if (!isOwner) return <p className="text-red-500">비밀 단어장 접근 권한이 없습니다.</p>

  return (
    <main className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Secret Word</h1>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="text-indigo-600 hover:text-indigo-900 p-1"
          title="단어 추가"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {showAddForm && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 space-y-2">
          <div className="grid md:grid-cols-3 gap-2">
            <input value={form.term} onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))} placeholder="단어" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.meaning} onChange={(e) => setForm((p) => ({ ...p, meaning: e.target.value }))} placeholder="뜻" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.example} onChange={(e) => setForm((p) => ({ ...p, example: e.target.value }))} placeholder="예문(선택)" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
          </div>
          <button onClick={add} className="text-emerald-600 hover:text-emerald-900 p-1" title="등록">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </section>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />

      {loading ? (
        <div className="py-6 flex justify-center"><LoaderSwitcher label="비밀 단어장 불러오는 중..." /></div>
      ) : (
        <section className="space-y-1">
          {filtered.map((w) => (
            <article key={w.id} className="py-2 border-b border-gray-200/70 dark:border-gray-700/60 flex items-start gap-2">
              <div className="flex-1 grid md:grid-cols-3 gap-2">
                <input defaultValue={w.term} onBlur={(e) => w.id && updateSecretWord(w.id, { term: e.target.value })} className="bg-transparent outline-none" />
                <input defaultValue={w.meaning} onBlur={(e) => w.id && updateSecretWord(w.id, { meaning: e.target.value })} className="bg-transparent outline-none" />
                <input defaultValue={w.example || ''} onBlur={(e) => w.id && updateSecretWord(w.id, { example: e.target.value })} className="bg-transparent outline-none" />
              </div>
              <button onClick={async () => { if (!w.id) return; await deleteSecretWord(w.id); await load() }} className="text-red-600 p-1" title="삭제">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </article>
          ))}
          {filtered.length === 0 ? <p className="text-sm text-gray-500">등록된 단어가 없습니다.</p> : null}
        </section>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
