/**
 * @file taxonomyConfig.js
 * @description Centralized Taxonomy Registry for Fastify Backend and Frontend Routing.
 * Maps URL-friendly unaccented slugs to Backend database slugs, localized labels, badges,
 * and search fallback keywords using a unified, extensible schema.
 */

/**
 * Standard Taxonomy Item Factory.
 * Enforces uniform schema for any category, country, format, or tag created in the future.
 *
 * @param {Object} params
 * @param {string} params.slug - URL-friendly unaccented slug (e.g. 'han-quoc', 'hoat-hinh')
 * @param {Array<string>} params.backendSlugs - Database-stored slugs (including Vietnamese accents)
 * @param {string} params.nameVi - Localized Vietnamese display label
 * @param {string} params.nameEn - Localized English display label
 * @param {string} [params.badge='CINEMA'] - Short badge label for card headers and badges
 * @param {string} [params.searchKeyword] - Fallback search keyword for search endpoint
 * @param {string} [params.baseRoute='/'] - Root route path (e.g. '/quoc-gia', '/the-loai')
 * @returns {Object} Standardized taxonomy entity
 */
export function createTaxonomyItem({
  slug,
  backendSlugs = [],
  nameVi,
  nameEn,
  badge = 'CINEMA',
  searchKeyword,
  baseRoute = ''
}) {
  const normalizedSlug = slug.toLowerCase().trim();
  const allBackendSlugs = Array.from(new Set([normalizedSlug, ...backendSlugs.map(s => s.toLowerCase().trim())]));

  return {
    slug: normalizedSlug,
    backendSlugs: allBackendSlugs,
    nameVi: nameVi || slug,
    nameEn: nameEn || slug,
    badge,
    searchKeyword: searchKeyword || normalizedSlug.replace(/-/g, ' '),
    href: `${baseRoute}/${normalizedSlug}`
  };
}

/**
 * Standard Countries Registry.
 */
export const TAXONOMY_COUNTRIES = {
  'han-quoc': createTaxonomyItem({
    slug: 'han-quoc',
    backendSlugs: ['hàn-quốc', 'han-quoc'],
    nameVi: 'Hàn Quốc',
    nameEn: 'South Korea',
    badge: 'K-DRAMA',
    searchKeyword: 'han',
    baseRoute: '/quoc-gia'
  }),
  'trung-quoc': createTaxonomyItem({
    slug: 'trung-quoc',
    backendSlugs: ['trung-quốc', 'trung-quoc'],
    nameVi: 'Trung Quốc',
    nameEn: 'China',
    badge: 'C-DRAMA',
    searchKeyword: 'trung',
    baseRoute: '/quoc-gia'
  }),
  'nhat-ban': createTaxonomyItem({
    slug: 'nhat-ban',
    backendSlugs: ['nhật-bản', 'nhat-ban'],
    nameVi: 'Nhật Bản',
    nameEn: 'Japan',
    badge: 'J-DRAMA',
    searchKeyword: 'nhat',
    baseRoute: '/quoc-gia'
  }),
  'au-my': createTaxonomyItem({
    slug: 'au-my',
    backendSlugs: ['âu-mỹ', 'au-my'],
    nameVi: 'Âu Mỹ',
    nameEn: 'Western / Hollywood',
    badge: 'HOLLYWOOD',
    searchKeyword: 'my',
    baseRoute: '/quoc-gia'
  }),
  'thai-lan': createTaxonomyItem({
    slug: 'thai-lan',
    backendSlugs: ['thái-lan', 'thai-lan'],
    nameVi: 'Thái Lan',
    nameEn: 'Thailand',
    badge: 'T-DRAMA',
    searchKeyword: 'thai',
    baseRoute: '/quoc-gia'
  }),
  'viet-nam': createTaxonomyItem({
    slug: 'viet-nam',
    backendSlugs: ['việt-nam', 'viet-nam'],
    nameVi: 'Việt Nam',
    nameEn: 'Vietnam',
    badge: 'V-CINEMA',
    searchKeyword: 'viet',
    baseRoute: '/quoc-gia'
  }),
  'hong-kong': createTaxonomyItem({
    slug: 'hong-kong',
    backendSlugs: ['hồng-kông', 'hong-kong'],
    nameVi: 'Hồng Kông',
    nameEn: 'Hong Kong',
    badge: 'HK-CINEMA',
    searchKeyword: 'hong kong',
    baseRoute: '/quoc-gia'
  }),
  'dai-loan': createTaxonomyItem({
    slug: 'dai-loan',
    backendSlugs: ['đài-loan', 'dai-loan'],
    nameVi: 'Đài Loan',
    nameEn: 'Taiwan',
    badge: 'TW-DRAMA',
    searchKeyword: 'dai loan',
    baseRoute: '/quoc-gia'
  }),
  'anh': createTaxonomyItem({
    slug: 'anh',
    backendSlugs: ['anh'],
    nameVi: 'Anh',
    nameEn: 'United Kingdom',
    badge: 'UK',
    searchKeyword: 'anh',
    baseRoute: '/quoc-gia'
  })
};

/**
 * Standard Categories Registry.
 */
export const TAXONOMY_CATEGORIES = {
  'hoat-hinh': createTaxonomyItem({
    slug: 'hoat-hinh',
    backendSlugs: ['hoạt-hình', 'hoat-hinh'],
    nameVi: 'Hoạt Hình & Anime',
    nameEn: 'Animation & Anime',
    badge: 'ANIME & CARTOON',
    searchKeyword: 'hoat',
    baseRoute: '/the-loai'
  }),
  'hanh-dong': createTaxonomyItem({
    slug: 'hanh-dong',
    backendSlugs: ['hành-động', 'hanh-dong'],
    nameVi: 'Hành Động',
    nameEn: 'Action',
    badge: 'ACTION',
    searchKeyword: 'hanh dong',
    baseRoute: '/the-loai'
  }),
  'tinh-cam': createTaxonomyItem({
    slug: 'tinh-cam',
    backendSlugs: ['tình-cảm', 'lãng-mạn', 'tinh-cam'],
    nameVi: 'Tình Cảm',
    nameEn: 'Romance',
    badge: 'ROMANCE',
    searchKeyword: 'tinh cam',
    baseRoute: '/the-loai'
  }),
  'kinh-di': createTaxonomyItem({
    slug: 'kinh-di',
    backendSlugs: ['kinh-dị', 'kinh-di'],
    nameVi: 'Kinh Dị',
    nameEn: 'Horror',
    badge: 'HORROR',
    searchKeyword: 'kinh di',
    baseRoute: '/the-loai'
  }),
  'co-trang': createTaxonomyItem({
    slug: 'co-trang',
    backendSlugs: ['cổ-trang', 'co-trang'],
    nameVi: 'Cổ Trang',
    nameEn: 'Period Drama',
    badge: 'PERIOD',
    searchKeyword: 'co trang',
    baseRoute: '/the-loai'
  }),
  'hai-huoc': createTaxonomyItem({
    slug: 'hai-huoc',
    backendSlugs: ['phim-hài', 'hài-hước', 'hai-huoc'],
    nameVi: 'Hài Hước',
    nameEn: 'Comedy',
    badge: 'COMEDY',
    searchKeyword: 'hai',
    baseRoute: '/the-loai'
  }),
  'khoa-hoc-vien-tuong': createTaxonomyItem({
    slug: 'khoa-hoc-vien-tuong',
    backendSlugs: ['khoa-học-viễn-tưởng', 'gia-tuong', 'khoa-hoc-vien-tuong'],
    nameVi: 'Khoa Học Viễn Tưởng',
    nameEn: 'Sci-Fi',
    badge: 'SCI-FI',
    searchKeyword: 'vien tuong',
    baseRoute: '/the-loai'
  }),
  'tam-ly': createTaxonomyItem({
    slug: 'tam-ly',
    backendSlugs: ['tâm-lý', 'chính-kịch', 'tam-ly'],
    nameVi: 'Tâm Lý - Chính Kịch',
    nameEn: 'Drama',
    badge: 'DRAMA',
    searchKeyword: 'tam ly',
    baseRoute: '/the-loai'
  })
};

/**
 * Standard Formats Registry.
 */
export const TAXONOMY_FORMATS = {
  'phim-bo': createTaxonomyItem({
    slug: 'phim-bo',
    backendSlugs: ['series', 'phim-bo'],
    nameVi: 'Phim Bộ Đặc Sắc',
    nameEn: 'TV Series',
    badge: 'SERIES',
    baseRoute: '/dinh-dang'
  }),
  'phim-le': createTaxonomyItem({
    slug: 'phim-le',
    backendSlugs: ['single', 'phim-le'],
    nameVi: 'Phim Lẻ Chiếu Rạp',
    nameEn: 'Movies',
    badge: 'FEATURE',
    baseRoute: '/dinh-dang'
  }),
  'tv-shows': createTaxonomyItem({
    slug: 'tv-shows',
    backendSlugs: ['tvshows', 'tv-shows'],
    nameVi: 'Chương Trình TV',
    nameEn: 'TV Shows',
    badge: 'SHOW',
    baseRoute: '/dinh-dang'
  })
};

/**
 * Resolves country taxonomy metadata from any input slug.
 * @param {string} slug - Unaccented or accented slug
 * @returns {Object} Country metadata
 */
export function resolveCountryTaxonomy(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (TAXONOMY_COUNTRIES[normalized]) {
    return TAXONOMY_COUNTRIES[normalized];
  }

  for (const item of Object.values(TAXONOMY_COUNTRIES)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  return createTaxonomyItem({
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    baseRoute: '/quoc-gia'
  });
}

/**
 * Resolves category taxonomy metadata from any input slug.
 * @param {string} slug - Unaccented or accented slug
 * @returns {Object} Category metadata
 */
export function resolveCategoryTaxonomy(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (TAXONOMY_CATEGORIES[normalized]) {
    return TAXONOMY_CATEGORIES[normalized];
  }

  for (const item of Object.values(TAXONOMY_CATEGORIES)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  return createTaxonomyItem({
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    baseRoute: '/the-loai'
  });
}

/**
 * Resolves format taxonomy metadata from any input slug.
 * @param {string} slug - Unaccented or alias slug
 * @returns {Object} Format metadata
 */
export function resolveFormatTaxonomy(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (TAXONOMY_FORMATS[normalized]) {
    return TAXONOMY_FORMATS[normalized];
  }

  for (const item of Object.values(TAXONOMY_FORMATS)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  return createTaxonomyItem({
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    baseRoute: '/dinh-dang'
  });
}
