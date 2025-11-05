'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { YouTubeVideo, Timestamp } from '@/lib/firebase'
import { createYouTubeVideo, updateYouTubeVideo, extractVideoId } from '@/lib/firebase-youtube'

interface YouTubeFormProps {
  video?: YouTubeVideo | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function YouTubeForm({ video, isOpen, onClose, onSuccess }: YouTubeFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    videoUrl: '',
    videoId: '',
    title: '',
    description: '',
    duration: '',
    views: '',
    uploadDate: ''
  })

  useEffect(() => {
    if (video) {
      setFormData({
        videoUrl: `https://youtube.com/watch?v=${video.videoId}`,
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        duration: video.duration || '',
        views: video.views || '',
        uploadDate: video.uploadDate || ''
      })
    } else {
      // 신규 비디오일 때 초기화
      setFormData({
        videoUrl: '',
        videoId: '',
        title: '',
        description: '',
        duration: '',
        views: '',
        uploadDate: new Date().toISOString().split('T')[0]
      })
    }
  }, [video])

  if (!isOpen) return null

  const handleVideoUrlChange = (url: string) => {
    setFormData({ ...formData, videoUrl: url })
    
    // URL에서 비디오 ID 추출
    const videoId = extractVideoId(url)
    if (videoId) {
      setFormData(prev => ({ ...prev, videoId }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const videoData: any = {
        videoId: formData.videoId,
        title: formData.title,
        description: formData.description,
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: video?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      // optional 필드는 값이 있을 때만 추가
      if (formData.duration && formData.duration.trim()) {
        videoData.duration = formData.duration.trim()
      }
      
      if (formData.views && formData.views.trim()) {
        videoData.views = formData.views.trim()
      }
      
      if (formData.uploadDate && formData.uploadDate.trim()) {
        videoData.uploadDate = formData.uploadDate.trim()
      }

      if (video?.id) {
        await updateYouTubeVideo(video.id, videoData)
        alert('YouTube 비디오가 수정되었습니다.')
      } else {
        await createYouTubeVideo(videoData)
        alert('YouTube 비디오가 등록되었습니다.')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving YouTube video:', error)
      const errorMessage = error.message || 'YouTube 비디오 저장 중 오류가 발생했습니다.'
      alert(`오류: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full my-8 p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {video ? 'YouTube 비디오 수정' : '새 YouTube 비디오 추가'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">
                YouTube URL 또는 비디오 ID *
              </label>
              <input
                type="text"
                id="videoUrl"
                required
                value={formData.videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://youtube.com/watch?v=... 또는 dQw4w9WgXcQ"
              />
              {formData.videoId && (
                <p className="mt-1 text-sm text-gray-500">
                  비디오 ID: {formData.videoId}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="비디오 제목"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                설명 *
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="비디오 설명"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-1">
                  재생 시간
                </label>
                <input
                  type="text"
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="예: 10:30"
                />
              </div>

              <div>
                <label htmlFor="views" className="block text-sm font-medium mb-1">
                  조회수
                </label>
                <input
                  type="text"
                  id="views"
                  value={formData.views}
                  onChange={(e) => setFormData({ ...formData, views: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="예: 1.2K"
                />
              </div>

              <div>
                <label htmlFor="uploadDate" className="block text-sm font-medium mb-1">
                  업로드 날짜
                </label>
                <input
                  type="date"
                  id="uploadDate"
                  value={formData.uploadDate}
                  onChange={(e) => setFormData({ ...formData, uploadDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            {formData.videoId && (
              <div>
                <label className="block text-sm font-medium mb-1">미리보기</label>
                <div className="aspect-video w-full max-w-md mx-auto">
                  <img 
                    src={`https://img.youtube.com/vi/${formData.videoId}/maxresdefault.jpg`}
                    alt="YouTube thumbnail"
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${formData.videoId}/hqdefault.jpg`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.videoId}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '저장 중...' : (video ? '수정 완료' : '비디오 추가')}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}