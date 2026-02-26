'use client'

export default function HeartOutlineLoader({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="84" height="84" viewBox="0 0 100 100" className="text-rose-500">
        <path
          d="M50 86 C20 62 8 50 8 34 C8 22 17 13 29 13 C38 13 46 18 50 26 C54 18 62 13 71 13 C83 13 92 22 92 34 C92 50 80 62 50 86 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="260"
          strokeDashoffset="260"
          className="heart-draw"
        />
      </svg>
      <p className="text-sm text-gray-500">{label}</p>
      <style jsx>{`
        .heart-draw {
          animation: heartDraw 1.7s ease-in-out infinite;
        }
        @keyframes heartDraw {
          0% { stroke-dashoffset: 260; opacity: 0.35; }
          60% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
