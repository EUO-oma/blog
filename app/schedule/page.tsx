'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Schedule } from '@/lib/firebase';
import { getSchedules, deleteSchedule } from '@/lib/firebase-schedules';
import ScheduleModal from '@/components/ScheduleModal';
import ScheduleForm from '@/components/ScheduleForm';
import { exportSchedulesToExcel } from '@/lib/export-schedules';

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Firebase 초기화 후 약간의 지연을 두고 데이터 로드
    const timer = setTimeout(() => {
      loadSchedules();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedSchedules = await getSchedules();
      // 데이터 유효성 검증
      const validSchedules = fetchedSchedules.filter(schedule => 
        schedule && schedule.startDate && typeof schedule.startDate.toDate === 'function'
      );
      setSchedules(validSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('일정을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) return;

    try {
      await deleteSchedule(id);
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('일정 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setShowFormModal(true);
  };

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp || typeof timestamp.toDate !== 'function') return '-';
      const date = timestamp.toDate();
      if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  const formatTime = (timestamp: any) => {
    try {
      if (!timestamp || typeof timestamp.toDate !== 'function') return '-';
      const date = timestamp.toDate();
      if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (error) {
      console.error('Time formatting error:', error);
      return '-';
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={loadSchedules}
            className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 오늘의 일정 필터링
  const todaySchedules = schedules.filter(schedule => {
    try {
      if (!schedule.startDate || typeof schedule.startDate.toDate !== 'function') return false;
      const today = new Date();
      const scheduleDate = schedule.startDate.toDate();
      return scheduleDate.toDateString() === today.toDateString();
    } catch (error) {
      console.error('Error filtering today schedules:', error);
      return false;
    }
  });

  // 다가올 일정 필터링 (오늘 이후 7일)
  const upcomingSchedules = schedules.filter(schedule => {
    try {
      if (!schedule.startDate || typeof schedule.startDate.toDate !== 'function') return false;
      const today = new Date();
      const weekLater = new Date();
      weekLater.setDate(today.getDate() + 7);
      const scheduleDate = schedule.startDate.toDate();
      return scheduleDate > today && scheduleDate <= weekLater;
    } catch (error) {
      console.error('Error filtering upcoming schedules:', error);
      return false;
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">일정 관리</h1>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          {schedules.length > 0 && (
            <>
              <button
                onClick={() => exportSchedulesToExcel(schedules)}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 text-sm sm:text-base"
              >
                <svg
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                <span className="hidden sm:inline">Excel 다운로드</span>
                <span className="sm:hidden">Excel</span>
              </button>
            </>
          )}
          {user && (
            <button
              onClick={() => {
                setEditingSchedule(null);
                setShowFormModal(true);
              }}
              className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm sm:text-base"
            >
              + 새 일정
            </button>
          )}
        </div>
      </div>

      {/* 오늘의 일정 하이라이트 */}
      {todaySchedules.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">🗓️ 오늘의 일정</h2>
          <div className="space-y-2">
            {todaySchedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: schedule.color || '#6366f1' }}
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(schedule.startDate)} - {schedule.title}
                  </span>
                  {schedule.location && (
                    <span className="text-gray-500 dark:text-gray-400 ml-2">@ {schedule.location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다가올 일정 미리보기 (모바일) */}
      {isMobile && upcomingSchedules.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">📅 다가올 일정</h2>
          <div className="space-y-2">
            {upcomingSchedules.slice(0, 3).map((schedule) => (
              <div key={schedule.id} className="text-sm">
                <span className="font-medium">{formatDate(schedule.startDate)}</span> - {schedule.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          등록된 일정이 없습니다.
        </p>
      ) : isMobile ? (
        /* 모바일용 카드 뷰 */
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: schedule.color || '#6366f1' }}
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {schedule.title}
                  </h3>
                </div>
                {user && schedule.authorEmail === user.email && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="수정"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => schedule.id && handleDelete(schedule.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {formatDate(schedule.startDate)} {formatTime(schedule.startDate)}
                    {schedule.endDate && ` ~ ${formatTime(schedule.endDate)}`}
                  </span>
                </div>
                {schedule.location && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{schedule.location}</span>
                  </div>
                )}
                {schedule.description && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {schedule.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 데스크탑용 테이블 뷰 */
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  장소
                </th>
                {user && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    관리
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {schedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(schedule.startDate)}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {formatTime(schedule.startDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: schedule.color || '#6366f1' }}
                      />
                      <div className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {schedule.title}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          - {schedule.description}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {schedule.location || '-'}
                    </div>
                  </td>
                  {user && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {schedule.authorEmail === user.email && (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
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
                            onClick={() =>
                              schedule.id && handleDelete(schedule.id)
                            }
                            className="text-red-600 hover:text-red-900 p-1"
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
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
            setShowFormModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingSchedule(null);
            loadSchedules();
          }}
        />
      )}
    </div>
  );
}
