'use client';

import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/services';
import type { AdminStats } from '@/lib/types';

const CATEGORY_KO: Record<string, string> = {
  CAFE: '카페', RESTAURANT: '레스토랑', BAR: '바', PARK: '공원',
  CULTURAL: '문화', BOOKSTORE: '서점', BOWLING: '볼링', KARAOKE: '노래방',
  SPA: '스파', ESCAPE: '방탈출', ARCADE: '아케이드', ETC: '기타',
};

function BarChart({
  data,
  color,
  label,
}: {
  data: { date: string; count: number }[];
  color: string;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">{label}</p>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">이번 주 데이터가 없어요.</p>
      ) : (
        <div className="flex items-end gap-2 h-36">
          {data.map((d) => {
            const pct = Math.round((d.count / max) * 100);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-600">{d.count}</span>
                <div
                  className={`w-full ${color} rounded-t-md transition-all`}
                  style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }}
                />
                <span className="text-[10px] text-gray-400">{d.date}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
  sub,
  color,
}: {
  emoji: string;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <span className="text-xl">{emoji}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-violet-500 mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm py-10 text-center">불러오는 중...</div>;
  if (!stats) return <div className="text-red-400 text-sm py-10 text-center">데이터를 불러오지 못했어요.</div>;

  const maxCheckins = Math.max(...(stats.popularPlaces?.map((p) => p._count.checkIns) ?? [1]), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">통계 &amp; 분석</h1>
        <p className="text-gray-500 text-sm">서비스 전반의 지표를 확인하세요.</p>
      </div>

      {/* 핵심 지표 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">핵심 지표</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard emoji="👥" label="전체 사용자" value={stats.totalUsers} sub={`이번 주 +${stats.newUsersThisWeek}명`} color="from-violet-500 to-violet-600" />
          <StatCard emoji="📍" label="전체 체크인" value={stats.totalCheckIns} sub={`이번 주 +${stats.checkInsThisWeek}회`} color="from-blue-500 to-blue-600" />
          <StatCard emoji="⭐" label="전체 리뷰" value={stats.totalReviews} color="from-amber-400 to-amber-500" />
          <StatCard emoji="🏙️" label="활성 장소" value={stats.activePlaces} sub={`전체 ${stats.totalPlaces}개소`} color="from-green-500 to-green-600" />
        </div>
      </div>

      {/* 지원 지표 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">고객 지원</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard emoji="📨" label="전체 문의" value={stats.totalTickets} color="from-pink-500 to-pink-600" />
          <StatCard emoji="🔔" label="답변 대기" value={stats.openTickets} color="from-red-400 to-red-500" />
          <StatCard emoji="✅" label="처리 완료" value={stats.totalTickets - stats.openTickets} color="from-emerald-500 to-emerald-600" />
          <StatCard
            emoji="📊"
            label="처리율"
            value={stats.totalTickets > 0 ? Math.round(((stats.totalTickets - stats.openTickets) / stats.totalTickets) * 100) : 0}
            sub="%"
            color="from-cyan-500 to-cyan-600"
          />
        </div>
      </div>

      {/* 이번 주 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-2">이번 주 신규 가입</h2>
          <BarChart data={stats.usersByDay} color="bg-violet-400" label="일별 신규 가입자 수" />
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-2">이번 주 체크인</h2>
          <BarChart data={stats.checkinsByDay} color="bg-blue-400" label="일별 체크인 수" />
        </div>
      </div>

      {/* 인기 장소 */}
      {stats.popularPlaces && stats.popularPlaces.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-5">인기 장소 Top 5 (체크인 기준)</h2>
          <div className="space-y-5">
            {stats.popularPlaces.map((place, i) => {
              const pct = maxCheckins > 0 ? Math.round((place._count.checkIns / maxCheckins) * 100) : 0;
              return (
                <div key={place.id} className="flex items-center gap-4">
                  <span className={`text-lg font-bold w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800 truncate">{place.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{CATEGORY_KO[place.category] ?? place.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-20 shrink-0 text-right">
                        체크인 {place._count.checkIns}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-amber-500">⭐ {place.rating.toFixed(1)}</p>
                    <p className="text-xs text-gray-400">리뷰 {place.reviewCount}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
