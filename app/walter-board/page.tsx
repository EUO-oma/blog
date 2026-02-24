'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type WalterCommand = {
  id: string;
  created_at: string;
  command_text: string;
  status: string;
  result_text: string | null;
};

const ALLOWED_EMAIL = 'icandoit13579@gmail.com';

export default function WalterBoardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<WalterCommand[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newCommand, setNewCommand] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  const canWrite = !!user?.email && user.email.toLowerCase() === ALLOWED_EMAIL;

  const load = async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anon) {
        setError('환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
        return;
      }

      const endpoint = `${url}/rest/v1/walter_commands?select=id,created_at,command_text,status,result_text&order=created_at.desc&limit=50`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Supabase 조회 실패 (${res.status}): ${text}`);
        return;
      }

      const data = (await res.json()) as WalterCommand[];
      setRows(data);
    } catch (e: any) {
      setError(`조회 중 오류: ${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitCommand = async () => {
    setSubmitMsg('');
    if (!canWrite) {
      setSubmitMsg('작성 권한이 없습니다.');
      return;
    }
    if (!newCommand.trim()) {
      setSubmitMsg('명령을 입력해줘.');
      return;
    }

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) {
        setSubmitMsg('환경변수가 없습니다.');
        return;
      }

      const endpoint = `${url}/rest/v1/walter_commands`;
      const body = [
        {
          owner_id: '8497629423',
          source: 'blog',
          command_text: newCommand.trim(),
          worker_key: 'WALTER_WORKER_TOKEN_001',
          status: 'queued',
        },
      ];

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        setSubmitMsg(`등록 실패 (${res.status}): ${text}`);
        return;
      }

      setNewCommand('');
      setSubmitMsg('명령 등록 완료');
      await load();
    } catch (e: any) {
      setSubmitMsg(`등록 오류: ${e?.message ?? e}`);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Walter Command Board</h1>
      <p className="text-sm text-gray-500 mb-4">텔레그램 ↔ Supabase 미러링 작업 현황 (최신순)</p>

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm mb-2">로그인 사용자: {user?.email ?? '로그인 안 됨'}</p>
        <p className="text-xs text-gray-500 mb-3">작성 허용 계정: {ALLOWED_EMAIL}</p>
        <div className="flex gap-2">
          <input
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="예: 배터리 상태 확인"
            className="flex-1 rounded border px-3 py-2 text-sm"
            disabled={!canWrite}
          />
          <button
            onClick={submitCommand}
            disabled={!canWrite}
            className="rounded bg-indigo-600 text-white px-4 py-2 text-sm disabled:bg-gray-400"
          >
            명령 등록
          </button>
        </div>
        {submitMsg ? <p className="mt-2 text-sm text-gray-700">{submitMsg}</p> : null}
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 p-4 text-sm whitespace-pre-wrap">{error}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">시간</th>
              <th className="text-left px-4 py-3">명령</th>
              <th className="text-left px-4 py-3">상태</th>
              <th className="text-left px-4 py-3">결과</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">불러오는 중...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">표시할 데이터가 없습니다.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{new Date(row.created_at).toLocaleString('ko-KR')}</td>
                  <td className="px-4 py-3 min-w-[220px]">{row.command_text}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full px-2 py-1 text-xs bg-gray-100 text-gray-700">{row.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-pre-wrap">{row.result_text || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
