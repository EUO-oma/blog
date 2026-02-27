'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  PhonebookItem,
  createPhonebookItem,
  deletePhonebookItem,
  getPhonebookItems,
  updatePhonebookItem,
} from '@/lib/firebase-phonebook'
import LoaderSwitcher from '@/components/LoaderSwitcher'

const CATEGORIES = ['통신', '전기/설비', '생활', '병원', '택배/물류', '식당', '기타']

export default function PhonebookPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<PhonebookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('전체')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ company: '', category: '기타', phone: '', fax: '', address: '', businessNumber: '', memo: '', url1: '', url2: '' })

  const loadItems = async () => {
    if (!user?.email) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const fetched = await getPhonebookItems(user.email)
      setItems(fetched)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      const categoryMatch = activeCategory === '전체' || it.category === activeCategory
      if (!categoryMatch) return false
      if (!q) return true
      return [it.company, it.category, it.phone, it.fax || '', it.address || '', it.businessNumber || '', it.memo || '', it.url1 || '', it.url2 || ''].join(' ').toLowerCase().includes(q)
    })
  }, [items, search, activeCategory])

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      setMessage('전화번호 복사 완료')
      setTimeout(() => setMessage(''), 1200)
    } catch {
      setMessage('복사 실패')
    }
  }

  const shareContact = async (item: PhonebookItem) => {
    const text = `${item.company}\n${item.phone}${item.memo ? `\n${item.memo}` : ''}`
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: item.company, text })
      } else {
        await navigator.clipboard.writeText(text)
        setMessage('공유 미지원 환경이라 연락처를 복사했어.')
      }
    } catch {
      setMessage('공유가 취소되었거나 실패했어.')
    }
  }

  const saveItem = async () => {
    if (!user?.email) return setMessage('로그인 후 사용할 수 있어요.')
    if (!form.company.trim() || !form.phone.trim()) return setMessage('업체명/전화번호를 입력해줘.')

    setSaving(true)
    setMessage('')
    try {
      if (editingId) {
        await updatePhonebookItem(editingId, {
          company: form.company.trim(),
          category: form.category,
          phone: form.phone.trim(),
          fax: form.fax.trim(),
          address: form.address.trim(),
          businessNumber: form.businessNumber.trim(),
          memo: form.memo.trim(),
          url1: form.url1.trim(),
          url2: form.url2.trim(),
        })
        setMessage('연락처를 수정했어.')
      } else {
        await createPhonebookItem({
          company: form.company.trim(),
          category: form.category,
          phone: form.phone.trim(),
          fax: form.fax.trim(),
          address: form.address.trim(),
          businessNumber: form.businessNumber.trim(),
          memo: form.memo.trim(),
          url1: form.url1.trim(),
          url2: form.url2.trim(),
          authorEmail: user.email,
          authorName: user.displayName || user.email,
        })
        setMessage('연락처를 저장했어.')
      }

      setEditingId(null)
      setForm({ company: '', category: '기타', phone: '', fax: '', address: '', businessNumber: '', memo: '', url1: '', url2: '' })
      await loadItems()
    } catch (e: any) {
      setMessage(`저장 실패: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (id?: string) => {
    if (!id) return
    if (!confirm('이 연락처를 삭제할까요?')) return

    try {
      await deletePhonebookItem(id)
      setMessage('삭제했어.')
      await loadItems()
    } catch (e: any) {
      setMessage(`삭제 실패: ${e?.message || e}`)
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">업체 전화번호 폰북</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          이 폰북은 Firebase에 사용자별로 저장돼. 로그인하면 내 기기들에서 동일하게 동기화돼.
        </p>
        <button
          onClick={() => {
            const event = new CustomEvent('openLoginModal')
            window.dispatchEvent(event)
          }}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          로그인하기
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">업체 전화번호 폰북</h1>
        <p className="text-sm text-gray-500">Firebase 동기화: {user.email}</p>
      </div>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 bg-white dark:bg-gray-800">
        <h2 className="font-semibold mb-3">연락처 추가</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            placeholder="업체명"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="전화번호"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            value={form.fax}
            onChange={(e) => setForm((p) => ({ ...p, fax: e.target.value }))}
            placeholder="팩스(선택)"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="주소(선택)"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={form.businessNumber}
            onChange={(e) => setForm((p) => ({ ...p, businessNumber: e.target.value }))}
            placeholder="사업자번호(선택)"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={form.memo}
            onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
            placeholder="메모(선택)"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={form.url1}
            onChange={(e) => setForm((p) => ({ ...p, url1: e.target.value }))}
            placeholder="URL 1 (선택)"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <input
            value={form.url2}
            onChange={(e) => setForm((p) => ({ ...p, url2: e.target.value }))}
            placeholder="URL 2 (선택)"
            className="px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={saveItem}
            disabled={saving}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? '저장 중...' : editingId ? '수정 저장' : '+ 추가'}
          </button>
          {editingId ? (
            <button
              onClick={() => {
                setEditingId(null)
                setForm({ company: '', category: '기타', phone: '', fax: '', address: '', businessNumber: '', memo: '', url1: '', url2: '' })
              }}
              className="px-3 py-2 rounded border text-sm"
            >
              수정 취소
            </button>
          ) : null}
          {message ? <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p> : null}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="업체명/카테고리/번호 검색"
            className="w-full px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {['전체', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs border ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoaderSwitcher label="폰북을 불러오는 중..." />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">저장된 연락처가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => (
              <article
                key={it.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"
              >
                <div className="flex flex-wrap justify-between gap-2 items-start">
                  <div>
                    <h3 className="font-semibold">{it.company}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">#{it.category}</p>
                    <p className="mt-1 text-sm">{it.phone}</p>
                    {it.fax ? <p className="mt-1 text-xs text-gray-500">FAX: {it.fax}</p> : null}
                    {it.address ? <p className="mt-1 text-xs text-gray-500">주소: {it.address}</p> : null}
                    {it.businessNumber ? <p className="mt-1 text-xs text-gray-500">사업자번호: {it.businessNumber}</p> : null}
                    {it.memo ? <p className="mt-1 text-xs text-gray-500">{it.memo}</p> : null}
                    {it.url1 ? <a href={it.url1} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-indigo-600 break-all">{it.url1}</a> : null}
                    {it.url2 ? <a href={it.url2} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-indigo-600 break-all">{it.url2}</a> : null}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => copyPhone(it.phone)}
                      className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      복사
                    </button>
                    <button
                      onClick={() => shareContact(it)}
                      className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      공유
                    </button>
                    <a
                      href={`tel:${it.phone.replace(/[^0-9+]/g, '')}`}
                      className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      전화
                    </a>
                    <button
                      onClick={() => {
                        setEditingId(it.id || null)
                        setForm({
                          company: it.company,
                          category: it.category,
                          phone: it.phone,
                          fax: it.fax || '',
                          address: it.address || '',
                          businessNumber: it.businessNumber || '',
                          memo: it.memo || '',
                          url1: it.url1 || '',
                          url2: it.url2 || '',
                        })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm hover:bg-amber-600"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
