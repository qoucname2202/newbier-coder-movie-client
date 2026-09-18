/**
 * @file mockComments.js
 * @description Standardized Mock Data and Backend API Contract Schema for Community Comments.
 * This specification serves as a reference contract for Backend Engineers to implement
 * the `/api/comments/top` and `/api/comments/live-buzz` endpoints.
 */

/**
 * @typedef {Object} MovieRef
 * @property {string} _id - Movie ID
 * @property {string} name - Localized movie title
 * @property {string} slug - Movie slug URL
 * @property {number} year - Release year
 * @property {string} poster_url - Vertical poster image
 * @property {string} thumb_url - Landscape thumbnail image
 * @property {number} rating - Movie rating (IMDb)
 */

/**
 * @typedef {Object} UserRef
 * @property {string} _id - User identifier
 * @property {string} name - User display name
 * @property {string} [avatar] - Avatar image URL or fallback initial
 * @property {string} [badge] - Community recognition badge (e.g. 'Cinephile', 'VIP Khán Giả', 'Thành Viên Vàng')
 */

/**
 * @typedef {Object} ParentCommentRef
 * @property {string} _id - Parent comment ID being replied to
 * @property {string} user_name - Author of the parent comment
 * @property {string} snippet - Short snippet (5-8 words) followed by '...'
 * @property {boolean} [is_icon_only] - True if parent comment contained only emojis/stickers
 */

/**
 * @typedef {Object} CommentSchema
 * @property {string} _id - Unique comment ID
 * @property {MovieRef} movie - The movie being discussed
 * @property {UserRef} user - The commenting user
 * @property {string} content - Full comment text
 * @property {string} created_at - ISO timestamp or human relative string
 * @property {number} likes_count - Total positive upvotes / hearts
 * @property {number} dislikes_count - Total downvotes
 * @property {number} replies_count - Total replies received
 * @property {number} score - Computed algorithm score: (likes * 2 + replies * 3 - dislikes)
 * @property {'week'|'month'|'all'} period - Time bucket categorization
 * @property {string} [mood] - Emotional impression tag (e.g. '😭 Cảm động', '🤯 Cú twist đỉnh cao', '🔥 Mãn nhãn', '🤣 Cười xỉu')
 * @property {boolean} [is_spoiler=false] - Whether content contains plot reveals
 * @property {ParentCommentRef} [parent_comment] - Populated if this is a reply to another comment
 */

// ============================================================================
// TOP COMMENTS DATA (Curated for Week, Month, All-Time)
// Priority is 'week' by default as requested.
// ============================================================================

export const mockTopCommentsWeek = [
  {
    _id: "comm-w-1",
    movie: {
      _id: "mock-featured-1",
      name: "Dune: Hành Tinh Cát - Phần Hai",
      slug: "dune-hanh-tinh-cat-phan-hai",
      year: 2024,
      poster_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
      rating: 8.8
    },
    user: {
      _id: "usr-101",
      name: "Trần Bảo Long",
      avatar: "",
      badge: "Cinephile 🌟"
    },
    content: "Đoạn Paul Atreides bước lên cồn cát và thuần phục Sâu Cát khổng lồ Shai-Hulud kết hợp với âm nhạc dồn dập của Hans Zimmer làm mình nổi cả da gà. Một tác phẩm xứng tầm sử thi điện ảnh thời đại mới!",
    created_at: "Hôm qua",
    likes_count: 342,
    dislikes_count: 4,
    replies_count: 48,
    score: 824,
    period: "week",
    mood: "🔥 Mãn nhãn tuyệt đối",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-w-2",
    movie: {
      _id: "mock-anime-1",
      name: "Khóa Chặt Cửa Nào Suzume",
      slug: "khoa-chat-cua-nao-suzume",
      year: 2022,
      poster_url: "https://image.tmdb.org/t/p/w500/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
      rating: 8.2
    },
    user: {
      _id: "usr-102",
      name: "Ngọc Mai",
      avatar: "",
      badge: "Anime Critic"
    },
    content: "Ý nghĩa chữa lành vết thương sau thiên tai động đất 2011 được lồng ghép quá tinh tế. Cảnh Suzume đối diện với chính mình năm 4 tuổi làm rạp chiếu hôm đấy ai cũng sụt sùi.",
    created_at: "2 ngày trước",
    likes_count: 289,
    dislikes_count: 2,
    replies_count: 31,
    score: 669,
    period: "week",
    mood: "😭 Cảm động rơi lệ",
    is_spoiler: false,
    parent_comment: {
      _id: "comm-parent-01",
      user_name: "Thế Hùng",
      snippet: "Phim này xem có hay bằng Your Name không bạn...",
      is_icon_only: false
    }
  },
  {
    _id: "comm-w-3",
    movie: {
      _id: "mock-anime-6",
      name: "Arcane: Liên Minh Huyền Thoại",
      slug: "arcane-lien-minh-huyen-thoai",
      year: 2024,
      poster_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      rating: 9.0
    },
    user: {
      _id: "usr-103",
      name: "Đặng Quang Huy",
      avatar: "",
      badge: "VIP Khán Giả"
    },
    content: "Từng khung hình đẹp như tranh vẽ sơn dầu chuyển động. Diễn biến tâm lý nhân vật Jinx đau đớn và giằng xé tột cùng, không có đúng sai tuyệt đối, chỉ có những bi kịch không lối thoát.",
    created_at: "3 ngày trước",
    likes_count: 254,
    dislikes_count: 5,
    replies_count: 27,
    score: 584,
    period: "week",
    mood: "🤯 Cú twist đỉnh cao",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-w-4",
    movie: {
      _id: "mock-anime-2",
      name: "Spider-Man: Du Hành Vũ Trụ Nhện",
      slug: "spider-man-du-hanh-vu-tru-nhen",
      year: 2023,
      poster_url: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg",
      rating: 8.7
    },
    user: {
      _id: "usr-104",
      name: "Minh Triết",
      avatar: "",
      badge: "Thành Viên"
    },
    content: "Chuẩn luôn bác ơi! Phong cách đồ họa kết hợp giữa comic truyền thống và 3D CGI vượt thời đại, đoạn Miles nhảy khỏi tòa nhà với bản nhạc What's Up Danger đã thành huyền thoại rồi.",
    created_at: "1 ngày trước",
    likes_count: 198,
    dislikes_count: 1,
    replies_count: 19,
    score: 452,
    period: "week",
    mood: "🔥 Phấn khích",
    is_spoiler: false,
    parent_comment: {
      _id: "comm-parent-02",
      user_name: "Tuấn Vũ",
      snippet: "Phần 2 này đồ họa có thực sự đỉnh hơn phần 1...",
      is_icon_only: false
    }
  },
  {
    _id: "comm-w-5",
    movie: {
      _id: "mock-cn-1",
      name: "Khánh Dư Niên - Phần 2",
      slug: "khanh-du-nien-phan-2",
      year: 2024,
      poster_url: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",
      rating: 8.6
    },
    user: {
      _id: "usr-105",
      name: "Thanh Hằng",
      avatar: "",
      badge: "Mê Phim Bộ"
    },
    content: "Đấu trí cung đình nghẹt thở từng phút. Phạm Nhàn vẫn giữ được nét dí dỏm thông minh đặc trưng, kịch bản gãy gọn không hề bị đuối so với phần 1.",
    created_at: "4 ngày trước",
    likes_count: 182,
    dislikes_count: 3,
    replies_count: 22,
    score: 427,
    period: "week",
    mood: "🧠 Đấu trí xuất sắc",
    is_spoiler: false,
    parent_comment: {
      _id: "comm-parent-03",
      user_name: "Hoàng Oanh",
      snippet: "❤️🔥👏",
      is_icon_only: true
    }
  },
  {
    _id: "comm-w-6",
    movie: {
      _id: "mock-kr-1",
      name: "Nữ Hoàng Nước Mắt",
      slug: "nu-hoang-nuoc-mat",
      year: 2024,
      poster_url: "https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
      rating: 8.7
    },
    user: {
      _id: "usr-106",
      name: "Khánh Linh",
      avatar: "",
      badge: "K-Drama Fan"
    },
    content: "Kim Soo Hyun và Kim Ji Won diễn xuất ăn ý đến từng ánh mắt. Vừa hài hước vừa lấy đi cả lít nước mắt của khán giả, xứng đáng là drama Hàn hot nhất năm!",
    created_at: "5 ngày trước",
    likes_count: 175,
    dislikes_count: 2,
    replies_count: 18,
    score: 402,
    period: "week",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-w-7",
    movie: {
      _id: "mock-anime-7",
      name: "Lâu Đài Bay Của Howl",
      slug: "lau-dai-bay-cua-phap-su-howl",
      year: 2004,
      poster_url: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
      rating: 8.5
    },
    user: {
      _id: "usr-109",
      name: "Phương Linh",
      avatar: "",
      badge: "Ghibli Fan"
    },
    content: "Lâu đài biết đi và chàng Howl đẹp trai phong trần đúng là tuổi thơ của bao nhiêu thế hệ khán giả.",
    created_at: "5 ngày trước",
    likes_count: 168,
    dislikes_count: 1,
    replies_count: 14,
    score: 377,
    period: "week",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-w-8",
    movie: {
      _id: "mock-anime-8",
      name: "Chú Thuật Hồi Chiến 0",
      slug: "chu-thuat-hoi-chien-0",
      year: 2021,
      poster_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      rating: 8.3
    },
    user: {
      _id: "usr-110",
      name: "Tiến Dũng",
      avatar: "",
      badge: "Anime Fan"
    },
    content: "Pha combat cuối giữa Yuta và Geto được MAPPA vẽ lực và mãn nhãn kinh khủng khiếp!",
    created_at: "6 ngày trước",
    likes_count: 154,
    dislikes_count: 2,
    replies_count: 16,
    score: 354,
    period: "week",
    is_spoiler: false,
    parent_comment: {
      _id: "comm-parent-04",
      user_name: "Gojo Satoru",
      snippet: "Phim này xem có cần coi season 1 trước không...",
      is_icon_only: false
    }
  },
  {
    _id: "comm-w-9",
    movie: {
      _id: "mock-anime-9",
      name: "Đại Chiến Titan: Phần Cuối",
      slug: "dai-chien-titan-phan-cuoi",
      year: 2023,
      poster_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
      rating: 9.1
    },
    user: {
      _id: "usr-111",
      name: "Hữu Toàn",
      avatar: "",
      badge: "Cinephile"
    },
    content: "Cái kết tuy đau lòng nhưng phản ánh quá chân thực bản chất vòng lặp xung đột của loài người.",
    created_at: "6 ngày trước",
    likes_count: 142,
    dislikes_count: 4,
    replies_count: 19,
    score: 337,
    period: "week",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-w-10",
    movie: {
      _id: "mock-anime-10",
      name: "Thiếu Niên Và Chim Diệc",
      slug: "thieu-nien-va-chim-diec",
      year: 2023,
      poster_url: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
      rating: 8.1
    },
    user: {
      _id: "usr-112",
      name: "Thùy Chi",
      avatar: "",
      badge: "Reviewer"
    },
    content: "Tác phẩm ẩn chứa nhiều tầng triết lý nhân sinh của Hayao Miyazaki, càng xem lại càng thấy thấm thía.",
    created_at: "7 ngày trước",
    likes_count: 136,
    dislikes_count: 1,
    replies_count: 11,
    score: 304,
    period: "week",
    is_spoiler: false,
    parent_comment: null
  }
];

export const mockTopCommentsMonth = [
  ...mockTopCommentsWeek.slice(0, 5),
  {
    _id: "comm-m-1",
    movie: {
      _id: "mock-anime-4",
      name: "Tên Cậu Là Gì? (Your Name)",
      slug: "ten-cau-la-gi-your-name",
      year: 2016,
      poster_url: "https://image.tmdb.org/t/p/w500/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
      rating: 8.4
    },
    user: {
      _id: "usr-107",
      name: "Vũ Tuấn Anh",
      avatar: "",
      badge: "Huyền Thoại 🏆"
    },
    content: "Xem lại lần thứ 5 vẫn thổn thức như lần đầu tiên. Khoảnh khắc hai người lướt qua nhau trên bậc thang thật đẹp.",
    created_at: "2 tuần trước",
    likes_count: 512,
    dislikes_count: 3,
    replies_count: 64,
    score: 1213,
    period: "month",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-m-2",
    movie: {
      _id: "mock-anime-3",
      name: "Thanh Gươm Diệt Quỷ",
      slug: "thanh-guom-diet-quy-chuyen-tau-vo-tan",
      year: 2020,
      poster_url: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
      rating: 8.2
    },
    user: {
      _id: "usr-108",
      name: "Lê Hoàng Phúc",
      avatar: "",
      badge: "Cinephile"
    },
    content: "Viêm Trụ Rengoku: 'Hãy ngẩng cao đầu mà sống, dẫu trái tim có vỡ vụn'. Trận chiến Akaza vs Rengoku quá tuyệt vời.",
    created_at: "3 tuần trước",
    likes_count: 489,
    dislikes_count: 6,
    replies_count: 52,
    score: 1128,
    period: "month",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-m-3",
    movie: {
      _id: "mock-anime-11",
      name: "Đảo Hải Tặc: Phim Red",
      slug: "dao-hai-tac-phim-red",
      year: 2022,
      poster_url: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      thumb_url: "https://image.tmdb.org/t/p/original/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg",
      rating: 8.0
    },
    user: {
      _id: "usr-113",
      name: "Gia Bảo",
      avatar: "",
      badge: "One Piece Fan"
    },
    content: "Giọng ca của Ado gánh còng lưng cả bộ phim, nghe nhạc mà nổi hết cả gai ốc trong rạp.",
    created_at: "3 tuần trước",
    likes_count: 420,
    dislikes_count: 5,
    replies_count: 38,
    score: 949,
    period: "month",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-m-4",
    movie: {
      _id: "mock-anime-12",
      name: "Đứa Con Của Thời Tiết",
      slug: "dua-con-cua-thoi-tiet",
      year: 2019,
      poster_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      rating: 8.2
    },
    user: {
      _id: "usr-114",
      name: "Hải Yến",
      avatar: "",
      badge: "Shinkai Fan"
    },
    content: "Hình ảnh mưa rơi trên bầu trời Tokyo đẹp đến ngỡ ngàng, cái kết can đảm chọn người mình yêu hơn thế giới.",
    created_at: "4 tuần trước",
    likes_count: 395,
    dislikes_count: 3,
    replies_count: 34,
    score: 889,
    period: "month",
    is_spoiler: false,
    parent_comment: null
  },
  {
    _id: "comm-m-5",
    movie: {
      _id: "mock-anime-5",
      name: "Vùng Đất Linh Hồn",
      slug: "vung-dat-linh-hon",
      year: 2001,
      poster_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      thumb_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      rating: 8.6
    },
    user: {
      _id: "usr-115",
      name: "Thành Đạt",
      avatar: "",
      badge: "Huyền Thoại 🏆"
    },
    content: "Mỗi độ tuổi xem Spirited Away lại cho một cảm giác khác biệt, một tuyệt tác không tuổi của điện ảnh thế giới.",
    created_at: "1 tháng trước",
    likes_count: 670,
    dislikes_count: 2,
    replies_count: 75,
    score: 1563,
    period: "month",
    is_spoiler: false,
    parent_comment: null
  }
];

export const mockTopCommentsAll = [
  ...mockTopCommentsMonth.slice(2, 5),
  ...mockTopCommentsMonth.slice(0, 4),
  ...mockTopCommentsWeek.slice(0, 3)
];

// ============================================================================
// LIVE BUZZ STREAM DATA (Realtime Marquee Ticker)
// Simulates concurrent audience reactions across trending movies.
// ============================================================================

export const mockLiveBuzzComments = [
  {
    _id: "buzz-1",
    movie_name: "Dune: Phần Hai",
    movie_slug: "dune-hanh-tinh-cat-phan-hai",
    poster_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    user_name: "Hoàng Nam",
    time_ago: "1 phút trước",
    snippet: "Đoạn solo của Timothée Chalamet diễn xuất thần thái ma mị ghê gớm!"
  },
  {
    _id: "buzz-2",
    movie_name: "Arcane Season 2",
    movie_slug: "arcane-lien-minh-huyen-thoai",
    poster_url: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    user_name: "Thùy Trang",
    time_ago: "3 phút trước",
    snippet: "Ai nghe OST bài mới của Ashnikko chưa, nổi hết cả da gà luôn ạ 🎧"
  },
  {
    _id: "buzz-3",
    movie_name: "Khóa Chặt Cửa Nào Suzume",
    movie_slug: "khoa-chat-cua-nao-suzume",
    poster_url: "https://image.tmdb.org/t/p/w500/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
    user_name: "Bảo Trâm",
    time_ago: "5 phút trước",
    snippet: "Chú mèo Souta biến thành cái ghế cưng xỉu, muốn nuôi một con ghê 😻"
  },
  {
    _id: "buzz-4",
    movie_name: "Spider-Man: Across the Spider-Verse",
    movie_slug: "spider-man-du-hanh-vu-tru-nhen",
    poster_url: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    user_name: "Minh Khang",
    time_ago: "7 phút trước",
    snippet: "Phần này xem lại trên TV 4K màn OLED màu sắc phê không tả nổi."
  },
  {
    _id: "buzz-5",
    movie_name: "Đại Chiến Titan: Phần Cuối",
    movie_slug: "dai-chien-titan-phan-cuoi",
    poster_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    user_name: "Tuấn Kiệt",
    time_ago: "9 phút trước",
    snippet: "Lời tạm biệt trọn vẹn cho tuổi thơ 10 năm theo dõi Eren và Mikasa."
  },
  {
    _id: "buzz-6",
    movie_name: "Nữ Hoàng Nước Mắt",
    movie_slug: "nu-hoang-nuoc-mat",
    poster_url: "https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg",
    user_name: "Thanh Thảo",
    time_ago: "12 phút trước",
    snippet: "Tập 10 vừa khóc vừa cười với ông luật sư Baek Hyun Woo 😂"
  },
  {
    _id: "buzz-7",
    movie_name: "Lâu Đài Bay Của Pháp Sư Howl",
    movie_slug: "lau-dai-bay-cua-phap-su-howl",
    poster_url: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    user_name: "Quỳnh Nga",
    time_ago: "15 phút trước",
    snippet: "Nhạc nền Merry-Go-Round of Life nghe đi nghe lại hàng trăm lần vẫn mê."
  },
  {
    _id: "buzz-8",
    movie_name: "Khánh Dư Niên 2",
    movie_slug: "khanh-du-nien-phan-2",
    poster_url: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    user_name: "Đức Thịnh",
    time_ago: "18 phút trước",
    snippet: "Trận so tài khẩu chiến triều đình đỉnh chóp, đúng chuẩn siêu phẩm cổ trang."
  }
];
