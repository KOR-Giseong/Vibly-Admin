'use client';

import { useEffect, useRef, useState } from 'react';
import { supportApi } from '@/lib/services';
import type { SupportTicket, TicketStatus } from '@/lib/types';

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: '대기중',
  IN_PROGRESS: '처리중',
  RESOLVED: '해결됨',
  CLOSED: '종료',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

interface ChatMessage {
  id: string;
  body: string;
  imageUrl?: string | null;
  isAdmin: boolean;
  senderId: string;
  createdAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  // FAQ reply
  const [reply, setReply] = useState('');
  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await supportApi.getAllTickets();
      setTickets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // 15초마다 티켓 목록 자동 갱신 (신규 채팅 감지)
    listPollRef.current = setInterval(() => { fetchTickets(); }, 15000);
    return () => { if (listPollRef.current) clearInterval(listPollRef.current); };
  }, []);

  // 채팅 티켓 선택 시 메시지 로드 + 폴링
  useEffect(() => {
    if (!selected || selected.type !== 'CHAT') {
      if (pollRef.current) clearInterval(pollRef.current);
      setMessages([]);
      return;
    }
    const load = async () => {
      const msgs = await supportApi.getMessages(selected.id);
      setMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    load();
    pollRef.current = setInterval(load, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selected]);

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setReply('');
    setChatInput('');
  };

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await supportApi.replyTicket(selected.id, reply.trim());
      setReply('');
      setSelected(null);
      await fetchTickets();
    } catch { alert('답변 전송에 실패했습니다.'); }
    finally { setSending(false); }
  };

  const handleSendMessage = async () => {
    if (!selected || !chatInput.trim()) return;
    setSending(true);
    const text = chatInput.trim();
    setChatInput('');
    try {
      const msg = await supportApi.sendMessage(selected.id, text);
      setMessages((prev) => [...prev, msg]);
      await fetchTickets();
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch { alert('메시지 전송에 실패했습니다.'); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await supportApi.updateStatus(id, status); await fetchTickets(); }
    catch { alert('상태 변경에 실패했습니다.'); }
  };

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">고객 문의</h1>
      <p className="text-gray-500 text-sm mb-6">사용자 문의 목록입니다. 클릭하여 답변하세요.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">사용자</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">유형</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">제목</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">상태</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">날짜</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tickets.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">문의가 없습니다.</td></tr>
            )}
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openTicket(ticket)}>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{ticket.user.name}</p>
                  <p className="text-gray-400 text-xs">{ticket.user.email ?? ticket.user.nickname}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ticket.type === 'CHAT' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'}`}>
                    {ticket.type === 'CHAT' ? '💬 채팅' : '❓ FAQ'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-900 font-medium">{ticket.title}</p>
                  <p className="text-gray-400 truncate max-w-xs">{ticket.body}</p>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={ticket.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-violet-500 ${STATUS_COLORS[ticket.status]}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4">
                  <button onClick={(e) => { e.stopPropagation(); openTicket(ticket); }}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                    {ticket.type === 'CHAT' ? '채팅 보기' : '답변하기'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex justify-between items-start p-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selected.type === 'CHAT' ? 'bg-pink-100 text-pink-700' : 'bg-violet-100 text-violet-700'}`}>
                    {selected.type === 'CHAT' ? '💬 채팅' : '❓ FAQ'}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                </div>
                <p className="text-sm text-gray-500">{selected.user.name} · {new Date(selected.createdAt).toLocaleDateString('ko-KR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
            </div>

            {/* CHAT: 채팅 UI */}
            {selected.type === 'CHAT' ? (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                  {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-8">메시지가 없습니다.</p>}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${msg.isAdmin ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        {msg.imageUrl && (
                          <a href={msg.imageUrl.startsWith('http') ? msg.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000'}${msg.imageUrl}`}
                            target="_blank" rel="noreferrer" className="block mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.imageUrl.startsWith('http') ? msg.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3000'}${msg.imageUrl}`}
                              alt="첨부 이미지"
                              className="rounded-xl max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90"
                            />
                          </a>
                        )}
                        {msg.body && <p className="whitespace-pre-wrap">{msg.body}</p>}
                        <p className={`text-[10px] mt-1 text-right ${msg.isAdmin ? 'text-violet-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button onClick={handleSendMessage} disabled={sending || !chatInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                    {sending ? '...' : '전송'}
                  </button>
                </div>
              </>
            ) : (
              /* FAQ: 기존 reply UI */
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.body}</p>
                </div>
                {selected.adminReply && (
                  <div className="bg-violet-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-violet-600 mb-1">이전 답변</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.adminReply}</p>
                  </div>
                )}
                <textarea
                  value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder="답변 내용을 입력하세요..." rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">취소</button>
                  <button onClick={handleReply} disabled={sending || !reply.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                    {sending ? '전송 중...' : '답변 전송'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
