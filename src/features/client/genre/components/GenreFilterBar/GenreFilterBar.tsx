/**
 * @file GenreFilterBar.tsx
 * @description Floating filter bar offering format type toggling, sort criteria,
 * and live movie counter indicators.
 */

import React from 'react';
import { GenreFormatFilter, GenreSortOption } from '../../types/genre.types';
import { FORMAT_FILTER_TABS, SORT_OPTIONS } from '../../constants/genreThemeConstants';
import { FaSortAmountDown, FaFilm, FaTv, FaThLarge } from 'react-icons/fa';
import styles from './GenreFilterBar.module.css';

export interface GenreFilterBarProps {
  formatFilter: GenreFormatFilter;
  sortOption: GenreSortOption;
  onFormatChange: (format: GenreFormatFilter) => void;
  onSortChange: (sort: GenreSortOption) => void;
  loadedCount: number;
  totalCount: number;
  isLoading: boolean;
}

const GenreFilterBar: React.FC<GenreFilterBarProps> = ({
  formatFilter,
  sortOption,
  onFormatChange,
  onSortChange,
  loadedCount,
  totalCount,
  isLoading
}) => {
  const getTabIcon = (id: GenreFormatFilter) => {
    switch (id) {
      case 'single':
        return <FaFilm size={12} />;
      case 'series':
        return <FaTv size={12} />;
      case 'all':
      default:
        return <FaThLarge size={12} />;
    }
  };

  return (
    <div className={styles.filterBarWrapper} role="toolbar" aria-label="Bộ lọc và sắp xếp phim">
      <div className={styles.filterContainer}>
        {/* Left: Format Switcher Tabs */}
        <div className={styles.formatTabs} role="group" aria-label="Lọc theo định dạng">
          {FORMAT_FILTER_TABS.map((tab) => {
            const isActive = formatFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                onClick={() => onFormatChange(tab.id)}
                disabled={isLoading}
                aria-pressed={isActive}
              >
                {getTabIcon(tab.id)}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Movie Count & Sort Selector */}
        <div className={styles.controlsRight}>
          <div className={styles.countIndicator} aria-live="polite">
            Hiển thị <span className={styles.countBold}>{loadedCount}</span>
            {totalCount > 0 && (
              <>
                {' / '}
                <span className={styles.countBold}>{totalCount}</span>
              </>
            )}{' '}
            phim
          </div>

          <div className={styles.sortWrapper}>
            <FaSortAmountDown size={12} className="text-secondary" />
            <label htmlFor="genre-sort-select" className={styles.sortLabel}>
              Sắp xếp:
            </label>
            <select
              id="genre-sort-select"
              className={styles.sortSelect}
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as GenreSortOption)}
              disabled={isLoading}
              aria-label="Tiêu chí sắp xếp danh sách phim"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenreFilterBar;
