/**
 * @file CountryFilterBar.tsx
 * @description Filter toolbar with Sort selector, Year selector, and total count indicator.
 */

import React from 'react';
import { CountrySortOption } from '../types/country.types';
import styles from '@/styles/CountryPage.module.css';

export interface CountryFilterBarProps {
  currentSort: CountrySortOption;
  currentYear: string;
  totalItems: number;
  onSortChange: (sort: CountrySortOption) => void;
  onYearChange: (year: string) => void;
}

const SORT_OPTIONS: Array<{ value: CountrySortOption; label: string }> = [
  { value: 'moi-nhat', label: 'Mới nhất' },
  { value: 'xem-nhieu', label: 'Xem nhiều nhất' },
  { value: 'danh-gia', label: 'Đánh giá cao' },
  { value: 'nam-phat-hanh', label: 'Năm phát hành' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = ['all', ...Array.from({ length: 16 }, (_, i) => String(CURRENT_YEAR - i))];

export const CountryFilterBar: React.FC<CountryFilterBarProps> = ({
  currentSort,
  currentYear,
  totalItems,
  onSortChange,
  onYearChange,
}) => {
  return (
    <div className={styles.filterBar} id="country-movies-section">
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label htmlFor="country-sort-select" className={styles.filterLabel}>
            Sắp xếp:
          </label>
          <select
            id="country-sort-select"
            className={styles.selectInput}
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as CountrySortOption)}
            aria-label="Sắp xếp danh sách phim"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="country-year-select" className={styles.filterLabel}>
            Năm:
          </label>
          <select
            id="country-year-select"
            className={styles.selectInput}
            value={currentYear}
            onChange={(e) => onYearChange(e.target.value)}
            aria-label="Lọc phim theo năm phát hành"
          >
            <option value="all">Tất cả năm</option>
            {YEAR_OPTIONS.filter((y) => y !== 'all').map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.movieCountText}>
        Tổng cộng: <strong style={{ color: '#ffffff' }}>{totalItems}</strong> bộ phim
      </div>
    </div>
  );
};

export default CountryFilterBar;
