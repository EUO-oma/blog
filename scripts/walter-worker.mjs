#!/usr/bin/env node

/**
 * Walter Queue Monitor Worker (Railway-ready)
 * - Polls walter_commands queue in Supabase
 * - Logs queue/running/error stats
 * - Detects stale queued jobs (default: >12h)
 *
 * Phase 1 is READ-ONLY on purpose (safe rollout).
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const OWNER_ID = process.env.WALTER_OWNER_ID || '8497629423'
const POLL_MS = Number(process.env.WALTER_POLL_MS || 30000)
const OFF_HOURS_POLL_MS = Number(process.env.WALTER_OFF_HOURS_POLL_MS || 300000)
const STALE_HOURS = Number(process.env.WALTER_STALE_HOURS || 12)
const ACTIVE_TZ = process.env.WALTER_TZ || 'Asia/Seoul'
const ACTIVE_START_HOUR = Number(process.env.WALTER_ACTIVE_START_HOUR || 8)
const ACTIVE_END_HOUR = Number(process.env.WALTER_ACTIVE_END_HOUR || 19)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[walter-worker] Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or anon key)')
  process.exit(1)
}

const endpoint = `${SUPABASE_URL}/rest/v1/walter_commands?select=id,status,created_at,command_text&owner_id=eq.${OWNER_ID}&order=created_at.desc&limit=200`

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

let tick = 0

function getHourInTimezone(tz) {
  const h = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    hour12: false,
  }).format(new Date())
  return Number(h)
}

function isInActiveWindow() {
  const hour = getHourInTimezone(ACTIVE_TZ)
  // start inclusive, end exclusive: 08:00 <= now < 19:00
  return hour >= ACTIVE_START_HOUR && hour < ACTIVE_END_HOUR
}

async function pollOnce() {
  tick += 1
  const now = Date.now()

  const res = await fetch(endpoint, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase read failed (${res.status}): ${text}`)
  }

  const rows = await res.json()

  const stats = { queued: 0, running: 0, done: 0, error: 0, all: rows.length }
  for (const r of rows) {
    const s = String(r.status || '').toLowerCase()
    if (s in stats) stats[s] += 1
  }

  const staleMs = STALE_HOURS * 60 * 60 * 1000
  const staleQueued = rows.filter((r) => {
    if (String(r.status) !== 'queued') return false
    const t = new Date(r.created_at).getTime()
    return Number.isFinite(t) && now - t > staleMs
  })

  const line = `[walter-worker] tick=${tick} all=${stats.all} queued=${stats.queued} running=${stats.running} done=${stats.done} error=${stats.error} staleQueued=${staleQueued.length}`
  console.log(line)

  if (staleQueued.length > 0) {
    const preview = staleQueued
      .slice(0, 3)
      .map((r) => `- ${new Date(r.created_at).toLocaleString('ko-KR')} | ${String(r.command_text || '').slice(0, 80)}`)
      .join('\n')
    console.warn(`[walter-worker] stale queued detected (> ${STALE_HOURS}h)\n${preview}`)
  }
}

async function main() {
  console.log('[walter-worker] started')
  console.log(
    `[walter-worker] owner=${OWNER_ID}, pollMs=${POLL_MS}, offHoursPollMs=${OFF_HOURS_POLL_MS}, staleHours=${STALE_HOURS}, activeWindow=${ACTIVE_START_HOUR}:00-${ACTIVE_END_HOUR}:00 (${ACTIVE_TZ})`
  )

  while (true) {
    const activeNow = isInActiveWindow()

    if (!activeNow) {
      const hour = getHourInTimezone(ACTIVE_TZ)
      console.log(`[walter-worker] off-hours now (${hour}:00 ${ACTIVE_TZ}) -> sleeping`)
      await new Promise((r) => setTimeout(r, OFF_HOURS_POLL_MS))
      continue
    }

    try {
      await pollOnce()
    } catch (e) {
      console.error('[walter-worker] poll error:', e?.message || e)
    }
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
}

main()
