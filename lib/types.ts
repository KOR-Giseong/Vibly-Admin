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
  isProfileComplete: boolean;
  provider: string;
  createdAt: string;
  _count: {
    checkIns: number;
    reviews: number;
    bookmarks: number;
  };
}
