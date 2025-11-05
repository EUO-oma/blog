'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Schedule } from '@/lib/firebase'
import { getSchedules, deleteSchedule } from '@/lib/firebase-schedules'
import ScheduleModal from '@/components/ScheduleModal'
import ScheduleForm from '@/components/ScheduleForm'

export default function SchedulePage() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const fetchedSchedules = await getSchedules()
      setSchedules(fetchedSchedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) return

    try {
      await deleteSchedule(id)
      await loadSchedules()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('일정 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowFormModal(true)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return ''
    return new Date(timestamp.toDate()).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">일정 관리</h1>
        {user && (
          <button
            onClick={() => {
              setEditingSchedule(null)
              setShowFormModal(true)
            }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + 새 일정 추가
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          등록된 일정이 없습니다.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => setSelectedSchedule(schedule)}
              style={{
                borderLeft: `4px solid ${schedule.color || '#6366f1'}`
              }}
            >
              <h3 className="text-xl font-semibold mb-2">{schedule.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {schedule.description}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                <p>📅 {formatDate(schedule.startDate)}</p>
                {schedule.endDate && (
                  <p>~ {formatDate(schedule.endDate)}</p>
                )}
                {schedule.location && (
                  <p className="mt-1">📍 {schedule.location}</p>
                )}
              </div>
              
              {user && schedule.authorEmail === user.email && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(schedule)
                    }}
                    className="p-2 text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (schedule.id) handleDelete(schedule.id)
                    }}
                    className="p-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 일정 상세 모달 */}
      {selectedSchedule && (
        <ScheduleModal
          schedule={selectedSchedule}
          isOpen={!!selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}

      {/* 일정 추가/수정 모달 */}
      {showFormModal && (
        <ScheduleForm
          schedule={editingSchedule}
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false)
            setEditingSchedule(null)
          }}
          onSuccess={() => {
            setShowFormModal(false)
            setEditingSchedule(null)
            loadSchedules()
          }}
        />
      )}
    </div>
  )
}