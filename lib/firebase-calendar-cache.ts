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
  const today = new Date().toISOString().slice(0, 10)
  const q = query(collection(db, COL), orderBy('startAt', 'asc'))
  const snap = await getDocs(q)

  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CalendarTodayCacheItem[]
  return all.filter((it) => String(it.startAt || '').startsWith(today))
}
