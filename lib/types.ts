export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketType = 'FAQ' | 'CHAT';

export interface SupportTicket {
  id: string;
  type: TicketType;
  title: string;
  body: string;
  status: TicketStatus;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  nickname?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  suspendedUntil?: string | null;
  suspendReason?: string | null;
  isProfileComplete: boolean;
  provider: string;
  createdAt: string;
  _count: {
    checkIns: number;
    reviews: number;
    bookmarks: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalTickets: number;
  openTickets: number;
  totalCheckIns: number;
  checkInsThisWeek: number;
  totalPlaces: number;
  activePlaces: number;
  totalReviews: number;
  usersByDay: { date: string; count: number }[];
  checkinsByDay: { date: string; count: number }[];
  popularPlaces: {
    id: string;
    name: string;
    category: string;
    rating: number;
    reviewCount: number;
    _count: { checkIns: number; bookmarks: number };
  }[];
}

export interface AdminCheckIn {
  id: string;
  mood: string;
  note?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nickname?: string | null;
    avatarUrl?: string | null;
  };
  place: {
    id: string;
    name: string;
    category: string;
  };
}

export interface AdminReview {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nickname?: string | null;
    avatarUrl?: string | null;
  };
  place: {
    id: string;
    name: string;
    category: string;
  };
}

export interface AdminPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  reviewCount: number;
  vibeScore: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    checkIns: number;
    bookmarks: number;
    reviews: number;
  };
}

export interface AdminUserCredit {
  id: string;
  name: string;
  nickname?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  credits: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt: string;
}

export interface AdminPaginated<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
  hasNext?: boolean;
}

// ─── Community ────────────────────────────────────────────────────────────────

export type PostCategory = 'FREE' | 'INFO' | 'QUESTION' | 'REVIEW';

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  FREE: '자유게시판',
  INFO: '정보공유',
  QUESTION: '질문/도움',
  REVIEW: '장소후기',
};

export interface AdminPost {
  id: string;
  category: PostCategory;
  title: string;
  isHidden: boolean;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nickname?: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

// ─── Notice ───────────────────────────────────────────────────────────────────

export interface AdminNotice {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Report ───────────────────────────────────────────────────────────────

export type ReportReason = 'SPAM' | 'ABUSE' | 'ILLEGAL' | 'ADULT' | 'PRIVACY' | 'OTHER';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM: '스팸/광고',
  ABUSE: '욕설/협오',
  ILLEGAL: '불법 정보',
  ADULT: '성인/음란물',
  PRIVACY: '개인정보 침해',
  OTHER: '기타',
};

export interface AdminReport {
  id: string;
  reason: ReportReason;
  detail?: string | null;
  isResolved: boolean;
  createdAt: string;
  post: {
    id: string;
    title: string;
    category: PostCategory;
    isHidden: boolean;
  };
  user: {
    id: string;
    nickname?: string | null;
    name: string;
  };
}
