import apiClient from './api';
import type { SupportTicket, AdminUser, AdminStats, AdminPlace, AdminCheckIn, AdminReview, AdminPaginated, AdminPost, AdminNotice, AdminReport, AdminUserCredit, AdminCouple, AdminUserReport, AdminSubscription, AdminCreditGrantLog, SubscriptionType } from './types';

export const supportApi = {
  getAllTickets: () => apiClient.get<SupportTicket[]>('/support/admin/tickets').then((r) => r.data),
  replyTicket: (id: string, reply: string) =>
    apiClient.patch(`/support/admin/tickets/${id}/reply`, { reply }).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/support/admin/tickets/${id}/status`, { status }).then((r) => r.data),
  getMessages: (id: string) =>
    apiClient.get<any[]>(`/support/admin/tickets/${id}/messages`).then((r) => r.data),
  sendMessage: (id: string, body: string) =>
    apiClient.post<any>(`/support/admin/tickets/${id}/messages`, { body }).then((r) => r.data),
};

export const usersApi = {
  getAll: () => apiClient.get<AdminUser[]>('/support/admin/users').then((r) => r.data),
  toggleAdmin: (id: string) =>
    apiClient.patch(`/support/admin/users/${id}/toggle-admin`).then((r) => r.data),
  suspendUser: (id: string, reason: string, suspendedUntil: string) =>
    apiClient.patch(`/support/admin/users/${id}/suspend`, { reason, suspendedUntil }).then((r) => r.data),
  unsuspendUser: (id: string) =>
    apiClient.patch(`/support/admin/users/${id}/unsuspend`).then((r) => r.data),
};

export const statsApi = {
  getStats: () => apiClient.get<AdminStats>('/support/admin/stats').then((r) => r.data),
};

export const placesApi = {
  getAll: () => apiClient.get<AdminPlace[]>('/support/admin/places').then((r) => r.data),
  toggleActive: (id: string) =>
    apiClient.patch(`/support/admin/places/${id}/toggle-active`).then((r) => r.data),
};

export const checkInsApi = {
  getAll: (page = 1, limit = 30) =>
    apiClient.get<AdminPaginated<AdminCheckIn>>(`/support/admin/checkins?page=${page}&limit=${limit}`).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/support/admin/checkins/${id}`).then((r) => r.data),
};

export const reviewsApi = {
  getAll: (page = 1, limit = 30) =>
    apiClient.get<AdminPaginated<AdminReview>>(`/support/admin/reviews?page=${page}&limit=${limit}`).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/support/admin/reviews/${id}`).then((r) => r.data),
};

export const authApi = {
  // 관리자 전용 로그인 엔드포인트 (ADMIN_JWT_SECRET으로 서명된 토큰 발급)
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string }>('/auth/admin/login', { email, password }).then((r) => r.data),
  googleLogin: (idToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/admin/google', { idToken }).then((r) => r.data),
  kakaoLogin: (accessToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/admin/kakao', { idToken: accessToken }).then((r) => r.data),
};

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export const adminLogApi = {
  getLogs: (page = 1, limit = 30) =>
    apiClient
      .get<{ items: AdminLog[]; total: number; page: number; hasNext: boolean }>(
        `/admin-logs?page=${page}&limit=${limit}`,
      )
      .then((r) => r.data),
};

export interface AdminChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export const adminChatApi = {
  getMessages: (page = 1, limit = 50) =>
    apiClient
      .get<{ items: AdminChatMessage[]; total: number; page: number; hasNext: boolean }>(
        `/admin-messages?page=${page}&limit=${limit}`,
      )
      .then((r) => r.data),
  sendMessage: (content: string) =>
    apiClient.post<AdminChatMessage>('/admin-messages', { content }).then((r) => r.data),
  deleteMessage: (id: string) =>
    apiClient.delete(`/admin-messages/${id}`).then((r) => r.data),
};

export const communityApi = {
  getPosts: (page = 1, limit = 30) =>
    apiClient.get<AdminPaginated<AdminPost>>(`/community/admin/posts?page=${page}&limit=${limit}`).then((r) => r.data),
  toggleHidden: (id: string) =>
    apiClient.patch(`/community/admin/posts/${id}/hidden`).then((r) => r.data),
  togglePinned: (id: string) =>
    apiClient.patch(`/community/admin/posts/${id}/pinned`).then((r) => r.data),
  deletePost: (id: string) =>
    apiClient.delete(`/community/posts/${id}`).then((r) => r.data),
};

export const noticesApi = {
  getAll: (page = 1, limit = 50) =>
    apiClient.get<{ items: AdminNotice[]; total: number; hasNext: boolean }>(`/community/notices?page=${page}&limit=${limit}`).then((r) => r.data),
  create: (data: { title: string; body: string; isPinned?: boolean }) =>
    apiClient.post<AdminNotice>('/community/notices', data).then((r) => r.data),
  update: (id: string, data: { title?: string; body?: string; isPinned?: boolean }) =>
    apiClient.patch<AdminNotice>(`/community/notices/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/community/notices/${id}`).then((r) => r.data),
};

export const reportsApi = {
  getAll: (page = 1, limit = 30, onlyUnresolved = false) =>
    apiClient
      .get<{ items: AdminReport[]; total: number; page: number; hasNext: boolean }>(
        `/community/admin/reports?page=${page}&limit=${limit}&unresolved=${onlyUnresolved}`,
      )
      .then((r) => r.data),
  resolve: (id: string, hidePost: boolean) =>
    apiClient.patch(`/community/admin/reports/${id}/resolve`, { hidePost }).then((r) => r.data),
};

export const creditsApi = {
  getUsers: () =>
    apiClient.get<AdminUserCredit[]>('/credits/admin/users').then((r) => r.data),
  adjust: (userId: string, amount: number) =>
    apiClient.patch<{ credits: number }>(`/credits/admin/users/${userId}/adjust`, { amount }).then((r) => r.data),
  bulkGrant: (amount: number, note?: string) =>
    apiClient.post<{ count: number }>('/credits/admin/bulk-grant', { amount, note }).then((r) => r.data),
  getGrantHistory: (page = 1, limit = 30) =>
    apiClient.get<{ items: AdminCreditGrantLog[]; total: number; page: number; hasNext: boolean }>(
      `/credits/admin/credit-history?page=${page}&limit=${limit}`,
    ).then((r) => r.data),
};

export const userReportsApi = {
  getAll: (page = 1, limit = 30, onlyUnresolved = false) =>
    apiClient
      .get<{ items: AdminUserReport[]; total: number; page: number; hasNext: boolean }>(
        `/couple/admin/user-reports?page=${page}&limit=${limit}&unresolved=${onlyUnresolved}`,
      )
      .then((r) => r.data),
  resolve: (id: string) =>
    apiClient.patch(`/couple/admin/user-reports/${id}/resolve`).then((r) => r.data),
};

export const subscriptionsApi = {
  getAll: (page = 1, limit = 30) =>
    apiClient
      .get<{ items: AdminSubscription[]; total: number; page: number; hasNext: boolean }>(
        `/credits/admin/subscriptions?page=${page}&limit=${limit}`,
      )
      .then((r) => r.data),
  getHistory: (page = 1, limit = 30) =>
    apiClient
      .get<{ items: AdminSubscription[]; total: number; page: number; hasNext: boolean }>(
        `/credits/admin/subscriptions/history?page=${page}&limit=${limit}`,
      )
      .then((r) => r.data),
  grant: (userId: string, type: SubscriptionType, durationDays: number) =>
    apiClient
      .post<AdminSubscription>('/credits/admin/subscriptions', { userId, type, durationDays })
      .then((r) => r.data),
  revoke: (userId: string) =>
    apiClient.delete(`/credits/admin/subscriptions/${userId}`).then((r) => r.data),
};

export const appConfigApi = {
  getAll: () =>
    apiClient.get<Record<string, string>>('/credits/admin/app-config').then((r) => r.data),
  set: (key: string, value: string) =>
    apiClient.patch('/credits/admin/app-config', { key, value }).then((r) => r.data),
};

export const couplesApi = {
  getAll: (page = 1, limit = 30, status?: 'ACTIVE' | 'DISSOLVED') =>
    apiClient
      .get<{ items: AdminCouple[]; total: number; page: number; hasNext: boolean }>(
        `/couple/admin/list?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
      )
      .then((r) => r.data),
  dissolve: (id: string) =>
    apiClient.delete(`/couple/admin/${id}`).then((r) => r.data),
};
