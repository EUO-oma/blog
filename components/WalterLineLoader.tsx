'use client'

export default function WalterLineLoader({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="180" height="44" viewBox="0 0 180 44" className="text-indigo-500">
        <path
          d="M5 22 L45 22 L60 8 L78 36 L96 10 L116 32 L135 16 L175 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="260"
          strokeDashoffset="260"
          className="walter-line"
        />
      </svg>
      <p className="text-sm text-gray-500">{label}</p>
      <style jsx>{`
        .walter-line {
          animation: draw 1.4s ease-in-out infinite;
        }
        @keyframes draw {
          0% { stroke-dashoffset: 260; opacity: 0.3; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
