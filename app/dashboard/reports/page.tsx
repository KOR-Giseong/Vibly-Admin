'use client';

import { useEffect, useState, useCallback } from 'react';
import NextImage from 'next/image';
import { reportsApi, userReportsApi } from '@/lib/services';
import { REPORT_REASON_LABEL } from '@/lib/types';
import type { AdminReport, AdminUserReport } from '@/lib/types';

type MainTab = 'posts' | 'users';
type Filter = 'all' | 'unresolved';

// ── 게시글 신고 탭 ────────────────────────────────────────────────────────────
function PostReportsTab() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('unresolved');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getAll(1, 100, filter === 'unresolved');
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (report: AdminReport, hidePost: boolean) => {
    if (resolvingId) return;
    setResolvingId(report.id);
    try {
      await reportsApi.resolve(report.id, hidePost);
      setItems((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, isResolved: true, post: { ...r.post, isHidden: hidePost ? true : r.post.isHidden } }
            : r,
        ),
      );
    } finally {
      setResolvingId(null);
    }
  };

  const unresolvedCount = items.filter((r) => !r.isResolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {unresolvedCount > 0 && (
          <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
            미처리 {unresolvedCount}건
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          {(['unresolved', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f === 'unresolved' ? '미처리' : '전체'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          {filter === 'unresolved' ? '처리할 신고가 없습니다 ✅' : '신고 내역이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${
                report.isResolved ? 'border-gray-100 opacity-60' : 'border-red-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {REPORT_REASON_LABEL[report.reason]}
                    </span>
                    {report.isResolved ? (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">처리완료</span>
                    ) : (
                      <span className="bg-yellow-50 text-yellow-600 text-xs px-2 py-0.5 rounded-full">미처리</span>
                    )}
                    {report.post.isHidden && (
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">게시글 숨김</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{report.post.title}</p>
                  {report.detail && (
                    <p className="text-sm text-gray-500 mt-1">상세: {report.detail}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>신고자: {report.user.nickname ?? report.user.name}</span>
                    <span>{new Date(report.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
                {!report.isResolved && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleResolve(report, false)}
                      disabled={resolvingId === report.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      무시 (게시글 유지)
                    </button>
                    <button
                      onClick={() => handleResolve(report, true)}
                      disabled={resolvingId === report.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      처리 + 게시글 숨김
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 유저 신고 탭 ──────────────────────────────────────────────────────────────
function UserReportsTab() {
  const [items, setItems] = useState<AdminUserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('unresolved');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userReportsApi.getAll(1, 100, filter === 'unresolved');
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id: string) => {
    if (resolvingId) return;
    setResolvingId(id);
    try {
      await userReportsApi.resolve(id);
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, isResolved: true } : r));
    } finally {
      setResolvingId(null);
    }
  };

  const unresolvedCount = items.filter((r) => !r.isResolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {unresolvedCount > 0 && (
          <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
            미처리 {unresolvedCount}건
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          {(['unresolved', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f === 'unresolved' ? '미처리' : '전체'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          {filter === 'unresolved' ? '처리할 신고가 없습니다 ✅' : '유저 신고 내역이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border ${
                report.isResolved ? 'border-gray-100 opacity-60' : 'border-orange-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {REPORT_REASON_LABEL[report.reason]}
                    </span>
                    {report.isResolved ? (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">처리완료</span>
                    ) : (
                      <span className="bg-yellow-50 text-yellow-600 text-xs px-2 py-0.5 rounded-full">미처리</span>
                    )}
                  </div>

                  {/* 신고 대상 유저 */}
                  <div className="flex items-center gap-3 mb-2">
                    {report.reported.avatarUrl && (
                      <NextImage
                        src={report.reported.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {report.reported.nickname ?? report.reported.name}
                        <span className="text-gray-400 font-normal text-xs ml-1">피신고자</span>
                      </p>
                    </div>
                  </div>

                  {report.detail && (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                      {report.detail}
                    </p>
                  )}

                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>신고자: {report.reporter.nickname ?? report.reporter.name}</span>
                    <span>{new Date(report.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                </div>

                {!report.isResolved && (
                  <button
                    onClick={() => handleResolve(report.id)}
                    disabled={resolvingId === report.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 shrink-0"
                  >
                    처리 완료
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('posts');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
        <p className="text-sm text-gray-500 mt-1">사용자 신고를 검토하고 처리합니다.</p>
      </div>

      {/* 메인 탭 */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'posts', label: '게시글 신고' },
          { key: 'users', label: '유저 신고 (커플/초대)' },
        ] as { key: MainTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'posts' ? <PostReportsTab /> : <UserReportsTab />}
    </div>
  );
}
