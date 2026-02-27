'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import GuestPlaceholder from '@/components/GuestPlaceholder'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createWord, deleteWord, getWords, updateWord, type WordItem } from '@/lib/firebase-words'

type SlideStage = 'term' | 'meaning' | 'example'

export default function WordPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<WordItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ term: '', meaning: '', example: '' })
  const [msg, setMsg] = useState('')

  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slideStage, setSlideStage] = useState<SlideStage>('term')
  const [blink, setBlink] = useState(false)

  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashMsg = (text: string, ms = 1500) => {
    setMsg(text)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMsg(''), ms)
  }

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

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    }
  }, [])

  const add = async () => {
    if (!user?.email) return flashMsg('로그인 후 사용 가능해요.')
    if (!form.term.trim() || !form.meaning.trim()) return flashMsg('단어/뜻은 필수야.')
    try {
      await createWord({
        term: form.term.trim(),
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        authorEmail: user.email,
      })
      setForm({ term: '', meaning: '', example: '' })
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
    return items.filter((i) => `${i.term} ${i.meaning} ${i.example || ''}`.toLowerCase().includes(k))
  }, [q, items])

  const activeWords = useMemo(() => filtered.filter((i) => !i.learned), [filtered])
  const learnedWords = useMemo(() => filtered.filter((i) => i.learned), [filtered])

  const slideshowWords = useMemo(() => activeWords, [activeWords])

  useEffect(() => {
    if (!isSlideshowOpen || slideshowWords.length === 0) return
    const t = setTimeout(() => {
      if (slideStage === 'term') {
        setSlideStage('meaning')
      } else if (slideStage === 'meaning') {
        if (slideshowWords[slideIndex]?.example?.trim()) {
          setSlideStage('example')
          setBlink(true)
          setTimeout(() => setBlink(false), 1000)
        } else {
          setSlideStage('term')
          setSlideIndex((prev) => (prev + 1) % slideshowWords.length)
        }
      } else {
        setSlideStage('term')
        setSlideIndex((prev) => (prev + 1) % slideshowWords.length)
      }
    }, slideStage === 'example' ? 1000 : 1800)

    return () => clearTimeout(t)
  }, [isSlideshowOpen, slideIndex, slideStage, slideshowWords])

  if (!user) return <GuestPlaceholder title="Word 단어장은 로그인 후 사용 가능" desc="로그인하면 내 단어장 목록을 볼 수 있어요." emoji="📘" />

  return (
    <main className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Word</h1>
        <button
          onClick={() => {
            if (slideshowWords.length === 0) return flashMsg('학습 중 단어가 없어. 완료된 항목은 슬라이드쇼에서 제외돼.')
            setSlideIndex(0)
            setSlideStage('term')
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
      </div>

      <section className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">단어 추가</p>
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
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 space-y-2">
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
          </div>
        )}
      </section>

      <section className="mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
      </section>

      {loading ? (
        <div className="py-6 flex justify-center"><LoaderSwitcher label="단어장 불러오는 중..." /></div>
      ) : (
        <>
          <section className="space-y-1">
            {activeWords.map((w) => (
              <article key={w.id} className="py-2 border-b border-gray-200/70 dark:border-gray-700/60 flex items-start gap-2">
                <div className="flex-1 grid md:grid-cols-3 gap-2">
                  <input defaultValue={w.term} onBlur={(e) => w.id && updateWord(w.id, { term: e.target.value })} className="bg-transparent outline-none" />
                  <input defaultValue={w.meaning} onBlur={(e) => w.id && updateWord(w.id, { meaning: e.target.value })} className="bg-transparent outline-none" />
                  <input defaultValue={w.example || ''} onBlur={(e) => w.id && updateWord(w.id, { example: e.target.value })} className="bg-transparent outline-none" />
                </div>
                <button onClick={async () => { if (!w.id) return; await updateWord(w.id, { learned: true }); await load() }} className="text-emerald-600 p-1" title="학습 완료">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button onClick={async () => { if (!w.id) return; await deleteWord(w.id); await load() }} className="text-red-600 p-1" title="삭제">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </article>
            ))}
            {activeWords.length === 0 ? <p className="text-sm text-gray-500">학습 중 단어가 없습니다.</p> : null}
          </section>

          <section className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">완료한 학습 목록</h2>
            <div className="space-y-1">
              {learnedWords.map((w) => (
                <article key={w.id} className="py-2 border-b border-gray-200/70 dark:border-gray-700/60 flex items-start gap-2 opacity-80">
                  <div className="flex-1 grid md:grid-cols-3 gap-2">
                    <input defaultValue={w.term} onBlur={(e) => w.id && updateWord(w.id, { term: e.target.value })} className="bg-transparent outline-none line-through text-gray-500" />
                    <input defaultValue={w.meaning} onBlur={(e) => w.id && updateWord(w.id, { meaning: e.target.value })} className="bg-transparent outline-none line-through text-gray-500" />
                    <input defaultValue={w.example || ''} onBlur={(e) => w.id && updateWord(w.id, { example: e.target.value })} className="bg-transparent outline-none line-through text-gray-500" />
                  </div>
                  <button onClick={async () => { if (!w.id) return; await updateWord(w.id, { learned: false }); await load() }} className="text-gray-500 p-1" title="다시 학습">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8A8 8 0 006.4 5.6L4 8m0 8a8 8 0 0013.6 2.4L20 16" /></svg>
                  </button>
                </article>
              ))}
              {learnedWords.length === 0 ? <p className="text-sm text-gray-500">완료한 학습 항목이 없습니다.</p> : null}
            </div>
          </section>
        </>
      )}

      {isSlideshowOpen && slideshowWords.length > 0 ? (
        <div className="fixed inset-0 z-[95] bg-black text-white flex items-center justify-center px-6">
          <button onClick={() => setIsSlideshowOpen(false)} className="absolute top-4 right-4 border border-white/40 rounded px-2 py-1 text-sm">닫기</button>
          <div className="text-center max-w-3xl">
            <p className="text-xs text-white/60 mb-3">{slideIndex + 1} / {slideshowWords.length}</p>
            <div className={`text-4xl sm:text-6xl font-semibold whitespace-pre-wrap break-words transition-opacity duration-300 ${blink ? 'opacity-40' : 'opacity-100'}`}>
              {slideStage === 'term' && slideshowWords[slideIndex]?.term}
              {slideStage === 'meaning' && slideshowWords[slideIndex]?.meaning}
              {slideStage === 'example' && (slideshowWords[slideIndex]?.example || '')}
            </div>
            <p className="mt-3 text-sm text-white/60">{slideStage === 'term' ? '단어' : slideStage === 'meaning' ? '뜻' : '예문'}</p>
          </div>
        </div>
      ) : null}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
