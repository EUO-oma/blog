'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { YouTubeVideo } from '@/lib/firebase'
import { getYouTubeVideos, deleteYouTubeVideo } from '@/lib/firebase-youtube'
import YouTubeForm from '@/components/YouTubeForm'
import WalterLineLoader from '@/components/WalterLineLoader'

export default function YouTubePage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null)
  
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

  const openPlayer = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setShowPlayer(true)
  }

  const closePlayer = () => {
    setShowPlayer(false)
    setSelectedVideo(null)
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <WalterLineLoader label="유튜브 목록을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">YouTube Videos</h1>
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