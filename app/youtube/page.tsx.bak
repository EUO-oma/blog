'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { YouTubeVideo } from '@/lib/firebase'
import { getYouTubeVideos, deleteYouTubeVideo } from '@/lib/firebase-youtube'
import YouTubeForm from '@/components/YouTubeForm'

export default function YouTubePage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null)
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  useEffect(() => {
    loadVideos()
  }, [])
  
  const loadVideos = async () => {
    setLoading(true)
    try {
      const fetchedVideos = await getYouTubeVideos()
      setVideos(fetchedVideos)
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

  const openPlayer = (video: YouTubeVideo, startPlaylist = false) => {
    setSelectedVideo(video)
    setShowPlayer(true)
    if (startPlaylist) {
      const index = playlist.findIndex(v => v.id === video.id)
      setCurrentIndex(index >= 0 ? index : 0)
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }

  const closePlayer = () => {
    setShowPlayer(false)
    setSelectedVideo(null)
    setIsPlaying(false)
  }
  
  // 전체 재생 시작 (모달)
  const playAll = () => {
    if (videos.length > 0) {
      setPlaylist(videos)
      setCurrentIndex(0)
      openPlayer(videos[0], true)
    }
  }
  
  // 셔플 재생 시작 (모달)
  const shufflePlay = () => {
    if (videos.length > 0) {
      // Fisher-Yates 셔플 알고리즘
      const shuffled = [...videos]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setPlaylist(shuffled)
      setCurrentIndex(0)
      openPlayer(shuffled[0], true)
    }
  }
  
  // 전체화면 재생 시작
  const playFullscreen = (mode: 'all' | 'shuffle') => {
    if (typeof window !== 'undefined') {
      window.open(`/youtube/player?mode=${mode}`, '_blank')
    }
  }
  
  // 다음 비디오 재생
  const playNext = () => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setSelectedVideo(playlist[nextIndex])
    } else {
      // 마지막 비디오면 처음부터 다시
      setCurrentIndex(0)
      setSelectedVideo(playlist[0])
    }
  }
  
  // 이전 비디오 재생
  const playPrevious = () => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setSelectedVideo(playlist[prevIndex])
    }
  }
  
  // 플레이리스트 변경 시 현재 비디오 업데이트
  useEffect(() => {
    if (isPlaying && playlist.length > 0 && currentIndex < playlist.length) {
      setSelectedVideo(playlist[currentIndex])
    }
  }, [currentIndex, isPlaying, playlist])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">YouTube Videos</h1>
        <div className="flex gap-3">
          {videos.length > 0 && (
            <>
              <button
                onClick={() => playFullscreen('all')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                title="새 창에서 전체화면 재생"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                </svg>
                전체화면 재생
              </button>
              
              <button
                onClick={playAll}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ▶️ 전체 재생
              </button>
              <button
                onClick={shufflePlay}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                🔀 셔플 재생
              </button>
            </>
          )}
          {user && (
          <button
            onClick={() => {
              setEditingVideo(null)
              setShowFormModal(true)
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + 새 비디오 추가
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          등록된 비디오가 없습니다.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div 
                className="relative aspect-video cursor-pointer group"
                onClick={() => openPlayer(video)}
              >
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                  <svg 
                    className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
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
                <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {video.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{video.views} views</span>
                  <span>{video.uploadDate}</span>
                </div>
                
                {user && video.authorEmail === user.email && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(video)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => video.id && handleDelete(video.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {showPlayer && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closePlayer}
        >
          <div 
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePlayer}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {isPlaying && playlist.length > 0 ? (
                <iframe
                  key={selectedVideo.videoId}
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&playlist=${playlist.map(v => v.videoId).join(',')}&loop=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  onEnded={() => {
                    if (currentIndex < playlist.length - 1) {
                      playNext()
                    }
                  }}
                />
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
            </div>
            
            {/* 플레이리스트 컨트롤 */}
            {isPlaying && playlist.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={playPrevious}
                  disabled={currentIndex === 0}
                  className="p-2 text-white hover:text-gray-300 disabled:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                
                <span className="text-white text-sm">
                  {currentIndex + 1} / {playlist.length}
                </span>
                
                <button
                  onClick={playNext}
                  disabled={currentIndex === playlist.length - 1}
                  className="p-2 text-white hover:text-gray-300 disabled:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/>
                  </svg>
                </button>
              </div>
            )}
            
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

      {/* YouTube Form Modal */}
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