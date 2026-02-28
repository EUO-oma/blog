'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { YouTubeVideo } from '@/lib/firebase'
import { getYouTubeVideos, deleteYouTubeVideo, updateYouTubeVideo } from '@/lib/firebase-youtube'
import YouTubeForm from '@/components/YouTubeForm'
import LoaderSwitcher from '@/components/LoaderSwitcher'

export default function YouTubePage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<(YouTubeVideo & { sortOrder?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    loadVideos()
  }, [])

  const normalizeSort = (rows: (YouTubeVideo & { sortOrder?: number })[]) => {
    return [...rows].sort((a, b) => {
      const sa = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER
      const sb = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER
      if (sa !== sb) return sa - sb
      const at = (a.createdAt as any)?.toMillis?.() || 0
      const bt = (b.createdAt as any)?.toMillis?.() || 0
      return bt - at
    })
  }

  const loadVideos = async () => {
    setLoading(true)
    try {
      const fetchedVideos = await getYouTubeVideos()
      setVideos(normalizeSort(fetchedVideos as any))
    } catch (error) {
      console.error('Error loading videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 비디오를 삭제하시겠습니까?')) return

    try {
      await deleteYouTubeVideo(id)
      await loadVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('비디오 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (video: YouTubeVideo) => {
    setEditingVideo(video)
    setShowFormModal(true)
  }

  const openPlayer = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setShowPlayer(true)
  }

  const closePlayer = () => {
    setShowPlayer(false)
    setSelectedVideo(null)
  }

  const saveInlineTitle = async (video: YouTubeVideo & { sortOrder?: number }) => {
    if (!video.id) return
    const next = editingTitle.trim()
    setEditingTitleId(null)
    if (!next || next === video.title) return

    setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, title: next } : v)))
    try {
      await updateYouTubeVideo(video.id, { title: next })
    } catch (e) {
      console.error('youtube inline title update failed', e)
      await loadVideos()
    }
  }

  const moveVideo = async (video: YouTubeVideo & { sortOrder?: number }, direction: 'up' | 'down') => {
    const idx = videos.findIndex((v) => v.id === video.id)
    if (idx < 0) return
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= videos.length) return

    const next = [...videos]
    const a = next[idx]
    const b = next[target]
    ;[next[idx], next[target]] = [next[target], next[idx]]

    const aSort = typeof a.sortOrder === 'number' ? a.sortOrder : idx
    const bSort = typeof b.sortOrder === 'number' ? b.sortOrder : target
    next[idx].sortOrder = aSort
    next[target].sortOrder = bSort
    setVideos([...next])

    try {
      if (a.id) await updateYouTubeVideo(a.id, { sortOrder: bSort } as any)
      if (b.id) await updateYouTubeVideo(b.id, { sortOrder: aSort } as any)
    } catch (e) {
      console.error('youtube reorder failed', e)
      await loadVideos()
    }
  }

  const copyVideo = async (video: YouTubeVideo) => {
    const url = `https://www.youtube.com/watch?v=${video.videoId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (e) {
      console.error('youtube copy failed', e)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoaderSwitcher label="유튜브 목록을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-3xl font-bold">YouTube Videos</h1>
        {user && (
          <button
            onClick={() => {
              setEditingVideo(null)
              setShowFormModal(true)
            }}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-2"
            title="새 비디오 추가"
            aria-label="새 비디오 추가"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">등록된 비디오가 없습니다.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video, idx) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative aspect-video cursor-pointer group" onClick={() => openPlayer(video)}>
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                  <svg className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                {video.duration && (
                  <span className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </span>
                )}
              </div>

              <div className="p-4">
                {editingTitleId === video.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => saveInlineTitle(video)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        saveInlineTitle(video)
                      }
                      if (e.key === 'Escape') setEditingTitleId(null)
                    }}
                    className="w-full font-semibold text-lg mb-2 bg-transparent outline-none border-b border-indigo-300"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!(user && video.authorEmail === user.email)) return
                      setEditingTitleId(video.id || null)
                      setEditingTitle(video.title || '')
                    }}
                    className="w-full text-left font-semibold text-lg line-clamp-2 mb-2"
                    title={user && video.authorEmail === user.email ? '제목 수정' : undefined}
                  >
                    {video.title}
                  </button>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{video.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{video.views} views</span>
                  <span>{video.uploadDate}</span>
                </div>

                {user && video.authorEmail === user.email && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => moveVideo(video, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-gray-800 disabled:opacity-30 p-1" title="위로">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveVideo(video, 'down')} disabled={idx === videos.length - 1} className="text-gray-500 hover:text-gray-800 disabled:opacity-30 p-1" title="아래로">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button onClick={() => copyVideo(video)} className="text-blue-600 hover:text-blue-800 p-1" title="복사">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button onClick={() => handleEdit(video)} className="text-indigo-600 hover:text-indigo-800 p-1" title="수정">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => video.id && handleDelete(video.id)} className="text-red-600 hover:text-red-800 p-1" title="삭제">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={closePlayer}>
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={closePlayer} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <div className="mt-4 text-white">
              <h2 className="text-2xl font-semibold mb-2">{selectedVideo.title}</h2>
              <p className="text-gray-300 mb-4">{selectedVideo.description}</p>
              <div className="flex gap-4 text-sm text-gray-400">
                {selectedVideo.views && <span>{selectedVideo.views} views</span>}
                {selectedVideo.uploadDate && <span>Uploaded on {selectedVideo.uploadDate}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <YouTubeForm
          video={editingVideo}
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false)
            setEditingVideo(null)
          }}
          onSuccess={() => {
            setShowFormModal(false)
            setEditingVideo(null)
            loadVideos()
          }}
        />
      )}
    </div>
  )
}
