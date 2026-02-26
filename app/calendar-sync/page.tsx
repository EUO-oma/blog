'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import {
  deleteCalendarCacheItemById,
  getCalendarCacheItemById,
  updateCalendarCacheItem,
  type CalendarTodayCacheItem,
} from '@/lib/firebase-calendar-cache'

function CalendarSyncDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''
  const router = useRouter()
  const { user } = useAuth()

  const [item, setItem] = useState<CalendarTodayCacheItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({ title: '', description: '', location: '', startAt: '', endAt: '', allDay: false })

  const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || ''
  const gasApiToken = process.env.NEXT_PUBLIC_GAS_SYNC_TOKEN || ''
  const canEdit = user?.email?.toLowerCase() === 'icandoit13579@gmail.com'

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const found = await getCalendarCacheItemById(id)
        setItem(found)
        if (found) {
          setForm({
            title: found.title || '',
            description: found.description || '',
            location: found.location || '',
            startAt: found.startAt || '',
            endAt: found.endAt || '',
            allDay: !!found.allDay,
          })
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const syncNow = async () => {
    if (!gasWebAppUrl || !gasApiToken) return
    await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'syncNow', token: gasApiToken }),
    }).catch(() => {})
  }

  const save = async () => {
    if (!canEdit || !item) return
    if (!gasWebAppUrl || !gasApiToken) return setMsg('GAS 연동 변수가 필요해요.')

    setSaving(true)
    setMsg('')
    try {
      await updateCalendarCacheItem(item.id, {
        title: form.title,
        description: form.description,
        location: form.location,
        startAt: form.startAt,
        endAt: form.endAt,
        allDay: form.allDay,
      })

      const res = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateEvent',
          eventId: item.eventId,
          token: gasApiToken,
          payload: {
            title: form.title,
            description: form.description,
            location: form.location,
            startAt: form.startAt,
            endAt: form.endAt,
            allDay: form.allDay,
          },
        }),
      })
      const data = await res.json()
      if (!data?.ok) setMsg(`원본 반영 실패: ${data?.error || 'unknown'}`)
      else setMsg('저장 완료')

      await syncNow()
    } catch (e: any) {
      setMsg(`저장 실패: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!canEdit || !item) return
    if (!gasWebAppUrl || !gasApiToken) return setMsg('GAS 연동 변수가 필요해요.')
    if (!confirm('이 일정을 삭제할까요?')) return

    try {
      await deleteCalendarCacheItemById(item.id)
      setMsg('목록에서 제거됨. 원본 삭제 처리 중...')

      await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEvent', eventId: item.eventId, token: gasApiToken }),
      }).catch(() => {})

      await syncNow()
      router.push('/schedule')
    } catch (e: any) {
      setMsg(`삭제 실패: ${e?.message || e}`)
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><LoaderSwitcher label="일정 상세 불러오는 중..." /></div>
  if (!item) return <p className="text-gray-500">해당 일정을 찾을 수 없어.</p>

  return (
    <main className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">동기화 일정 상세</h1>
        <button onClick={() => router.push('/schedule')} className="px-3 py-1.5 rounded border text-sm">일정으로</button>
      </div>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 space-y-3">
        <div><label className="text-sm">제목</label><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" /></div>
        <div><label className="text-sm">설명</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="text-sm">시작</label><input value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" /></div>
          <div><label className="text-sm">종료</label><input value={form.endAt} onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))} className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" /></div>
        </div>
        <div><label className="text-sm">장소</label><input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" /></div>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allDay} onChange={(e) => setForm((p) => ({ ...p, allDay: e.target.checked }))} /> 종일 일정</label>

        <div className="flex gap-2">
          <button onClick={save} disabled={!canEdit || saving} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">{saving ? '저장중...' : '저장'}</button>
          <button onClick={remove} disabled={!canEdit} className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50">삭제</button>
          <a href={item.editUrl || item.openUrl || '#'} target="_blank" rel="noreferrer" className="px-4 py-2 rounded border">캘린더 열기</a>
        </div>
        {msg ? <p className="text-sm text-gray-500">{msg}</p> : null}
      </section>
    </main>
  )
}

export default function CalendarSyncDetailPage() {
  return (
    <Suspense fallback={<div className="py-10 flex justify-center"><LoaderSwitcher label="일정 상세 불러오는 중..." /></div>}>
      <CalendarSyncDetailInner />
    </Suspense>
  )
}
