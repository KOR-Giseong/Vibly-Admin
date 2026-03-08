'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscriptionsApi, appConfigApi } from '@/lib/services';
import type { AdminSubscription, SubscriptionType } from '@/lib/types';

const TYPE_LABEL: Record<SubscriptionType, string> = {
  MONTHLY:     '월간',
  YEARLY:      '연간',
  TRIAL:       '무료체험',
  ADMIN_GRANT: '관리자 부여',
};

const TYPE_BADGE: Record<SubscriptionType, string> = {
  MONTHLY:     'bg-blue-100 text-blue-700',
  YEARLY:      'bg-violet-100 text-violet-700',
  TRIAL:       'bg-yellow-100 text-yellow-700',
  ADMIN_GRANT: 'bg-pink-100 text-pink-700',
};

const PLATFORM_LABEL: Record<string, string> = {
  IOS: 'iOS', ANDROID: 'Android', WEB: '관리자',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

type Tab = 'active' | 'history' | 'config';

interface GrantModal {
  userId: string;
  type: SubscriptionType;
  durationDays: string;
}

const CONFIG_KEYS = [
  { key: 'FREE_TRIAL_ENABLED', label: '무료 체험 활성화', type: 'boolean' },
  { key: 'FREE_TRIAL_DAYS',    label: '무료 체험 기간 (일)', type: 'number' },
  { key: 'DISCOUNT_ENABLED',   label: '할인 활성화', type: 'boolean' },
  { key: 'DISCOUNT_PCT',       label: '할인율 (%)', type: 'number' },
] as const;

// ── 유저 아바타 셀 ─────────────────────────────────────────────────────────────
function UserCell({ user }: { user: AdminSubscription['user'] }) {
  return (
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
  );
}

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>('active');

  // ── 활성 구독 ───────────────────────────────────────────────────────────────
  const [subs, setSubs]           = useState<AdminSubscription[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsPage, setSubsPage]   = useState(1);
  const [subsLoading, setSubsLoading] = useState(true);
  const SUBS_LIMIT = 20;

  // ── 전체 구독 내역 ──────────────────────────────────────────────────────────
  const [history, setHistory]           = useState<AdminSubscription[]>([]);
  const [histTotal, setHistTotal]       = useState(0);
  const [histPage, setHistPage]         = useState(1);
  const [histLoading, setHistLoading]   = useState(false);
  const HIST_LIMIT = 30;

  // ── 구독 부여 모달 ──────────────────────────────────────────────────────────
  const [grantModal, setGrantModal] = useState<GrantModal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── 앱 설정 ─────────────────────────────────────────────────────────────────
  const [configs, setConfigs]           = useState<Record<string, string>>({});
  const [configLoading, setConfigLoading] = useState(true);

  // ── 데이터 로드 ─────────────────────────────────────────────────────────────
  const fetchSubs = useCallback(async () => {
    setSubsLoading(true);
    try {
      const data = await subscriptionsApi.getAll(subsPage, SUBS_LIMIT);
      setSubs(data.items);
      setSubsTotal(data.total);
    } finally {
      setSubsLoading(false);
    }
  }, [subsPage]);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await subscriptionsApi.getHistory(histPage, HIST_LIMIT);
      setHistory(data.items);
      setHistTotal(data.total);
    } finally {
      setHistLoading(false);
    }
  }, [histPage]);

  const fetchConfigs = async () => {
    try {
      setConfigs(await appConfigApi.getAll());
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, [fetchSubs]);
  useEffect(() => { fetchConfigs(); }, []);
  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  // ── 구독 취소 ───────────────────────────────────────────────────────────────
  const handleRevoke = async (sub: AdminSubscription) => {
    if (!confirm(`${sub.user.nickname ?? sub.user.name}님의 구독을 취소하시겠습니까?`)) return;
    try {
      await subscriptionsApi.revoke(sub.userId);
      fetchSubs();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '처리 중 오류가 발생했습니다.');
    }
  };

  // ── 구독 부여 ───────────────────────────────────────────────────────────────
  const handleGrant = async () => {
    if (!grantModal) return;
    const days = parseInt(grantModal.durationDays, 10);
    if (!grantModal.userId.trim()) { alert('유저 ID를 입력해주세요.'); return; }
    if (isNaN(days) || days <= 0)  { alert('유효한 기간(일)을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      await subscriptionsApi.grant(grantModal.userId.trim(), grantModal.type, days);
      alert('구독이 부여되었습니다. 해당 유저에게 알림이 발송됩니다.');
      setGrantModal(null);
      fetchSubs();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 앱 설정 ─────────────────────────────────────────────────────────────────
  const handleConfigToggle = async (key: string, current: string) => {
    const next = current === 'true' ? 'false' : 'true';
    try {
      await appConfigApi.set(key, next);
      setConfigs((prev) => ({ ...prev, [key]: next }));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '설정 변경 중 오류가 발생했습니다.');
    }
  };

  const handleConfigNumber = async (key: string, value: string) => {
    if (!value.trim() || isNaN(Number(value))) return;
    try {
      await appConfigApi.set(key, value);
      setConfigs((prev) => ({ ...prev, [key]: value }));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '설정 변경 중 오류가 발생했습니다.');
    }
  };

  const subsTotalPages = Math.ceil(subsTotal / SUBS_LIMIT);
  const histTotalPages = Math.ceil(histTotal / HIST_LIMIT);

  return (
    <div>
      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">구독 관리</h1>
          <p className="text-gray-500 text-sm mt-1">프리미엄 구독 부여·취소·내역 및 앱 설정을 관리합니다.</p>
        </div>
        <button
          onClick={() => setGrantModal({ userId: '', type: 'ADMIN_GRANT', durationDays: '30' })}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition"
        >
          <span>⭐</span> 구독 부여
        </button>
      </div>

      {/* ── 탭 ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([['active', '활성 구독'], ['history', '전체 내역'], ['config', '앱 설정']] as [Tab, string][]).map(([key, label]) => (
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

      {/* ── 활성 구독 탭 ─────────────────────────────────────────────────── */}
      {tab === 'active' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">활성 구독자 <span className="font-semibold text-gray-900">{subsTotal.toLocaleString()}</span>명</p>
          </div>

          {subsLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">구독 유형</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">만료일</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">구독자가 없습니다.</td></tr>
                )}
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><UserCell user={sub.user} /></td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[sub.type]}`}>
                        {TYPE_LABEL[sub.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">{formatDate(sub.expiresAt)}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(sub.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevoke(sub)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {subsTotalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{subsPage} / {subsTotalPages} 페이지</p>
              <div className="flex gap-2">
                <button onClick={() => setSubsPage((p) => Math.max(1, p - 1))} disabled={subsPage === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">이전</button>
                <button onClick={() => setSubsPage((p) => Math.min(subsTotalPages, p + 1))} disabled={subsPage === subsTotalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">다음</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 전체 내역 탭 ─────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500">총 <span className="font-semibold text-gray-900">{histTotal.toLocaleString()}</span>건의 구독 내역 (활성 + 만료 포함)</p>
          </div>

          {histLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">불러오는 중...</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">구독 유형</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">플랫폼</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">부여 관리자</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">만료일</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">등록일</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">내역이 없습니다.</td></tr>
                )}
                {history.map((sub) => {
                  const expired = isExpired(sub.expiresAt);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><UserCell user={sub.user} /></td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[sub.type]}`}>
                          {TYPE_LABEL[sub.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{PLATFORM_LABEL[sub.platform] ?? sub.platform}</span>
                      </td>
                      {/* 부여 관리자 (ADMIN_GRANT인 경우) */}
                      <td className="px-6 py-4">
                        {sub.admin ? (
                          <div>
                            <p className="text-xs font-medium text-gray-700">{sub.admin.nickname ?? sub.admin.name}</p>
                            <p className="text-xs text-gray-400">{sub.admin.email ?? '-'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={expired ? 'text-red-400 text-xs' : 'text-gray-700 text-sm'}>
                          {formatDateTime(sub.expiresAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(sub.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${expired ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {expired ? '만료' : '활성'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}

          {histTotalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">{histPage} / {histTotalPages} 페이지</p>
              <div className="flex gap-2">
                <button onClick={() => setHistPage((p) => Math.max(1, p - 1))} disabled={histPage === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">이전</button>
                <button onClick={() => setHistPage((p) => Math.min(histTotalPages, p + 1))} disabled={histPage === histTotalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">다음</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 앱 설정 탭 ───────────────────────────────────────────────────── */}
      {tab === 'config' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">앱 설정</h2>
          <p className="text-gray-500 text-xs mb-5">무료 체험 및 할인 이벤트 설정을 관리합니다.</p>

          {configLoading ? (
            <p className="text-sm text-gray-400">설정 불러오는 중...</p>
          ) : (
            <div className="space-y-4">
              {CONFIG_KEYS.map(({ key, label, type }) => {
                const value = configs[key] ?? (type === 'boolean' ? 'false' : '0');
                return (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{key}</p>
                    </div>
                    {type === 'boolean' ? (
                      <button
                        onClick={() => handleConfigToggle(key, value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value === 'true' ? 'bg-violet-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          value === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    ) : (
                      <input
                        type="number" min={0} defaultValue={value}
                        onBlur={(e) => handleConfigNumber(key, e.target.value)}
                        className="w-24 text-right border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 구독 부여 모달 ────────────────────────────────────────────────── */}
      {grantModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setGrantModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">구독 부여</h2>
                <p className="text-sm text-gray-500 mt-0.5">관리자 권한으로 프리미엄 구독을 부여합니다.</p>
              </div>
              <button onClick={() => setGrantModal(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유저 ID</label>
                <input
                  type="text" value={grantModal.userId}
                  onChange={(e) => setGrantModal({ ...grantModal, userId: e.target.value })}
                  placeholder="유저 UUID 또는 이메일 입력"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">구독 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['MONTHLY', 'YEARLY', 'TRIAL', 'ADMIN_GRANT'] as SubscriptionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setGrantModal({ ...grantModal, type: t })}
                      className={`py-2 text-xs font-semibold rounded-lg border transition ${
                        grantModal.type === t
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'text-gray-600 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기간 (일)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[7, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      onClick={() => setGrantModal({ ...grantModal, durationDays: String(d) })}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        grantModal.durationDays === String(d)
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'text-gray-600 border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      {d}일
                    </button>
                  ))}
                </div>
                <input
                  type="number" min={1} value={grantModal.durationDays}
                  onChange={(e) => setGrantModal({ ...grantModal, durationDays: e.target.value })}
                  placeholder="직접 입력"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-700 leading-relaxed">
                ⭐ 만료일: {new Date(Date.now() + parseInt(grantModal.durationDays || '0') * 86400000).toLocaleDateString('ko-KR')}
                <br />
                <span className="text-violet-500">부여 시 해당 유저에게 푸시 알림이 발송됩니다.</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setGrantModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">취소</button>
              <button
                onClick={handleGrant}
                disabled={submitting || !grantModal.userId.trim() || !grantModal.durationDays}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-violet-600 hover:bg-violet-700 transition disabled:opacity-50"
              >
                {submitting ? '처리 중...' : '부여하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
