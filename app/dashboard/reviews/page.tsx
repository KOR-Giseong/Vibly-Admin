'use client';

import { useEffect, useState, useCallback } from 'react';
import { reviewsApi } from '@/lib/services';
import type { AdminReview } from '@/lib/types';

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsPage() {
  const [data, setData] = useState<{ total: number; items: AdminReview[] } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const LIMIT = 30;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await reviewsApi.getAll(p, LIMIT);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await reviewsApi.delete(id);
      setData((prev) =>
        prev
          ? { ...prev, total: prev.total - 1, items: prev.items.filter((r) => r.id !== id) }
          : prev,
      );
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const filtered = data?.items.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.user.name.toLowerCase().includes(q) ||
      (r.user.nickname ?? '').toLowerCase().includes(q) ||
      r.place.name.toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q);
    const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
    return matchSearch && matchRating;
  }) ?? [];

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">리뷰 관리</h1>
        <p className="text-gray-500 text-sm">전체 리뷰를 조회하고 부적절한 리뷰를 삭제하세요. 삭제 시 장소 평점이 자동 재계산됩니다.</p>
      </div>

      {/* 검색 / 필터 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="사용자명, 장소명, 리뷰 내용 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <div className="flex bg-gray-100 rounded-xl p-1 text-sm gap-0.5">
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all text-xs ${ratingFilter === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {r === 0 ? '전체' : `${r}★`}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">전체 {data?.total ?? 0}건</span>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-gray-400 text-sm py-10 text-center">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs font-medium">
                  <th className="px-6 py-3 text-left">사용자</th>
                  <th className="px-4 py-3 text-left">장소</th>
                  <th className="px-4 py-3 text-center">평점</th>
                  <th className="px-4 py-3 text-left">리뷰 내용</th>
                  <th className="px-4 py-3 text-center">날짜</th>
                  <th className="px-4 py-3 text-center">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">조건에 맞는 리뷰가 없어요.</td>
                  </tr>
                )}
                {filtered.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {review.user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={review.user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-500 text-xs font-bold">
                            {review.user.name[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 leading-none">{review.user.name}</p>
                          {review.user.nickname && <p className="text-xs text-gray-400">@{review.user.nickname}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium max-w-36 truncate">{review.place.name}</p>
                      <p className="text-xs text-gray-400">{review.place.category}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 max-w-64">
                      <p className="text-gray-600 text-xs line-clamp-2">{review.body}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {confirmId === review.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDelete(review.id)}
                            disabled={deletingId === review.id}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                          >
                            {deletingId === review.id ? '...' : '확인'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(review.id)}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">{page} / {totalPages} 페이지</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                >
                  이전
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
