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
const STALE_HOURS = Number(process.env.WALTER_STALE_HOURS || 12)

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
  console.log(`[walter-worker] owner=${OWNER_ID}, pollMs=${POLL_MS}, staleHours=${STALE_HOURS}`)

  while (true) {
    try {
      await pollOnce()
    } catch (e) {
      console.error('[walter-worker] poll error:', e?.message || e)
    }
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
}

main()
