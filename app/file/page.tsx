'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import { createFileItem, deleteFileItem, getFiles, updateFileItem } from '@/lib/firebase-files'
import { auth, FileItem } from '@/lib/firebase'

const OWNER = 'icandoit13579@gmail.com'

export default function FilePage() {
  const { user } = useAuth()
  const owner = user?.email?.toLowerCase() === OWNER

  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [folderName, setFolderName] = useState('EUO_FILE_INBOX_SYNC_GDRIVE')
  const [department, setDepartment] = useState('공통')
  const [season, setSeason] = useState('2026Q1')
  const [keywords, setKeywords] = useState('')
  const [uploadChannel, setUploadChannel] = useState<'r2' | 'gdrive' | 'github'>('r2')
  const [driveTitle, setDriveTitle] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [githubTitle, setGithubTitle] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const signerUrl = process.env.NEXT_PUBLIC_R2_SIGNER_URL || ''
  const gasDriveUrl = process.env.NEXT_PUBLIC_GAS_DRIVE_WEBAPP_URL || process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || ''
  const gasToken = process.env.NEXT_PUBLIC_GAS_SYNC_TOKEN || ''

  const flash = (text: string, ms = 1500) => {
    setMsg(text)
    setTimeout(() => setMsg(''), ms)
  }

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getFiles())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'euo-file'
    load()
  }, [])

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return items
    return items.filter((i) => `${i.title}`.toLowerCase().includes(k))
  }, [items, q])

  const getDriveSubFolder = (contentType?: string) => {
    const ct = String(contentType || '').toLowerCase()
    const top = ct.startsWith('image/') || ct.startsWith('audio/') || ct.startsWith('video/') ? 'media' : ct.startsWith('application/') || ct.startsWith('text/') ? 'docs' : 'etc'
    const dep = (department || '공통').trim()
    const sea = (season || '기본').trim()
    return `${folderName}/${top}/${dep}/${sea}`
  }

  const upload = async (file: File) => {
    if (!owner) return flash('권한 없음')
    if (!signerUrl) return flash('R2 signer URL을 먼저 설정해줘', 2200)

    try {
      setUploading(true)
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) throw new Error('로그인 토큰이 없어 업로드할 수 없음')

      const res = await fetch(`${signerUrl.replace(/\/$/, '')}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'x-filename': encodeURIComponent(file.name),
          'x-content-type': file.type || 'application/octet-stream',
          'x-size': String(file.size),
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })
      if (!res.ok) throw new Error(`upload failed (${res.status})`)
      const up = await res.json()

      await createFileItem({
        title: file.name,
        fileUrl: up.publicUrl,
        sourceType: 'r2',
        objectKey: up.objectKey,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        department,
        season,
        keywords,
        driveSyncStatus: 'idle',
        driveFolderName: getDriveSubFolder(file.type),
        authorEmail: user?.email || OWNER,
        authorName: user?.displayName || user?.email || 'owner',
      })
      flash('파일 업로드 완료')
      await load()
    } catch (e: any) {
      flash(`업로드 실패: ${e?.message || e}`, 2200)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const syncToDrive = async (item: FileItem) => {
    if (!owner || !item.id) return
    if (!gasDriveUrl || !gasToken) return flash('GAS Drive URL 변수 설정 필요', 2300)

    try {
      const driveFolder = getDriveSubFolder(item.contentType)
      await updateFileItem(item.id, { driveSyncStatus: 'pending', driveFolderName: driveFolder, department, season, keywords })
      setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, driveSyncStatus: 'pending', driveFolderName: driveFolder } : v)))

      const res = await fetch(gasDriveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveR2ToDrive',
          token: gasToken,
          fileUrl: item.fileUrl,
          filename: item.title,
          folderName: driveFolder,
          contentType: item.contentType || 'application/octet-stream',
        }),
      })
      const data = await res.json().catch(() => ({} as any))
      if (!data?.ok) throw new Error(data?.error || 'drive sync failed')

      await updateFileItem(item.id, {
        driveSyncStatus: 'success',
        driveFileId: data.fileId,
        lastSyncedAt: new Date().toISOString(),
        lastError: '',
        driveFolderName: driveFolder,
      })
      flash('Drive 전송 완료')
      await load()
    } catch (e: any) {
      const errMsg = e?.message || String(e)

      // Safari/브라우저 환경에서 GAS CORS/redirect 이슈로 Load failed가 날 수 있어 best-effort 재시도
      if (/load failed|failed to fetch|network/i.test(String(errMsg || ''))) {
        try {
          await fetch(gasDriveUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              action: 'saveR2ToDrive',
              token: gasToken,
              fileUrl: item.fileUrl,
              filename: item.title,
              folderName: getDriveSubFolder(item.contentType),
              contentType: item.contentType || 'application/octet-stream',
            }),
          })

          await updateFileItem(item.id, {
            driveSyncStatus: 'pending',
            lastError: 'browser_cors_fallback',
            driveFolderName: getDriveSubFolder(item.contentType),
          })
          flash('Drive 전송 요청은 보냈어. 10~30초 뒤 상태 확인해줘.', 2600)
          await load()
          return
        } catch (_) {
          // fallback도 실패하면 아래 failed 처리
        }
      }

      await updateFileItem(item.id, { driveSyncStatus: 'failed', lastError: errMsg, driveFolderName: folderName })
      flash(`Drive 전송 실패: ${errMsg}`, 2600)
      await load()
    }
  }

  const registerDriveLink = async () => {
    if (!owner) return flash('권한 없음')
    if (!driveTitle.trim() || !driveUrl.trim()) return flash('Drive 제목/링크를 입력해줘')
    try {
      await createFileItem({
        title: driveTitle.trim(),
        fileUrl: driveUrl.trim(),
        sourceType: 'gdrive',
        contentType: 'application/vnd.google-apps.file',
        department,
        season,
        keywords,
        driveSyncStatus: 'success',
        driveFolderName: getDriveSubFolder('application/vnd.google-apps.file'),
        authorEmail: user?.email || OWNER,
        authorName: user?.displayName || user?.email || 'owner',
      })
      setDriveTitle('')
      setDriveUrl('')
      flash('Google Drive 링크 등록 완료')
      await load()
    } catch (e: any) {
      flash(`등록 실패: ${e?.message || e}`, 2200)
    }
  }

  const registerGithubLink = async () => {
    if (!owner) return flash('권한 없음')
    if (!githubTitle.trim() || !githubUrl.trim()) return flash('GitHub 제목/링크를 입력해줘')
    try {
      await createFileItem({
        title: githubTitle.trim(),
        fileUrl: githubUrl.trim(),
        sourceType: 'github',
        contentType: 'application/octet-stream',
        department,
        season,
        keywords,
        driveSyncStatus: 'idle',
        authorEmail: user?.email || OWNER,
        authorName: user?.displayName || user?.email || 'owner',
      })
      setGithubTitle('')
      setGithubUrl('')
      flash('GitHub 링크 등록 완료')
      await load()
    } catch (e: any) {
      flash(`등록 실패: ${e?.message || e}`, 2200)
    }
  }

  const remove = async (item: FileItem) => {
    if (!owner || !item.id) return
    if (!confirm('삭제할까?')) return

    try {
      if (item.sourceType === 'r2' && item.objectKey && signerUrl) {
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) throw new Error('로그인 토큰이 없어 삭제할 수 없음')

        await fetch(`${signerUrl.replace(/\/$/, '')}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ objectKey: item.objectKey }),
        }).catch(() => null)
      }
      await deleteFileItem(item.id)
      flash('삭제 완료')
      await load()
    } catch {
      flash('삭제 실패')
    }
  }

  if (!owner) {
    return (
      <main className="max-w-5xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold">File</h1>
        <p className="text-sm text-red-500">관리자만 접근 가능한 게시판입니다.</p>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">File</h1>
        {owner && (
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
            <select value={uploadChannel} onChange={(e) => setUploadChannel(e.target.value as any)} className="text-xs px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700">
              <option value="r2">R2 업로드</option>
              <option value="gdrive">Google Drive 링크등록</option>
              <option value="github">GitHub 링크등록</option>
            </select>
            {uploadChannel === 'r2' ? (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-indigo-600 hover:text-indigo-900 p-1 disabled:opacity-40" title="파일 업로드">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            ) : uploadChannel === 'gdrive' ? (
              <button onClick={registerDriveLink} className="text-emerald-600 hover:text-emerald-900 p-1" title="Drive 링크 등록">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            ) : (
              <button onClick={registerGithubLink} className="text-emerald-600 hover:text-emerald-900 p-1" title="GitHub 링크 등록">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            )}
          </>
        )}
      </div>

      {owner && (
        <>
          <div className="grid sm:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap shrink-0">루트:</span>
              <input value={folderName} onChange={(e) => setFolderName(e.target.value)} className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap shrink-0">부서:</span>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap shrink-0">시즌:</span>
              <input value={season} onChange={(e) => setSeason(e.target.value)} className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap shrink-0">키워드:</span>
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="회의록,계약" className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            </div>
          </div>

          {uploadChannel === 'gdrive' && (
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <input value={driveTitle} onChange={(e) => setDriveTitle(e.target.value)} placeholder="Drive 파일 제목" className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
              <input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            </div>
          )}

          {uploadChannel === 'github' && (
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <input value={githubTitle} onChange={(e) => setGithubTitle(e.target.value)} placeholder="GitHub 파일 제목" className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
              <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/... 또는 release asset URL" className="w-full px-2 py-1 rounded border dark:bg-gray-900 dark:border-gray-700" />
            </div>
          )}
        </>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="파일 검색" className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700" />

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="파일 목록 불러오는 중..." /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="block truncate font-medium hover:underline">{item.title}</a>
                <p className="text-xs text-gray-500 truncate">{item.department || '공통'} · {item.season || '기본'} · {item.keywords || '-'} </p>
              </div>
              {item.size ? <span className="text-xs text-gray-500">{Math.ceil(item.size / 1024)} KB</span> : null}
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{item.sourceType || 'r2'}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${item.driveSyncStatus === 'success' ? 'bg-green-100 text-green-700' : item.driveSyncStatus === 'failed' ? 'bg-red-100 text-red-700' : item.driveSyncStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{item.driveSyncStatus || 'idle'}</span>
              <button onClick={async () => { await navigator.clipboard.writeText(item.fileUrl); flash('링크 복사 완료') }} className="text-blue-600 hover:text-blue-800 p-1" title="복사"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
              {owner && item.sourceType === 'r2' && <button onClick={() => syncToDrive(item)} className="text-emerald-600 hover:text-emerald-800 p-1" title="Drive 전송"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5-6 5 6m-5-6v16" /></svg></button>}
              {owner && <button onClick={() => remove(item)} className="text-red-600 hover:text-red-800 p-1" title="삭제"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500">파일이 없습니다.</p>}
        </div>
      )}

      {msg ? <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-white text-xs px-3 py-2 rounded z-[95]">{msg}</div> : null}
    </main>
  )
}
