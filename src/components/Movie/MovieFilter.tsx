import React, { useState, useCallback, useMemo } from 'react';
import { FaFilter, FaSearch, FaArrowRight, FaCaretDown, FaCaretUp, FaThLarge, FaSlidersH } from 'react-icons/fa';
import styles from '@/styles/MovieFilter.module.css';
import { showCinemaAlert } from '@/components/UI/CinemaAlert';

export interface MovieFilterState {
  status: string;           // 'all' | 'Sắp chiếu' | 'Đang chiếu' | 'Trọn bộ'
  format: string;           // 'all' | 'Chiếu Rạp'
  country: string;          // 'all' | 'Âu Mỹ' | 'Hàn Quốc' ... (hoặc string[])
  type: string;             // 'all' | 'Phim lẻ' | 'Phim bộ'
  ageRating: string;        // 'all' | 'P (Mọi lứa tuổi)' ...
  categories: string[];     // ['all'] hoặc ['Cung Đấu', 'Hành Động'...]
  version: string;          // 'all' | 'Phụ đề' | 'Lồng tiếng' | 'Thuyết minh giọng Bắc' | 'Thuyết minh giọng Nam'
  year: string;             // 'all' | '2026' | '2025' ...
  sort: string;             // 'Mới nhất' | 'Mới cập nhật' | 'Điểm IMDb' | 'Lượt xem'
}

export interface MovieFilterProps {
  value?: MovieFilterState;
  defaultValue?: Partial<MovieFilterState>;
  onChange?: (filters: MovieFilterState) => void;
  onSubmit?: (filters: MovieFilterState) => void;
  onClose?: () => void;
  onReset?: () => void;
  themeColor?: 'amber' | 'red';
  showTitleHeader?: boolean;   // Hiển thị thanh tiêu đề bên ngoài
  titleText?: string;          // Mặc định: "Duyệt tìm"
  className?: string;
  defaultOpen?: boolean;       // Trạng thái mở mặc định
}

// 1. Tình trạng
export const STATUS_LIST = ['Tất cả', 'Sắp chiếu', 'Đang chiếu', 'Trọn bộ'];

// 2. Định dạng
export const FORMAT_LIST = ['Tất cả', 'Chiếu Rạp'];

// 3. Quốc gia
export const COUNTRY_LIST = [
  'Tất cả', 'Âu Mỹ', 'Ba Lan', 'Canada', 'Châu Á', 'Châu Âu', 'Colombia',
  'Đài Loan', 'Đức', 'Hàn Quốc', 'Hồng Kông', 'Indonesia', 'Ireland',
  'Malaysia', 'Nhật Bản', 'Philippines', 'Tây Ban Nha', 'Thái Lan',
  'Trung quốc', 'United States of America', 'Việt Nam'
];

// 4. Loại phim
export const TYPE_LIST = ['Tất cả', 'Phim lẻ', 'Phim bộ'];

// 5. Xếp hạng
export const AGE_RATING_LIST = [
  'Tất cả',
  'P (Mọi lứa tuổi)',
  'K (Dưới 13 tuổi)',
  'T13 (13 tuổi trở lên)',
  'T16 (16 tuổi trở lên)',
  'T18 (18 tuổi trở lên)'
];

// 6. Thể loại
export const CATEGORY_LIST = [
  'Tất cả', 'Âm Nhạc', 'Ẩm Thực', 'Anime', 'Báo Thù', 'Bí ẩn', "Boy's Love", 'Boys Love',
  'Cảm Động', 'Chích Kịch', 'Chiến Tranh', 'Chiếu Rạp', 'Chính kịch', 'Chính Sự', 'Chính Trị',
  'Chữa Lành', 'Chuyển Thể', 'Cổ Điển', 'Cổ Trang', 'Công Sở', 'Cung Đấu', 'Cuối Tuần',
  'Dã Sử', 'Dịp Lễ', 'Du Lịch', 'Đô Thị', 'Đời Sống', 'Đời Thường', 'Gay Cấn', 'Gia Đấu',
  'Gia đình', 'Giả Tưởng', 'Giật gân', 'Hài Hước', 'Hành Động', 'Hành Sự', 'Hình Sự',
  'Hoạt Hình', 'Học Đường', 'Hồi Hội', 'Hồi Hộp', 'Hôn Nhân', 'Huyền Huyễn', 'Khoa Học',
  'Kịch Tính', 'Kiếm Hiệp', 'Kinh Dị', 'Kinh Điển', 'Kỳ Ảo', 'Lãng Mạn', 'Lãng mạn',
  'LGBTQ+', 'Lịch Sử', 'Nghịch Tập', 'Ngôn Tình', 'Ngược Luyến', 'Nữ Chủ', 'Nữ Cường',
  'Phá Án', 'Pháp Lý', 'Phiêu Lưu', 'Phim Chính Kịch', 'Phim Ngắn', 'Quyền Mưu',
  'Sắp Chiếu', 'Siêu Anh Hùng', 'Siêu Nhiên', 'Sitcom', 'Tài liệu', 'Tâm Linh',
  'Tâm Lý', 'Thần Thoại', 'Thần Tượng', 'Thành Thị', 'Thanh Xuân', 'Thể Thao',
  'Thôn Quê', 'Thương Trường', 'Tiên Hiệp', 'Tình bạn', 'Tình Báo', 'Tình Cảm',
  'Tình Tiết', 'Tội Phạm', 'Trinh Thám', 'Trường Học', 'Truyền hình',
  'Truyền Hình Thực Tế', 'TVB', 'Văn Phòng', 'Viễn Tưởng', 'Võ Hiệp', 'Võ Thuật',
  'Webtoon', 'Xuyên Không', 'Y khoa'
];

// 7. Phiên bản
export const VERSION_LIST = [
  'Tất cả',
  'Phụ đề',
  'Lồng tiếng',
  'Thuyết minh giọng Bắc',
  'Thuyết minh giọng Nam'
];

// 8. Năm sản xuất
export const YEAR_LIST = [
  'Tất cả', '2026', '2025', '2024', '2023', '2022', '2021', '2020',
  '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011'
];

// 9. Sắp xếp
export const SORT_LIST = ['Mới nhất', 'Mới cập nhật', 'Điểm IMDb', 'Lượt xem'];

export const INITIAL_MOVIE_FILTER_STATE: MovieFilterState = {
  status: 'Tất cả',
  format: 'Tất cả',
  country: 'Tất cả',
  type: 'Tất cả',
  ageRating: 'Tất cả',
  categories: ['Tất cả'],
  version: 'Tất cả',
  year: 'Tất cả',
  sort: 'Mới nhất'
};

/**
 * Slug generator to normalize Vietnamese text for database queries
 */
function toDatabaseSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Chuyển đổi MovieFilterState sang tham số truy vấn API backend (/api/v1/movies)
 */
export function filterStateToQueryParams(filters: MovieFilterState): Record<string, any> {
  const params: Record<string, any> = {};

  // Status mapping
  if (filters.status && filters.status !== 'Tất cả') {
    if (filters.status === 'Sắp chiếu') params.status = 'trailer';
    else if (filters.status === 'Đang chiếu') params.status = 'ongoing';
    else if (filters.status === 'Trọn bộ') params.status = 'completed';
    else params.status = toDatabaseSlug(filters.status);
  }

  // Format mapping
  if (filters.format === 'Chiếu Rạp') {
    params.chieuRap = true;
  }

  // Type mapping
  if (filters.type && filters.type !== 'Tất cả') {
    if (filters.type === 'Phim lẻ') params.type = 'single';
    else if (filters.type === 'Phim bộ') params.type = 'series';
    else params.type = toDatabaseSlug(filters.type);
  }

  // Country mapping
  if (filters.country && filters.country !== 'Tất cả') {
    params.country = toDatabaseSlug(filters.country);
  }

  // Categories mapping
  if (filters.categories && filters.categories.length > 0 && !filters.categories.includes('Tất cả')) {
    params.category = filters.categories.map(c => toDatabaseSlug(c)).join(',');
  }

  // Version / Lang mapping
  if (filters.version && filters.version !== 'Tất cả') {
    if (filters.version === 'Phụ đề') params.lang = 'Vietsub';
    else if (filters.version === 'Lồng tiếng') params.lang = 'Lồng Tiếng';
    else params.lang = 'Thuyết Minh';
  }

  // Year mapping
  if (filters.year && filters.year !== 'Tất cả') {
    params.year = filters.year;
  }

  // Sort mapping
  if (filters.sort && filters.sort !== 'Tất cả') {
    if (filters.sort === 'Mới nhất') params.sort = 'newest';
    else if (filters.sort === 'Mới cập nhật') params.sort = 'updated';
    else if (filters.sort === 'Điểm IMDb') params.sort = 'rating';
    else if (filters.sort === 'Lượt xem') params.sort = 'views';
  }

  return params;
}

const MovieFilter: React.FC<MovieFilterProps> = ({
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClose,
  onReset,
  themeColor = 'red',
  showTitleHeader = false,
  titleText = 'Duyệt tìm',
  className = '',
  defaultOpen = true
}) => {
  const [internalState, setInternalState] = useState<MovieFilterState>({
    ...INITIAL_MOVIE_FILTER_STATE,
    ...defaultValue
  });

  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [customYear, setCustomYear] = useState<string>('');

  const activeState = value || internalState;

  // Tính số lượng tiêu chí đang áp dụng (khác 'Tất cả')
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeState.status && activeState.status !== 'Tất cả') count++;
    if (activeState.format && activeState.format !== 'Tất cả') count++;
    if (activeState.country && activeState.country !== 'Tất cả') count++;
    if (activeState.type && activeState.type !== 'Tất cả') count++;
    if (activeState.ageRating && activeState.ageRating !== 'Tất cả') count++;
    if (activeState.categories && activeState.categories.length > 0 && !activeState.categories.includes('Tất cả')) {
      count += activeState.categories.length;
    }
    if (activeState.version && activeState.version !== 'Tất cả') count++;
    if (activeState.year && activeState.year !== 'Tất cả') count++;
    if (activeState.sort && activeState.sort !== 'Mới nhất') count++;
    return count;
  }, [activeState]);

  // Danh sách tóm tắt các filter đang chọn để hiển thị khi thu gọn
  const activeChips = useMemo(() => {
    const list: string[] = [];
    if (activeState.status && activeState.status !== 'Tất cả') list.push(activeState.status);
    if (activeState.format && activeState.format !== 'Tất cả') list.push(activeState.format);
    if (activeState.country && activeState.country !== 'Tất cả') list.push(activeState.country);
    if (activeState.type && activeState.type !== 'Tất cả') list.push(activeState.type);
    if (activeState.ageRating && activeState.ageRating !== 'Tất cả') list.push(activeState.ageRating);
    if (activeState.categories && activeState.categories.length > 0 && !activeState.categories.includes('Tất cả')) {
      list.push(...activeState.categories);
    }
    if (activeState.version && activeState.version !== 'Tất cả') list.push(activeState.version);
    if (activeState.year && activeState.year !== 'Tất cả') list.push(`Năm ${activeState.year}`);
    if (activeState.sort && activeState.sort !== 'Mới nhất') list.push(activeState.sort);
    return list;
  }, [activeState]);

  // Active styles based on theme
  const isRed = themeColor === 'red';
  const boxedActive = isRed ? styles.boxedChipActiveRed : styles.boxedChipActiveAmber;
  const textActive = isRed ? styles.textChipActiveRed : styles.textChipActiveAmber;
  const sortActive = isRed ? styles.sortChipActiveRed : styles.sortChipActiveAmber;
  const submitBtnClass = isRed ? styles.submitBtn : `${styles.submitBtn} ${styles.submitBtnAmber}`;
  const toggleBtnClass = isRed ? styles.filterToggleBtn : `${styles.filterToggleBtn} ${styles.filterToggleBtnAmber}`;
  const headerIconWrapClass = isRed ? styles.filterHeaderIconWrap : `${styles.filterHeaderIconWrap} ${styles.filterHeaderIconWrapAmber}`;
  const activeBadgeClass = isRed ? styles.filterActiveBadge : `${styles.filterActiveBadge} ${styles.filterActiveBadgeAmber}`;
  const resetBtnClass = isRed ? styles.resetTextBtn : `${styles.resetTextBtn} ${styles.resetTextBtnAmber}`;
  const headerResetBtnClass = isRed ? styles.headerResetBtn : `${styles.headerResetBtn} ${styles.headerResetBtnAmber}`;
  const yearWrapClass = isRed ? styles.yearInputWrap : `${styles.yearInputWrap} ${styles.yearInputWrapAmber}`;
  const yearIconClass = isRed ? styles.yearInputIcon : `${styles.yearInputIcon} ${styles.yearInputIconAmber}`;
  const browserTitleIconClass = isRed ? styles.browserTitleIcon : `${styles.browserTitleIcon} ${styles.browserTitleIconAmber}`;

  // Update handler
  const updateFilters = useCallback((updater: (prev: MovieFilterState) => MovieFilterState) => {
    const nextState = updater(activeState);
    if (!value) {
      setInternalState(nextState);
    }
    onChange?.(nextState);
  }, [activeState, value, onChange]);

  // Single select for status, format, country, type, ageRating, version, sort
  const handleSingleSelect = useCallback((key: keyof Omit<MovieFilterState, 'categories'>, item: string) => {
    updateFilters(prev => ({
      ...prev,
      [key]: item
    }));
  }, [updateFilters]);

  // Year select (from preset or custom input)
  const handleYearSelect = useCallback((yr: string) => {
    setCustomYear('');
    updateFilters(prev => ({
      ...prev,
      year: yr
    }));
  }, [updateFilters]);

  const handleCustomYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomYear(val);
    if (val.trim()) {
      updateFilters(prev => ({
        ...prev,
        year: val.trim()
      }));
    }
  }, [updateFilters]);

  // Multi select for categories
  const handleCategorySelect = useCallback((cat: string) => {
    updateFilters(prev => {
      if (cat === 'Tất cả') {
        return { ...prev, categories: ['Tất cả'] };
      }

      const withoutAll = prev.categories.filter(c => c !== 'Tất cả');
      const isSelected = withoutAll.includes(cat);

      const nextCats = isSelected
        ? withoutAll.filter(c => c !== cat)
        : [...withoutAll, cat];

      return {
        ...prev,
        categories: nextCats.length === 0 ? ['Tất cả'] : nextCats
      };
    });
  }, [updateFilters]);

  // Submit button click
  const handleSubmit = useCallback(() => {
    onSubmit?.(activeState);
  }, [onSubmit, activeState]);

  // Close button click
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Reset button click
  const handleReset = useCallback(() => {
    setCustomYear('');
    const reset = { ...INITIAL_MOVIE_FILTER_STATE };
    if (!value) {
      setInternalState(reset);
    }
    onChange?.(reset);
    onReset?.();
  }, [value, onChange, onReset]);

  return (
    <div className={`${styles.browserContainer} ${className}`}>
      {/* 1. Optional External Page Header */}
      {showTitleHeader && (
        <div className={styles.browserTitleRow}>
          <h2 className={styles.browserMainTitle}>
            <span className={browserTitleIconClass}>
              <FaThLarge />
            </span>
            {titleText}
          </h2>
        </div>
      )}

      {/* 2. Main Filter Card Panel */}
      <div className={`${styles.filterCard} ${!isOpen ? styles.filterCardCollapsed : ''}`}>
        {/* Integrated Card Header (Never leaves the button lonely!) */}
        <div 
          className={`${styles.filterCardHeader} ${isOpen ? styles.filterHeaderWithBorder : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={styles.filterHeaderLeft}>
            <div className={headerIconWrapClass}>
              <FaSlidersH />
            </div>
            <div className={styles.filterHeaderTitleGroup}>
              <span className={styles.filterHeaderTitle}>Bộ lọc nâng cao</span>
              {activeFiltersCount > 0 ? (
                <span className={activeBadgeClass}>
                  Đã chọn:
                </span>
              ) : (
                <span className={styles.filterDefaultHint}>
                  (Tất cả phim)
                </span>
              )}
            </div>

            {/* Khi thu gọn, hiển thị preview tóm tắt các nhãn đang chọn */}
            {!isOpen && activeChips.length > 0 && (
              <div className={styles.collapsedChipsPreview}>
                {activeChips.slice(0, 5).map((chip, idx) => (
                  <span key={idx} className={styles.collapsedChipBadge}>
                    {chip}
                  </span>
                ))}
                {activeChips.length > 5 && (
                  <span className={styles.collapsedChipBadge}>
                    +{activeChips.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.filterHeaderRight}>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className={headerResetBtnClass}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                title="Đặt lại toàn bộ tiêu chí về mặc định"
              >
                Đặt lại
              </button>
            )}

            <button
              type="button"
              className={toggleBtnClass}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              aria-expanded={isOpen}
            >
              <FaFilter size={12} />
              {isOpen ? 'Thu gọn' : 'Mở rộng bộ lọc'}
              {isOpen ? <FaCaretUp /> : <FaCaretDown />}
            </button>
          </div>
        </div>

        {isOpen && (
          <>
            <div className={styles.filterRows}>
              {/* Row 1: Tình trạng */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Tình trạng:</div>
                <div className={styles.rowOptions}>
                  {STATUS_LIST.map(st => {
                    const isActive = activeState.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        className={st === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleSingleSelect('status', st)}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Định dạng */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Định dạng:</div>
                <div className={styles.rowOptions}>
                  {FORMAT_LIST.map(fmt => {
                    const isActive = activeState.format === fmt;
                    return (
                      <button
                        key={fmt}
                        type="button"
                        className={fmt === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleSingleSelect('format', fmt)}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Quốc gia */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Quốc gia:</div>
                <div className={styles.rowOptions}>
                  {COUNTRY_LIST.map(c => {
                    const isActive = activeState.country === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        className={c === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleSingleSelect('country', c)}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Loại phim */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Loại phim:</div>
                <div className={styles.rowOptions}>
                  {TYPE_LIST.map(tp => {
                    const isActive = activeState.type === tp;
                    return (
                      <button
                        key={tp}
                        type="button"
                        className={tp === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleSingleSelect('type', tp)}
                      >
                        {tp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Xếp hạng */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Xếp hạng:</div>
                <div className={styles.rowOptions}>
                  {AGE_RATING_LIST.map(ar => {
                    const isActive = activeState.ageRating === ar;
                    return (
                      <button
                        key={ar}
                        type="button"
                        className={ar === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleSingleSelect('ageRating', ar)}
                      >
                        {ar}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Thể loại */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Thể loại:</div>
                <div className={styles.rowOptions}>
                  {CATEGORY_LIST.map(cat => {
                    const isActive = activeState.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={cat === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleCategorySelect(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 7: Phiên bản */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Phiên bản:</div>
                <div className={styles.rowOptions}>
                  {VERSION_LIST.map(ver => {
                    const isActive = activeState.version === ver;
                    return (
                      <button
                        key={ver}
                        type="button"
                        className={ver === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleSingleSelect('version', ver)}
                      >
                        {ver}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 8: Năm sản xuất */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Năm sản xuất:</div>
                <div className={styles.rowOptions}>
                  {YEAR_LIST.map(yr => {
                    const isActive = activeState.year === yr && !customYear;
                    return (
                      <button
                        key={yr}
                        type="button"
                        className={yr === 'Tất cả' ? `${styles.boxedChip} ${isActive ? boxedActive : ''}` : `${styles.textChip} ${isActive ? textActive : ''}`}
                        onClick={() => handleYearSelect(yr)}
                      >
                        {yr}
                      </button>
                    );
                  })}

                  {/* Input Search Year */}
                  <div className={yearWrapClass}>
                    <FaSearch className={yearIconClass} />
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      className={styles.yearInput}
                      placeholder="Nhập năm"
                      value={customYear}
                      onChange={handleCustomYearChange}
                    />
                  </div>
                </div>
              </div>

              {/* Row 9: Sắp xếp */}
              <div className={styles.filterRow}>
                <div className={styles.rowLabel}>Sắp xếp:</div>
                <div className={styles.rowOptions}>
                  {SORT_LIST.map(srt => {
                    const isActive = activeState.sort === srt;
                    return (
                      <button
                        key={srt}
                        type="button"
                        className={`${styles.sortChip} ${isActive ? sortActive : ''}`}
                        onClick={() => handleSingleSelect('sort', srt)}
                      >
                        {srt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Footer Action Row */}
            <div className={styles.filterFooter}>
              <button
                type="button"
                className={submitBtnClass}
                onClick={handleSubmit}
              >
                Lọc kết quả <FaArrowRight size={13} />
              </button>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
              >
                Thu gọn
              </button>

              {/* <button
                type="button"
                className={resetBtnClass}
                onClick={handleReset}
                title="Đặt lại toàn bộ tiêu chí về mặc định"
              >
                Đặt lại
              </button> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(MovieFilter);
