/**
 * @file GenreEmptyState.tsx
 * @description Engaging zero-results panel guiding users to reset active filters or explore other genres.
 */

import React from 'react';
import Link from 'next/link';
import { TAXONOMY_CATEGORIES } from '@/config/taxonomyConfig';
import { FaFilm, FaRedo, FaCompass } from 'react-icons/fa';
import styles from './GenreEmptyState.module.css';

export interface GenreEmptyStateProps {
  genreTitle: string;
  currentSlug: string;
  hasFilters: boolean;
  onResetFilters: () => void;
}

const GenreEmptyState: React.FC<GenreEmptyStateProps> = ({
  genreTitle,
  currentSlug,
  hasFilters,
  onResetFilters
}) => {
  const otherGenres = Object.values(TAXONOMY_CATEGORIES).filter((c) => c.slug !== currentSlug);

  return (
    <div className={styles.emptyContainer} role="region" aria-label="Không tìm thấy phim">
      <div className={styles.iconCircle}>
        <FaFilm size={28} />
      </div>

      <h3 className={styles.emptyTitle}>
        Chưa có phim phù hợp trong chủ đề {genreTitle}
      </h3>

      <p className={styles.emptyDescription}>
        {hasFilters
          ? 'Không tìm thấy bộ phim nào phù hợp với bộ lọc hiện tại của bạn. Bạn hãy thử đặt lại bộ lọc để xem toàn bộ danh sách.'
          : 'Kho phim cho chủ đề này đang được ban biên tập tuyển chọn và cập nhật liên tục. Mời bạn khám phá các chủ đề hấp dẫn khác.'}
      </p>

      <div className={styles.actionRow}>
        {hasFilters && (
          <button type="button" className={styles.resetButton} onClick={onResetFilters}>
            <FaRedo size={12} />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}

        <Link href="/search" className={styles.exploreButton}>
          <FaCompass size={13} />
          <span>Duyệt tất cả phim</span>
        </Link>
      </div>

      <div className={styles.suggestionWrapper}>
        <h4 className={styles.suggestionHeading}>Chủ đề được yêu thích</h4>
        <div className={styles.chipsContainer}>
          {otherGenres.slice(0, 5).map((cat) => (
            <Link key={cat.slug} href={`/genre/${cat.slug}`} className={styles.chip}>
              {cat.nameVi}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenreEmptyState;
