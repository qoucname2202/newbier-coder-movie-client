/**
 * The central taxonomy system for the Fastify backend and the frontend
 * routing.
 *
 * It maps a clean slug (without accents) to the database slug, the
 * Vietnamese display label, the badge and the fallback search keyword,
 * with one shared and extensible schema.
 */

/**
 * Builds a normalized taxonomy item.
 *
 * The same schema is used for every kind of taxonomy: category, country,
 * format and tag.
 *
 * @param params - The configuration of the item.
 * @param params.slug - The clean slug without accents, used in the URL,
 *                      such as "han-quoc" or "hoat-hinh".
 * @param params.backendSlugs - The slugs stored in the database, with the
 *                              Vietnamese accents.
 * @param params.nameVi - The Vietnamese display label.
 * @param params.nameEn - The English display label.
 * @param params.badge - The short badge used by the card header. It
 *                       defaults to "CINEMA".
 * @param params.searchKeyword - The fallback keyword used by the search
 *                               endpoint.
 * @param params.baseRoute - The base route of the item, such as "/country"
 *                           or "/genre".
 * @returns The normalized taxonomy entity.
 */
export function createTaxonomyItem({
  slug,
  backendSlugs = [],
  nameVi,
  nameEn,
  badge = 'CINEMA',
  searchKeyword,
  baseRoute = ''
}: {
  slug: string;
  backendSlugs?: string[];
  nameVi: string;
  nameEn?: string;
  badge?: string;
  searchKeyword?: string;
  baseRoute?: string;
}) {
  const normalizedSlug = slug.toLowerCase().trim();
  const allBackendSlugs = Array.from(new Set([normalizedSlug, ...backendSlugs.map((s: string) => s.toLowerCase().trim())]));

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
 * The registry of the countries.
 */
export const TAXONOMY_COUNTRIES = {
  'han-quoc': createTaxonomyItem({
    slug: 'han-quoc',
    backendSlugs: ['han-quoc'],
    nameVi: 'Hàn Quốc',
    nameEn: 'South Korea',
    badge: 'K-DRAMA',
    baseRoute: '/country'
  }),
  'trung-quoc': createTaxonomyItem({
    slug: 'trung-quoc',
    backendSlugs: ['trung-quoc'],
    nameVi: 'Trung Quốc',
    nameEn: 'China',
    badge: 'C-DRAMA',
    baseRoute: '/country'
  }),
  'nhat-ban': createTaxonomyItem({
    slug: 'nhat-ban',
    backendSlugs: ['nhat-ban'],
    nameVi: 'Nhật Bản',
    nameEn: 'Japan',
    badge: 'J-DRAMA',
    baseRoute: '/country'
  }),
  'au-my': createTaxonomyItem({
    slug: 'au-my',
    backendSlugs: ['au-my'],
    nameVi: 'Âu Mỹ',
    nameEn: 'Western / Hollywood',
    badge: 'HOLLYWOOD',
    baseRoute: '/country'
  }),
  'thai-lan': createTaxonomyItem({
    slug: 'thai-lan',
    backendSlugs: ['thai-lan'],
    nameVi: 'Thái Lan',
    nameEn: 'Thailand',
    badge: 'T-DRAMA',
    baseRoute: '/country'
  }),
  'viet-nam': createTaxonomyItem({
    slug: 'viet-nam',
    backendSlugs: ['viet-nam'],
    nameVi: 'Việt Nam',
    nameEn: 'Vietnam',
    badge: 'V-CINEMA',
    baseRoute: '/country'
  }),
  'hong-kong': createTaxonomyItem({
    slug: 'hong-kong',
    backendSlugs: ['hong-kong'],
    nameVi: 'Hồng Kông',
    nameEn: 'Hong Kong',
    badge: 'HK-CINEMA',
    baseRoute: '/country'
  }),
  'dai-loan': createTaxonomyItem({
    slug: 'dai-loan',
    backendSlugs: ['dai-loan'],
    nameVi: 'Đài Loan',
    nameEn: 'Taiwan',
    badge: 'TW-DRAMA',
    baseRoute: '/country'
  }),
  'anh': createTaxonomyItem({
    slug: 'anh',
    backendSlugs: ['anh'],
    nameVi: 'Anh',
    nameEn: 'United Kingdom',
    badge: 'UK',
    baseRoute: '/country'
  })
} as const;

/**
 * The registry of the movie categories.
 */
export const TAXONOMY_CATEGORIES = {
  'hoat-hinh': createTaxonomyItem({
    slug: 'hoat-hinh',
    backendSlugs: ['hoat-hinh'],
    nameVi: 'Hoạt Hình & Anime',
    nameEn: 'Animation & Anime',
    badge: 'ANIME & CARTOON',
    baseRoute: '/genre'
  }),
  'hanh-dong': createTaxonomyItem({
    slug: 'hanh-dong',
    backendSlugs: ['hanh-dong'],
    nameVi: 'Hành Động',
    nameEn: 'Action',
    badge: 'ACTION',
    baseRoute: '/genre'
  }),
  'tinh-cam': createTaxonomyItem({
    slug: 'tinh-cam',
    backendSlugs: ['tinh-cam'],
    nameVi: 'Tình Cảm',
    nameEn: 'Romance',
    badge: 'ROMANCE',
    baseRoute: '/genre'
  }),
  'kinh-di': createTaxonomyItem({
    slug: 'kinh-di',
    backendSlugs: ['kinh-di'],
    nameVi: 'Kinh Dị',
    nameEn: 'Horror',
    badge: 'HORROR',
    baseRoute: '/genre'
  }),
  'co-trang': createTaxonomyItem({
    slug: 'co-trang',
    backendSlugs: ['co-trang'],
    nameVi: 'Cổ Trang',
    nameEn: 'Period Drama',
    badge: 'PERIOD',
    baseRoute: '/genre'
  }),
  'hai-huoc': createTaxonomyItem({
    slug: 'hai-huoc',
    backendSlugs: ['hai-huoc'],
    nameVi: 'Hài Hước',
    nameEn: 'Comedy',
    badge: 'COMEDY',
    baseRoute: '/genre'
  }),
  'khoa-hoc-vien-tuong': createTaxonomyItem({
    slug: 'khoa-hoc-vien-tuong',
    backendSlugs: ['khoa-hoc-vien-tuong'],
    nameVi: 'Khoa Học Viễn Tưởng',
    nameEn: 'Sci-Fi',
    badge: 'SCI-FI',
    baseRoute: '/genre'
  }),
  'tam-ly': createTaxonomyItem({
    slug: 'tam-ly',
    backendSlugs: ['tam-ly'],
    nameVi: 'Tâm Lý - Chính Kịch',
    nameEn: 'Drama',
    badge: 'DRAMA',
    baseRoute: '/genre'
  })
} as const;

/**
 * The registry of the movie formats.
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
} as const;

/**
 * Looks up the metadata of a country from the given slug.
 *
 * Both the clean slug and the slug with accents are supported.
 *
 * @param slug - The slug to look for, clean or with accents.
 * @returns The metadata of the country, or a default item built from the
 *          slug when the country is unknown.
 */
export function resolveCountryTaxonomy(slug: string | null | undefined) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (normalized in TAXONOMY_COUNTRIES) {
    return (TAXONOMY_COUNTRIES as Record<string, ReturnType<typeof createTaxonomyItem>>)[normalized];
  }

  for (const item of Object.values(TAXONOMY_COUNTRIES as Record<string, ReturnType<typeof createTaxonomyItem>>)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  return createTaxonomyItem({
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    baseRoute: '/country'
  });
}

/**
 * Looks up the metadata of a category from the given slug.
 *
 * Both the clean slug and the slug with accents are supported.
 *
 * @param slug - The slug to look for, clean or with accents.
 * @returns The metadata of the category, or a default item built from the
 *          slug when the category is unknown.
 */
export function resolveCategoryTaxonomy(slug: string | null | undefined) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (normalized in TAXONOMY_CATEGORIES) {
    return (TAXONOMY_CATEGORIES as Record<string, ReturnType<typeof createTaxonomyItem>>)[normalized];
  }

  for (const item of Object.values(TAXONOMY_CATEGORIES as Record<string, ReturnType<typeof createTaxonomyItem>>)) {
    if (item.backendSlugs.includes(normalized)) {
      return item;
    }
  }

  return createTaxonomyItem({
    slug: normalized,
    backendSlugs: [normalized],
    nameVi: slug,
    nameEn: slug,
    baseRoute: '/genre'
  });
}

/**
 * Looks up the metadata of a format from the given slug.
 *
 * The clean slug and the alias slugs are both supported.
 *
 * @param slug - The slug to look for.
 * @returns The metadata of the format, or a default item built from the
 *          slug when the format is unknown.
 */
export function resolveFormatTaxonomy(slug: string | null | undefined) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();

  if (normalized in TAXONOMY_FORMATS) {
    return (TAXONOMY_FORMATS as Record<string, ReturnType<typeof createTaxonomyItem>>)[normalized];
  }

  for (const item of Object.values(TAXONOMY_FORMATS as Record<string, ReturnType<typeof createTaxonomyItem>>)) {
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
