'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createPeople, deletePeople, getPeople, updatePeople, type PeopleItem } from '@/lib/firebase-people'

type SlideStage = 'person' | 'related' | 'note'
const OWNER_EMAIL = 'icandoit13579@gmail.com'

export default function PeoplePage() {
  const { user } = useAuth()
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL

  const [items, setItems] = useState<PeopleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ person: '', related: '', note: '' })
  const [msg, setMsg] = useState('')
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideStage, setSlideStage] = useState<SlideStage>('person')

  const flashMsg = (text: string, ms = 1500) => {
    setMsg(text)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMsg(''), ms)
  }

  const load = async () => {
    if (!isOwner) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setItems(await getPeople())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner])

  useEffect(() => () => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
  }, [])

  const add = async () => {
    if (!isOwner) return
    if (!form.person.trim() || !form.related.trim()) return flashMsg('사람/관련 항목은 필수야.')
    try {
      await createPeople({ person: form.person.trim(), related: form.related.trim(), note: form.note.trim() })
      setForm({ person: '', related: '', note: '' })
      setShowAddForm(false)
      flashMsg('등록 완료')
      await load()
    } catch (e: any) {
      flashMsg(`등록 실패: ${e?.message || e}`, 2200)
    }
  }

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return items
    return items.filter((i) => `${i.person} ${i.related} ${i.note || ''}`.toLowerCase().includes(k))
  }, [items, q])

  const activeItems = useMemo(() => filtered.filter((i) => !i.learned), [filtered])
  const learnedItems = useMemo(() => filtered.filter((i) => i.learned), [filtered])

  useEffect(() => {
    if (!isSlideshowOpen || activeItems.length === 0) return
    const t = setTimeout(() => {
      if (slideStage === 'person') {
        setSlideStage('related')
      } else if (slideStage === 'related') {
        if (activeItems[slideIndex]?.note?.trim()) {
          setSlideStage('note')
        } else {
          setSlideStage('person')
          setSlideIndex((prev) => (prev + 1) % activeItems.length)
        }
      } else {
        setSlideStage('person')
        setSlideIndex((prev) => (prev + 1) % activeItems.length)
      }
    }, slideStage === 'note' ? 1000 : 1800)

    return () => clearTimeout(t)
  }, [isSlideshowOpen, slideIndex, slideStage, activeItems])

  if (!user) return <p className="text-gray-500">로그인 필요</p>
  if (!isOwner) return <p className="text-red-500">People 게시판은 관리자만 접근 가능해요.</p>

  return (
    <main className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">People</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (activeItems.length === 0) return flashMsg('슬라이드쇼할 항목이 없어.')
              setSlideIndex(0)
              setSlideStage('person')
              setIsSlideshowOpen(true)
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1"
            title="슬라이드쇼"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-5.197-3A1 1 0 008 9.034v5.932a1 1 0 001.555.832l5.197-3a1 1 0 000-1.73z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="text-indigo-600 hover:text-indigo-900 p-1"
            title="항목 추가"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {showAddForm && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 space-y-2">
          <div className="grid md:grid-cols-3 gap-2">
            <input value={form.person} onChange={(e) => setForm((p) => ({ ...p, person: e.target.value }))} placeholder="사람 이름" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.related} onChange={(e) => setForm((p) => ({ ...p, related: e.target.value }))} placeholder="관련 항목" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="메모(선택)" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
          </div>
          <button onClick={add} className="text-emerald-600 hover:text-emerald-900 p-1" title="등록">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
        </section>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="사람/관련 항목 검색" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />

      {loading ? (
        <div className="py-6 flex justify-center"><LoaderSwitcher label="People 불러오는 중..." /></div>
      ) : (
        <>
          <section className="space-y-1">
            {activeItems.map((p) => (
              <article key={p.id} className="py-2 border-b border-gray-200/70 dark:border-gray-700/60 flex items-start gap-2">
                <div className="flex-1 grid md:grid-cols-3 gap-2">
                  <input defaultValue={p.person} onBlur={(e) => p.id && updatePeople(p.id, { person: e.target.value })} className="bg-transparent outline-none font-semibold" />
                  <input defaultValue={p.related} onBlur={(e) => p.id && updatePeople(p.id, { related: e.target.value })} className="bg-transparent outline-none" />
                  <input defaultValue={p.note || ''} onBlur={(e) => p.id && updatePeople(p.id, { note: e.target.value })} className="bg-transparent outline-none text-sm text-gray-500" />
                </div>
                <button onClick={async () => { if (!p.id) return; await updatePeople(p.id, { learned: true }); await load() }} className="text-emerald-600 p-1" title="완료">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button onClick={async () => { if (!p.id) return; await deletePeople(p.id); await load() }} className="text-red-600 p-1" title="삭제">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </article>
            ))}
            {activeItems.length === 0 ? <p className="text-sm text-gray-500">등록된 항목이 없습니다.</p> : null}
          </section>

          <section className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">완료한 항목</h2>
            <div className="space-y-1">
              {learnedItems.map((p) => (
                <article key={p.id} className="py-2 border-b border-gray-200/70 dark:border-gray-700/60 flex items-start gap-2 opacity-80">
                  <div className="flex-1 grid md:grid-cols-3 gap-2">
                    <input defaultValue={p.person} onBlur={(e) => p.id && updatePeople(p.id, { person: e.target.value })} className="bg-transparent outline-none line-through text-gray-500" />
                    <input defaultValue={p.related} onBlur={(e) => p.id && updatePeople(p.id, { related: e.target.value })} className="bg-transparent outline-none line-through text-gray-500" />
                    <input defaultValue={p.note || ''} onBlur={(e) => p.id && updatePeople(p.id, { note: e.target.value })} className="bg-transparent outline-none line-through text-gray-500 text-sm" />
                  </div>
                  <button onClick={async () => { if (!p.id) return; await updatePeople(p.id, { learned: false }); await load() }} className="text-gray-500 p-1" title="되돌리기">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8A8 8 0 006.4 5.6L4 8m0 8a8 8 0 0013.6 2.4L20 16" /></svg>
                  </button>
                </article>
              ))}
              {learnedItems.length === 0 ? <p className="text-sm text-gray-500">완료한 항목이 없습니다.</p> : null}
            </div>
          </section>
        </>
      )}

      {isSlideshowOpen && activeItems.length > 0 && (
        <div className="fixed inset-0 z-[95] bg-black text-white flex items-center justify-center px-6">
          <button onClick={() => setIsSlideshowOpen(false)} className="absolute top-4 right-4 border border-white/40 rounded px-2 py-1 text-sm">닫기</button>
          <div className="text-center max-w-3xl">
            <p className="text-xs text-white/60 mb-3">{slideIndex + 1} / {activeItems.length}</p>
            <div className="text-4xl sm:text-6xl font-semibold whitespace-pre-wrap break-words transition-opacity duration-300">
              {slideStage === 'person' && activeItems[slideIndex]?.person}
              {slideStage === 'related' && activeItems[slideIndex]?.related}
              {slideStage === 'note' && (activeItems[slideIndex]?.note || '')}
            </div>
            <p className="mt-3 text-sm text-white/60">{slideStage === 'person' ? '사람' : slideStage === 'related' ? '관련 항목' : '메모'}</p>
          </div>
        </div>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
