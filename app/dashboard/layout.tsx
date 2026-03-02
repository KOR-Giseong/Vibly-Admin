'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', emoji: '📊' },
  { href: '/dashboard/analytics', label: '통계 분석', emoji: '📈' },
  { href: '/dashboard/tickets', label: '고객 문의', emoji: '📨' },
  { href: '/dashboard/users', label: '사용자 관리', emoji: '👥' },
  { href: '/dashboard/places', label: '장소 관리', emoji: '🏙️' },
  { href: '/dashboard/checkins', label: '체크인 관리', emoji: '📍' },
  { href: '/dashboard/reviews', label: '리뷰 관리', emoji: '⭐' },
  { href: '/dashboard/community', label: '커뮤니티 관리', emoji: '💬' },
  { href: '/dashboard/reports', label: '신고 관리', emoji: '⚠️' },
  { href: '/dashboard/notices', label: '공지사항 관리', emoji: '📢' },
  { href: '/dashboard/credits', label: '크레딧 관리', emoji: '🪙' },
  { href: '/dashboard/couples', label: '커플 관리', emoji: '💑' },
  { href: '/dashboard/subscriptions', label: '구독 관리', emoji: '⭐' },
  { href: '/dashboard/notifications', label: '알림 전송', emoji: '🔔' },
];

function NavItem({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-violet-100 text-violet-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span>{emoji}</span>
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo2.png" alt="Vibly" className="h-8 w-auto object-contain" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <span>🚪</span> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}
