'use client';

import { useEffect, useState } from 'react';

type WalterCommand = {
  id: string;
  created_at: string;
  command_text: string;
  status: string;
  result_text: string | null;
};

export default function WalterBoardPage() {
  const [rows, setRows] = useState<WalterCommand[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    load();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Walter Command Board</h1>
      <p className="text-sm text-gray-500 mb-6">텔레그램 ↔ Supabase 미러링 작업 현황 (최신순)</p>

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
