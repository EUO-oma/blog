'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createImage, deleteImage, getImages, updateImage, type ImageItem } from '@/lib/firebase-images'

const OWNER_EMAIL = 'icandoit13579@gmail.com'

type SignResponse = {
  signedUrl: string
  publicUrl: string
  objectKey: string
}

export default function ImgPage() {
  const { user } = useAuth()
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL

  const [items, setItems] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [q, setQ] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashMsg = (text: string, ms = 1800) => {
    setMsg(text)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMsg(''), ms)
  }

  const signerUrl = process.env.NEXT_PUBLIC_R2_SIGNER_URL || ''
  const signerToken = process.env.NEXT_PUBLIC_R2_SIGNER_TOKEN || ''

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getImages())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-img'
    load()
  }, [])

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    }
  }, [])

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return items
    return items.filter((i) => `${i.title} ${i.note || ''}`.toLowerCase().includes(k))
  }, [items, q])

  const add = async () => {
    if (!isOwner) return flashMsg('등록 권한이 없어.')
    if (!title.trim() || !file) return flashMsg('제목/이미지는 필수야.')
    if (!signerUrl || !signerToken) return flashMsg('R2 signer 환경변수를 먼저 설정해줘.', 2600)

    try {
      setUploading(true)
      flashMsg('업로드 준비 중...')

      const signRes = await fetch(`${signerUrl.replace(/\/$/, '')}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signerToken}`,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        }),
      })

      if (!signRes.ok) throw new Error(`서명 요청 실패 (${signRes.status})`)
      const signed = (await signRes.json()) as SignResponse

      flashMsg('R2 업로드 중...')
      const putRes = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })
      if (!putRes.ok) throw new Error(`R2 업로드 실패 (${putRes.status})`)

      await createImage({
        title: title.trim(),
        note: note.trim(),
        imageUrl: signed.publicUrl,
        objectKey: signed.objectKey,
        authorEmail: user?.email || OWNER_EMAIL,
      })

      setTitle('')
      setNote('')
      setFile(null)
      setShowAddForm(false)
      flashMsg('등록 완료')
      await load()
    } catch (e: any) {
      flashMsg(`등록 실패: ${e?.message || e}`, 2800)
    } finally {
      setUploading(false)
    }
  }

  const remove = async (item: ImageItem) => {
    if (!isOwner || !item.id) return

    try {
      if (signerUrl && signerToken && item.objectKey) {
        await fetch(`${signerUrl.replace(/\/$/, '')}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${signerToken}`,
          },
          body: JSON.stringify({ objectKey: item.objectKey }),
        }).catch(() => null)
      }

      await deleteImage(item.id)
      flashMsg('삭제 완료')
      await load()
    } catch (e: any) {
      flashMsg(`삭제 실패: ${e?.message || e}`)
    }
  }

  return (
    <main className="max-w-4xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">IMG</h1>
        {isOwner && (
          <button onClick={() => setShowAddForm((v) => !v)} className="text-indigo-600 hover:text-indigo-900 p-1" title="이미지 등록">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {isOwner && showAddForm && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800 space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="메모(선택)" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700 dark:text-gray-200"
          />
          <div className="flex justify-end">
            <button
              onClick={add}
              disabled={uploading}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white hover:bg-sky-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700 w-full" />

      {loading ? (
        <div className="py-6 flex justify-center"><LoaderSwitcher label="이미지 불러오는 중..." /></div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((it) => (
            <article key={it.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-900">
                <img src={it.imageUrl} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-3 space-y-2">
                <input
                  defaultValue={it.title}
                  onBlur={(e) => it.id && isOwner && updateImage(it.id, { title: e.target.value.trim() })}
                  readOnly={!isOwner}
                  className="w-full bg-transparent outline-none font-semibold"
                />
                <input
                  defaultValue={it.note || ''}
                  onBlur={(e) => it.id && isOwner && updateImage(it.id, { note: e.target.value.trim() })}
                  readOnly={!isOwner}
                  className="w-full bg-transparent outline-none text-sm text-gray-500 dark:text-gray-400"
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(it.imageUrl)
                        flashMsg('URL 복사 완료')
                      } catch {
                        flashMsg('복사 실패')
                      }
                    }}
                    className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1"
                    title="URL 복사"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-8 8h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {isOwner && (
                    <button onClick={() => remove(it)} className="text-red-600 hover:text-red-800 p-1" title="삭제">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500">등록된 이미지가 없습니다.</p>}
        </section>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
