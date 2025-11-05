'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Schedule, Timestamp } from '@/lib/firebase'
import { createSchedule, updateSchedule } from '@/lib/firebase-schedules'

interface ScheduleFormProps {
  schedule?: Schedule | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const colorOptions = [
  { value: '#ef4444', label: '빨강' },
  { value: '#f97316', label: '주황' },
  { value: '#eab308', label: '노랑' },
  { value: '#22c55e', label: '초록' },
  { value: '#3b82f6', label: '파랑' },
  { value: '#6366f1', label: '보라' },
  { value: '#ec4899', label: '분홍' },
  { value: '#6b7280', label: '회색' }
]

export default function ScheduleForm({ schedule, isOpen, onClose, onSuccess }: ScheduleFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    color: '#6366f1'
  })

  useEffect(() => {
    if (schedule) {
      const startDate = schedule.startDate.toDate()
      const endDate = schedule.endDate?.toDate()
      
      setFormData({
        title: schedule.title,
        description: schedule.description,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        endTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
        location: schedule.location || '',
        color: schedule.color || '#6366f1'
      })
    }
  }, [schedule])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      let endDateTime = null
      
      if (formData.endDate && formData.endTime) {
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)
      }

      const scheduleData: Omit<Schedule, 'id'> = {
        title: formData.title,
        description: formData.description,
        startDate: Timestamp.fromDate(startDateTime),
        endDate: endDateTime ? Timestamp.fromDate(endDateTime) : undefined,
        location: formData.location || undefined,
        color: formData.color,
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: schedule?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      if (schedule?.id) {
        await updateSchedule(schedule.id, scheduleData)
        alert('일정이 수정되었습니다.')
      } else {
        await createSchedule(scheduleData)
        alert('일정이 등록되었습니다.')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving schedule:', error)
      const errorMessage = error.message || '일정 저장 중 오류가 발생했습니다.'
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
              {schedule ? '일정 수정' : '새 일정 등록'}
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
                placeholder="일정 제목"
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
                placeholder="일정에 대한 설명"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                  시작 날짜 *
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                  시작 시간 *
                </label>
                <input
                  type="time"
                  id="startTime"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                  종료 날짜
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                장소
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="예: 회의실, 카페, 온라인"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium mb-1">
                색상
              </label>
              <div className="flex gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === option.value 
                        ? 'border-gray-900 dark:border-white' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '저장 중...' : (schedule ? '수정 완료' : '일정 등록')}
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