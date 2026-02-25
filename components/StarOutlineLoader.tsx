'use client'

export default function StarOutlineLoader({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="80" height="80" viewBox="0 0 100 100" className="text-amber-500">
        <path
          d="M50 8 L61 37 L92 37 L67 56 L76 88 L50 69 L24 88 L33 56 L8 37 L39 37 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="260"
          strokeDashoffset="260"
          className="star-draw"
        />
      </svg>
      <p className="text-sm text-gray-500">{label}</p>
      <style jsx>{`
        .star-draw {
          animation: starDraw 1.6s ease-in-out infinite;
        }
        @keyframes starDraw {
          0% { stroke-dashoffset: 260; opacity: 0.35; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
