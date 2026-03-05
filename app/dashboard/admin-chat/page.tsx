'use client';

import { useEffect, useRef, useState } from 'react';
import { adminChatApi, AdminChatMessage } from '@/lib/services';

const POLL_INTERVAL = 5000;

export default function AdminChatPage() {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await adminChatApi.getMessages(1, 100);
      setMessages(data.items);
    } catch {
      // 무시
    }
  };

  // 최초 로드 시 authorId 추론 (첫 응답에서 가져옴)
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setMyId(payload.sub ?? null);
      } catch {
        // 무시
      }
    }
    fetchMessages();
  }, []);

  // 5초 폴링
  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // 새 메시지 오면 스크롤 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await adminChatApi.sendMessage(text);
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch {
      // 무시
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminChatApi.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // 무시
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">관리자 채팅</h1>
        <p className="text-gray-500 text-sm mt-1">관리자끼리 요청사항·변경사항을 공유하는 내부 채널입니다.</p>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 p-4 space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">아직 메시지가 없습니다. 먼저 작성해보세요.</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.authorId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <span className="text-xs text-gray-400 px-1">{msg.authorName}</span>
                )}
                <div className={`group relative px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                  {isMe && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex"
                    >
                      ×
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-300 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          maxLength={500}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
