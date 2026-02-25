import type { Tables, TablesInsert } from '@/lib/supabase.types'

export type WalterCommand = Pick<
  Tables<'walter_commands'>,
  'id' | 'created_at' | 'command_text' | 'status' | 'result_text'
>

export type WalterCommandStatus = 'queued' | 'running' | 'done' | 'error'

const OWNER_ID = '8497629423'
const WORKER_KEY = 'WALTER_WORKER_TOKEN_001'

type Env = { url: string; anon: string }

function getEnv(): Env {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return { url, anon }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, anon } = getEnv()
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase 요청 실패 (${res.status}): ${text}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  return (await res.json()) as T
}

export async function listWalterCommands(limit = 100): Promise<WalterCommand[]> {
  return request<WalterCommand[]>(
    `/rest/v1/walter_commands?select=id,created_at,command_text,status,result_text&order=created_at.desc&limit=${limit}`
  )
}

export async function createWalterCommand(commandText: string): Promise<void> {
  const payload: WalterCommandInsert[] = [
    {
      owner_id: OWNER_ID,
      source: 'blog',
      command_text: commandText,
      worker_key: WORKER_KEY,
      status: 'queued',
    } as WalterCommandInsert,
  ]

  await request<unknown>('/rest/v1/walter_commands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteWalterCommandById(id: string): Promise<void> {
  await request<unknown>(`/rest/v1/walter_commands?id=eq.${id}&owner_id=eq.${OWNER_ID}`, {
    method: 'DELETE',
  })
}

export async function deleteWalterCommandsByStatus(statuses: WalterCommandStatus[]): Promise<void> {
  const joined = statuses.join(',')
  await request<unknown>(`/rest/v1/walter_commands?owner_id=eq.${OWNER_ID}&status=in.(${joined})`, {
    method: 'DELETE',
  })
}

export async function deleteWalterCommandsByIds(ids: string[]): Promise<void> {
  const idList = ids.map((id) => `"${id}"`).join(',')
  await request<unknown>(`/rest/v1/walter_commands?id=in.(${idList})&owner_id=eq.${OWNER_ID}`, {
    method: 'DELETE',
  })
}
