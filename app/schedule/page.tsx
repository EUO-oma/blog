'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Schedule } from '@/lib/firebase';
import { getSchedules, deleteSchedule } from '@/lib/firebase-schedules';
import ScheduleModal from '@/components/ScheduleModal';
import ScheduleForm from '@/components/ScheduleForm';
import { exportSchedulesToExcel } from '@/lib/export-schedules';
import { downloadICS } from '@/lib/calendar-utils';
import LoaderSwitcher from '@/components/LoaderSwitcher';
import { deleteCalendarCacheByEventId, getCalendarRangeCacheItems, type CalendarTodayCacheItem } from '@/lib/firebase-calendar-cache';

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
  const [calendarSynced, setCalendarSynced] = useState<CalendarTodayCacheItem[]>([]);
  const [syncMsg, setSyncMsg] = useState<string>('');
  const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || '';
  const gasApiToken = process.env.NEXT_PUBLIC_GAS_SYNC_TOKEN || '';
  const canDeleteCalendar = user?.email?.toLowerCase() === 'icandoit13579@gmail.com';

  const toDate = (value: any): Date | null => {
    try {
      if (!value) return null;
      if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
      if (typeof value.toDate === 'function') {
        const d = value.toDate();
        return isNaN(d.getTime()) ? null : d;
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

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
      const [fetchedSchedules, fetchedCalendar] = await Promise.all([
        getSchedules(),
        getCalendarRangeCacheItems(60).catch(() => []),
      ]);
      // 데이터 유효성 검증
      const validSchedules = fetchedSchedules.filter(schedule => 
        schedule && schedule.startDate && typeof schedule.startDate.toDate === 'function'
      );
      setSchedules(validSchedules);
      setCalendarSynced(fetchedCalendar);
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

  const shareSynced = async (item: CalendarTodayCacheItem) => {
    const text = `🗓️ ${item.title}\n${item.startAt || ''}${item.location ? `\n📍 ${item.location}` : ''}`;
    try {
      const nav: any = typeof navigator !== 'undefined' ? navigator : null;
      if (nav && typeof nav.share === 'function') {
        await nav.share({ title: item.title, text });
      } else if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        setSyncMsg('공유 미지원 환경이라 일정 내용을 복사했어.');
      } else {
        setSyncMsg('이 브라우저에서는 공유/복사가 제한돼 있어.');
      }
    } catch {
      setSyncMsg('공유가 취소되었거나 실패했어.');
    }
  };

  const deleteSyncedFromCalendar = async (eventId: string) => {
    if (!canDeleteCalendar) return;
    if (!gasWebAppUrl || !gasApiToken) {
      setSyncMsg('GAS 연동 변수 누락');
      return;
    }
    if (!window.confirm('캘린더 원본에서 삭제할까요?')) return;

    // 1차: 화면/캐시에서 즉시 제거(사용자 체감 개선)
    setCalendarSynced((prev) => prev.filter((x) => x.eventId !== eventId));
    await deleteCalendarCacheByEventId(eventId).catch(() => {});

    const payload = JSON.stringify({ action: 'deleteEvent', eventId, token: gasApiToken });
    try {
      const res = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      const data = await res.json();
      if (!data?.ok) {
        setSyncMsg(`삭제 실패: ${data?.error || 'unknown'}`);
        return;
      }
      await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncNow', token: gasApiToken }),
      }).catch(() => {});

      setSyncMsg(data?.deleted === false ? '이미 삭제된 일정이야. 목록에서 정리했어.' : '캘린더 원본 삭제 완료');
      const refreshed = await getCalendarRangeCacheItems(60).catch(() => []);
      setCalendarSynced(refreshed);
    } catch {
      await fetch(gasWebAppUrl, { method: 'POST', mode: 'no-cors', body: payload });
      setSyncMsg('삭제 요청 전송됨. 잠시 후 최신화할게.');
      setTimeout(async () => {
        const refreshed = await getCalendarRangeCacheItems(60).catch(() => []);
        setCalendarSynced(refreshed);
      }, 1500);
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
        <LoaderSwitcher label="일정을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
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

  const expandedSchedules: (Schedule & { occurrenceKey: string; occurrenceDate: Date })[] = schedules.flatMap((schedule) => {
    const start = toDate(schedule.startDate);
    if (!start) return [];

    const repeatType = schedule.repeatType || 'none';
    const interval = Math.max(1, schedule.repeatInterval || 1);
    const repeatUntil = toDate(schedule.repeatUntil);

    const makeItem = (date: Date, index: number) => ({
      ...schedule,
      startDate: ({ toDate: () => date } as any),
      occurrenceKey: `${schedule.id || 'new'}-${date.toISOString()}-${index}`,
      occurrenceDate: date,
    });

    if (repeatType === 'none') {
      return [makeItem(start, 0)];
    }

    // 화면 과부하 방지: 앞으로 180일까지만 전개
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 180);

    const results: (Schedule & { occurrenceKey: string; occurrenceDate: Date })[] = [];
    let cursor = new Date(start);
    let guard = 0;

    while (guard < 600) {
      guard += 1;
      if (repeatUntil && cursor > repeatUntil) break;
      if (cursor > rangeEnd) break;

      const inRange = cursor >= rangeStart;
      if (repeatType === 'daily') {
        if (inRange) results.push(makeItem(new Date(cursor), guard));
        cursor.setDate(cursor.getDate() + interval);
        continue;
      }

      if (repeatType === 'weekly') {
        const weekdays = schedule.repeatWeekdays && schedule.repeatWeekdays.length > 0
          ? schedule.repeatWeekdays
          : [start.getDay()];

        weekdays.forEach((day) => {
          const base = new Date(cursor);
          const diff = day - base.getDay();
          const target = new Date(base);
          target.setDate(base.getDate() + diff);
          if (target < start) return;
          if (repeatUntil && target > repeatUntil) return;
          if (target >= rangeStart && target <= rangeEnd) {
            results.push(makeItem(target, guard + day));
          }
        });

        cursor.setDate(cursor.getDate() + 7 * interval);
        continue;
      }

      if (repeatType === 'monthly') {
        if (inRange) results.push(makeItem(new Date(cursor), guard));
        const next = new Date(cursor);
        next.setMonth(next.getMonth() + interval);
        cursor = next;
        continue;
      }

      break;
    }

    return results;
  }).sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime());

  // 오늘의 일정 필터링
  const todaySchedules = expandedSchedules.filter(schedule => {
    const today = new Date();
    return schedule.occurrenceDate.toDateString() === today.toDateString();
  });

  // 다가올 일정 필터링 (오늘 이후 7일)
  const upcomingSchedules = expandedSchedules.filter(schedule => {
    const today = new Date();
    const weekLater = new Date();
    weekLater.setDate(today.getDate() + 7);
    return schedule.occurrenceDate > today && schedule.occurrenceDate <= weekLater;
  });

  // 일정을 텍스트로 포맷팅
  const formatScheduleText = (schedule: Schedule) => {
    const date = formatDate(schedule.startDate);
    const time = formatTime(schedule.startDate);
    const endTime = schedule.endDate ? formatTime(schedule.endDate) : '';
    
    let text = `📅 ${schedule.title}\n`;
    text += `📍 날짜: ${date}\n`;
    text += `⏰ 시간: ${time}`;
    if (endTime) text += ` ~ ${endTime}`;
    text += '\n';
    if (schedule.location) text += `📌 장소: ${schedule.location}\n`;
    text += `📝 내용: ${schedule.description}`;
    
    return text;
  };

  // 클립보드에 복사
  const copyScheduleToClipboard = async (schedule: Schedule) => {
    const text = formatScheduleText(schedule);
    
    try {
      await navigator.clipboard.writeText(text);
      alert('일정이 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('복사 실패:', err);
      alert('복사에 실패했습니다.');
    }
  };

  // 모바일 공유
  const shareSchedule = async (schedule: Schedule) => {
    const text = formatScheduleText(schedule);
    
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: schedule.title,
          text: text
        });
      } catch (err) {
        console.error('공유 실패:', err);
      }
    }
  };

  const getDateKey = (item: CalendarTodayCacheItem) => {
    const raw = String(item.startAt || '')
    if (!raw) return ''
    // 타임존 변환 오차 방지: 원본 문자열의 날짜부분을 우선 사용
    if (raw.includes('T')) return raw.slice(0, 10)
    return raw.slice(0, 10)
  }

  const groupedCalendarSynced = calendarSynced
    .map((item) => ({ item, key: getDateKey(item) }))
    .filter((x) => !!x.key)
    .sort((a, b) => a.key.localeCompare(b.key) || String(a.item.startAt || '').localeCompare(String(b.item.startAt || '')))
    .reduce((acc: Record<string, CalendarTodayCacheItem[]>, cur) => {
      if (!acc[cur.key]) acc[cur.key] = []
      acc[cur.key].push(cur.item)
      return acc
    }, {} as Record<string, CalendarTodayCacheItem[]>);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3 sm:gap-4">
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">📅 다가올 일정</h2>
          <div className="space-y-2">
            {upcomingSchedules.slice(0, 3).map((schedule) => (
              <div key={schedule.id} className="text-sm">
                <span className="font-medium text-green-700 dark:text-green-300">{formatDate(schedule.startDate)}</span> - {schedule.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google Calendar 동기화 (1개월) */}
      {calendarSynced.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">🔄 Google 캘린더 동기화 (2개월)</h2>
          {syncMsg ? <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2">{syncMsg}</p> : null}

          <div className="space-y-3">
            {Object.entries(groupedCalendarSynced).map(([dateKey, items]) => (
              <div key={dateKey} className="rounded border border-indigo-200/70 dark:border-indigo-800/60 bg-white/70 dark:bg-gray-900/20">
                <div className="px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-300 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <span>{new Date(dateKey).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' })}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{items.length}건</span>
                </div>
                <div className="divide-y divide-indigo-100 dark:divide-indigo-900/40">
                  {items.map((item) => {
                    const when = item.allDay ? '종일' : (item.startAt?.slice(11, 16) || '-')
                    return (
                      <div key={item.id} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                        <a
                          href={`/calendar-sync?id=${encodeURIComponent(item.id)}`}
                          className="truncate flex-1 rounded px-1.5 py-1 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/30"
                          title="일정 상세/수정"
                        >
                          <b>{item.title}</b> · <span className="text-green-700 dark:text-green-300">{when}</span>
                        </a>
                        <div className="shrink-0 flex gap-2">
                          <a
                            href={item.editUrl || `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(`${item.title} ${item.startAt || ''}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="열기"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14m-4 0H3v7h7v-3" />
                            </svg>
                          </a>
                          <button onClick={() => shareSynced(item)} className="text-green-600 hover:text-green-900 p-1" title="공유">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464 0m5.464 0l-5.464 0" />
                            </svg>
                          </button>
                          {canDeleteCalendar ? (
                            <button onClick={() => deleteSyncedFromCalendar(item.eventId)} className="text-red-600 hover:text-red-900 p-1" title="삭제">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedSchedules.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          등록된 일정이 없습니다.
        </p>
      ) : isMobile ? (
        /* 모바일용 카드 뷰 */
        <div className="space-y-4">
          {expandedSchedules.map((schedule) => (
            <div
              key={schedule.occurrenceKey}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: schedule.color || '#6366f1' }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {schedule.title}
                    </h3>
                    {schedule.repeatType && schedule.repeatType !== 'none' && (
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                        반복: {schedule.repeatType === 'daily' ? '매일' : schedule.repeatType === 'weekly' ? '매주' : '매월'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* 복사 버튼 - 모든 사용자에게 표시 */}
                  <button
                    onClick={() => copyScheduleToClipboard(schedule)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="일정 복사"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* 공유 버튼 - 모바일에서만 표시 */}
                  {isMobile && typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={() => shareSchedule(schedule)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="일정 공유"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464 0m5.464 0l-5.464 0" />
                      </svg>
                    </button>
                  )}
                  
                  {/* 캘린더 추가 버튼 - 모든 사용자에게 표시 */}
                  <button
                    onClick={() => downloadICS(schedule)}
                    className="text-purple-600 hover:text-purple-900 p-1"
                    title="캘린더에 추가"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {user && schedule.authorEmail === user.email && (
                    <>
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
                    </>
                  )}
                </div>
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
              {expandedSchedules.map((schedule) => (
                <tr
                  key={schedule.occurrenceKey}
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
                        {schedule.repeatType && schedule.repeatType !== 'none' && (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                            {schedule.repeatType === 'daily' ? '매일' : schedule.repeatType === 'weekly' ? '매주' : '매월'}
                          </span>
                        )}
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
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex gap-2 justify-center">
                      {/* 복사 버튼 - 모든 사용자에게 표시 */}
                      <button
                        onClick={() => copyScheduleToClipboard(schedule)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="일정 복사"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {/* 캘린더 추가 버튼 - 모든 사용자에게 표시 */}
                      <button
                        onClick={() => downloadICS(schedule)}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        title="캘린더에 추가"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {user && schedule.authorEmail === user.email && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
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
