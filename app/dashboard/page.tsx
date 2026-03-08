'use client';

import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/services';
import type { AdminStats } from '@/lib/types';

const ADMIN_RULES = [
  '관리자 계정은 본인 외 타인에게 공유할 수 없습니다.',
  '사용자의 개인정보는 업무 목적 외 열람 및 사용이 금지됩니다.',
  '관리자 권한을 이용한 부당 행위는 즉시 권한이 박탈됩니다.',
  '모든 관리자 활동은 로그로 기록되며 정기적으로 감사됩니다.',
  '서비스 운영 관련 정보를 외부에 무단 공개하지 마십시오.',
  '보안 사고 발생 시 즉시 상급자에게 보고하십시오.',
];

function AdminRules() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-violet-50 border border-violet-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-violet-600 text-lg">🛡️</span>
          <span className="font-semibold text-violet-800 text-sm">관리자 수칙</span>
          <span className="text-xs text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full">{ADMIN_RULES.length}개 항목</span>
        </div>
        <span className="text-violet-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2">
          {ADMIN_RULES.map((rule, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
              <p className="text-sm text-violet-900">{rule}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CATEGORY_KO: Record<string, string> = {
  CAFE: '카페', RESTAURANT: '레스토랑', BAR: '바', PARK: '공원',
  CULTURAL: '문화', BOOKSTORE: '서점', BOWLING: '볼링', KARAOKE: '노래방',
  SPA: '스파', ESCAPE: '방탈출', ARCADE: '아케이드', ETC: '기타',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;
  if (!stats) return <div className="text-red-400 text-sm">데이터를 불러오지 못했어요.</div>;

  const cards = [
    { label: '전체 사용자', value: stats.totalUsers, sub: `이번 주 +${stats.newUsersThisWeek}명`, emoji: '👥', color: 'from-violet-500 to-violet-600' },
    { label: '전체 체크인', value: stats.totalCheckIns, sub: `이번 주 +${stats.checkInsThisWeek}회`, emoji: '📍', color: 'from-blue-500 to-blue-600' },
    { label: '전체 문의', value: stats.totalTickets, sub: `답변 대기 ${stats.openTickets}건`, emoji: '📨', color: 'from-pink-500 to-pink-600' },
    { label: '등록 장소', value: stats.totalPlaces, sub: `활성 ${stats.activePlaces}개`, emoji: '🏙️', color: 'from-green-500 to-green-600' },
  ];

  const maxCheckins = Math.max(...(stats.popularPlaces?.map((p) => p._count.checkIns) ?? [1]), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">대시보드</h1>
        <p className="text-gray-500 text-sm">Vibly 서비스 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 관리자 수칙 */}
      <AdminRules />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <span className="text-2xl">{card.emoji}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-violet-500 mt-1 font-medium">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 이번 주 가입자 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">이번 주 신규 가입</h2>
          {stats.usersByDay.length === 0 ? (
            <p className="text-sm text-gray-400">이번 주 데이터가 없어요.</p>
          ) : (
            <div className="space-y-3">
              {stats.usersByDay.map((d) => (
                <div key={d.date}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{d.date}</span>
                  </div>
                  <MiniBar value={d.count} max={Math.max(...stats.usersByDay.map((x) => x.count), 1)} color="bg-violet-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 이번 주 체크인 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">이번 주 체크인</h2>
          {stats.checkinsByDay.length === 0 ? (
            <p className="text-sm text-gray-400">이번 주 체크인 데이터가 없어요.</p>
          ) : (
            <div className="space-y-3">
              {stats.checkinsByDay.map((d) => (
                <div key={d.date}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{d.date}</span>
                  </div>
                  <MiniBar value={d.count} max={Math.max(...stats.checkinsByDay.map((x) => x.count), 1)} color="bg-blue-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 인기 장소 Top 5 */}
      {stats.popularPlaces && stats.popularPlaces.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">인기 장소 Top 5</h2>
          <div className="space-y-4">
            {stats.popularPlaces.map((place, i) => (
              <div key={place.id} className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{place.name}</p>
                  <p className="text-xs text-gray-400">{CATEGORY_KO[place.category] ?? place.category} · ⭐ {place.rating.toFixed(1)}</p>
                </div>
                <div className="text-right shrink-0 w-24 sm:w-40">
                  <MiniBar value={place._count.checkIns} max={maxCheckins} color="bg-green-400" />
                  <p className="text-xs text-gray-400 mt-1">체크인 {place._count.checkIns} · 북마크 {place._count.bookmarks}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
