import { axiosInstance as api } from './api';

export interface AppNotification { id: string; title: string; message: string; isRead: boolean; createdAt: string }
export interface NotificationList { unreadCount: number; items: AppNotification[] }

export const notificationService = {
  list: (limit = 20) => api.get<NotificationList>('/notifications', { params: { limit } }).then((r) => r.data),
  read: (id: string) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.post('/notifications/read-all').then((r) => r.data),
};
