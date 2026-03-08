'use client';

import { useEffect, useState, useCallback } from 'react';
import { creditsApi } from '@/lib/services';
import type { AdminUserCredit, AdminCreditGrantLog } from '@/lib/types';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: '정상', cls: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: '정지', cls: 'bg-red-100 text-red-600'    },
  DELETED:   { label: '탈퇴', cls: 'bg-gray-100 text-gray-500'  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// ── 탭 타입 ───────────────────────────────────────────────────────────────────
type Tab = 'users' | 'history';

// ── 개별 지급/차감 모달 ───────────────────────────────────────────────────────
interface AdjustModal {
  user: AdminUserCredit;
  amount: string;
  type: 'grant' | 'deduct';
}

// ── 전체 지급 모달 ────────────────────────────────────────────────────────────
interface BulkModal {
  amount: string;
  note: string;
}

export default function CreditsPage() {
  const [tab, setTab] = useState<Tab>('users');

  // ── 유저 목록 상태 ──────────────────────────────────────────────────────────
  const [users, setUsers]             = useState<AdminUserCredit[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState<AdjustModal | null>(null);
  const [bulkModal, setBulkModal]     = useState<BulkModal | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // ── 지급 내역 상태 ──────────────────────────────────────────────────────────
  const [history, setHistory]         = useState<AdminCreditGrantLog[]>([]);
  const [histTotal, setHistTotal]     = useState(0);
  const [histPage, setHistPage]       = useState(1);
  const [histLoading, setHistLoading] = useState(false);
  const HIST_LIMIT = 30;

  // ── 데이터 로드 ─────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      setUsers(await creditsApi.getUsers());
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await creditsApi.getGrantHistory(histPage, HIST_LIMIT);
      setHistory(data.items);
      setHistTotal(data.total);
    } finally {
      setHistLoading(false);
    }
  }, [histPage]);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  // ── 개별 지급/차감 ──────────────────────────────────────────────────────────
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

  // ── 전체 지급 ───────────────────────────────────────────────────────────────
  const handleBulkGrant = async () => {
    if (!bulkModal) return;
    const n = parseInt(bulkModal.amount, 10);
    if (isNaN(n) || n <= 0) { alert('올바른 크레딧 양을 입력해 주세요.'); return; }
    if (!confirm(`전체 활성 유저에게 ${n.toLocaleString()} 크레딧을 지급합니다. 계속하시겠습니까?`)) return;
    setSubmitting(true);
    try {
      const result = await creditsApi.bulkGrant(n, bulkModal.note || undefined);
      alert(`✅ 전체 지급 완료\n${result.count.toLocaleString()}명에게 ${n.toLocaleString()} 크레딧이 지급되었습니다.`);
      setBulkModal(null);
      fetchUsers();
      if (tab === 'history') fetchHistory();
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

  const histTotalPages = Math.ceil(histTotal / HIST_LIMIT);

  return (
    <div>
      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">크레딧 관리</h1>
          <p className="text-gray-500 text-sm mt-1">유저별 크레딧 잔액 조회, 지급/차감 및 전체 이벤트 지급을 관리합니다.</p>
        </div>
        <button
          onClick={() => setBulkModal({ amount: '', note: '' })}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition"
        >
          <span>🎁</span> 전체 지급
        </button>
      </div>

      {/* ── 탭 ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([['users', '유저 크레딧'], ['history', '지급 내역']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 유저 크레딧 탭 ───────────────────────────────────────────────── */}
      {tab === 'users' && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 이메일, 닉네임 검색..."
            className="w-full max-w-sm mb-5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {usersLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
            ) : (
              <div className="overflow-x-auto">
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700 overflow-hidden flex-shrink-0">
                              {user.avatarUrl
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                : (user.nickname ?? user.name)[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.nickname ?? user.name}</p>
                              <p className="text-gray-400 text-xs">{user.email ?? '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold text-base ${user.credits < 10 ? 'text-red-500' : 'text-gray-900'}`}>
                            {user.credits.toLocaleString()}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">크레딧</span>
                        </td>
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
            )}
          </div>
        </>
      )}

      {/* ── 지급 내역 탭 ─────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{histTotal.toLocaleString()}</span>건의 관리자 지급 내역</p>
          </div>

          {histLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">수신 유저</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">지급 관리자</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">크레딧</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사유/이벤트명</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">내역이 없습니다.</td></tr>
                )}
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    {/* 수신 유저 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 overflow-hidden flex-shrink-0">
                          {log.user.avatarUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={log.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : (log.user.nickname ?? log.user.name)[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{log.user.nickname ?? log.user.name}</p>
                          <p className="text-gray-400 text-xs">{log.user.email ?? log.userId}</p>
                        </div>
                      </div>
                    </td>

                    {/* 지급 관리자 */}
                    <td className="px-6 py-4">
                      {log.admin ? (
                        <div>
                          <p className="font-medium text-gray-700">{log.admin.nickname ?? log.admin.name}</p>
                          <p className="text-gray-400 text-xs">{log.admin.email ?? '-'}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    {/* 크레딧 */}
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${log.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}
                      </span>
                    </td>

                    {/* 사유 */}
                    <td className="px-6 py-4">
                      <span className="text-gray-600 text-xs">{log.note ?? '개별 지급'}</span>
                    </td>

                    {/* 일시 */}
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {histTotalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{histPage} / {histTotalPages} 페이지</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                  disabled={histPage === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  이전
                </button>
                <button
                  onClick={() => setHistPage((p) => Math.min(histTotalPages, p + 1))}
                  disabled={histPage === histTotalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 개별 지급/차감 모달 ──────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">크레딧 {modal.type === 'grant' ? '지급' : '차감'}</h2>
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
                  type="number" min={1} value={modal.amount}
                  onChange={(e) => setModal({ ...modal, amount: e.target.value })}
                  placeholder="예) 100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
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
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">취소</button>
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

      {/* ── 전체 지급 모달 ────────────────────────────────────────────────── */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setBulkModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">전체 크레딧 지급</h2>
                <p className="text-sm text-gray-500 mt-0.5">전체 활성 유저에게 일괄 지급합니다.</p>
              </div>
              <button onClick={() => setBulkModal(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지급 크레딧 수</label>
                <input
                  type="number" min={1} value={bulkModal.amount}
                  onChange={(e) => setBulkModal({ ...bulkModal, amount: e.target.value })}
                  placeholder="예) 100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">빠른 선택</p>
                <div className="flex gap-2 flex-wrap">
                  {[10, 30, 50, 100, 200].map((n) => (
                    <button
                      key={n}
                      onClick={() => setBulkModal({ ...bulkModal, amount: String(n) })}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        bulkModal.amount === String(n)
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'text-gray-600 border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이벤트명 / 사유 <span className="text-gray-400 font-normal">(선택)</span></label>
                <input
                  type="text" value={bulkModal.note}
                  onChange={(e) => setBulkModal({ ...bulkModal, note: e.target.value })}
                  placeholder="예) 출시 기념 이벤트"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 leading-relaxed">
                🎁 전체 활성 유저 대상으로 크레딧이 즉시 지급되며, 알림이 발송됩니다.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setBulkModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">취소</button>
              <button
                onClick={handleBulkGrant}
                disabled={submitting || !bulkModal.amount}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-amber-500 hover:bg-amber-600 transition disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '전체 지급하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
