'use client';

import { useEffect, useState, useCallback } from 'react';
import { noticesApi } from '@/lib/services';
import type { AdminNotice } from '@/lib/types';

type FormData = { title: string; body: string; isPinned: boolean };
const EMPTY_FORM: FormData = { title: '', body: '', isPinned: false };

export default function NoticesPage() {
  const [items, setItems] = useState<AdminNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminNotice | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await noticesApi.getAll(1, 100);
      const sorted = [
        ...res.items.filter((n) => n.isPinned),
        ...res.items.filter((n) => !n.isPinned),
      ];
      setItems(sorted);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (notice: AdminNotice) => {
    setEditTarget(notice);
    setForm({ title: notice.title, body: notice.body, isPinned: notice.isPinned });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const updated = await noticesApi.update(editTarget.id, form);
        setItems((prev) => prev.map((n) => n.id === editTarget.id ? updated : n));
      } else {
        const created = await noticesApi.create(form);
        setItems((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await noticesApi.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">공지사항 관리</h1>
          <p className="text-gray-500 text-sm">앱 사용자에게 공지사항을 작성하고 관리하세요.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition"
        >
          <span>＋</span> 새 공지 작성
        </button>
      </div>

      {/* 작성/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editTarget ? '공지사항 수정' : '새 공지사항 작성'}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              placeholder="공지 제목 (최대 100자)"
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              placeholder="공지 내용을 입력하세요"
              rows={8}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4 accent-violet-600"
            />
            <label htmlFor="isPinned" className="text-sm text-gray-700 cursor-pointer">
              📌 상단 고정 (중요 공지)
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.body.trim()}
              className="flex-1 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition disabled:opacity-50"
            >
              {saving ? '저장 중...' : (editTarget ? '수정 완료' : '공지 등록')}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditTarget(null); setForm(EMPTY_FORM); }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="text-4xl">📢</span>
            <p>아직 공지사항이 없습니다.</p>
            <button
              onClick={openCreate}
              className="text-sm text-violet-600 hover:underline"
            >
              첫 번째 공지를 작성해보세요
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">상태</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">제목</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">내용 미리보기</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">작성일</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {notice.isPinned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                        📌 고정
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        일반
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 max-w-[200px] truncate block" title={notice.title}>
                      {notice.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 max-w-[320px] truncate block" title={notice.body}>
                      {notice.body}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(notice)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      >
                        수정
                      </button>
                      {confirmId === notice.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(notice.id)}
                            disabled={deletingId === notice.id}
                            className="text-xs px-2 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                          >
                            {deletingId === notice.id ? '삭제 중...' : '확인'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(notice.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
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
    </div>
  );
}
