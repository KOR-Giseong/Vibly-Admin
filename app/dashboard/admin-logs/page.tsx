'use client';

import { useEffect, useState } from 'react';
import { adminLogApi, AdminLog } from '@/lib/services';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);

  const limit = 30;

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const data = await adminLogApi.getLogs(p, limit);
      setLogs(data.items);
      setTotal(data.total);
      setHasNext(data.hasNext);
      setPage(p);
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const formatDetail = (detail?: Record<string, unknown>) => {
    if (!detail) return '-';
    const str = JSON.stringify(detail);
    return str.length > 80 ? str.slice(0, 80) + '…' : str;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">액션 로그</h1>
        <p className="text-gray-500 text-sm mt-1">관리자 쓰기 작업 이력 (전체 {total.toLocaleString()}건)</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">로딩 중...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">액션 로그가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">시각</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">관리자 ID</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">액션</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">대상</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">상세</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {log.adminId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <MethodBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.targetType ? (
                      <span>
                        {log.targetType}
                        {log.targetId && (
                          <span className="text-gray-400 font-mono text-xs ml-1">
                            #{log.targetId.slice(0, 6)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono max-w-xs truncate">
                    {formatDetail(log.detail)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{log.ip ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <span className="text-sm text-gray-500">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}건
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLogs(page - 1)}
            disabled={page <= 1 || loading}
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
          >
            이전
          </button>
          <button
            onClick={() => fetchLogs(page + 1)}
            disabled={!hasNext || loading}
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

function MethodBadge({ action }: { action: string }) {
  const method = action.split(':')[0] ?? action;
  const colors: Record<string, string> = {
    POST: 'bg-green-100 text-green-700',
    PATCH: 'bg-blue-100 text-blue-700',
    PUT: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  const color = colors[method] ?? 'bg-gray-100 text-gray-600';
  const path = action.includes(':') ? action.slice(action.indexOf(':') + 1) : '';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${color}`}>{method}</span>
      <span className="text-gray-600 text-xs">{path}</span>
    </span>
  );
}
