'use client';

import { useState } from 'react';
import apiClient from '@/lib/api';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({ error: '제목과 내용을 모두 입력해주세요.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await apiClient.post<{ sent: number }>('/notifications/broadcast', {
        title: title.trim(),
        message: message.trim(),
      });
      setResult({ sent: res.data.sent });
      setTitle('');
      setMessage('');
    } catch (e: any) {
      setResult({ error: e?.response?.data?.message ?? '전송에 실패했어요.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">알림 전송</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 사용자에게 푸시 알림을 전송합니다. (광고/공지용)
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl space-y-5">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            알림 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 🎉 Vibly 업데이트 소식"
            maxLength={50}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            알림 내용
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예) 새로운 기능이 업데이트되었어요! 지금 확인해보세요."
            maxLength={200}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/200</p>
        </div>

        {/* 미리보기 */}
        {(title || message) && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-medium">미리보기</p>
            <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-gray-900">{title || '(제목 없음)'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{message || '(내용 없음)'}</p>
            </div>
          </div>
        )}

        {/* 결과 메시지 */}
        {result && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              result.error
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}
          >
            {result.error ? `❌ ${result.error}` : `✅ ${result.sent?.toLocaleString()}명에게 전송 완료!`}
          </div>
        )}

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          {sending ? '전송 중...' : '🔔 전체 사용자에게 전송'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          ⚠️ 전송 후 취소할 수 없습니다. 내용을 꼭 확인해주세요.
        </p>
      </div>
    </div>
  );
}
