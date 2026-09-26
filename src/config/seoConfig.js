/**
 * @file seoConfig.js
 * @description Centralized SEO & Social Metadata Configuration.
 * Enforces unified title formatting, OpenGraph standards, and metadata defaults.
 */

export const SEO_CONFIG = {
  siteName: 'MovieStreaming',
  titleSuffix: 'MovieStreaming',
  defaultTitle: 'MovieStreaming - Xem Phim Online HD Vietsub Miễn Phí',
  defaultDescription: 'Website xem phim online chuẩn HD miễn phí, cập nhật nhanh nhất các bộ phim bom tấn, phim chiếu rạp, phim bộ Hàn Quốc, Trung Quốc, Âu Mỹ chất lượng cao.',
  defaultKeywords: 'xem phim online, phim moi, phim le, phim bo, phim chieu rap, anime, vietsub, thuyet minh',
  defaultImage: '/img/phimlogo-removebg-preview.png',
  locale: 'vi_VN',
  twitterCard: 'summary_large_image',

  /**
   * Helper to generate standardized document title.
   * @param {string} pageTitle - Individual page title
   * @returns {string} Formatted title (e.g. "Phim Lẻ | MovieStreaming")
   */
  formatTitle: (pageTitle) => {
    if (!pageTitle) return SEO_CONFIG.defaultTitle;
    return `${pageTitle} | ${SEO_CONFIG.titleSuffix}`;
  }
};
