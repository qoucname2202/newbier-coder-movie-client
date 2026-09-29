/**
 * @file watchConfig.js
 * @description Centralized Configuration for the Movie Watch & Player Page.
 * Configures episode pagination chunks, sidebar recommendations, UI labels,
 * fallbacks, and SEO defaults without hardcoding values in UI components.
 */

export const WATCH_CONFIG = {
  // Episode playlist chunk size (24 items per group for balanced grid layout)
  episodesPerGroup: 24,

  // Sidebar recommendations widget settings
  recommendations: {
    limit: 10,
    title: 'Phim Đề Xuất',
    emptyText: 'Đang cập nhật danh sách đề xuất...'
  },

  // UI labels & text tokens
  labels: {
    playlistTitle: 'Danh Sách Tập',
    totalEpisodesSuffix: 'tập',
    versionLabel: 'Bản chiếu:',
    pinEpisodeTitle: 'Cuộn tới danh sách tập đang xem',
    pinEpisodeText: 'Ghim tập',
    prevEpisode: 'Tập trước',
    nextEpisode: 'Tập tiếp',
    favorite: 'Yêu thích',
    favorited: 'Đã lưu',
    share: 'Chia sẻ',
    shareCopied: 'Đã sao chép',
    synopsisTitle: 'Tóm tắt nội dung',
    backToMovieDetail: 'Về trang thông tin phim',
    homeCrumb: 'Trang chủ',
    defaultEpisodePrefix: 'Tập'
  },

  // SEO & Head defaults
  seo: {
    siteName: 'MovieStreaming',
    defaultBackdrop: '/img/background/movies-wall.jpg',
    buildPageTitle: (movieName, epTitle) =>
      `Xem phim ${movieName}${epTitle ? ` - ${epTitle}` : ''} | MovieStreaming`,
    buildDescription: (movieName, epTitle) =>
      `Xem phim ${movieName}${epTitle ? ` ${epTitle}` : ''} chất lượng cao trực tuyến miễn phí.`
  }
};
