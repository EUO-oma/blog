'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createImage, deleteImage, getImages, updateImage, type ImageItem } from '@/lib/firebase-images'

const OWNER_EMAIL = 'icandoit13579@gmail.com'

type UploadResponse = {
  publicUrl: string
  objectKey: string
}

type Variant = 'thumb' | 'medium' | 'original'

function defaultTitle() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `IMG_${yyyy}${mm}${dd}_${hh}${mi}${ss}`
}

function safeFilename(name: string) {
  return (name || 'image').replace(/[\\/:*?"<>|\s]+/g, '_')
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

async function makeResizedBlob(file: File, targetLongEdge: number, quality = 0.8): Promise<Blob> {
  const img = await fileToImage(file)
  const longEdge = Math.max(img.width, img.height)
  const ratio = longEdge > targetLongEdge ? targetLongEdge / longEdge : 1

  const width = Math.max(1, Math.round(img.width * ratio))
  const height = Math.max(1, Math.round(img.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 생성 실패')
  ctx.drawImage(img, 0, 0, width, height)

  const webpBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
  })
  if (webpBlob) return webpBlob

  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
  if (jpegBlob) return jpegBlob

  throw new Error('리사이즈 실패')
}

export default function ImgPage() {
  const { user } = useAuth()
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL

  const [items, setItems] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [keepOriginal, setKeepOriginal] = useState(false)

  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    } catch (e: any) {
      flashMsg(`load failed: ${e?.message || e}`, 2400)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-img'
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const uploadVariant = async (blob: Blob, fileName: string, variant: Variant): Promise<UploadResponse> => {
    const uploadRes = await fetch(`${signerUrl.replace(/\/$/, '')}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${signerToken}`,
        'x-filename': encodeURIComponent(`${variant}_${fileName}`),
        'x-content-type': blob.type || 'application/octet-stream',
        'x-size': String(blob.size),
        'Content-Type': blob.type || 'application/octet-stream',
      },
      body: blob,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '')
      throw new Error(`R2 업로드 실패 (${variant} / ${uploadRes.status}) ${errText}`)
    }

    return (await uploadRes.json()) as UploadResponse
  }

  const uploadNow = async (file: File) => {
    if (!isOwner) return flashMsg('등록 권한이 없어.')
    if (!signerUrl || !signerToken) return flashMsg('R2 signer 환경변수를 먼저 설정해줘.', 2600)
    if (!file.type.startsWith('image/')) return flashMsg('이미지 파일만 업로드 가능해.')

    try {
      setUploading(true)
      flashMsg('썸네일/미디엄 생성 중...')

      const thumbBlob = await makeResizedBlob(file, 560, 0.75)
      const mediumBlob = await makeResizedBlob(file, 1440, 0.82)

      flashMsg('업로드 중...')
      const [thumbUploaded, mediumUploaded] = await Promise.all([
        uploadVariant(thumbBlob, file.name, 'thumb'),
        uploadVariant(mediumBlob, file.name, 'medium'),
      ])

      let originalUploaded: UploadResponse | null = null
      if (keepOriginal) {
        originalUploaded = await uploadVariant(file, file.name, 'original')
      }

      await createImage({
        title: defaultTitle(),
        note: '',
        imageUrl: originalUploaded?.publicUrl || mediumUploaded.publicUrl,
        imageUrlThumb: thumbUploaded.publicUrl,
        imageUrlMedium: mediumUploaded.publicUrl,
        imageUrlOriginal: originalUploaded?.publicUrl,
        objectKey: originalUploaded?.objectKey || mediumUploaded.objectKey,
        objectKeyThumb: thumbUploaded.objectKey,
        objectKeyMedium: mediumUploaded.objectKey,
        objectKeyOriginal: originalUploaded?.objectKey,
        authorEmail: user?.email || OWNER_EMAIL,
      })

      flashMsg('등록 완료')
      await load()
    } catch (e: any) {
      flashMsg(`등록 실패: ${e?.message || e}`, 3200)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const saveTitleEdit = async (item: ImageItem) => {
    if (!isOwner || !item.id) return
    const nextTitle = editingTitle.trim() || item.title

    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, title: nextTitle } : v)))
    setEditingTitleId(null)

    try {
      await updateImage(item.id, { title: nextTitle })
      flashMsg('제목 수정 완료', 1200)
    } catch (e: any) {
      flashMsg(`제목 수정 실패: ${e?.message || e}`, 2200)
      await load()
    }
  }

  const downloadImage = async (item: ImageItem) => {
    if (!isOwner) return

    const highQuality = window.confirm('고화질로 다운로드할까?\n확인 = 고화질 / 취소 = 저용량')
    const sourceUrl = highQuality ? (item.imageUrlOriginal || item.imageUrlMedium || item.imageUrl) : (item.imageUrlMedium || item.imageUrl)

    try {
      setDownloadingId(item.id || null)
      const response = await fetch(sourceUrl)
      if (!response.ok) throw new Error(`다운로드 실패 (${response.status})`)
      const blob = await response.blob()

      let finalBlob = blob
      if (!highQuality) {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image()
          el.crossOrigin = 'anonymous'
          el.onload = () => resolve(el)
          el.onerror = reject
          el.src = URL.createObjectURL(blob)
        })

        const maxWidth = 1280
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas 생성 실패')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        finalBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('저용량 변환 실패'))), 'image/jpeg', 0.82)
        })
      }

      const url = URL.createObjectURL(finalBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeFilename(item.title)}${highQuality ? '' : '_lite'}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      flashMsg(highQuality ? '고화질 다운로드 완료' : '저용량 다운로드 완료')
    } catch (e: any) {
      flashMsg(`다운로드 실패: ${e?.message || e}`, 2200)
    } finally {
      setDownloadingId(null)
    }
  }

  const remove = async (item: ImageItem) => {
    if (!isOwner || !item.id) return

    try {
      if (signerUrl && signerToken) {
        const keys = [item.objectKeyThumb, item.objectKeyMedium, item.objectKeyOriginal, item.objectKey].filter(Boolean) as string[]
        await Promise.all(
          keys.map((objectKey) =>
            fetch(`${signerUrl.replace(/\/$/, '')}/delete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${signerToken}`,
              },
              body: JSON.stringify({ objectKey }),
            }).catch(() => null)
          )
        )
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
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadNow(f)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-sky-500 text-white hover:bg-sky-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="이미지 추가"
              aria-label="이미지 추가"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H13V5a1 1 0 1 0-2 0v6H5a1 1 0 1 0 0 2h6v6a1 1 0 1 0 2 0v-6h6a1 1 0 1 0 0-2z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {isOwner && (
        <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 select-none">
          <input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} />
          원본도 함께 저장(기본 OFF)
        </label>
      )}

      <p className="text-xs text-gray-500">+ 버튼을 누르면 사진 선택 후 바로 저장돼. 기본은 썸네일/미디엄만 저장하고, 원본은 다운로드 전용으로 선택 저장 가능해.</p>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700 w-full" />

      {loading ? (
        <div className="py-6 flex justify-center"><LoaderSwitcher label="이미지 불러오는 중..." /></div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((it) => {
            const cardUrl = it.imageUrlThumb || it.imageUrlMedium || it.imageUrl
            const modalUrl = it.imageUrlMedium || it.imageUrlThumb || it.imageUrl

            return (
              <article key={it.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-900">
                  <button type="button" onClick={() => setPreviewUrl(modalUrl)} className="w-full h-full">
                    <img src={cardUrl} alt={it.title} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(it.imageUrlOriginal || it.imageUrlMedium || it.imageUrl)
                          flashMsg('URL 복사 완료')
                        } catch {
                          flashMsg('복사 실패')
                        }
                      }}
                      className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1"
                      title="URL 복사"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      {isOwner && editingTitleId === it.id ? (
                        <input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => saveTitleEdit(it)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveTitleEdit(it)
                            }
                            if (e.key === 'Escape') {
                              setEditingTitleId(null)
                              setEditingTitle('')
                            }
                          }}
                          autoFocus
                          className="w-full bg-transparent outline-none font-semibold text-center"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isOwner) return
                            setEditingTitleId(it.id || null)
                            setEditingTitle(it.title || '')
                          }}
                          className="w-full text-center bg-transparent outline-none font-semibold truncate"
                          title="제목 수정"
                        >
                          {it.title}
                        </button>
                      )}
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => downloadImage(it)}
                        disabled={downloadingId === it.id}
                        className="text-emerald-600 hover:text-emerald-800 p-1 disabled:opacity-50"
                        title="다운로드 (고화질/저용량 선택)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 5v10m0 0l-3-3m3 3l3-3" />
                        </svg>
                      </button>
                    )}

                    <span className="w-2" />

                    {isOwner && (
                      <button onClick={() => remove(it)} className="text-red-600 hover:text-red-800 p-1" title="삭제">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <input
                    defaultValue={it.note || ''}
                    onBlur={(e) => it.id && isOwner && updateImage(it.id, { note: e.target.value.trim() })}
                    readOnly={!isOwner}
                    className="w-full bg-transparent outline-none text-sm text-gray-500 dark:text-gray-400"
                  />
                </div>
              </article>
            )
          })}
          {filtered.length === 0 && <p className="text-sm text-gray-500">등록된 이미지가 없습니다.</p>}
        </section>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-[94] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="preview"
            className="max-w-[96vw] max-h-[92vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 text-white/90 hover:text-white p-2"
            title="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
