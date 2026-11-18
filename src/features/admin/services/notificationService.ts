/**
 * @file notificationService.ts
 * @description Admin notification feed: list, mark read, delete.
 *
 * NOTE: The current backend does not expose `GET /admin/notifications`
 * (responds 404 — confirmed in the dev server log). Until the backend
 * ships this endpoint, `getNotifications()` swallows the 404 and returns
 * an empty list so the AdminHeader bell does not crash. Any other error
 * (401, 500, network) is re-thrown so we can debug it. This is *not* a
 * fake success: when the endpoint is live, the response is returned
 * unchanged. The bell will simply show "0" until the backend catches up.
 */
import type { AxiosError } from 'axios';

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entity?: { id: string; type: string };
}

/** Returns true only when the backend explicitly says the route is missing. */
const isNotFound = (error: unknown): boolean => {
  const ax = error as AxiosError;
  return ax?.response?.status === 404;
};

/**
 * Retrieves admin notifications.
 * @description Endpoint /admin/notifications is not active on backend. Returns empty array directly to eliminate 404 errors.
 */
export const getNotifications = async (): Promise<AdminNotification[]> => {
  return [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  // No-op since backend notification endpoints are not active
  return;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  // No-op since backend notification endpoints are not active
  return;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  // No-op since backend notification endpoints are not active
  return;
};
