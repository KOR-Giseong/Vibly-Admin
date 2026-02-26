import apiClient from './api';
import type { SupportTicket, AdminUser } from './types';

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

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string }>('/auth/email/login', { email, password }).then((r) => r.data),
  getMe: () => apiClient.get<{ id: string; name: string; isAdmin: boolean }>('/auth/me').then((r) => r.data),
};
