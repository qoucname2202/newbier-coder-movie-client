/**
 * @file taxonomyConfig.js
 * @description Centralized Taxonomy Registry for Fastify Backend and Frontend Routing.
 * Maps URL-friendly unaccented slugs to Backend database slugs, localized labels, badges,
 * and search fallback keywords.
 */

/**
 * Standard Countries Registry.
 * Key: URL slug (unaccented)
 */
export const TAXONOMY_COUNTRIES = {
  'han-quoc': {
    slug: 'han-quoc',
    backendSlugs: ['hàn-quốc', 'han-quoc'],
    nameVi: 'Hàn Quốc',
    nameEn: 'South Korea',
    badge: 'K-DRAMA',
    searchKeyword: 'han',
    href: '/quoc-gia/han-quoc'
  },
  'trung-quoc': {
    slug: 'trung-quoc',
    backendSlugs: ['trung-quốc', 'trung-quoc'],
    nameVi: 'Trung Quốc',
    nameEn: 'China',
    badge: 'C-DRAMA',
    searchKeyword: 'trung',
    href: '/quoc-gia/trung-quoc'
  },
  'nhat-ban': {
    slug: 'nhat-ban',
    backendSlugs: ['nhật-bản', 'nhat-ban'],
    nameVi: 'Nhật Bản',
    nameEn: 'Japan',
    badge: 'J-DRAMA',
    searchKeyword: 'nhat',
    href: '/quoc-gia/nhat-ban'
  },
  'au-my': {
    slug: 'au-my',
    backendSlugs: ['âu-mỹ', 'au-my'],
    nameVi: 'Âu Mỹ',
    nameEn: 'Western / Hollywood',
    badge: 'HOLLYWOOD',
    searchKeyword: 'my',
    href: '/quoc-gia/au-my'
  },
  'thai-lan': {
    slug: 'thai-lan',
    backendSlugs: ['thái-lan', 'thai-lan'],
    nameVi: 'Thái Lan',
    nameEn: 'Thailand',
    badge: 'T-DRAMA',
    searchKeyword: 'thai',
    href: '/quoc-gia/thai-lan'
  },
  'viet-nam': {
    slug: 'viet-nam',
    backendSlugs: ['việt-nam', 'viet-nam'],
    nameVi: 'Việt Nam',
    nameEn: 'Vietnam',
    badge: 'V-CINEMA',
    searchKeyword: 'viet',
    href: '/quoc-gia/viet-nam'
  },
  'hong-kong': {
    slug: 'hong-kong',
    backendSlugs: ['hồng-kông', 'hong-kong'],
    nameVi: 'Hồng Kông',
    nameEn: 'Hong Kong',
    badge: 'HK-CINEMA',
    searchKeyword: 'hong kong',
    href: '/quoc-gia/hong-kong'
  },
  'dai-loan': {
    slug: 'dai-loan',
    backendSlugs: ['đài-loan', 'dai-loan'],
    nameVi: 'Đài Loan',
    nameEn: 'Taiwan',
    badge: 'TW-DRAMA',
    searchKeyword: 'dai loan',
    href: '/quoc-gia/dai-loan'
  },
  'anh': {
    slug: 'anh',
    backendSlugs: ['anh'],
    nameVi: 'Anh',
    nameEn: 'United Kingdom',
    badge: 'UK',
    searchKeyword: 'anh',
    href: '/quoc-gia/anh'
  }
};

/**
 * Standard Categories Registry.
 * Key: URL slug (unaccented)
 */
export const TAXONOMY_CATEGORIES = {
  'hoat-hinh': {
    slug: 'hoat-hinh',
    backendSlugs: ['hoạt-hình', 'hoat-hinh'],
    nameVi: 'Hoạt Hình & Anime',
    nameEn: 'Animation & Anime',
    badge: 'ANIME & CARTOON',
    searchKeyword: 'hoat',
    href: '/the-loai/hoat-hinh'
  },
  'hanh-dong': {
    slug: 'hanh-dong',
    backendSlugs: ['hành-động', 'hanh-dong'],
    nameVi: 'Hành Động',
    nameEn: 'Action',
    badge: 'ACTION',
    searchKeyword: 'hanh dong',
    href: '/the-loai/hanh-dong'
  },
  'tinh-cam': {
    slug: 'tinh-cam',
    backendSlugs: ['tình-cảm', 'lãng-mạn', 'tinh-cam'],
    nameVi: 'Tình Cảm',
    nameEn: 'Romance',
    badge: 'ROMANCE',
    searchKeyword: 'tinh cam',
    href: '/the-loai/tinh-cam'
  },
  'kinh-di': {
    slug: 'kinh-di',
    backendSlugs: ['kinh-dị', 'kinh-di'],
    nameVi: 'Kinh Dị',
    nameEn: 'Horror',
    badge: 'HORROR',
    searchKeyword: 'kinh di',
    href: '/the-loai/kinh-di'
  },
  'co-trang': {
    slug: 'co-trang',
    backendSlugs: ['cổ-trang', 'co-trang'],
    nameVi: 'Cổ Trang',
    nameEn: 'Period Drama',
    badge: 'PERIOD',
    searchKeyword: 'co trang',
    href: '/the-loai/co-trang'
  },
  'hai-huoc': {
    slug: 'hai-huoc',
    backendSlugs: ['phim-hài', 'hài-hước', 'hai-huoc'],
    nameVi: 'Hài Hước',
    nameEn: 'Comedy',
    badge: 'COMEDY',
    searchKeyword: 'hai',
    href: '/the-loai/hai-huoc'
  },
  'khoa-hoc-vien-tuong': {
    slug: 'khoa-hoc-vien-tuong',
    backendSlugs: ['khoa-học-viễn-tưởng', 'gia-tuong', 'khoa-hoc-vien-tuong'],
    nameVi: 'Khoa Học Viễn Tưởng',
    nameEn: 'Sci-Fi',
    badge: 'SCI-FI',
    searchKeyword: 'vien tuong',
    href: '/the-loai/khoa-hoc-vien-tuong'
  },
  'tam-ly': {
    slug: 'tam-ly',
    backendSlugs: ['tâm-lý', 'chính-kịch', 'tam-ly'],
    nameVi: 'Tâm Lý - Chính Kịch',
    nameEn: 'Drama',
    badge: 'DRAMA',
    searchKeyword: 'tam ly',
    href: '/the-loai/tam-ly'
  }
};

/**
 * Resolves country taxonomy metadata from any input slug.
 * @param {string} slug - Unaccented or accented slug
 * @returns {Object} Country metadata
 */
export function resolveCountryTaxonomy(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  // Direct key lookup
  if (TAXONOMY_COUNTRIES[normalized]) {
    return TAXONOMY_COUNTRIES[normalized];
  }

  // Lookup across backendSlugs
  for (const item of Object.values(TAXONOMY_COUNTRIES)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  // Default fallback for dynamic/unregistered country
  return {
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    badge: 'CINEMA',
    searchKeyword: normalized.replace(/-/g, ' '),
    href: `/quoc-gia/${normalized}`
  };
}

/**
 * Resolves category taxonomy metadata from any input slug.
 * @param {string} slug - Unaccented or accented slug
 * @returns {Object} Category metadata
 */
export function resolveCategoryTaxonomy(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  // Direct key lookup
  if (TAXONOMY_CATEGORIES[normalized]) {
    return TAXONOMY_CATEGORIES[normalized];
  }

  // Lookup across backendSlugs
  for (const item of Object.values(TAXONOMY_CATEGORIES)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  // Default fallback for dynamic/unregistered category
  return {
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    badge: 'GENRE',
    searchKeyword: normalized.replace(/-/g, ' '),
    href: `/the-loai/${normalized}`
  };
}
