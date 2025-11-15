'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { YouTubeVideo } from '@/lib/firebase';
import { getYouTubeVideos } from '@/lib/firebase-youtube';

function YouTubePlayer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode'); // 'all' or 'shuffle'

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const fetchedVideos = await getYouTubeVideos();

      if (mode === 'shuffle') {
        // Fisher-Yates 셔플
        const shuffled = [...fetchedVideos];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setVideos(shuffled);
      } else {
        setVideos(fetchedVideos);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // 처음으로 돌아가기
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(videos.length - 1); // 마지막으로
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        playNext();
        break;
      case 'ArrowLeft':
        playPrevious();
        break;
      case 'Escape':
        router.push('/youtube');
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  if (loading || videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        ) : (
          <div className="text-white">비디오가 없습니다.</div>
        )}
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* 상단 컨트롤 */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/youtube')}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h1 className="text-white text-lg font-semibold">
              {currentVideo.title}
            </h1>
          </div>
          <div className="text-white text-sm">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>
      </div>

      {/* 비디오 플레이어 */}
      <div className="flex-1 flex items-center justify-center" ref={playerRef}>
        <iframe
          key={currentVideo.videoId}
          src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            // YouTube Player API를 사용하여 비디오 종료 감지
            const iframe = playerRef.current?.querySelector('iframe');
            if (iframe && (window as any).YT && (window as any).YT.Player) {
              const player = new (window as any).YT.Player(iframe, {
                events: {
                  onStateChange: (event: any) => {
                    if (event.data === (window as any).YT.PlayerState.ENDED) {
                      playNext();
                    }
                  },
                },
              });
            }
          }}
        />
      </div>

      {/* 하단 컨트롤 및 플레이리스트 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* 재생 컨트롤 */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={playPrevious}
            className="text-white hover:text-gray-300 transition-colors"
            title="이전 (←)"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={playNext}
            className="text-white hover:text-gray-300 transition-colors"
            title="다음 (→)"
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* 플레이리스트 미리보기 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-white scale-105'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={
                  video.thumbnail ||
                  `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
                }
                alt={video.title}
                className="w-32 h-20 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                }}
              />
            </button>
          ))}
        </div>

        <div className="text-center text-gray-400 text-sm mt-2">
          <kbd>←</kbd> 이전 | <kbd>→</kbd> 다음 | <kbd>ESC</kbd> 나가기
        </div>
      </div>
    </div>
  );
}

export default function YouTubePlayerPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}>
      <YouTubePlayer />
    </Suspense>
  );
}
