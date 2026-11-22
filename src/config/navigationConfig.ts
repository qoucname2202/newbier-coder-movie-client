/**
 * The central navigation system for the header, the footer and the profile
 * menu.
 *
 * The navbar stays in sync with `TAXONOMY_CATEGORIES` and
 * `TAXONOMY_COUNTRIES`.
 */

import { TAXONOMY_CATEGORIES, TAXONOMY_COUNTRIES } from './taxonomyConfig';
import { ROUTES } from './routesConfig';

/**
 * A dropdown item of the navbar, built from a taxonomy item.
 * A taxonomy item has the shape `{ nameVi, slug, href, badge }`.
 */
interface TaxonomyNavItem {
  name: string;
  slug: string;
  href: string;
  badge: string;
}

/** A dropdown item of the navbar. */
interface DropdownNavItem {
  id: string;
  label: string;
  type: 'dropdown';
  dropdownType: 'genres' | 'countries' | 'years';
  items: TaxonomyNavItem[];
  matchPrefix?: string;
}

/** A link of the navbar. */
interface LinkNavItem {
  id: string;
  label: string;
  type: 'link';
  href: string;
  matchPrefix?: string;
  matchExact?: boolean;
}

/** All the kinds of navbar item. */
type NavbarNavItem = DropdownNavItem | LinkNavItem;

/** An item of the user menu. */
interface UserNavItem {
  id: string;
  label: string;
  href: string;
  iconType: string;
  iconColor: string;
}

/**
 * The normalized list of categories used by the navigation dropdown.
 */
export const GENRE_NAV_ITEMS: TaxonomyNavItem[] = Object.values(TAXONOMY_CATEGORIES).map((cat) => ({
  name: cat.nameVi,
  slug: cat.slug,
  href: cat.href,
  badge: cat.badge
}));

/**
 * The normalized list of countries used by the navigation dropdown.
 */
export const COUNTRY_NAV_ITEMS: TaxonomyNavItem[] = Object.values(TAXONOMY_COUNTRIES).map((country) => ({
  name: country.nameVi,
  slug: country.slug,
  href: `/quoc-gia/${country.slug}`,
  badge: country.badge
}));

/**
 * The main navigation items of the navbar, following the product spec:
 * 1. Genres (dropdown)  2. Browse (/search)
 * 3. Movies (/movies)  4. Series (/series)
 * 5. Countries (dropdown)  6. Performers (/performer)
 * 7. Schedule (/browse/schedule)
 */
export const MAIN_NAV_ITEMS: NavbarNavItem[] = [
  {
    id: 'chu-de',
    label: 'Chủ Đề',
    type: 'dropdown',
    dropdownType: 'genres',
    items: GENRE_NAV_ITEMS,
    matchPrefix: '/genre'
  },
  {
    id: 'duyet-tim',
    label: 'Duyệt tìm',
    type: 'link',
    href: ROUTES.SEARCH,
    matchExact: true
  },
  {
    id: 'phim-le',
    label: 'Phim Lẻ',
    type: 'link',
    href: '/formats/phim-le/movies?page=1&limit=20',
    matchPrefix: '/formats/phim-le'
  },
  {
    id: 'phim-bo',
    label: 'Phim Bộ',
    type: 'link',
    href: ROUTES.SERIES,
    matchPrefix: '/series'
  },
  {
    id: 'country',
    label: 'Quốc gia',
    type: 'dropdown',
    dropdownType: 'countries',
    items: COUNTRY_NAV_ITEMS,
    matchPrefix: '/quoc-gia'
  },
  {
    id: 'nam-phat-hanh',
    label: 'Năm',
    type: 'dropdown',
    dropdownType: 'years',
    items: [],
    matchPrefix: '/search'
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
    // `/schedule` answers 404, because the real file is located at
    // `src/pages/client/browse/schedule.tsx`. The rewrite
    // `/browse/:path*` → `/client/browse/:path*` of `next.config.ts` means
    // the link has to be `/browse/schedule`, to match
    // `ROUTES.MOVIES` and `ROUTES.SERIES`.
    href: ROUTES.SCHEDULE,
    matchPrefix: '/browse/schedule'
  }
];

/**
 * The items of the dropdown menu of the user account.
 */
export const USER_NAV_ITEMS: UserNavItem[] = [
  {
    id: 'profile',
    label: 'Hồ sơ của tôi',
    href: ROUTES.PROFILE,
    iconType: 'user',
    iconColor: 'primary'
  },
  {
    id: 'favorites',
    label: 'Phim yêu thích',
    href: '/user/favorites',
    iconType: 'heart',
    iconColor: 'danger'
  },
  {
    id: 'watchlater',
    label: 'Danh sách xem sau',
    href: '/user/watch-later',
    iconType: 'bookmark',
    iconColor: 'warning'
  },
  {
    id: 'history',
    label: 'Lịch sử xem',
    href: '/user/history',
    iconType: 'history',
    iconColor: 'info'
  }
];

/**
 * The configuration of the quick search in the navbar.
 */
export const NAVBAR_SEARCH_CONFIG = {
  debounceMs: 250,
  movieLimit: 6,
  actorLimit: 4,
  placeholder: 'Tìm phim, diễn viên...'
} as const;

export default {
  MAIN_NAV_ITEMS,
  USER_NAV_ITEMS,
  NAVBAR_SEARCH_CONFIG
};
