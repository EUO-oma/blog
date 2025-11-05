'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Sample YouTube video data - replace with your actual videos
const YOUTUBE_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Sample Video 1',
    description: 'This is a sample video description. Replace with your actual video content.',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: '3:52',
    views: '1.2M',
    uploadDate: '2024-01-15'
  },
  {
    id: 'M7lc1UVf-VE',
    title: 'Sample Video 2',
    description: 'Another sample video for demonstration purposes.',
    thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg',
    duration: '5:21',
    views: '823K',
    uploadDate: '2024-02-10'
  },
  {
    id: 'ZbZSe6N_BXs',
    title: 'Sample Video 3',
    description: 'Learn something new with this sample video.',
    thumbnail: 'https://img.youtube.com/vi/ZbZSe6N_BXs/maxresdefault.jpg',
    duration: '10:34',
    views: '2.5M',
    uploadDate: '2024-03-05'
  },
  {
    id: 'y6120QOlsfU',
    title: 'Sample Video 4',
    description: 'Educational content placeholder.',
    thumbnail: 'https://img.youtube.com/vi/y6120QOlsfU/maxresdefault.jpg',
    duration: '7:45',
    views: '456K',
    uploadDate: '2024-03-20'
  }
]

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  views: string
  uploadDate: string
}

export default function YouTubePage() {
  const { user } = useAuth()
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedVideo(null)
  }

  return (
    <>
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold">YouTube 채널</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          최신 동영상 콘텐츠를 확인해보세요
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">최신 동영상</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {YOUTUBE_VIDEOS.map((video) => (
            <article 
              key={video.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
              onClick={() => handleVideoClick(video)}
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {video.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>{video.views} views</span>
                  <time>{new Date(video.uploadDate).toLocaleDateString('ko-KR')}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Video Player Modal */}
      {isModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedVideo.title}</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="aspect-video bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedVideo.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                <span>{selectedVideo.views} views</span>
                <time>업로드: {new Date(selectedVideo.uploadDate).toLocaleDateString('ko-KR')}</time>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}