'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/services';
import type { AdminUser } from '@/lib/types';

// ─── 정지 모달 상태 ───────────────────────────────────────────────────────────

interface SuspendModal {
  user: AdminUser;
  reason: string;
  until: string; // yyyy-MM-dd
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: '정상', cls: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: '정지', cls: 'bg-red-100 text-red-600'    },
  DELETED:   { label: '탈퇴', cls: 'bg-gray-100 text-gray-500'  },
};

export default function UsersPage() {
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [suspendModal, setSuspendModal] = useState<SuspendModal | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleAdmin = async (id: string, name: string, currentIsAdmin: boolean) => {
    if (!confirm(`${name}님을 ${currentIsAdmin ? '관리자 해제' : '관리자 지정'}하시겠어요?`)) return;
    try {
      await usersApi.toggleAdmin(id);
      await fetchUsers();
    } catch {
      alert('권한 변경에 실패했습니다.');
    }
  };

  // ── 정지 처리 ─────────────────────────────────────────────────────────────

  const openSuspend = (user: AdminUser) =>
    setSuspendModal({ user, reason: '', until: todayPlus(7) });

  const handleSuspend = async () => {
    if (!suspendModal) return;
    if (!suspendModal.reason.trim()) { alert('정지 사유를 입력해 주세요.'); return; }
    if (!suspendModal.until) { alert('정지 기간을 선택해 주세요.'); return; }
    setSubmitting(true);
    try {
      await usersApi.suspendUser(
        suspendModal.user.id,
        suspendModal.reason.trim(),
        new Date(suspendModal.until).toISOString(),
      );
      setSuspendModal(null);
      await fetchUsers();
    } catch { alert('정지 처리에 실패했습니다.'); }
    finally { setSubmitting(false); }
  };

  const handleUnsuspend = async (id: string, name: string) => {
    if (!confirm(`${name}님의 계정 정지를 해제하시겠어요?`)) return;
    try {
      await usersApi.unsuspendUser(id);
      await fetchUsers();
    } catch { alert('정지 해제에 실패했습니다.'); }
  };

  // ── 필터 ──────────────────────────────────────────────────────────────────

  const filtered = users.filter((u) =>
    u.name.includes(search) ||
    (u.email ?? '').includes(search) ||
    (u.nickname ?? '').includes(search),
  );

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">사용자 관리</h1>
      <p className="text-gray-500 text-sm mb-6">전체 사용자 목록 및 관리자 권한, 계정 정지를 관리합니다.</p>

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
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">가입 방법</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">활동</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">권한</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">사용자가 없습니다.</td></tr>
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
                        {user.status === 'SUSPENDED' && (
                          <p className="text-red-400 text-[11px] mt-0.5">
                            {user.suspendReason} · {formatDate(user.suspendedUntil)}까지
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 가입 방법 */}
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{user.provider}</span>
                  </td>

                  {/* 활동 */}
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    체크인 {user._count.checkIns} · 리뷰 {user._count.reviews} · 북마크 {user._count.bookmarks}
                  </td>

                  {/* 상태 */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>

                  {/* 권한 */}
                  <td className="px-6 py-4">
                    {user.isAdmin ? (
                      <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">일반</span>
                    )}
                  </td>

                  {/* 관리 버튼 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleUnsuspend(user.id, user.nickname ?? user.name)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-green-600 hover:bg-green-50 transition"
                        >
                          정지 해제
                        </button>
                      ) : user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => openSuspend(user)}
                          disabled={user.isAdmin}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          계정 정지
                        </button>
                      ) : null}

                      {user.status !== 'DELETED' && (
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.nickname ?? user.name, user.isAdmin)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                            user.isAdmin
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-violet-600 hover:bg-violet-50'
                          }`}
                        >
                          {user.isAdmin ? '관리자 해제' : '관리자 지정'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 계정 정지 모달 ────────────────────────────────────────────────────── */}
      {suspendModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSuspendModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">계정 정지</h2>
                <p className="text-sm text-gray-500 mt-0.5">{suspendModal.user.nickname ?? suspendModal.user.name}님</p>
              </div>
              <button onClick={() => setSuspendModal(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              {/* 정지 사유 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정지 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={suspendModal.reason}
                  onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                  placeholder="예) 커뮤니티 가이드라인 위반으로 인한 일시 정지"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* 빠른 기간 선택 */}
              <div>
                <p className="text-xs text-gray-500 mb-2">빠른 기간 선택</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: '3일', days: 3 },
                    { label: '7일', days: 7 },
                    { label: '14일', days: 14 },
                    { label: '30일', days: 30 },
                    { label: '90일', days: 90 },
                  ].map(({ label, days }) => (
                    <button
                      key={days}
                      onClick={() => setSuspendModal({ ...suspendModal, until: todayPlus(days) })}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        suspendModal.until === todayPlus(days)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 날짜 직접 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  정지 종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={suspendModal.until}
                  min={todayPlus(1)}
                  onChange={(e) => setSuspendModal({ ...suspendModal, until: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* 경고 박스 */}
              <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 leading-relaxed">
                ⚠️ 정지 기간 동안 해당 사용자는 앱에 로그인하거나 서비스를 이용할 수 없습니다.
                정지 기간 종료 후 자동으로 계정이 복구됩니다.
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSuspendModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleSuspend}
                disabled={submitting || !suspendModal.reason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '계정 정지'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
