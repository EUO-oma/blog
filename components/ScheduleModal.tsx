'use client'

import { Schedule } from '@/lib/firebase'

interface ScheduleModalProps {
  schedule: Schedule
  isOpen: boolean
  onClose: () => void
}

export default function ScheduleModal({ schedule, isOpen, onClose }: ScheduleModalProps) {
  if (!isOpen) return null

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return ''
    return new Date(timestamp.toDate()).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <div className="flex justify-between items-start mb-6">
            <h2 
              className="text-2xl font-bold"
              style={{ color: schedule.color || '#6366f1' }}
            >
              {schedule.title}
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

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">설명</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {schedule.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">일시</h3>
              <p className="text-gray-600 dark:text-gray-400">
                시작: {formatDate(schedule.startDate)}
              </p>
              {schedule.endDate && (
                <p className="text-gray-600 dark:text-gray-400">
                  종료: {formatDate(schedule.endDate)}
                </p>
              )}
            </div>

            {schedule.location && (
              <div>
                <h3 className="font-semibold mb-1">장소</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  📍 {schedule.location}
                </p>
              </div>
            )}

            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                작성자: {schedule.authorName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}