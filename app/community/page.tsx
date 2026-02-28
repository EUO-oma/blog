'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createCommunityPost, deleteCommunityPost, getCommunityPosts } from '@/lib/firebase-community'
import { CommunityPost } from '@/lib/firebase'
import { getMyApproval, requestApproval } from '@/lib/firebase-approvals'

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [approval, setApproval] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [msg, setMsg] = useState('')

  const owner = user?.email?.toLowerCase() === 'icandoit13579@gmail.com'
  const canWrite = owner || approval === 'approved'

  const flash = (text: string, ms = 1500) => {
    setMsg(text)
    setTimeout(() => setMsg(''), ms)
  }

  const load = async () => {
    setLoading(true)
    try {
      const rows = await getCommunityPosts()
      setPosts(rows)
      if (user?.email) {
        const ap = await getMyApproval(user.email)
        setApproval((ap?.status as any) || 'none')
      } else {
        setApproval('none')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-community'
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const submit = async () => {
    if (!user?.email || !canWrite) return

    const lines = draft.split(/\r?\n/)
    const first = (lines[0] || '').trim()
    const rest = lines.slice(1).join('\n').trim()
    if (!first || !rest) return flash('첫 줄은 제목, 아래 줄은 본문으로 입력해줘')

    await createCommunityPost({
      title: first,
      content: rest,
      authorEmail: user.email,
      authorName: user.displayName || user.email,
    })
    setDraft('')
    flash('등록 완료')
    await load()
  }

  return (
    <main className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Community</h1>

      {!user && <p className="text-sm text-gray-500">읽기는 누구나 가능, 작성은 로그인+승인 후 가능해요.</p>}

      {user && !canWrite && (
        <div className="rounded border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20 p-3 text-sm">
          {approval === 'pending' && <p>승인 대기중입니다.</p>}
          {approval === 'rejected' && <p>승인이 거절되었습니다. 관리자에게 문의하세요.</p>}
          {approval === 'none' && (
            <button onClick={async () => { await requestApproval(user.email!); setApproval('pending'); flash('승인 요청 완료') }} className="text-indigo-600 hover:text-indigo-900">
              회원가입 승인 요청하기
            </button>
          )}
        </div>
      )}

      {user && canWrite && (
        <section className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={"첫 줄은 자동으로 제목으로 저장됩니다.\n둘째 줄부터 본문으로 저장됩니다.\n\n텔레그램 채팅처럼 편하게 입력해줘"}
            rows={6}
            className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <div className="flex justify-end">
            <button
              onClick={submit}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition shadow-sm"
              title="전송"
              aria-label="전송"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.426 11.095 4.23 3.488a1 1 0 0 0-1.37 1.16l1.7 5.95a1 1 0 0 0 .74.7l7.13 1.54-7.13 1.54a1 1 0 0 0-.74.7l-1.7 5.95a1 1 0 0 0 1.37 1.16l17.196-7.607a1 1 0 0 0 0-1.828z" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="커뮤니티 불러오는 중..." /></div>
      ) : (
        <section className="space-y-0">
          {posts.map((p) => (
            <article key={p.id} className="py-3 border-b border-gray-200/80 dark:border-gray-700/80">
              <h2 className="font-semibold">{p.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-1">{p.content}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{p.authorName}</span>
                <div className="flex items-center gap-2">
                  <span>{(p.createdAt as any)?.toDate?.()?.toLocaleString?.('ko-KR') || ''}</span>
                  {(owner || user?.email?.toLowerCase() === p.authorEmail?.toLowerCase()) && p.id && (
                    <button onClick={() => deleteCommunityPost(p.id!).then(load)} className="text-red-600 hover:text-red-800 p-1" title="삭제">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {posts.length === 0 && <p className="text-sm text-gray-500 py-3">아직 글이 없습니다.</p>}
        </section>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
