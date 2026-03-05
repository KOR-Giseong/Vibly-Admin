'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { clearAdminToken } from '@/lib/api';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30분

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
  { href: '/dashboard/admin-logs', label: '액션 로그', emoji: '📋' },
  { href: '/dashboard/admin-chat', label: '관리자 채팅', emoji: '💬' },
];

function NavItem({ href, label, emoji, onClose }: { href: string; label: string; emoji: string; onClose?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClose}
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
  const router = useRouter();
  const lastActivityRef = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 30분 비활성 시 자동 로그아웃
  useEffect(() => {
    lastActivityRef.current = Date.now();

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= SESSION_TIMEOUT_MS) {
        clearAdminToken();
        router.push('/login');
      }
    }, 60_000); // 1분마다 체크

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [router]);

  const handleLogout = () => {
    clearAdminToken();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-30 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo2.png" alt="Vibly" className="h-8 w-auto object-contain" />
          </div>
          {/* 모바일 닫기 버튼 */}
          <button
            className="md:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} onClose={() => setSidebarOpen(false)} />
          ))}
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
      <div className="flex-1 flex flex-col md:ml-60">
        {/* 모바일 상단 헤더 */}
        <header className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center gap-4 px-4 py-3">
          <button
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo2.png" alt="Vibly" className="h-7 w-auto object-contain" />
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
