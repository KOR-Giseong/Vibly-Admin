'use client';

import { useEffect, useState } from 'react';
import { supportApi, usersApi } from '@/lib/services';

interface Stats {
  totalTickets: number;
  openTickets: number;
  totalUsers: number;
  adminUsers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [tickets, users] = await Promise.all([
          supportApi.getAllTickets(),
          usersApi.getAll(),
        ]);
        setStats({
          totalTickets: tickets.length,
          openTickets: tickets.filter((t) => t.status === 'OPEN').length,
          totalUsers: users.length,
          adminUsers: users.filter((u) => u.isAdmin).length,
        });
      } catch {
        /* 401 → 인터셉터가 처리 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;

  const cards = [
    { label: '전체 문의', value: stats?.totalTickets ?? 0, emoji: '📨', color: 'from-violet-500 to-violet-600' },
    { label: '답변 대기', value: stats?.openTickets ?? 0, emoji: '🔔', color: 'from-pink-500 to-pink-600' },
    { label: '전체 사용자', value: stats?.totalUsers ?? 0, emoji: '👥', color: 'from-blue-500 to-blue-600' },
    { label: '관리자', value: stats?.adminUsers ?? 0, emoji: '⚙️', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h1>
      <p className="text-gray-500 text-sm mb-8">Vibly 서비스 현황을 한눈에 확인하세요.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <span className="text-2xl">{card.emoji}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
