'use client';

import { useEffect, useState } from 'react';
import { placesApi } from '@/lib/services';
import type { AdminPlace } from '@/lib/types';

const CATEGORY_KO: Record<string, string> = {
  CAFE: '카페', RESTAURANT: '레스토랑', BAR: '바', PARK: '공원',
  CULTURAL: '문화', BOOKSTORE: '서점', BOWLING: '볼링', KARAOKE: '노래방',
  SPA: '스파', ESCAPE: '방탈출', ARCADE: '아케이드', ETC: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  CAFE: 'bg-amber-100 text-amber-700',
  RESTAURANT: 'bg-red-100 text-red-700',
  BAR: 'bg-purple-100 text-purple-700',
  PARK: 'bg-green-100 text-green-700',
  CULTURAL: 'bg-blue-100 text-blue-700',
  BOOKSTORE: 'bg-indigo-100 text-indigo-700',
  BOWLING: 'bg-orange-100 text-orange-700',
  KARAOKE: 'bg-pink-100 text-pink-700',
  SPA: 'bg-teal-100 text-teal-700',
  ESCAPE: 'bg-gray-100 text-gray-700',
  ARCADE: 'bg-yellow-100 text-yellow-700',
  ETC: 'bg-gray-100 text-gray-600',
};

export default function PlacesPage() {
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    placesApi.getAll().then(setPlaces).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggleActive = async (id: string) => {
    setToggling(id);
    try {
      const updated = await placesApi.toggleActive(id);
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: updated.isActive } : p)),
      );
    } finally {
      setToggling(null);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(places.map((p) => p.category)))];

  const filtered = places.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && p.isActive) ||
      (activeFilter === 'INACTIVE' && !p.isActive);
    return matchSearch && matchCategory && matchActive;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">장소 관리</h1>
        <p className="text-gray-500 text-sm">등록된 장소를 조회하고 활성화 상태를 관리하세요.</p>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="장소명, 주소 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'ALL' ? '전체 카테고리' : (CATEGORY_KO[c] ?? c)}</option>
          ))}
        </select>
        <div className="flex bg-gray-100 rounded-xl p-1 text-sm">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'ALL' ? '전체' : f === 'ACTIVE' ? '활성' : '비활성'}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400">{filtered.length}개</span>
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
                  <th className="px-6 py-3 text-left">장소명</th>
                  <th className="px-4 py-3 text-left">카테고리</th>
                  <th className="px-4 py-3 text-left">주소</th>
                  <th className="px-4 py-3 text-center">평점</th>
                  <th className="px-4 py-3 text-center">체크인</th>
                  <th className="px-4 py-3 text-center">북마크</th>
                  <th className="px-4 py-3 text-center">리뷰</th>
                  <th className="px-4 py-3 text-center">바이브</th>
                  <th className="px-4 py-3 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-sm">
                      조건에 맞는 장소가 없어요.
                    </td>
                  </tr>
                )}
                {filtered.map((place) => (
                  <tr key={place.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800 max-w-48 truncate">{place.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[place.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORY_KO[place.category] ?? place.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-48 truncate">{place.address}</td>
                    <td className="px-4 py-3 text-center font-medium text-amber-600">
                      ⭐ {place.rating.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{place._count.checkIns}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{place._count.bookmarks}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{place._count.reviews}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{place.vibeScore.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(place.id)}
                        disabled={toggling === place.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                          place.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {toggling === place.id ? '...' : place.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
