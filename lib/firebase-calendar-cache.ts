import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'

export type CalendarTodayCacheItem = {
  id: string
  eventId: string
  title: string
  description: string
  location: string
  startAt: string
  endAt: string
  allDay: boolean
  status: string
  source: string
  syncedAt?: any
}

const COL = 'calendar_today_cache'

export async function getTodayCalendarCacheItems(): Promise<CalendarTodayCacheItem[]> {
  return getCalendarRangeCacheItems(0)
}

export async function getCalendarRangeCacheItems(rangeDays = 30): Promise<CalendarTodayCacheItem[]> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + rangeDays)
  end.setHours(23, 59, 59, 999)

  const q = query(collection(db, COL), orderBy('startAt', 'asc'))
  const snap = await getDocs(q)
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CalendarTodayCacheItem[]

  return all.filter((it) => {
    const raw = String(it.startAt || '')
    if (!raw) return false
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return false
    return date >= start && date <= end
  })
}
