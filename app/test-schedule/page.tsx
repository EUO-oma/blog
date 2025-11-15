'use client';

import { useState } from 'react';
import { createSchedule } from '@/lib/firebase-schedules';
import { Timestamp } from '@/lib/firebase';

export default function TestSchedulePage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestSchedules = async () => {
    setLoading(true);
    setStatus('Creating test schedules...');

    try {
      // 오늘 일정
      const today = new Date();
      today.setHours(14, 0, 0, 0);

      const schedule1 = {
        title: '프로젝트 미팅',
        description: 'Next.js 블로그 개발 진행 상황 공유 및 다음 단계 논의',
        startDate: Timestamp.fromDate(today),
        endDate: Timestamp.fromDate(
          new Date(today.getTime() + 2 * 60 * 60 * 1000)
        ), // 2시간 후
        location: '회의실 A',
        color: '#3b82f6',
        authorEmail: 'test@example.com',
        authorName: '김개발',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const id1 = await createSchedule(schedule1);
      setStatus(`✅ Created schedule 1: ${id1}\n`);

      // 내일 일정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const schedule2 = {
        title: '코드 리뷰',
        description: 'Firebase 인증 기능 및 일정 관리 기능 코드 리뷰',
        startDate: Timestamp.fromDate(tomorrow),
        endDate: Timestamp.fromDate(
          new Date(tomorrow.getTime() + 1 * 60 * 60 * 1000)
        ), // 1시간 후
        location: '온라인 (Google Meet)',
        color: '#22c55e',
        authorEmail: 'test@example.com',
        authorName: '김개발',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const id2 = await createSchedule(schedule2);
      setStatus((prev) => prev + `✅ Created schedule 2: ${id2}\n`);

      // 모레 일정
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(15, 30, 0, 0);

      const schedule3 = {
        title: '디자인 검토',
        description: 'UI/UX 개선사항 논의 및 다크모드 테마 최종 검토',
        startDate: Timestamp.fromDate(dayAfter),
        location: '디자인팀 회의실',
        color: '#ec4899',
        authorEmail: 'test@example.com',
        authorName: '김개발',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const id3 = await createSchedule(schedule3);
      setStatus((prev) => prev + `✅ Created schedule 3: ${id3}\n`);

      setStatus(
        (prev) => prev + '\n🎉 모든 테스트 일정이 성공적으로 생성되었습니다!'
      );
    } catch (error: any) {
      console.error('Error creating test schedules:', error);
      setStatus(
        `❌ Error: ${error.message}\n\n자세한 내용은 콘솔을 확인하세요.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">테스트 일정 생성</h1>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm mb-2">📅 다음 3개의 테스트 일정을 생성합니다:</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>오늘: 프로젝트 미팅 (오후 2시~4시)</li>
          <li>내일: 코드 리뷰 (오전 10시~11시)</li>
          <li>모레: 디자인 검토 (오후 3시 30분)</li>
        </ul>
      </div>

      <button
        onClick={createTestSchedules}
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '생성 중...' : '테스트 일정 생성'}
      </button>

      {status && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm font-mono">{status}</pre>
        </div>
      )}

      <div className="mt-8 space-y-2">
        <a
          href="/schedule"
          className="inline-block text-indigo-600 hover:underline"
        >
          → 일정 페이지로 이동
        </a>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Firebase Console에서도 확인 가능: Firestore Database → schedules
          컬렉션
        </p>
      </div>
    </div>
  );
}
