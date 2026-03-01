'use client';

import { useEffect, useState } from 'react';
import { creditsApi } from '@/lib/services';
import type { AdminUserCredit } from '@/lib/types';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: '정상', cls: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: '정지', cls: 'bg-red-100 text-red-600'    },
  DELETED:   { label: '탈퇴', cls: 'bg-gray-100 text-gray-500'  },
};

interface AdjustModal {
  user: AdminUserCredit;
  amount: string;
  type: 'grant' | 'deduct';
}

export default function CreditsPage() {
  const [users, setUsers]         = useState<AdminUserCredit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<AdjustModal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await creditsApi.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = (user: AdminUserCredit, type: 'grant' | 'deduct') =>
    setModal({ user, amount: '', type });

  const handleAdjust = async () => {
    if (!modal) return;
    const n = parseInt(modal.amount, 10);
    if (isNaN(n) || n <= 0) { alert('올바른 크레딧 양을 입력해 주세요.'); return; }
    const amount = modal.type === 'grant' ? n : -n;
    setSubmitting(true);
    try {
      const result = await creditsApi.adjust(modal.user.id, amount);
      setUsers((prev) =>
        prev.map((u) => u.id === modal.user.id ? { ...u, credits: result.credits } : u),
      );
      alert(`${modal.user.nickname ?? modal.user.name}님 크레딧 ${modal.type === 'grant' ? '지급' : '차감'} 완료\n현재 잔액: ${result.credits.toLocaleString()}`);
      setModal(null);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name.includes(search) ||
    (u.email ?? '').includes(search) ||
    (u.nickname ?? '').includes(search),
  );

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">크레딧 관리</h1>
      <p className="text-gray-500 text-sm mb-6">유저별 크레딧 잔액 조회 및 지급/차감을 관리합니다.</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="이름, 이메일, 닉네임 검색..."
        className="w-full max-w-sm mb-6 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">보유 크레딧</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">사용자가 없습니다.</td></tr>
            )}
            {filtered.map((user) => {
              const badge = STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE;
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* 사용자 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700 overflow-hidden flex-shrink-0">
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatarUrl} alt={user.nickname ?? user.name} className="w-full h-full object-cover" />
                        ) : (user.nickname ?? user.name)[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nickname ?? user.name}</p>
                        <p className="text-gray-400 text-xs">{user.email ?? '-'}</p>
                      </div>
                    </div>
                  </td>

                  {/* 상태 */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>

                  {/* 크레딧 */}
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold text-base ${user.credits < 10 ? 'text-red-500' : 'text-gray-900'}`}>
                      {user.credits.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">크레딧</span>
                  </td>

                  {/* 관리 버튼 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(user, 'grant')}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                      >
                        지급
                      </button>
                      <button
                        onClick={() => openModal(user, 'deduct')}
                        disabled={user.credits === 0}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        차감
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 지급/차감 모달 ──────────────────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  크레딧 {modal.type === 'grant' ? '지급' : '차감'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {modal.user.nickname ?? modal.user.name} · 현재 {modal.user.credits.toLocaleString()} 크레딧
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modal.type === 'grant' ? '지급' : '차감'}할 크레딧 수
                </label>
                <input
                  type="number"
                  min={1}
                  value={modal.amount}
                  onChange={(e) => setModal({ ...modal, amount: e.target.value })}
                  placeholder="예) 100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>

              {/* 빠른 선택 */}
              <div>
                <p className="text-xs text-gray-500 mb-2">빠른 선택</p>
                <div className="flex gap-2 flex-wrap">
                  {[10, 50, 100, 500, 1000].map((n) => (
                    <button
                      key={n}
                      onClick={() => setModal({ ...modal, amount: String(n) })}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        modal.amount === String(n)
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'text-gray-600 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                modal.type === 'grant' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                {modal.type === 'grant'
                  ? `✅ 지급 후 잔액: ${(modal.user.credits + (parseInt(modal.amount) || 0)).toLocaleString()} 크레딧`
                  : `⚠️ 차감 후 잔액: ${Math.max(0, modal.user.credits - (parseInt(modal.amount) || 0)).toLocaleString()} 크레딧`
                }
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleAdjust}
                disabled={submitting || !modal.amount}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 ${
                  modal.type === 'grant' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {submitting ? '처리 중...' : modal.type === 'grant' ? '지급하기' : '차감하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
