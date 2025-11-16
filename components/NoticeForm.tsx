'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Notice, createNotice, updateNotice } from '@/lib/firebase-notices'
import { Timestamp } from 'firebase/firestore'

interface NoticeFormProps {
  notice?: Notice | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NoticeForm({ notice, isOpen, onClose, onSuccess }: NoticeFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (notice) {
      const noticeDate = notice.date.toDate()
      setFormData({
        title: notice.title,
        content: notice.content,
        date: noticeDate.toISOString().split('T')[0]
      })
    } else {
      // 새 공지사항일 때 초기화
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [notice])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const noticeDate = new Date(formData.date)
      
      const noticeData: Omit<Notice, 'id'> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        date: Timestamp.fromDate(noticeDate),
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: notice?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      if (notice?.id) {
        await updateNotice(notice.id, noticeData)
        alert('공지사항이 수정되었습니다.')
      } else {
        await createNotice(noticeData)
        alert('공지사항이 등록되었습니다.')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving notice:', error)
      alert(`오류: ${error.message || '공지사항 저장 중 오류가 발생했습니다.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full my-8 p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {notice ? '공지사항 수정' : '새 공지사항 등록'}
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
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                날짜 *
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                내용 *
              </label>
              <textarea
                id="content"
                required
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '저장 중...' : (notice ? '수정 완료' : '공지사항 등록')}
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