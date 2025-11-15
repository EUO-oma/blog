'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createSchedule } from '@/lib/firebase-schedules';
import { Timestamp } from '@/lib/firebase';

export default function CreateTestSchedulesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addStatus = (message: string) => {
    setStatus((prev) => [...prev, message]);
  };

  const createAllSchedules = async () => {
    if (!user) {
      setError('로그인이 필요합니다!');
      return;
    }

    setLoading(true);
    setStatus([]);
    setError('');

    try {
      addStatus('🚀 테스트 일정 생성을 시작합니다...');

      // 1. 오늘 오후 미팅
      const today = new Date();
      today.setHours(15, 0, 0, 0);

      const meeting = {
        title: '팀 정기 회의',
        description: '주간 업무 진행 상황 공유 및 다음 주 계획 수립',
        startDate: Timestamp.fromDate(today),
        endDate: Timestamp.fromDate(new Date(today.getTime() + 90 * 60 * 1000)), // 1.5시간
        location: '3층 회의실 A',
        color: '#3b82f6', // 파란색
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createSchedule(meeting);
      addStatus('✅ 팀 정기 회의 일정이 생성되었습니다');

      // 2. 내일 코드 리뷰
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 30, 0, 0);

      const codeReview = {
        title: '코드 리뷰 세션',
        description: '신규 기능 PR 리뷰 및 코드 품질 개선 논의',
        startDate: Timestamp.fromDate(tomorrow),
        endDate: Timestamp.fromDate(
          new Date(tomorrow.getTime() + 60 * 60 * 1000)
        ), // 1시간
        location: '온라인 (Google Meet)',
        color: '#22c55e', // 초록색
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createSchedule(codeReview);
      addStatus('✅ 코드 리뷰 세션이 생성되었습니다');

      // 3. 이번 주 금요일 스프린트 회고
      const friday = new Date();
      const daysUntilFriday = (5 - friday.getDay() + 7) % 7 || 7;
      friday.setDate(friday.getDate() + daysUntilFriday);
      friday.setHours(16, 0, 0, 0);

      const retrospective = {
        title: '스프린트 회고',
        description: '이번 스프린트 성과 검토 및 개선점 도출',
        startDate: Timestamp.fromDate(friday),
        endDate: Timestamp.fromDate(
          new Date(friday.getTime() + 120 * 60 * 1000)
        ), // 2시간
        location: '대회의실',
        color: '#f97316', // 주황색
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createSchedule(retrospective);
      addStatus('✅ 스프린트 회고가 생성되었습니다');

      // 4. 다음 주 월요일 프로젝트 킥오프
      const nextMonday = new Date();
      const daysUntilMonday = (1 - nextMonday.getDay() + 7) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);

      const kickoff = {
        title: '신규 프로젝트 킥오프',
        description: '새로운 기능 개발 프로젝트 시작 미팅',
        startDate: Timestamp.fromDate(nextMonday),
        endDate: Timestamp.fromDate(
          new Date(nextMonday.getTime() + 180 * 60 * 1000)
        ), // 3시간
        location: '본사 1층 대강당',
        color: '#ec4899', // 분홍색
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createSchedule(kickoff);
      addStatus('✅ 신규 프로젝트 킥오프가 생성되었습니다');

      // 5. 2주 후 기술 워크샵
      const workshop = new Date();
      workshop.setDate(workshop.getDate() + 14);
      workshop.setHours(14, 0, 0, 0);

      const techWorkshop = {
        title: '기술 워크샵: Next.js 14 신기능',
        description: 'Next.js 14의 새로운 기능과 Best Practice 공유',
        startDate: Timestamp.fromDate(workshop),
        location: '교육장 B',
        color: '#6366f1', // 보라색
        authorEmail: user.email!,
        authorName: user.displayName || user.email!,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createSchedule(techWorkshop);
      addStatus('✅ 기술 워크샵이 생성되었습니다');

      addStatus('');
      addStatus('🎉 모든 테스트 일정이 성공적으로 생성되었습니다!');
      addStatus('3초 후 일정 페이지로 이동합니다...');

      setTimeout(() => {
        router.push('/schedule');
      }, 3000);
    } catch (err: any) {
      console.error('Error creating schedules:', err);
      setError(`오류 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">테스트 일정 생성</h1>

      {!user ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-lg font-medium mb-2">⚠️ 로그인이 필요합니다</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            일정을 생성하려면 먼저 로그인해주세요.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-3">📅 생성될 테스트 일정</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-blue-500 mt-0.5 mr-2"></span>
                <div>
                  <strong>팀 정기 회의</strong> - 오늘 오후 3시 (3층 회의실 A)
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-green-500 mt-0.5 mr-2"></span>
                <div>
                  <strong>코드 리뷰 세션</strong> - 내일 오전 10시 30분 (온라인)
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-orange-500 mt-0.5 mr-2"></span>
                <div>
                  <strong>스프린트 회고</strong> - 이번 주 금요일 오후 4시
                  (대회의실)
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-pink-500 mt-0.5 mr-2"></span>
                <div>
                  <strong>신규 프로젝트 킥오프</strong> - 다음 주 월요일 오전
                  9시 (본사 1층 대강당)
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-purple-500 mt-0.5 mr-2"></span>
                <div>
                  <strong>기술 워크샵</strong> - 2주 후 오후 2시 (교육장 B)
                </div>
              </li>
            </ul>
          </div>

          <button
            onClick={createAllSchedules}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '일정 생성 중...' : '테스트 일정 생성하기'}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {status.length > 0 && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="space-y-1">
                {status.map((msg, idx) => (
                  <p key={idx} className="text-sm font-mono">
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
        <p>
          💡 팁: 생성된 일정은 일정 페이지에서 수정하거나 삭제할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
