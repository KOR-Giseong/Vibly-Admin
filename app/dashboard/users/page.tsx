'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/services';
import type { AdminUser } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleAdmin = async (id: string, name: string, currentIsAdmin: boolean) => {
    const action = currentIsAdmin ? '관리자 해제' : '관리자 지정';
    if (!confirm(`${name}님을 ${action}하시겠어요?`)) return;
    try {
      await usersApi.toggleAdmin(id);
      await fetchUsers();
    } catch {
      alert('권한 변경에 실패했습니다.');
    }
  };

  const filtered = users.filter((u) =>
    u.name.includes(search) ||
    (u.email ?? '').includes(search) ||
    (u.nickname ?? '').includes(search),
  );

  if (loading) return <div className="text-gray-400 text-sm">불러오는 중...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">사용자 관리</h1>
      <p className="text-gray-500 text-sm mb-6">전체 사용자 목록 및 관리자 권한을 관리합니다.</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="이름, 이메일, 닉네임 검색..."
        className="w-full max-w-sm mb-6 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">가입 방법</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">활동</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">권한</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">사용자가 없습니다.</td></tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-semibold text-violet-700 overflow-hidden flex-shrink-0">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name[0]
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-400 text-xs">{user.email ?? user.nickname ?? '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{user.provider}</span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  체크인 {user._count.checkIns} · 리뷰 {user._count.reviews} · 북마크 {user._count.bookmarks}
                </td>
                <td className="px-6 py-4">
                  {user.isAdmin ? (
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">ADMIN</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full">일반</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleAdmin(user.id, user.name, user.isAdmin)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      user.isAdmin
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-violet-600 hover:bg-violet-50'
                    }`}
                  >
                    {user.isAdmin ? '관리자 해제' : '관리자 지정'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
