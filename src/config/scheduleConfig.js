/**
 * @file scheduleConfig.js
 * @description Centralized Schedule & Broadcast Calendar Configuration.
 * Configures weekly release calendar days, labels, and broadcast time standards.
 */

export const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2', short: 'T2', en: 'Monday' },
  { id: 2, label: 'Thứ 3', short: 'T3', en: 'Tuesday' },
  { id: 3, label: 'Thứ 4', short: 'T4', en: 'Wednesday' },
  { id: 4, label: 'Thứ 5', short: 'T5', en: 'Thursday' },
  { id: 5, label: 'Thứ 6', short: 'T6', en: 'Friday' },
  { id: 6, label: 'Thứ 7', short: 'T7', en: 'Saturday' },
  { id: 0, label: 'Chủ Nhật', short: 'CN', en: 'Sunday' }
];

export const SCHEDULE_CONFIG = {
  defaultLimit: 24,
  sampleSlots: ['19:00', '20:00', '21:15', '22:30'],
  badgeText: 'LỊCH PHÁT SÓNG',
  pageTitle: 'Lịch Chiếu Phim Tuần Này',
  pageDescription: 'Lịch chiếu phim mới cập nhật theo ngày trong tuần, theo dõi lịch phát sóng các bộ phim bộ và anime hot nhất.'
};
