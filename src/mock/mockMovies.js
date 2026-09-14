/**
 * @file mockMovies.js
 * @description Standard mock movie dataset and Backend API Contract Schema.
 * Serves as a working specification for Backend engineers to match endpoint responses.
 */

/**
 * @typedef {Object} CategoryItem
 * @property {string} name - Category display name (e.g. 'Khoa Học Viễn Tưởng')
 * @property {string} slug - URL safe category identifier (e.g. 'khoa-hoc-vien-tuong')
 */

/**
 * @typedef {Object} CountryItem
 * @property {string} name - Country display name (e.g. 'Mỹ', 'Hàn Quốc')
 * @property {string} slug - URL safe country identifier (e.g. 'my', 'han-quoc')
 */

/**
 * @typedef {Object} MovieSchema
 * @property {string} _id - Unique movie identifier
 * @property {string} name - Primary localized Vietnamese title
 * @property {string} origin_name - Original native title
 * @property {string} slug - SEO-friendly URL slug
 * @property {number} year - Release year
 * @property {'4K'|'FHD'|'HD'} quality - Video resolution
 * @property {string} lang - Audio / Subtitle format ('Vietsub', 'Thuyết minh', 'Lồng tiếng', 'Vietsub + Thuyết minh')
 * @property {'single'|'series'} type - Content format ('single' for movies, 'series' for TV shows)
 * @property {'ongoing'|'completed'|'upcoming'} status - Production / broadcasting status
 * @property {string} [episode_current] - Current episode label (e.g. 'Tập 6/9', 'Tập 16/16', 'Full')
 * @property {number} [episode_total] - Total planned episodes for series
 * @property {string} [time] - Runtime duration (e.g. '166 phút' or '45 phút/tập')
 * @property {number} [rating] - Rating score from 0.0 to 10.0 (IMDb)
 * @property {number} [view] - Total cumulative view count
 * @property {string} content - Synopsis overview text
 * @property {string} poster_url - Vertical poster image URL (2:3 aspect ratio)
 * @property {string} thumb_url - Landscape thumbnail image URL (16:9 aspect ratio)
 * @property {string} backdrop_url - High-resolution hero backdrop image URL (16:9 widescreen)
 * @property {string} [trailer_url] - YouTube video ID for embedded trailer player
 * @property {Array<CategoryItem>} category - Array of genre taxonomy items
 * @property {Array<CountryItem>} country - Array of country origin items
 * @property {Array<Object>} episodes - Episode streaming links and server sources
 */

// ============================================================================
// CASE 1: Single Blockbuster Movie - 4K, Vietsub
// ============================================================================
export const mockFeaturedMovie = {
  _id: "mock-featured-1",
  name: "Dune: Hành Tinh Cát - Phần Hai",
  origin_name: "Dune: Part Two",
  slug: "dune-hanh-tinh-cat-phan-hai",
  year: 2024,
  quality: "4K",
  lang: "Vietsub + Thuyết minh",
  type: "single",
  status: "completed",
  episode_current: "Full",
  time: "166 phút",
  rating: 8.8,
  view: 125400,
  content: "Paul Atreides hợp nhất với Chani và người Fremen trong khi tìm kiếm sự trả thù chống lại những kẻ đã hủy hoại gia đình anh. Phải đối mặt với sự lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ, anh cố gắng ngăn chặn một tương lai khủng khiếp mà chỉ anh có thể thấy trước.",
  poster_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
  thumb_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
  backdrop_url: "https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
  trailer_url: "Way9Dexny3w",
  category: [
    { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
    { name: "Hành Động", slug: "hanh-dong" },
    { name: "Phiêu Lưu", slug: "phieu-luu" }
  ],
  country: [{ name: "Mỹ", slug: "my" }],
  episodes: [
    {
      server_name: "Vietsub #1",
      server_data: [
        {
          name: "Full",
          slug: "full",
          link_embed: "https://www.youtube.com/embed/Way9Dexny3w"
        }
      ]
    }
  ]
};

// ============================================================================
// CASE 2: PHIM BỘ ĐANG CHIẾU (Ongoing Series with Live Episode Progress)
// ============================================================================
export const mockOngoingSeries = {
  _id: "mock-series-ongoing-2",
  name: "Arcane: Liên Minh Huyền Thoại - Mùa 2",
  origin_name: "Arcane: League of Legends Season 2",
  slug: "arcane-season-2",
  year: 2024,
  quality: "4K",
  lang: "Lồng tiếng + Vietsub",
  type: "series",
  status: "ongoing",
  episode_current: "Tập 6/9",
  episode_total: 9,
  time: "42 phút/tập",
  rating: 9.0,
  view: 245000,
  content: "Căng thẳng giữa thành phố Piltover thịnh vượng và thế giới ngầm Zaun nghèo nàn lên đến đỉnh điểm sau vụ tấn công vào Hội đồng. Hai chị em Vi và Jinx đứng ở hai đầu chiến tuyến trong cuộc chiến định đoạt tương lai của cả hai thế giới.",
  poster_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
  thumb_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
  backdrop_url: "https://image.tmdb.org/t/p/original/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg",
  trailer_url: "yu95qJjB5eY",
  category: [
    { name: "Hoạt Hình", slug: "hoat-hinh" },
    { name: "Hành Động", slug: "hanh-dong" },
    { name: "Viễn Tưởng", slug: "vien-tuong" }
  ],
  country: [{ name: "Mỹ", slug: "my" }],
  episodes: [
    {
      server_name: "Lồng tiếng VIP",
      server_data: [
        { name: "Tập 1", slug: "tap-1", link_embed: "https://www.youtube.com/embed/yu95qJjB5eY" },
        { name: "Tập 6", slug: "tap-6", link_embed: "https://www.youtube.com/embed/yu95qJjB5eY" }
      ]
    }
  ]
};

// ============================================================================
// CASE 3: PHIM BỘ TRỌN BỘ HOÀN TẤT (Completed Full Series)
// ============================================================================
export const mockCompletedSeries = {
  _id: "mock-series-completed-3",
  name: "Trò Chơi Vương Quyền",
  origin_name: "Game of Thrones",
  slug: "tro-choi-vuong-quyen",
  year: 2019,
  quality: "4K",
  lang: "Vietsub",
  type: "series",
  status: "completed",
  episode_current: "Trọn bộ 73 tập",
  episode_total: 73,
  time: "60 phút/tập",
  rating: 9.2,
  view: 320000,
  content: "Chín gia tộc quý tộc chiến đấu tàn khốc để giành quyền kiểm soát Ngai Sắt của vùng đất Westeros huyền thoại, trong khi một đội quân bóng ma cổ xưa từ phương Bắc đang trỗi dậy đe dọa sự tồn vong của toàn nhân loại.",
  poster_url: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
  thumb_url: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
  backdrop_url: "https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
  trailer_url: "KPLWWIOCOOQ",
  category: [
    { name: "Phim Bộ", slug: "phim-bo" },
    { name: "Giả Tưởng", slug: "gia-tuong" },
    { name: "Chính Kịch", slug: "chinh-kich" }
  ],
  country: [{ name: "Mỹ", slug: "my" }],
  episodes: [
    {
      server_name: "Vietsub VIP",
      server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "https://www.youtube.com/embed/KPLWWIOCOOQ" }]
    }
  ]
};

// ============================================================================
// CASE 4: PHIM SẮP RA MẮT / SẮP KHỞI CHIẾU (Upcoming Movie with Countdown)
// ============================================================================
export const mockUpcomingMovie = {
  _id: "mock-upcoming-4",
  name: "Avatar: Lửa Và Tro Tàn",
  origin_name: "Avatar: Fire and Ash",
  slug: "avatar-lua-va-tro-tan",
  year: 2025,
  quality: "Trailer 4K",
  lang: "Vietsub",
  type: "single",
  status: "upcoming",
  episode_current: "Sắp chiếu",
  time: "Khởi chiếu 12/2025",
  rating: 8.5,
  view: 89000,
  content: "Phần phim thứ ba đưa gia đình Sully khám phá một tộc người Na'vi mới đầy thù địch được gọi là 'Người Tro', sinh sống quanh các ngọn núi lửa hung hãn của hành tinh Pandora bí ẩn.",
  poster_url: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
  thumb_url: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
  backdrop_url: "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
  trailer_url: "d9MyW72ELq0",
  category: [
    { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
    { name: "Hành Động", slug: "hanh-dong" },
    { name: "Chiếu Rạp", slug: "chieu-rap" }
  ],
  country: [{ name: "Mỹ", slug: "my" }],
  episodes: []
};

// ============================================================================
// CASE 5: PHIM CHÂU Á ĐOẠT GIẢI (Award-Winning Drama / Cinema Classic)
// ============================================================================
export const mockAwardWinningMovie = {
  _id: "mock-award-5",
  name: "Ký Sinh Trùng",
  origin_name: "Parasite",
  slug: "ky-sinh-trung",
  year: 2019,
  quality: "4K",
  lang: "Vietsub",
  type: "single",
  status: "completed",
  episode_current: "Full",
  time: "132 phút",
  rating: 8.6,
  view: 198000,
  content: "Gia đình Kim nghèo khó dần thâm nhập vào cuộc sống của gia đình Park giàu có bằng cách đóng giả những người làm công lành nghề không quen biết nhau, mở ra chuỗi bi kịch bất ngờ.",
  poster_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  thumb_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  backdrop_url: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
  trailer_url: "5xH0hhJ_Vn8",
  category: [
    { name: "Tâm Lý", slug: "tam-ly" },
    { name: "Giật Gân", slug: "giat-gan" },
    { name: "Hài Đen", slug: "hai-den" }
  ],
  country: [{ name: "Hàn Quốc", slug: "han-quoc" }],
  episodes: [
    {
      server_name: "Vietsub #1",
      server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/5xH0hhJ_Vn8" }]
    }
  ]
};

// ============================================================================
// FULL MOCK MOVIE REPOSITORY
// ============================================================================
export const mockMovies = [
  mockFeaturedMovie,       // Case 1: Bom tấn lẻ 4K
  mockOngoingSeries,       // Case 2: Phim bộ đang chiếu (Tập 6/9)
  mockCompletedSeries,     // Case 3: Phim bộ trọn bộ (Trọn bộ 73 tập)
  mockUpcomingMovie,       // Case 4: Phim sắp chiếu (Khởi chiếu 12/2025)
  mockAwardWinningMovie,   // Case 5: Phim châu Á đoạt giải
  {
    _id: "mock-6",
    name: "Oppenheimer",
    origin_name: "Oppenheimer",
    slug: "oppenheimer",
    year: 2023,
    quality: "4K",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "180 phút",
    rating: 8.9,
    view: 98200,
    content: "Câu chuyện về nhà vật lý lý thuyết J. Robert Oppenheimer, người đứng đầu Dự án Manhattan phát triển bom nguyên tử trong Thế chiến II.",
    poster_url: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctetOs2tYx0OZEHG.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctetOs2tYx0OZEHG.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    trailer_url: "uYPbbksJxIg",
    category: [
      { name: "Chính Kịch", slug: "chinh-kich" },
      { name: "Lịch Sử", slug: "lich-su" }
    ],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: []
  },
  {
    _id: "mock-7",
    name: "Người Nhện: Du Hành Vũ Trụ Nhện",
    origin_name: "Spider-Man: Across the Spider-Verse",
    slug: "nguoi-nhen-du-hanh-vu-tru-nhen",
    year: 2023,
    quality: "FHD",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "140 phút",
    rating: 8.7,
    view: 84300,
    content: "Miles Morales phiêu lưu xuyên Đa Vũ Trụ, gặp gỡ đội quân Người Nhện được giao nhiệm vụ bảo vệ sự tồn tại của nó.",
    poster_url: "https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    category: [
      { name: "Hoạt Hình", slug: "hoat-hinh" },
      { name: "Hành Động", slug: "hanh-dong" }
    ],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: []
  }
];

// Mock country-specific movie lists for Moviecountry component
export const mockKoreanMovies = [
  mockAwardWinningMovie,
  {
    _id: "mock-kr-2",
    name: "Hạ Cánh Nơi Anh",
    origin_name: "Crash Landing on You",
    slug: "ha-canh-noi-anh",
    year: 2020,
    quality: "HD",
    lang: "Thuyết minh",
    type: "series",
    episode_current: "Tập 16/16",
    time: "70 phút/tập",
    rating: 8.7,
    view: 280000,
    content: "Một người thừa kế giàu có của Hàn Quốc vô tình hạ cánh xuống Triều Tiên sau một tai nạn dù lượn và rơi vào lưới tình với một sĩ quan quân đội.",
    poster_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    country: [{ name: "Hàn Quốc", slug: "han-quoc" }],
    category: [{ name: "Lãng Mạn", slug: "lang-man" }],
    episodes: [{ server_name: "Server 1", server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "" }] }]
  },
  {
    _id: "mock-kr-3",
    name: "Trò Chơi Con Mực",
    origin_name: "Squid Game",
    slug: "tro-choi-con-muc",
    year: 2021,
    quality: "4K",
    lang: "Vietsub",
    type: "series",
    episode_current: "Tập 9/9",
    time: "55 phút/tập",
    rating: 8.0,
    view: 450000,
    content: "Hàng trăm người chơi kẹt tiền chấp nhận lời mời kỳ lạ để cạnh tranh trong các trò chơi trẻ con với mức thưởng khổng lồ nhưng rủi ro chí mạng.",
    poster_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    country: [{ name: "Hàn Quốc", slug: "han-quoc" }],
    category: [{ name: "Hành Động", slug: "hanh-dong" }],
    episodes: [{ server_name: "Server 1", server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "" }] }]
  }
];

export const mockChineseMovies = [
  {
    _id: "mock-cn-1",
    name: "Trần Tình Lệnh",
    origin_name: "The Untamed",
    slug: "tran-tinh-lenh",
    year: 2019,
    quality: "FHD",
    lang: "Thuyết minh",
    type: "series",
    episode_current: "Tập 50/50",
    time: "45 phút/tập",
    rating: 8.9,
    view: 310000,
    content: "Hai tâm hồn tri kỷ cùng nhau khám phá một âm mưu đen tối trong giới tu tiên.",
    poster_url: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctetOs2tYx0OZEHG.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctetOs2tYx0OZEHG.jpg",
    country: [{ name: "Trung Quốc", slug: "trung-quoc" }],
    category: [{ name: "Cổ Trang", slug: "co-trang" }],
    episodes: [{ server_name: "Server 1", server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "" }] }]
  },
  {
    _id: "mock-cn-2",
    name: "Cuồng Phong",
    origin_name: "The Knockout",
    slug: "cuong-phong",
    year: 2023,
    quality: "HD",
    lang: "Vietsub",
    type: "series",
    episode_current: "Tập 39/39",
    time: "45 phút/tập",
    rating: 8.6,
    view: 190000,
    content: "Cuộc đấu trí kéo dài hai thập kỷ giữa viên cảnh sát hình sự chính trực và ông trùm thế giới ngầm.",
    poster_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    country: [{ name: "Trung Quốc", slug: "trung-quoc" }],
    category: [{ name: "Hình Sự", slug: "hinh-su" }],
    episodes: [{ server_name: "Server 1", server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "" }] }]
  }
];

export const mockCategories = [
  {
    id: "new",
    title: "Phim mới cập nhật",
    endpoint: "danh-sach/phim-moi-cap-nhat",
    movies: mockMovies
  }
];

