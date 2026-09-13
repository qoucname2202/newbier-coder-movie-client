// Mock data phim phục vụ hiển thị fallback khi API backend chưa sẵn sàng

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
  backdrop_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
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

export const mockMovies = [
  mockFeaturedMovie,
  {
    _id: "mock-2",
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
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/uYPbbksJxIg" }]
      }
    ]
  },
  {
    _id: "mock-3",
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
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/cqGjhVJWtEg" }]
      }
    ]
  },
  {
    _id: "mock-4",
    name: "Avatar: Dòng Chảy Của Nước",
    origin_name: "Avatar: The Way of Water",
    slug: "avatar-dong-chay-cua-nuoc",
    year: 2022,
    quality: "4K",
    lang: "Thuyết minh",
    type: "single",
    episode_current: "Full",
    time: "192 phút",
    rating: 7.8,
    view: 154000,
    content: "Jake Sully và Neytiri đã xây dựng một gia đình và làm mọi cách để bảo vệ tổ ấm khi mối đe dọa từ Trái Đất quay trở lại Pandora.",
    poster_url: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
    category: [{ name: "Hành Động", slug: "hanh-dong" }, { name: "Phiêu Lưu", slug: "phieu-luu" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/d9MyW72ELq0" }]
      }
    ]
  },
  {
    _id: "mock-5",
    name: "Kỵ Sĩ Bóng Đêm",
    origin_name: "The Dark Knight",
    slug: "ky-si-bong-dem",
    year: 2008,
    quality: "4K",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "152 phút",
    rating: 9.0,
    view: 210000,
    content: "Batman phải đối mặt với kẻ thù nguy hiểm nhất từ trước đến nay - Joker, kẻ muốn nhấn chìm Gotham vào sự hỗn loạn.",
    poster_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1rsqRqqYIKHH2.jpg",
    category: [{ name: "Hành Động", slug: "hanh-dong" }, { name: "Tội Phạm", slug: "toi-pham" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/EXeTwQWrcwY" }]
      }
    ]
  },
  {
    _id: "mock-6",
    name: "Interstellar: Hố Đen Tử Thần",
    origin_name: "Interstellar",
    slug: "interstellar-ho-den-tu-than",
    year: 2014,
    quality: "4K",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "169 phút",
    rating: 8.7,
    view: 185000,
    content: "Một nhóm thám hiểm du hành qua lỗ sâu trong không gian nhằm tìm kiếm hành tinh mới cho nhân loại khi Trái Đất sắp bị diệt vong.",
    poster_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    category: [{ name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/zSWdZVtXT7E" }]
      }
    ]
  },
  {
    _id: "mock-7",
    name: "Trò Chơi Vương Quyền",
    origin_name: "Game of Thrones",
    slug: "tro-choi-vuong-quyen",
    year: 2019,
    quality: "HD",
    lang: "Vietsub",
    type: "series",
    episode_current: "Tập 73/73",
    time: "60 phút/tập",
    rating: 9.2,
    view: 320000,
    content: "Chín gia tộc quý tộc chiến đấu để giành quyền kiểm soát vùng đất Westeros huyền thoại, trong khi một kẻ thù cổ xưa trở lại sau hàng ngàn năm ngủ yên.",
    poster_url: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
    category: [{ name: "Phim Bộ", slug: "phim-bo" }, { name: "Giả Tưởng", slug: "gia-tuong" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "https://www.youtube.com/embed/KPLWWIOCOOQ" }]
      }
    ]
  },
  {
    _id: "mock-8",
    name: "Cậu Bé Mất Tích",
    origin_name: "Stranger Things",
    slug: "cau-be-mat-tich",
    year: 2022,
    quality: "4K",
    lang: "Vietsub",
    type: "series",
    episode_current: "Tập 34/34",
    time: "50 phút/tập",
    rating: 8.7,
    view: 245000,
    content: "Khi một cậu bé biến mất bí ẩn, thị trấn nhỏ phát hiện ra một bí mật liên quan đến các thí nghiệm bí mật, lực lượng siêu nhiên đáng sợ và một cô bé kỳ lạ.",
    poster_url: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    category: [{ name: "Phim Bộ", slug: "phim-bo" }, { name: "Bí Ẩn", slug: "bi-an" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Tập 1", slug: "tap-1", link_embed: "https://www.youtube.com/embed/b9EkMc79ZSU" }]
      }
    ]
  },
  {
    _id: "mock-9",
    name: "Deadpool & Wolverine",
    origin_name: "Deadpool & Wolverine",
    slug: "deadpool-and-wolverine",
    year: 2024,
    quality: "4K",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "128 phút",
    rating: 8.0,
    view: 165000,
    content: "Wolverine đang hồi phục chấn thương khi tình cờ gặp gỡ gã lắm mồm Deadpool. Cả hai cùng hợp sức đánh bại kẻ thù chung.",
    poster_url: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/yDHYTjA3R0ne82ismFR4nnW3Bm5.jpg",
    category: [{ name: "Hành Động", slug: "hanh-dong" }, { name: "Hài Hước", slug: "hai-huoc" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/73_1biulkYk" }]
      }
    ]
  },
  {
    _id: "mock-10",
    name: "Hành Tinh Khỉ: Vương Quốc Mới",
    origin_name: "Kingdom of the Planet of the Apes",
    slug: "hanh-tinh-khi-vuong-quoc-moi",
    year: 2024,
    quality: "HD",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "145 phút",
    rating: 7.2,
    view: 78000,
    content: "Nhiều năm sau triều đại của Caesar, một chú khỉ trẻ bắt đầu cuộc hành trình sẽ khiến nó đặt câu hỏi về mọi điều đã được dạy về quá khứ.",
    poster_url: "https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/fqvXv6q9quHIapDMURdwZ76C29O.jpg",
    category: [{ name: "Hành Động", slug: "hanh-dong" }, { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" }],
    country: [{ name: "Mỹ", slug: "my" }],
    episodes: [
      {
        server_name: "Vietsub #1",
        server_data: [{ name: "Full", slug: "full", link_embed: "https://www.youtube.com/embed/Kdr5oedn7q8" }]
      }
    ]
  }
];

export const mockKoreanMovies = [
  {
    _id: "mock-kr-1",
    name: "Ký Sinh Trùng",
    origin_name: "Parasite",
    slug: "ky-sinh-trung",
    year: 2019,
    quality: "4K",
    lang: "Vietsub",
    type: "single",
    episode_current: "Full",
    time: "132 phút",
    rating: 8.5,
    view: 198000,
    content: "Gia đình họ Kim thất nghiệp lập mưu để từng thành viên được tuyển dụng vào làm việc cho gia đình họ Park giàu có.",
    poster_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    country: [{ name: "Hàn Quốc", slug: "han-quoc" }],
    category: [{ name: "Tâm Lý", slug: "tam-ly" }],
    episodes: [{ server_name: "Server 1", server_data: [{ name: "Full", slug: "full", link_embed: "" }] }]
  },
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
    view: 350000,
    content: "Hàng trăm người chơi kẹt tiền chấp nhận một lời mời kỳ lạ để thi đấu trong các trò chơi trẻ em với phần thưởng khổng lồ.",
    poster_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    thumb_url: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    country: [{ name: "Hàn Quốc", slug: "han-quoc" }],
    category: [{ name: "Hồi Hộp", slug: "hoi-hop" }],
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

