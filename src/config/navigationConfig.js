/**
 * @file navigationConfig.js
 * @description Centralized Navigation Registry for Header, Footer, and Profile Menu.
 * Synchronizes Navbar items directly with TAXONOMY_CATEGORIES and TAXONOMY_COUNTRIES.
 */

import { TAXONOMY_CATEGORIES, TAXONOMY_COUNTRIES } from './taxonomyConfig';
import { ROUTES } from './routesConfig';

/**
 * Normalized genre items for navigation dropdowns.
 */
export const GENRE_NAV_ITEMS = Object.values(TAXONOMY_CATEGORIES).map((cat) => ({
  name: cat.nameVi,
  slug: cat.slug,
  href: cat.href || `/the-loai/${cat.slug}`,
  badge: cat.badge
}));

/**
 * Normalized country items for navigation dropdowns.
 */
export const COUNTRY_NAV_ITEMS = Object.values(TAXONOMY_COUNTRIES).map((country) => ({
  name: country.nameVi,
  slug: country.slug,
  href: country.href || `/quoc-gia/${country.slug}`,
  badge: country.badge
}));

/**
 * Main Navbar Navigation Items strictly matching product specifications:
 * 1. Chủ Đề (Dropdown)
 * 2. Duyệt tìm (/search)
 * 3. Phim Lẻ (/movies)
 * 4. Phim Bộ (/series)
 * 5. Quốc gia (Dropdown)
 * 6. Diễn Viên (/performer)
 * 7. Lịch Chiếu (/lich-chieu)
 */
export const MAIN_NAV_ITEMS = [
  {
    id: 'chu-de',
    label: 'Chủ Đề',
    type: 'dropdown',
    dropdownType: 'genres',
    items: GENRE_NAV_ITEMS,
    matchPrefix: '/the-loai'
  },
  {
    id: 'duyet-tim',
    label: 'Duyệt tìm',
    type: 'link',
    href: ROUTES.SEARCH || '/search',
    matchExact: true
  },
  {
    id: 'phim-le',
    label: 'Phim Lẻ',
    type: 'link',
    href: ROUTES.MOVIES || '/movies',
    matchPrefix: '/movies'
  },
  {
    id: 'phim-bo',
    label: 'Phim Bộ',
    type: 'link',
    href: ROUTES.SERIES || '/series',
    matchPrefix: '/series'
  },
  {
    id: 'quoc-gia',
    label: 'Quốc gia',
    type: 'dropdown',
    dropdownType: 'countries',
    items: COUNTRY_NAV_ITEMS,
    matchPrefix: '/quoc-gia'
  },
  {
    id: 'dien-vien',
    label: 'Diễn Viên',
    type: 'link',
    href: '/performer',
    matchPrefix: '/performer'
  },
  {
    id: 'lich-chieu',
    label: 'Lịch Chiếu',
    type: 'link',
    href: '/lich-chieu',
    matchExact: true
  }
];

/**
 * User Account Dashboard Dropdown Links
 */
export const USER_NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Hồ sơ của tôi',
    href: ROUTES.PROFILE || '/profile',
    iconType: 'user',
    iconColor: 'primary'
  },
  {
    id: 'favorites',
    label: 'Phim yêu thích',
    href: '/favorites',
    iconType: 'heart',
    iconColor: 'danger'
  },
  {
    id: 'watchlater',
    label: 'Danh sách xem sau',
    href: '/watchlater',
    iconType: 'bookmark',
    iconColor: 'warning'
  },
  {
    id: 'history',
    label: 'Lịch sử xem',
    href: '/history',
    iconType: 'history',
    iconColor: 'info'
  }
];

/**
 * Navbar Live Search Tuning
 */
export const NAVBAR_SEARCH_CONFIG = {
  debounceMs: 250,
  movieLimit: 6,
  actorLimit: 4,
  placeholder: 'Tìm phim, diễn viên...'
};
