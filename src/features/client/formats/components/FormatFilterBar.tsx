/**
 * @file FormatFilterBar.tsx
 * @description Accessible toolbar for sorting and filtering movies by format.
 */

import React from 'react';
import { FaSortAmountDown, FaCalendarAlt } from 'react-icons/fa';
import type { FormatSortOption } from '../types/format.types';
import styles from '@/styles/FormatPage.module.css';

export interface FormatFilterBarProps {
  currentSort: FormatSortOption;
  currentYear: string;
  totalItems: number;
  onSortChange: (sort: FormatSortOption) => void;
  onYearChange: (year: string) => void;
}

const currentYearNum = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => String(currentYearNum - i));

export const FormatFilterBar: React.FC<FormatFilterBarProps> = ({
  currentSort,
  currentYear,
  totalItems,
  onSortChange,
  onYearChange
}) => {
  return (
    <div className={styles.filterBar}>
      <div className={styles.filterControls}>
        {/* Sort Select */}
        <div className={styles.filterGroup}>
          <label htmlFor="format-sort-select" className={styles.filterLabel}>
            <FaSortAmountDown aria-hidden="true" style={{ marginRight: '4px' }} />
            Sắp xếp:
          </label>
          <select
            id="format-sort-select"
            className={styles.selectInput}
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as FormatSortOption)}
            aria-label="Sắp xếp danh sách phim"
          >
            <option value="newest">Mới nhất cập nhật</option>
            <option value="highest-rating">Đánh giá cao nhất</option>
            <option value="year-desc">Năm phát hành mới nhất</option>
            <option value="year-asc">Năm phát hành cũ nhất</option>
            <option value="a-z">Tên A → Z</option>
            <option value="z-a">Tên Z → A</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>

        {/* Year Select */}
        <div className={styles.filterGroup}>
          <label htmlFor="format-year-select" className={styles.filterLabel}>
            <FaCalendarAlt aria-hidden="true" style={{ marginRight: '4px' }} />
            Năm:
          </label>
          <select
            id="format-year-select"
            className={styles.selectInput}
            value={currentYear}
            onChange={(e) => onYearChange(e.target.value)}
            aria-label="Lọc theo năm phát hành"
          >
            <option value="all">Tất cả các năm</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Item count text */}
      <div className={styles.movieCountText}>
        Tổng số: <strong style={{ color: '#ffffff' }}>{totalItems.toLocaleString('vi-VN')}</strong> phim
      </div>
    </div>
  );
};
