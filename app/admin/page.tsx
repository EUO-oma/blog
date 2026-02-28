'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { listPendingApprovals, setApproval, UserApproval } from '@/lib/firebase-approvals'

export default function AdminPage() {
  const { user } = useAuth()
  const owner = user?.email?.toLowerCase() === 'icandoit13579@gmail.com'
  const [rows, setRows] = useState<UserApproval[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      if (!owner) return
      setRows(await listPendingApprovals())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-admin'
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner])

  if (!owner) return <main className="max-w-3xl mx-auto"><p className="text-red-500">관리자만 접근 가능</p></main>

  return (
    <main className="max-w-3xl mx-auto space-y-3">
      <h1 className="text-3xl font-bold">Admin 승인 관리</h1>
      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="승인 목록 불러오는 중..." /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">대기중 요청이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 flex items-center justify-between">
              <div>
                <p className="font-medium">{r.email}</p>
                <p className="text-xs text-gray-500">요청: {(r.requestedAt as any)?.toDate?.()?.toLocaleString?.('ko-KR') || ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setApproval(r.email, 'approved', user?.email || '').then(load)} className="text-emerald-600 hover:text-emerald-800 p-1" title="승인">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
                <button onClick={() => setApproval(r.email, 'rejected', user?.email || '').then(load)} className="text-red-600 hover:text-red-800 p-1" title="거절">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
