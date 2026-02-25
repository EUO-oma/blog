'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createWalterCommand,
  deleteWalterCommandById,
  deleteWalterCommandsByIds,
  deleteWalterCommandsByStatus,
  listWalterCommands,
  type WalterCommand,
  type WalterCommandStatus,
} from '@/lib/supabase-walter';

const ALLOWED_EMAIL = 'icandoit13579@gmail.com';

function safeText(v: string | null | undefined) {
  if (!v) return '-';
  if (v.includes('�') || v.includes('???')) {
    return '인코딩 깨짐 데이터(폴러 수정 이후 신규 건부터 정상 표시)';
  }
  return v;
}

export default function WalterBoardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<WalterCommand[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newCommand, setNewCommand] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WalterCommandStatus>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canWrite = !!user?.email && user.email.toLowerCase() === ALLOWED_EMAIL;

  const load = async () => {
    setError('');
    try {
      const data = await listWalterCommands(100);
      setRows(data);
      setSelectedIds([]);
    } catch (e: any) {
      setError(`조회 중 오류: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitCommand = async (presetText?: string) => {
    setSubmitMsg('');
    if (!canWrite) return setSubmitMsg('작성 권한이 없습니다.');
    const command = (presetText ?? newCommand).trim();
    if (!command) return setSubmitMsg('명령을 입력해줘.');

    try {
      await createWalterCommand(command);
      if (!presetText) setNewCommand('');
      setSubmitMsg('명령 등록 완료');
      await load();
    } catch (e: any) {
      setSubmitMsg(`등록 오류: ${e?.message ?? e}`);
    }
  };

  const deleteCommand = async (id: string) => {
    if (!canWrite) return;
    if (!confirm('이 항목을 삭제할까?')) return;

    try {
      await deleteWalterCommandById(id);
      setSubmitMsg('삭제 완료');
      await load();
    } catch (e: any) {
      setSubmitMsg(`삭제 오류: ${e?.message ?? e}`);
    }
  };

  const clearDoneError = async () => {
    if (!canWrite) return;
    if (!confirm('done/error 항목을 모두 삭제할까?')) return;

    try {
      await deleteWalterCommandsByStatus(['done', 'error']);
      setSubmitMsg('done/error 일괄 정리 완료');
      await load();
    } catch (e: any) {
      setSubmitMsg(`일괄정리 오류: ${e?.message ?? e}`);
    }
  };

  const deleteSelected = async () => {
    if (!canWrite) return;
    if (selectedIds.length === 0) return setSubmitMsg('선택된 항목이 없습니다.');
    if (!confirm(`선택 ${selectedIds.length}건을 삭제할까?`)) return;

    try {
      await deleteWalterCommandsByIds(selectedIds);
      setSubmitMsg('선택 항목 삭제 완료');
      await load();
    } catch (e: any) {
      setSubmitMsg(`선택삭제 오류: ${e?.message ?? e}`);
    }
  };

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const queuedCount = rows.filter((r) => r.status === 'queued').length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Walter Command Board</h1>
      <p className="text-sm text-gray-500 mb-4">텔레그램 ↔ Supabase 작업 게시판</p>

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm mb-2">로그인 사용자: {user?.email ?? '로그인 안 됨'}</p>
        <p className="text-xs text-gray-500 mb-3">작성 허용 계정: {ALLOWED_EMAIL}</p>
        <div className="flex gap-2 mb-2">
          <input
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="예: 배터리 상태 확인"
            className="flex-1 rounded border px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100"
            disabled={!canWrite}
          />
          <button onClick={() => submitCommand()} disabled={!canWrite} className="rounded bg-indigo-600 text-white px-4 py-2 text-sm disabled:bg-gray-400">명령 등록</button>
          <button onClick={load} className="rounded bg-gray-700 text-white px-4 py-2 text-sm">새로고침</button>
          <button onClick={clearDoneError} disabled={!canWrite} className="rounded bg-orange-600 text-white px-4 py-2 text-sm disabled:bg-gray-400">완료항목 정리</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={() => submitCommand('배터리 상태 확인')} disabled={!canWrite} className="rounded border px-3 py-1 text-xs bg-white disabled:bg-gray-100">배터리 확인</button>
          <button onClick={() => submitCommand('큐 상태 확인')} disabled={!canWrite} className="rounded border px-3 py-1 text-xs bg-white disabled:bg-gray-100">큐 확인</button>
          <button onClick={() => submitCommand('오늘 처리 결과 요약')} disabled={!canWrite} className="rounded border px-3 py-1 text-xs bg-white disabled:bg-gray-100">요약 요청</button>
        </div>

        {submitMsg ? <p className="mt-1 text-sm text-gray-700">{submitMsg}</p> : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">필터:</span>
        {(['all', 'queued', 'running', 'done', 'error'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2 py-1 rounded border ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700'}`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setSelectedIds(filteredRows.filter((r) => r.status === 'done' || r.status === 'error').map((r) => r.id))}
          className="px-2 py-1 rounded border bg-white text-gray-700"
        >
          완료/에러 선택
        </button>
        <button onClick={deleteSelected} disabled={!canWrite} className="px-2 py-1 rounded border bg-red-600 text-white disabled:bg-gray-400">
          선택 삭제 ({selectedIds.length})
        </button>
        <span className="ml-3 text-gray-500">대기열: {queuedCount}건</span>
      </div>

      {error ? <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 p-4 text-sm whitespace-pre-wrap">{error}</div> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
        <table className="min-w-full text-sm text-gray-900 dark:text-gray-100">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
            <tr>
              <th className="text-left px-4 py-3">선택</th>
              <th className="text-left px-4 py-3">시간</th>
              <th className="text-left px-4 py-3">명령</th>
              <th className="text-left px-4 py-3">상태</th>
              <th className="text-left px-4 py-3">결과</th>
              <th className="text-left px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">불러오는 중...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">표시할 데이터가 없습니다.</td></tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800 align-top">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds((prev) => Array.from(new Set([...prev, row.id])));
                        else setSelectedIds((prev) => prev.filter((id) => id !== row.id));
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{new Date(row.created_at).toLocaleString('ko-KR')}</td>
                  <td className="px-4 py-3 min-w-[260px] text-gray-900 dark:text-gray-100">{safeText(row.command_text)}</td>
                  <td className="px-4 py-3"><span className="inline-block rounded-full px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">{row.status}</span></td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{safeText(row.result_text)}</td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <button onClick={() => deleteCommand(row.id)} className="rounded bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-700">삭제</button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
