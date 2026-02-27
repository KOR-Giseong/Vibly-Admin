'use client';

import { useEffect, useState, useCallback } from 'react';
import { communityApi } from '@/lib/services';
import { POST_CATEGORY_LABEL } from '@/lib/types';
import type { AdminPost } from '@/lib/types';

export default function CommunityPage() {
  const [data, setData] = useState<{ total: number; items: AdminPost[] } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const LIMIT = 30;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await communityApi.getPosts(p, LIMIT);
      setData({ total: res.total, items: res.items });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const handleToggleHidden = async (id: string) => {
    await communityApi.toggleHidden(id);
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((p) => p.id === id ? { ...p, isHidden: !p.isHidden } : p) }
        : prev,
    );
  };

  const handleTogglePinned = async (id: string) => {
    await communityApi.togglePinned(id);
    setData((prev) =>
      prev
        ? { ...prev, items: prev.items.map((p) => p.id === id ? { ...p, isPinned: !p.isPinned } : p) }
        : prev,
    );
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await communityApi.deletePost(id);
      setData((prev) =>
        prev
          ? { ...prev, total: prev.total - 1, items: prev.items.filter((p) => p.id !== id) }
          : prev,
      );
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const filtered = data?.items.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.user.name.toLowerCase().includes(q) ||
      (p.user.nickname ?? '').toLowerCase().includes(q)
    );
  }) ?? [];

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  const categoryColor: Record<string, string> = {
    FREE: 'bg-violet-100 text-violet-700',
    INFO: 'bg-emerald-100 text-emerald-700',
    QUESTION: 'bg-amber-100 text-amber-700',
    REVIEW: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">커뮤니티 관리</h1>
        <p className="text-gray-500 text-sm">게시글을 숨김 처리하거나 고정하고 부적절한 게시글을 삭제하세요.</p>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 items-center">
        <input
          type="text"
          placeholder="제목, 작성자 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        <span className="text-gray-400 text-sm">
          총 {filtered.length}개
        </span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">게시글이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">카테고리</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">제목</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">작성자</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">조회/좋아요/댓글</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">작성일</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((post) => (
                <tr key={post.id} className={`hover:bg-gray-50 transition ${post.isHidden ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {POST_CATEGORY_LABEL[post.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {post.isPinned && <span className="text-xs">📌</span>}
                      <span className="text-gray-900 font-medium max-w-[240px] truncate" title={post.title}>
                        {post.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-800">{post.user.nickname ?? post.user.name}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {post.viewCount} / {post._count.likes} / {post._count.comments}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${post.isHidden ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {post.isHidden ? '숨김' : '공개'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleTogglePinned(post.id)}
                        title={post.isPinned ? '고정 해제' : '고정'}
                        className="text-xs px-2 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
                      >
                        {post.isPinned ? '📌 해제' : '📌 고정'}
                      </button>
                      <button
                        onClick={() => handleToggleHidden(post.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition ${
                          post.isHidden
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        {post.isHidden ? '공개' : '숨김'}
                      </button>
                      {confirmId === post.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deletingId === post.id}
                            className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                          >
                            {deletingId === post.id ? '삭제 중...' : '확인'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(post.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
