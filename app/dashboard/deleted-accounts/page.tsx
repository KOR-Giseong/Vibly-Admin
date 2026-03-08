'use client';

import { useEffect, useState } from 'react';
import { deletedAccountsApi, AdminDeletedAccount } from '@/lib/services';

const PAGE_SIZE = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function daysLeft(canRejoinAt: string) {
  const diff = new Date(canRejoinAt).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days}일 남음` : '제한 만료';
}

const PROVIDER_LABEL: Record<string, string> = {
  EMAIL: '이메일',
  GOOGLE: '구글',
  KAKAO: '카카오',
  APPLE: '애플',
};

export default function DeletedAccountsPage() {
  const [items, setItems] = useState<AdminDeletedAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const res = await deletedAccountsApi.getAll(p, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  const handleUnlock = async (item: AdminDeletedAccount) => {
    const label = item.email ?? item.providerId ?? item.id;
    if (!confirm(`"${label}" 계정의 재가입 제한을 해제하시겠어요?\n해당 이메일/소셜 계정으로 즉시 새 계정 가입이 가능해집니다.`)) return;
    setUnlocking(item.id);
    try {
      await deletedAccountsApi.unlock(item.id);
      await fetchData(page);
    } catch {
      alert('처리에 실패했습니다.');
    } finally {
      setUnlocking(null);
    }
  };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      !q ||
      item.email?.toLowerCase().includes(q) ||
      item.providerId?.toLowerCase().includes(q) ||
      item.provider.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">탈퇴 계정 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            탈퇴 후 30일 재가입 제한 중인 계정 목록입니다. 관리자 권한으로 제한을 즉시 해제할 수 있습니다.
          </p>
        </div>
        <span className="text-sm text-gray-400">총 {total}건</span>
      </div>

      {/* 검색 */}
      <input
        type="text"
        placeholder="이메일, 소셜 ID, 제공자로 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
      />

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-gray-400">탈퇴 계정이 없어요.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">이메일 / 소셜 ID</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">제공자</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">탈퇴일</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">재가입 가능일</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">남은 제한</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const isExpired = new Date(item.canRejoinAt) <= new Date();
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-800 font-medium">
                      {item.email ?? item.providerId ?? <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                        {PROVIDER_LABEL[item.provider] ?? item.provider}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(item.deletedAt)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(item.canRejoinAt)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isExpired
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {daysLeft(item.canRejoinAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleUnlock(item)}
                        disabled={unlocking === item.id}
                        className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition disabled:opacity-50"
                      >
                        {unlocking === item.id ? '처리 중...' : '🔓 재가입 허용'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
