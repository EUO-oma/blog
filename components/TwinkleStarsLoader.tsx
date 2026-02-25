'use client'

export default function TwinkleStarsLoader({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-14 w-40">
        <span className="star s1">✦</span>
        <span className="star s2">✦</span>
        <span className="star s3">✦</span>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <style jsx>{`
        .star {
          position: absolute;
          color: #f59e0b;
          font-size: 1.5rem;
          opacity: 0.2;
          animation: twinkle 1.4s ease-in-out infinite;
        }
        .s1 { left: 8px; top: 18px; animation-delay: 0s; }
        .s2 { left: 62px; top: 4px; font-size: 1.9rem; animation-delay: 0.25s; }
        .s3 { left: 120px; top: 20px; animation-delay: 0.5s; }

        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
