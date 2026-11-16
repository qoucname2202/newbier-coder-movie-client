/**
 * @file genreThemeConstants.ts
 * @description Thematic presets, filters, and display configurations for genre showcase.
 */

import { GenreFormatFilter, GenreSortOption, GenreThemeConfig } from '../types/genre.types';
import { resolveCategoryTaxonomy } from '@/config/taxonomyConfig';

/**
 * Standard page size for infinite scroll chunks.
 */
export const GENRE_PAGE_SIZE = 24 as const;

/**
 * Throttle cooldown in ms between consecutive scroll fetches.
 */
export const SCROLL_FETCH_THROTTLE_MS = 600 as const;

/**
 * Format filter tab options.
 */
export const FORMAT_FILTER_TABS: ReadonlyArray<{ id: GenreFormatFilter; label: string }> = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'single', label: 'Phim Lẻ' },
  { id: 'series', label: 'Phim Bộ' }
] as const;

/**
 * Sort options for genre listing.
 */
export const SORT_OPTIONS: ReadonlyArray<{ id: GenreSortOption; label: string }> = [
  { id: 'newest', label: 'Mới Nhất' },
  { id: 'highest-rating', label: 'Đánh Giá Cao Nhất' },
  { id: 'year-desc', label: 'Năm Phát Hành (Mới Nhất)' },
  { id: 'a-z', label: 'Tên Phim (A - Z)' }
] as const;

/**
 * Curated theme personality per category.
 */
export const GENRE_THEMES: Record<string, Omit<GenreThemeConfig, 'slug' | 'title'>> = {
  'hanh-dong': {
    badge: 'ACTION THRILL',
    tagline: 'Bùng nổ kỹ xảo điện ảnh đỉnh cao, những pha rượt đuổi nghẹt thở và võ thuật kịch tính.',
    accentColor: '#e50914',
    gradient: 'linear-gradient(135deg, rgba(229, 9, 20, 0.45) 0%, rgba(136, 19, 55, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(229, 9, 20, 0.35)',
    searchKeyword: 'hanh dong'
  },
  'hoat-hinh': {
    badge: 'ANIME & CARTOON',
    tagline: 'Vũ trụ anime huyền thoại, hoạt hình 3D rực rỡ và những câu chuyện kỳ ảo lay động mọi thế hệ.',
    accentColor: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.45) 0%, rgba(99, 102, 241, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    searchKeyword: 'hoat hinh'
  },
  'tinh-cam': {
    badge: 'PURE ROMANCE',
    tagline: 'Những câu chuyện tình yêu ngọt ngào, lãng mạn và chạm đến mọi cung bậc cảm xúc của trái tim.',
    accentColor: '#ec4899',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.45) 0%, rgba(244, 63, 94, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(236, 72, 153, 0.35)',
    searchKeyword: 'tinh cam'
  },
  'kinh-di': {
    badge: 'DARK HORROR',
    tagline: 'Cảm giác rợn ngực, những điều kỳ bí rùng rợn và nỗi sợ hãi tột độ thử thách thần kinh người xem.',
    accentColor: '#dc2626',
    gradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.45) 0%, rgba(88, 28, 135, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(220, 38, 38, 0.35)',
    searchKeyword: 'kinh di'
  },
  'co-trang': {
    badge: 'HISTORICAL & WU XIA',
    tagline: 'Trường ca võ hiệp kỳ ảo, những trận cung đấu kinh điển và bức tranh lịch sử hoành tráng.',
    accentColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    searchKeyword: 'co trang'
  },
  'hai-huoc': {
    badge: 'COMEDY SPECIAL',
    tagline: 'Những tiếng cười sảng khoái, tình huống dở khóc dở cười và phút giây thư giãn trọn vẹn bên người thân.',
    accentColor: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.45) 0%, rgba(5, 150, 105, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    searchKeyword: 'hai huoc'
  },
  'khoa-hoc-vien-tuong': {
    badge: 'SCI-FI & CYBERPUNK',
    tagline: 'Khám phá vũ trụ bao la, kỷ nguyên trí tuệ nhân tạo và công nghệ siêu việt vượt thời gian.',
    accentColor: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.45) 0%, rgba(37, 99, 235, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    searchKeyword: 'vien tuong'
  },
  'tam-ly': {
    badge: 'INTENSE DRAMA',
    tagline: 'Chiều sâu tâm lý, số phận con người và những góc khuất xã hội chân thực đầy suy tư trăn trở.',
    accentColor: '#6366f1',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.45) 0%, rgba(79, 70, 229, 0.25) 50%, rgba(12, 15, 22, 0.95) 100%)',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    searchKeyword: 'tam ly'
  }
};

/**
 * Fallback theme config for any unregistered or custom category slug.
 */
export const DEFAULT_GENRE_THEME: Omit<GenreThemeConfig, 'slug' | 'title'> = {
  badge: 'CINEMA COLLECTION',
  tagline: 'Tuyển tập những tác phẩm điện ảnh xuất sắc nhất được chọn lọc kỹ lưỡng, chất lượng cao.',
  accentColor: '#e50914',
  gradient: 'linear-gradient(135deg, rgba(229, 9, 20, 0.4) 0%, rgba(30, 41, 59, 0.3) 50%, rgba(12, 15, 22, 0.95) 100%)',
  glowColor: 'rgba(229, 9, 20, 0.3)',
  searchKeyword: ''
};

/**
 * Resolves complete GenreThemeConfig with metadata from taxonomyConfig.
 *
 * @param slug - Category identifier
 * @returns Fully populated GenreThemeConfig
 */
export function getGenreThemeConfig(slug: string): GenreThemeConfig {
  const normalizedSlug = (slug || '').toLowerCase().trim();
  const taxonomy = resolveCategoryTaxonomy(normalizedSlug);
  const themePreset = GENRE_THEMES[normalizedSlug] || DEFAULT_GENRE_THEME;

  const title = taxonomy?.nameVi || normalizedSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const badge = taxonomy?.badge || themePreset.badge;

  return {
    slug: normalizedSlug,
    title,
    badge,
    tagline: themePreset.tagline,
    accentColor: themePreset.accentColor,
    gradient: themePreset.gradient,
    glowColor: themePreset.glowColor,
    searchKeyword: taxonomy?.searchKeyword || themePreset.searchKeyword
  };
}
