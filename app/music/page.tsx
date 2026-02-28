'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createMusicItem, deleteMusicItem, extractVideoId, getMusicItems, updateMusicItem } from '@/lib/firebase-music'
import { MusicItem } from '@/lib/firebase'

type SourceMode = 'youtube' | 'audio'

export default function MusicPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<MusicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [sourceMode, setSourceMode] = useState<SourceMode>('youtube')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const owner = user?.email?.toLowerCase() === 'icandoit13579@gmail.com'
  const signerUrl = process.env.NEXT_PUBLIC_R2_SIGNER_URL || ''
  const signerToken = process.env.NEXT_PUBLIC_R2_SIGNER_TOKEN || ''

  const flash = (text: string, ms = 1500) => {
    setMsg(text)
    setTimeout(() => setMsg(''), ms)
  }

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getMusicItems())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-music'
    load()
  }, [])

  const addYoutube = async () => {
    if (!owner) return
    const videoId = extractVideoId(urlInput.trim())
    if (!videoId) return flash('유효한 유튜브 링크를 넣어줘')

    await createMusicItem({
      sourceType: 'youtube',
      videoId,
      title: `music_${new Date().toISOString().slice(0, 19).replace('T', '_')}`,
      note: '',
      sortOrder: items.length,
      authorEmail: user?.email || 'icandoit13579@gmail.com',
      authorName: user?.displayName || user?.email || 'owner',
    })
    setUrlInput('')
    flash('추가 완료')
    await load()
  }

  const addAudio = async () => {
    if (!owner) return
    if (!audioFile) return flash('mp3 파일을 선택해줘')
    if (!signerUrl || !signerToken) return flash('R2 signer 환경변수를 먼저 설정해줘', 2200)

    try {
      setUploading(true)
      const uploadRes = await fetch(`${signerUrl.replace(/\/$/, '')}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${signerToken}`,
          'x-filename': encodeURIComponent(audioFile.name),
          'x-content-type': audioFile.type || 'audio/mpeg',
          'x-size': String(audioFile.size),
          'Content-Type': audioFile.type || 'audio/mpeg',
        },
        body: audioFile,
      })
      if (!uploadRes.ok) throw new Error(`upload failed (${uploadRes.status})`)
      const uploaded = await uploadRes.json()

      await createMusicItem({
        sourceType: 'audio',
        audioUrl: uploaded.publicUrl,
        objectKey: uploaded.objectKey,
        title: audioFile.name.replace(/\.[^.]+$/, ''),
        note: '',
        sortOrder: items.length,
        authorEmail: user?.email || 'icandoit13579@gmail.com',
        authorName: user?.displayName || user?.email || 'owner',
      })
      setAudioFile(null)
      flash('mp3 추가 완료')
      await load()
    } catch (e: any) {
      flash(`업로드 실패: ${e?.message || e}`, 2200)
    } finally {
      setUploading(false)
    }
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const to = idx + dir
    if (to < 0 || to >= items.length) return
    const next = [...items]
    ;[next[idx], next[to]] = [next[to], next[idx]]
    setItems(next)
    try {
      const a = next[idx]
      const b = next[to]
      if (a.id) await updateMusicItem(a.id, { sortOrder: idx })
      if (b.id) await updateMusicItem(b.id, { sortOrder: to })
    } catch {
      await load()
    }
  }

  const saveTitle = async (item: MusicItem) => {
    if (!owner || !item.id) return
    const next = editingTitle.trim()
    setEditingTitleId(null)
    if (!next || next === item.title) return
    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, title: next } : v)))
    await updateMusicItem(item.id, { title: next })
  }

  const remove = async (item: MusicItem) => {
    if (!owner || !item.id) return
    if (!window.confirm('삭제할까?')) return

    try {
      if (item.objectKey && signerUrl && signerToken) {
        await fetch(`${signerUrl.replace(/\/$/, '')}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signerToken}` },
          body: JSON.stringify({ objectKey: item.objectKey }),
        }).catch(() => null)
      }
      await deleteMusicItem(item.id)
      await load()
      flash('삭제 완료')
    } catch {
      flash('삭제 실패')
    }
  }

  const playing = useMemo(() => items.find((x) => x.id === playingId) || null, [items, playingId])

  return (
    <main className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Music</h1>
      </div>

      {owner && (
        <div className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-1">
              <input type="radio" checked={sourceMode === 'youtube'} onChange={() => setSourceMode('youtube')} /> YouTube 링크
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="radio" checked={sourceMode === 'audio'} onChange={() => setSourceMode('audio')} /> mp3 업로드(R2)
            </label>
          </div>

          {sourceMode === 'youtube' ? (
            <div className="flex items-center gap-2">
              <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="유튜브 링크/ID" className="flex-1 px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" />
              <button onClick={addYoutube} className="text-indigo-600 hover:text-indigo-900 p-1" title="추가">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input type="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/webm,audio/ogg" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="flex-1 text-sm" />
              <button onClick={addAudio} disabled={uploading} className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-40" title="업로드">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {playing && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-900/20 p-3">
          <div className="text-sm font-semibold mb-2">재생 중: {playing.title}</div>
          {playing.sourceType === 'audio' && playing.audioUrl ? (
            <audio key={playing.id} controls autoPlay className="w-full" src={playing.audioUrl} />
          ) : (
            <iframe
              key={playing.id}
              className="w-full h-56"
              src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1&playsinline=1&controls=1&modestbranding=1&rel=0`}
              title={playing.title}
              allow="autoplay; encrypted-media"
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="뮤직 목록 불러오는 중..." /></div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 text-sm">등록된 음악이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex items-center gap-2">
              <button onClick={() => setPlayingId(item.id || null)} className="text-emerald-600 hover:text-emerald-800 p-1" title="재생">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-5.197-3A1 1 0 008 9.034v5.932a1 1 0 001.555.832l5.197-3a1 1 0 000-1.73z" /></svg>
              </button>

              {owner && <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-gray-500 hover:text-gray-700 disabled:opacity-30 p-1" title="위로"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>}
              {owner && <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-gray-500 hover:text-gray-700 disabled:opacity-30 p-1" title="아래로"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>}

              <div className="flex-1 min-w-0">
                {owner && editingTitleId === item.id ? (
                  <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onBlur={() => saveTitle(item)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveTitle(item) } }} autoFocus className="w-full bg-transparent outline-none font-semibold" />
                ) : (
                  <button type="button" onClick={() => { if (!owner) return; setEditingTitleId(item.id || null); setEditingTitle(item.title) }} className="w-full text-left font-semibold truncate">{item.title}</button>
                )}
                <p className="text-xs text-gray-500 truncate">{item.sourceType === 'audio' ? 'R2 오디오' : 'YouTube 링크'}</p>
              </div>

              <button onClick={async () => { const link = item.sourceType === 'audio' ? (item.audioUrl || '') : `https://www.youtube.com/watch?v=${item.videoId}`; if (!link) return; await navigator.clipboard.writeText(link); flash('링크 복사 완료') }} className="text-blue-600 hover:text-blue-800 p-1" title="복사">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>

              {owner && item.id && <button onClick={() => remove(item)} className="text-red-600 hover:text-red-800 p-1" title="삭제"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
            </div>
          ))}
        </div>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
