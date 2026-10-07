/**
 * @file addMovieConfig.ts
 * @description Centralized configurations, taxonomy presets, UI dictionary/i18n, and quick-pick options for Movie Creation.
 * All steps, button labels, step navigation, validation rules, year stepper numbers, and dropdown sizes are configured here.
 */

export interface MovieTypeOption {
  value: 'single' | 'series';
  label: string;
  badge: string;
  desc: string;
}

export interface MovieStatusOption {
  value: 'completed' | 'ongoing' | 'trailer';
  label: string;
  badge: string;
}

export interface SelectOption {
  value: string;
  label: string;
  desc?: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CountryOption {
  id: string;
  name: string;
}

// 1. Year Stepper Settings
export const YEAR_STEPPER_CONFIG = {
  quickSteps: [-5, -1, 1, 5],
  minYear: 1920,
  maxYear: 2035,
  defaultYear: new Date().getFullYear()
};

// 2. Validation Rules Configuration
export const FORM_VALIDATION_CONFIG = {
  name: { required: true, minLength: 2 },
  slug: { required: true },
  content: { required: true, minLength: 10 },
  poster: { required: true },
  category: { required: true, minCount: 1 },
  country: { required: true, minCount: 1 }
};

// 3. UI Box Limits Configuration (Dropdown & Scroll sizes)
export const UI_LIMITS_CONFIG = {
  maxCategoryHeight: 115,
  maxCountryHeight: 95,
  maxTagBoxHeight: 68,
  maxDropdownItems: 8,
  maxEpisodesScrollHeight: 260
};

// 4. Movie Types
export const MOVIE_TYPES: MovieTypeOption[] = [
  { value: 'single', label: 'Phim lẻ (Movie)', badge: 'Phim lẻ', desc: '1 tập duy nhất' },
  { value: 'series', label: 'Phim bộ (Series)', badge: 'Phim bộ', desc: 'Nhiều tập liên tục' }
];

// 5. Movie Statuses
export const MOVIE_STATUSES: MovieStatusOption[] = [
  { value: 'completed', label: 'Hoàn tất', badge: 'Full' },
  { value: 'ongoing', label: 'Đang chiếu', badge: 'Tập mới' },
  { value: 'trailer', label: 'Sắp chiếu / Trailer', badge: 'Trailer' }
];

// 6. Movie Qualities
export const MOVIE_QUALITIES: SelectOption[] = [
  { value: '4K Ultra HD', label: '4K Ultra HD', desc: 'Độ phân giải 2160p siêu nét' },
  { value: 'FHD', label: 'Full HD 1080p', desc: 'Độ nét cao tiêu chuẩn' },
  { value: 'HD', label: 'HD 720p', desc: 'Tiết kiệm băng thông' },
  { value: 'CAM', label: 'Bản CAM / Rạp', desc: 'Bản quay sớm từ rạp' }
];

// 7. Movie Audio / Subtitle Languages
export const MOVIE_LANGUAGES: SelectOption[] = [
  { value: 'Vietsub', label: 'Phụ đề Vietsub' },
  { value: 'Thuyết Minh', label: 'Thuyết Minh Tiếng Việt' },
  { value: 'Lồng Tiếng', label: 'Lồng Tiếng Tiếng Việt' },
  { value: 'Vietsub + Thuyết Minh', label: 'Vietsub + Thuyết Minh' },
  { value: 'Nguyên Bản (Raw)', label: 'Nguyên Bản (Raw / Không Sub)' }
];

// 8. Preset Durations & Episodes
export const DURATION_OPTIONS: SelectOption[] = [
  { value: '90 phút', label: '90 phút' },
  { value: '100 phút', label: '100 phút' },
  { value: '110 phút', label: '110 phút' },
  { value: '120 phút', label: '120 phút' },
  { value: '135 phút', label: '135 phút' },
  { value: '150 phút', label: '150 phút' },
  { value: '180 phút', label: '180 phút (3 tiếng)' },
  { value: '45 phút/tập', label: '45 phút/tập' },
  { value: '60 phút/tập', label: '60 phút/tập' }
];

export const EPISODE_CURRENT_OPTIONS: SelectOption[] = [
  { value: 'Full', label: 'Full (Trọn bộ)' },
  { value: 'Tập 1', label: 'Tập 1' },
  { value: 'Tập 6', label: 'Tập 6' },
  { value: 'Tập 12', label: 'Tập 12' },
  { value: 'Tập 16', label: 'Tập 16' },
  { value: 'Tập 24', label: 'Tập 24' },
  { value: 'Đang cập nhật', label: 'Đang cập nhật' }
];

export const EPISODE_TOTAL_OPTIONS: SelectOption[] = [
  { value: '1 Tập', label: '1 Tập (Phim lẻ)' },
  { value: '8 Tập', label: '8 Tập' },
  { value: '12 Tập', label: '12 Tập' },
  { value: '16 Tập', label: '16 Tập' },
  { value: '24 Tập', label: '24 Tập' },
  { value: '32 Tập', label: '32 Tập' },
  { value: '40 Tập', label: '40 Tập' },
  { value: 'Full', label: 'Full' }
];

// 9. Preset Categories / Genres
export const PRESET_CATEGORIES: CategoryOption[] = [
  { id: 'hanh-dong', name: 'Hành Động' },
  { id: 'phieu-luu', name: 'Phiêu Lưu' },
  { id: 'hoat-hinh', name: 'Hoạt Hình' },
  { id: 'hai-huoc', name: 'Hài Hước' },
  { id: 'hinh-su', name: 'Hình Sự' },
  { id: 'tai-lieu', name: 'Tài Liệu' },
  { id: 'chinh-kich', name: 'Chính Kịch' },
  { id: 'gia-dinh', name: 'Gia Đình' },
  { id: 'gia-tuong', name: 'Giả Tưởng' },
  { id: 'lich-su', name: 'Lịch Sử' },
  { id: 'kinh-di', name: 'Kinh Dị' },
  { id: 'bi-an', name: 'Bí Ẩn' },
  { id: 'lang-man', name: 'Lãng Mạn' },
  { id: 'khoa-hoc-vien-tuong', name: 'Khoa Học Viễn Tưởng' },
  { id: 'giat-gan', name: 'Giật Gân' },
  { id: 'chien-tranh', name: 'Chiến Tranh' },
  { id: 'vo-thuat', name: 'Võ Thuật' },
  { id: 'co-trang', name: 'Cổ Trang' },
  { id: 'hoc-duong', name: 'Học Đường' },
  { id: 'am-nhac', name: 'Âm Nhạc' },
  { id: 'tam-ly', name: 'Tâm Lý' },
  { id: 'the-thao', name: 'Thể Thao' }
];

// 10. Preset Countries
export const PRESET_COUNTRIES: CountryOption[] = [
  { id: 'viet-nam', name: 'Việt Nam' },
  { id: 'han-quoc', name: 'Hàn Quốc' },
  { id: 'trung-quoc', name: 'Trung Quốc' },
  { id: 'au-my', name: 'Âu Mỹ (Hollywood)' },
  { id: 'nhat-ban', name: 'Nhật Bản' },
  { id: 'thai-lan', name: 'Thái Lan' },
  { id: 'an-do', name: 'Ấn Độ' },
  { id: 'hong-kong', name: 'Hồng Kông' },
  { id: 'dai-loan', name: 'Đài Loan' },
  { id: 'anh', name: 'Anh Quốc' },
  { id: 'phap', name: 'Pháp' },
  { id: 'tay-ban-nha', name: 'Tây Ban Nha' }
];

// 11. Popular Directors (Autocomplete pool)
export const POPULAR_DIRECTORS: string[] = [
  'Christopher Nolan',
  'Denis Villeneuve',
  'James Cameron',
  'Quentin Tarantino',
  'David Fincher',
  'Bong Joon-ho',
  'Trấn Thành',
  'Victor Vũ',
  'Lý Hải',
  'Nguyễn Quang Dũng',
  'Makoto Shinkai',
  'Hayao Miyazaki'
];

// 12. Popular Actors (Autocomplete pool)
export const POPULAR_ACTORS: string[] = [
  'Cillian Murphy',
  'Robert Downey Jr.',
  'Leonardo DiCaprio',
  'Tom Cruise',
  'Timothée Chalamet',
  'Zendaya',
  'Florence Pugh',
  'Song Kang-ho',
  'Trấn Thành',
  'Tuấn Trần',
  'Ninh Dương Lan Ngọc',
  'Kaity Nguyễn',
  'Thái Hòa',
  'Phương Anh Đào',
  'Song Joong-ki',
  'IU (Lee Ji-eun)'
];

// 13. Server Name Templates
export const SERVER_TEMPLATES: string[] = [
  'Vietsub #1 (VIP 4K)',
  'Thuyết Minh #1 (VIP)',
  'Lồng Tiếng #1',
  'Dự Phòng #1 (HLS Fast)',
  'Server Dự Phòng #2'
];

// 14. Demo Presets
export const DEMO_PRESETS = [
  {
    key: 'oppenheimer',
    title: 'Oppenheimer (Bom tấn)',
    data: {
      name: 'Oppenheimer: Kẻ Chế Tạo Bom Nguyên Tử',
      originName: 'Oppenheimer',
      slug: 'oppenheimer-ke-che-tao-bom-nguyen-tu',
      year: 2023,
      type: 'single' as const,
      status: 'completed' as const,
      quality: '4K Ultra HD',
      lang: 'Vietsub + Thuyết Minh',
      time: '180 phút',
      episodeCurrent: 'Full',
      episodeTotal: '1 Tập',
      thumbUrl: 'https://image.tmdb.org/t/p/w1280/rLb2cw69QBHgFDWcl0zKyfEaY2K.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      content: 'Bộ phim kể về cuộc đời và sự nghiệp của nhà vật lý lý thuyết J. Robert Oppenheimer, người được mệnh danh là "cha đẻ của bom nguyên tử", cùng những mâu thuẫn nội tâm sâu sắc trong dự án Manhattan làm thay đổi tiến trình lịch sử nhân loại.',
      selectedCategories: ['chinh-kich', 'lich-su', 'chien-tranh'],
      selectedCountries: ['au-my'],
      directors: ['Christopher Nolan'],
      actors: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
      chieuRap: true,
      isCopyright: true,
      subDocQuyen: false,
      tmdbId: '872585',
      voteAverage: 8.9,
      voteCount: 8420,
      notify: 'Bản 4K Ultra HD Vietsub chuẩn rạp',
      showtimes: 'Đã khởi chiếu trọn bộ tại rạp',
      servers: [
        {
          server_name: 'Vietsub #1 (VIP 4K)',
          server_data: [
            {
              name: 'Bản Đầy Đủ (Full)',
              slug: 'full',
              filename: 'oppenheimer-full',
              link_embed: 'https://player.phimapi.com/player/?url=https://s1.phimapi.com/oppenheimer-sample.m3u8',
              link_m3u8: 'https://s1.phimapi.com/oppenheimer-sample.m3u8'
            }
          ]
        }
      ]
    }
  },
  {
    key: 'dune2',
    title: 'Dune: Part Two (Khoa học viễn tưởng)',
    data: {
      name: 'Hành Tinh Cát: Phần Hai',
      originName: 'Dune: Part Two',
      slug: 'hanh-tinh-cat-phan-hai',
      year: 2024,
      type: 'single' as const,
      status: 'completed' as const,
      quality: '4K Ultra HD',
      lang: 'Vietsub',
      time: '166 phút',
      episodeCurrent: 'Full',
      episodeTotal: '1 Tập',
      thumbUrl: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520b22.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w780/czembW0Rk1Ke7lCJGhkAiBhQ9la.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      content: 'Paul Atreides hợp nhất với Chani và tộc Fremen khi đang trên con đường trả thù những kẻ chủ mưu đã tiêu diệt gia tộc mình. Đối mặt với lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ, Paul cố gắng ngăn chặn một tương lai đen tối.',
      selectedCategories: ['khoa-hoc-vien-tuong', 'phieu-luu', 'hanh-dong'],
      selectedCountries: ['au-my'],
      directors: ['Denis Villeneuve'],
      actors: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
      chieuRap: true,
      isCopyright: true,
      subDocQuyen: true,
      tmdbId: '693134',
      voteAverage: 8.7,
      voteCount: 5600,
      notify: 'Bản đẹp sắc nét Full HD Vietsub',
      showtimes: 'Đã khởi chiếu trọn bộ tại rạp',
      servers: [
        {
          server_name: 'Vietsub #1 (VIP 4K)',
          server_data: [
            {
              name: 'Bản Đầy Đủ (Full)',
              slug: 'full',
              filename: 'dune-2-full',
              link_embed: 'https://player.phimapi.com/player/?url=https://s1.phimapi.com/dune2-sample.m3u8',
              link_m3u8: 'https://s1.phimapi.com/dune2-sample.m3u8'
            }
          ]
        }
      ]
    }
  }
];

// 15. Complete UI Language Dictionary / I18n Configuration
export const MOVIE_FORM_I18N = {
  header: {
    title: 'Thêm Phim Mới',
    backToList: 'Danh sách phim',
    demoDropdown: 'Mẫu phim nhanh',
    saveTop: 'Lưu phim ngay'
  },
  steps: [
    { num: 1, shortTitle: 'Cơ bản', fullTitle: 'Nhận diện & Định dạng phim', desc: 'Tên, năm, chất lượng' },
    { num: 2, shortTitle: 'Phân loại', fullTitle: 'Thể loại, Quốc gia & Đoàn làm phim', desc: 'Thể loại, diễn viên' },
    { num: 3, shortTitle: 'Media', fullTitle: 'Hình ảnh Poster, Backdrop & Trailer', desc: 'Poster, trailer' },
    { num: 4, shortTitle: 'Nguồn phát', fullTitle: 'Máy chủ & Nguồn phát các tập', desc: 'Server, link tập' },
    { num: 5, shortTitle: 'Xuất bản', fullTitle: 'Nội dung tóm tắt & Xuất bản', desc: 'Tóm tắt, TMDB' }
  ],
  step1: {
    sectionIdentity: 'Nhận diện & Đường dẫn',
    sectionFormat: 'Định dạng & Trạng thái phát hành',
    sectionSpecs: 'Thông số kỹ thuật & Tập phim',
    nameVi: 'Tên phim (Tiếng Việt)',
    nameViPlaceholder: 'Ví dụ: Đất Rừng Phương Nam, Oppenheimer...',
    originName: 'Tên gốc (Tiếng Anh/Bản địa)',
    originNamePlaceholder: 'Ví dụ: Oppenheimer, Dune: Part Two...',
    slug: 'Đường dẫn tĩnh (Slug URL)',
    slugPlaceholder: 'duong-dan-phim',
    regenSlug: 'Tạo lại',
    releaseYear: 'Năm phát hành',
    format: 'Định dạng phim',
    status: 'Trạng thái phát hành',
    quality: 'Chất lượng',
    language: 'Ngôn ngữ',
    duration: 'Thời lượng',
    totalEpisodes: 'Tổng số tập'
  },
  step2: {
    categoryLabel: 'Thể loại phim',
    categorySearchPlaceholder: 'Lọc thể loại...',
    addCategoryPlaceholder: 'Thêm thể loại khác...',
    countryLabel: 'Quốc gia sản xuất',
    addCountryPlaceholder: 'Thêm quốc gia khác...',
    directorLabel: 'Đạo diễn',
    directorPlaceholder: 'Gõ hoặc chọn đạo diễn...',
    actorLabel: 'Diễn viên chính',
    actorPlaceholder: 'Gõ hoặc chọn diễn viên...',
    addBtn: 'Thêm'
  },
  step3: {
    posterLabel: 'Áp phích (Poster dọc 2:3)',
    posterPlaceholder: 'https://image.tmdb.org/t/p/w780/poster.jpg',
    backdropLabel: 'Ảnh bìa ngang (Backdrop 16:9)',
    backdropPlaceholder: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
    trailerLabel: 'Link Video Trailer (YouTube)',
    trailerPlaceholder: 'https://www.youtube.com/watch?v=...',
    previewTitle: 'Xem trước hình ảnh',
    sample1: 'Mẫu Oppenheimer',
    sample2: 'Mẫu Dune 2'
  },
  step4: {
    title: 'Máy chủ & Nguồn phát các tập phim',
    addServerLabel: 'Thêm máy chủ nhanh:',
    addEpisodeBtn: 'Thêm tập',
    epNamePlaceholder: 'Tên tập',
    embedPlaceholder: 'Link Embed (https://...)',
    m3u8Placeholder: 'Luồng HLS m3u8 (https://...)'
  },
  step5: {
    synopsisLabel: 'Nội dung tóm tắt phim',
    synopsisPlaceholder: 'Nhập nội dung tóm tắt cốt truyện hấp dẫn của bộ phim...',
    noticeLabel: 'Thông báo / Ghi chú đặc biệt',
    noticePlaceholder: 'Ví dụ: Bản đẹp HD Vietsub...',
    showtimesLabel: 'Lịch chiếu phim',
    showtimesPlaceholder: 'Ví dụ: 20:00 Thứ 7 & CN hàng tuần...',
    flagChieuRap: 'Phim Chiếu Rạp',
    flagCopyright: 'Bản Quyền Đã Xác Minh',
    flagExclusive: 'Phụ Đề Độc Quyền',
    tmdbTitle: 'Điểm số & TMDB',
    tmdbIdLabel: 'TMDB Movie ID',
    voteAvgLabel: 'Điểm (0-10)',
    voteCountLabel: 'Lượt đánh giá',
    simulatorTitle: 'Mô phỏng hiển thị Web'
  },
  actions: {
    prev: 'Quay lại',
    next: 'Tiếp theo',
    cancel: 'Hủy bỏ',
    publish: 'Xuất bản & Lưu phim',
    saving: 'Đang lưu...'
  },
  validation: {
    nameRequired: 'Vui lòng nhập tên phim (Tiếng Việt)',
    slugRequired: 'Slug URL không được để trống',
    contentRequired: 'Vui lòng nhập nội dung tóm tắt phim',
    posterRequired: 'Vui lòng cung cấp URL áp phích (Poster)',
    categoryRequired: 'Chọn ít nhất 1 thể loại',
    countryRequired: 'Chọn ít nhất 1 quốc gia',
    minServersRequired: 'Phải có ít nhất 1 máy chủ phát phim',
    fillRequiredPrompt: 'Vui lòng hoàn tất các mục bắt buộc trước khi lưu!'
  }
};
