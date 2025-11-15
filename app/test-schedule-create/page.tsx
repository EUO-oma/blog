'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createSchedule } from '@/lib/firebase-schedules';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function TestScheduleCreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');
  const [createdSchedules, setCreatedSchedules] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      setMessage('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  }, [user, loading, router]);

  const createTestSchedules = async () => {
    if (!user) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    setStatus('loading');
    setMessage('테스트 일정을 생성하는 중...');
    setCreatedSchedules([]);

    try {
      // 오늘 날짜 기준으로 일정 생성
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 테스트 일정 데이터 배열
      const testSchedules = [
        {
          title: '팀 미팅',
          description: '주간 프로젝트 진행 상황 공유 및 다음 주 계획 논의',
          startDate: Timestamp.fromDate(
            new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
          ), // 2일 후
          endDate: Timestamp.fromDate(
            new Date(
              today.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
            )
          ), // 2시간 후
          location: '회의실 A',
          color: '#3B82F6', // blue
          authorEmail: user.email!,
          authorName: user.displayName || user.email!,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          title: '프로젝트 마감일',
          description: '블로그 개발 1차 완료 및 배포',
          startDate: Timestamp.fromDate(
            new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          ), // 1주일 후
          location: '온라인',
          color: '#EF4444', // red
          authorEmail: user.email!,
          authorName: user.displayName || user.email!,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          title: '코드 리뷰',
          description: 'Firebase 통합 및 일정 관리 기능 코드 리뷰',
          startDate: Timestamp.fromDate(
            new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
          ), // 3일 후
          endDate: Timestamp.fromDate(
            new Date(
              today.getTime() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000
            )
          ), // 1시간 후
          location: 'Zoom',
          color: '#10B981', // green
          authorEmail: user.email!,
          authorName: user.displayName || user.email!,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          title: '기술 스터디',
          description: 'Next.js 14 새로운 기능 학습 및 적용 방안 논의',
          startDate: Timestamp.fromDate(
            new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
          ), // 5일 후
          endDate: Timestamp.fromDate(
            new Date(
              today.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
            )
          ), // 3시간 후
          location: '스터디룸 B',
          color: '#8B5CF6', // purple
          authorEmail: user.email!,
          authorName: user.displayName || user.email!,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          title: '휴가',
          description: '연차 휴가',
          startDate: Timestamp.fromDate(
            new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
          ), // 2주 후
          endDate: Timestamp.fromDate(
            new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000)
          ), // 3일간
          color: '#F59E0B', // amber
          authorEmail: user.email!,
          authorName: user.displayName || user.email!,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      const results: string[] = [];

      // 각 일정을 Firebase에 추가
      for (const schedule of testSchedules) {
        try {
          const id = await createSchedule(schedule);
          results.push(`✅ "${schedule.title}" 생성 완료 (ID: ${id})`);
        } catch (error: any) {
          results.push(`❌ "${schedule.title}" 생성 실패: ${error.message}`);
        }
      }

      setCreatedSchedules(results);
      setStatus('success');
      setMessage(`테스트 일정 생성이 완료되었습니다!`);

      // 3초 후 일정 페이지로 이동
      setTimeout(() => {
        router.push('/schedule');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(`오류 발생: ${error.message}`);
      console.error('Error creating test schedules:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">테스트 일정 생성</h1>

      {user ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm">현재 로그인된 사용자: {user.email}</p>
          </div>

          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                아래 버튼을 클릭하면 5개의 테스트 일정이 Firebase에 생성됩니다.
              </p>
              <button
                onClick={createTestSchedules}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                테스트 일정 생성하기
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">{message}</p>
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <div
              className={`p-4 rounded ${status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <p
                className={`font-semibold ${status === 'success' ? 'text-green-800' : 'text-red-800'}`}
              >
                {message}
              </p>
              {createdSchedules.length > 0 && (
                <div className="mt-4 space-y-1">
                  {createdSchedules.map((result, index) => (
                    <p key={index} className="text-sm">
                      {result}
                    </p>
                  ))}
                </div>
              )}
              {status === 'success' && (
                <p className="mt-4 text-sm text-gray-600">
                  3초 후 일정 페이지로 이동합니다...
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-800">{message}</p>
        </div>
      )}
    </div>
  );
}
