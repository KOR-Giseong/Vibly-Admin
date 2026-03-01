'use client';

import { useState, useEffect, useCallback } from 'react';
import { couplesApi } from '@/lib/services';
import type { AdminCouple } from '@/lib/types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'DISSOLVED';

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="w-8 h-8 rounded-full object-cover" />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CouplesPage() {
  const [couples, setCouples] = useState<AdminCouple[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [dissolvingId, setDissolvingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async (p: number, status: StatusFilter) => {
    setLoading(true);
    try {
      const res = await couplesApi.getAll(p, 30, status === 'ALL' ? undefined : status);
      setCouples(res.items);
      setTotal(res.total);
      setHasNext(res.hasNext);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, statusFilter); }, [load, page, statusFilter]);

  const handleFilterChange = (f: StatusFilter) => {
    setStatusFilter(f);
    setPage(1);
  };

  const handleDissolve = async (id: string) => {
    setDissolvingId(id);
    try {
      await couplesApi.dissolve(id);
      setCouples((prev) =>
        prev.map((c) => c.id === id ? { ...c, status: 'DISSOLVED', dissolvedAt: new Date().toISOString() } : c)
      );
    } catch {
      alert('커플 해제에 실패했습니다.');
    } finally {
      setDissolvingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💑 커플 관리</h1>
          <p className="text-sm text-gray-500 mt-1">전체 {total.toLocaleString()}쌍</p>
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-2">
          {(['ALL', 'ACTIVE', 'DISSOLVED'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                statusFilter === f
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'ALL' ? '전체' : f === 'ACTIVE' ? '활성' : '해제됨'}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">로딩 중...</div>
        ) : couples.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <span className="text-4xl">💑</span>
            <p>커플 데이터가 없습니다</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">파트너 1</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">파트너 2</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">상태</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">데이트 플랜</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">추억</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">크레딧 공유</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">등록일</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {couples.map((couple) => (
                <tr key={couple.id} className="hover:bg-gray-50 transition">
                  {/* 파트너 1 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={couple.user1.name} url={couple.user1.avatarUrl} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {couple.user1.nickname ?? couple.user1.name}
                        </p>
                        {couple.user1.email && (
                          <p className="text-xs text-gray-400">{couple.user1.email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 파트너 2 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={couple.user2.name} url={couple.user2.avatarUrl} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {couple.user2.nickname ?? couple.user2.name}
                        </p>
                        {couple.user2.email && (
                          <p className="text-xs text-gray-400">{couple.user2.email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 상태 */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        couple.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {couple.status === 'ACTIVE' ? '💚 활성' : '💔 해제됨'}
                    </span>
                  </td>

                  {/* 데이트 플랜 수 */}
                  <td className="px-6 py-4 text-gray-700">{couple._count.datePlans}</td>

                  {/* 추억 수 */}
                  <td className="px-6 py-4 text-gray-700">{couple._count.memories}</td>

                  {/* 크레딧 공유 */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${couple.creditShareEnabled ? 'text-violet-600' : 'text-gray-400'}`}>
                      {couple.creditShareEnabled ? '공유 중' : '비활성'}
                    </span>
                  </td>

                  {/* 등록일 */}
                  <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(couple.createdAt).toLocaleDateString('ko-KR')}
                  </td>

                  {/* 액션 */}
                  <td className="px-6 py-4">
                    {couple.status === 'ACTIVE' && (
                      confirmId === couple.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDissolve(couple.id)}
                            disabled={dissolvingId === couple.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition"
                          >
                            {dissolvingId === couple.id ? '처리 중...' : '확인'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(couple.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                        >
                          커플 해제
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            이전
          </button>
          <span className="text-sm text-gray-500">페이지 {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
