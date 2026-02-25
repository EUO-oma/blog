'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Notice, getNotices, deleteNotice } from '@/lib/firebase-notices'
import NoticeForm from '@/components/NoticeForm'
import LoaderSwitcher from '@/components/LoaderSwitcher'

export default function NoticePage() {
  const { user } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    setLoading(true)
    try {
      const fetchedNotices = await getNotices()
      setNotices(fetchedNotices)
    } catch (error) {
      console.error('Error loading notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return

    try {
      await deleteNotice(id)
      await loadNotices()
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('공지사항 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    setShowFormModal(true)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return ''
    const date = timestamp.toDate()
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 공지사항을 텍스트로 포맷팅
  const formatNoticeText = (notice: Notice) => {
    const date = formatDate(notice.date)
    
    let text = `📢 ${notice.title}\n`
    text += `📅 날짜: ${date}\n`
    text += `📝 내용:\n${notice.content}`
    
    return text
  }

  // 클립보드에 복사
  const copyNoticeToClipboard = async (notice: Notice) => {
    const text = formatNoticeText(notice)
    
    try {
      await navigator.clipboard.writeText(text)
      alert('공지사항이 클립보드에 복사되었습니다!')
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoaderSwitcher label="공지사항을 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">공지사항</h1>
        {user && (
          <button
            onClick={() => {
              setEditingNotice(null)
              setShowFormModal(true)
            }}
            className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base"
          >
            + 새 공지사항
          </button>
        )}
      </div>

      {notices.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          등록된 공지사항이 없습니다.
        </p>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{notice.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(notice.date)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* 복사 버튼 - 모든 사용자에게 표시 */}
                  <button
                    onClick={() => copyNoticeToClipboard(notice)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="공지사항 복사"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {user && notice.authorEmail === user.email && (
                    <>
                      <button
                        onClick={() => handleEdit(notice)}
                        className="text-indigo-600 hover:text-indigo-900 p-2"
                        title="수정"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => notice.id && handleDelete(notice.id)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="삭제"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {notice.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <NoticeForm
          notice={editingNotice}
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false)
            setEditingNotice(null)
          }}
          onSuccess={() => {
            setShowFormModal(false)
            setEditingNotice(null)
            loadNotices()
          }}
        />
      )}
    </div>
  )
}