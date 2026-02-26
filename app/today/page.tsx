'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { Schedule, Timestamp } from '@/lib/firebase'
import { deleteSchedule, getSchedules, updateSchedule } from '@/lib/firebase-schedules'
import { CalendarTodayCacheItem, getTodayCalendarCacheItems } from '@/lib/firebase-calendar-cache'

const OWNER_EMAIL = 'icandoit13579@gmail.com'

function toDate(value: any): Date | null {
  try {
    if (!value) return null
    if (typeof value?.toDate === 'function') return value.toDate()
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export default function TodayPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Schedule[]>([])
  const [cacheRows, setCacheRows] = useState<CalendarTodayCacheItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const canEdit = user?.email?.toLowerCase() === OWNER_EMAIL
  const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || ''
  const gasApiToken = process.env.NEXT_PUBLIC_GAS_SYNC_TOKEN || ''

  const load = async () => {
    setLoading(true)
    try {
      const [list, cache] = await Promise.all([getSchedules(), getTodayCalendarCacheItems()])
      setRows(list)
      setCacheRows(cache)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const todayItems = useMemo(() => {
    const now = new Date()
    return rows
      .filter((r) => {
        const d = toDate(r.startDate)
        return !!d && d.toDateString() === now.toDateString()
      })
      .sort((a, b) => {
        const aa = toDate(a.startDate)?.getTime() || 0
        const bb = toDate(b.startDate)?.getTime() || 0
        return aa - bb
      })
  }, [rows])

  const moveToTomorrow = async (item: Schedule) => {
    if (!canEdit || !item.id) return

    const start = toDate(item.startDate)
    if (!start) return

    const nextStart = new Date(start)
    nextStart.setDate(nextStart.getDate() + 1)

    const patch: Partial<Schedule> = {
      startDate: Timestamp.fromDate(nextStart),
    }

    const end = toDate(item.endDate)
    if (end) {
      const nextEnd = new Date(end)
      nextEnd.setDate(nextEnd.getDate() + 1)
      patch.endDate = Timestamp.fromDate(nextEnd)
    }

    await updateSchedule(item.id, patch)
    setMessage('내일로 이동 완료')
    await load()
  }

  const removeItem = async (item: Schedule) => {
    if (!canEdit || !item.id) return
    if (!confirm('이 일정을 삭제할까요?')) return
    await deleteSchedule(item.id)
    setMessage('삭제 완료')
    await load()
  }

  const copyItem = async (item: Schedule) => {
    const start = toDate(item.startDate)
    const time = start
      ? start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      : '-'
    const text = `🗓️ ${item.title}\n⏰ ${time}\n📝 ${item.description}${item.location ? `\n📍 ${item.location}` : ''}`
    await navigator.clipboard.writeText(text)
    setMessage('일정 복사 완료')
    setTimeout(() => setMessage(''), 1200)
  }

  const deleteFromGoogleCalendar = async (eventId: string) => {
    if (!canEdit) return
    if (!gasWebAppUrl || !gasApiToken) {
      setMessage('GAS 연동 설정(NEXT_PUBLIC_GAS_WEBAPP_URL / TOKEN)이 필요해요.')
      return
    }
    if (!confirm('구글 캘린더 원본에서 이 일정을 삭제할까요?')) return

    const payload = JSON.stringify({ action: 'deleteEvent', eventId, token: gasApiToken })

    try {
      // 1차: 일반 호출(응답 파싱 가능)
      const res = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      const data = await res.json()
      if (!data?.ok) {
        setMessage(`캘린더 삭제 실패: ${data?.error || 'unknown'}`)
        return
      }
      await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncNow', token: gasApiToken }),
      }).catch(() => {})

      if (data?.deleted === false) {
        setMessage('이미 캘린더에서 삭제된 일정이야. 목록을 최신화했어.')
      } else {
        setMessage('캘린더 원본 삭제 완료')
      }
      await load()
    } catch {
      // 2차: CORS 환경(정적 호스팅) 우회용 fire-and-refresh
      try {
        await fetch(gasWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: payload,
        })
        setMessage('삭제 요청을 보냈어. 동기화 후 목록을 새로고침할게.')
        setTimeout(() => {
          load()
        }, 1500)
      } catch (e: any) {
        setMessage(`캘린더 삭제 오류: ${e?.message || e}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoaderSwitcher label="오늘 보드를 준비하는 중..." />
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto py-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Today</h1>
        <p className="text-sm text-gray-500">오늘 해야 할 일정만 빠르게 정리하는 보드</p>
      </div>

      <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-100">
        오늘 일정 <b>{todayItems.length}</b>건
        {message ? <span className="ml-3">• {message}</span> : null}
      </div>

      {user && cacheRows.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Google Calendar 동기화</h2>
          <div className="space-y-2">
            {cacheRows.map((item) => {
              const time = item.allDay ? '종일' : (item.startAt?.slice(11, 16) || '-')
              return (
                <article key={item.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900/40 dark:bg-indigo-900/20">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</div>
                      <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">{time}{item.location ? ` · ${item.location}` : ''}</div>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={item.editUrl || `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(`${item.title} ${item.startAt || ''}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 px-2 py-1 rounded border text-[11px] bg-white/80 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700"
                      >
                        열기
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => deleteFromGoogleCalendar(item.eventId)}
                          className="shrink-0 px-2 py-1 rounded border text-[11px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {todayItems.length === 0 ? (
        cacheRows.length > 0 ? (
          <p className="text-gray-500">오늘 일정은 Google 동기화 섹션에서 확인할 수 있어.</p>
        ) : (
          <p className="text-gray-500">오늘 일정이 없어. 한가한 날이네 🙂</p>
        )
      ) : (
        <div className="space-y-3">
          {todayItems.map((item) => {
            const d = toDate(item.startDate)
            const time = d
              ? d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '-'
            return (
              <article
                key={item.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-base sm:text-lg">{item.title}</h2>
                    <p className="text-xs text-gray-500 mt-1">{time}</p>
                    <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.description}</p>
                    {item.location ? (
                      <p className="text-xs mt-1 text-gray-500">📍 {item.location}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyItem(item)}
                      className="px-2.5 py-1.5 rounded border text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      복사
                    </button>
                    <button
                      onClick={() => moveToTomorrow(item)}
                      disabled={!canEdit}
                      className="px-2.5 py-1.5 rounded border text-xs bg-amber-50 text-amber-700 border-amber-200 disabled:opacity-50"
                    >
                      내일로
                    </button>
                    <button
                      onClick={() => removeItem(item)}
                      disabled={!canEdit}
                      className="px-2.5 py-1.5 rounded text-xs bg-red-600 text-white disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
