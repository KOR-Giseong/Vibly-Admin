import apiClient from './api';
import type { SupportTicket, AdminUser, AdminStats, AdminPlace, AdminCheckIn, AdminReview, AdminPaginated, AdminPost, AdminNotice, AdminReport } from './types';

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
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string }>('/auth/email/login', { email, password }).then((r) => r.data),
  getMe: () => apiClient.get<{ id: string; name: string; isAdmin: boolean }>('/auth/me').then((r) => r.data),
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
