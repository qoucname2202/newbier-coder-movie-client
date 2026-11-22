/**
 * @file CountryPagination.tsx
 * @description Accessible cinema pagination with smart windowing and keyboard navigation.
 */

import React from 'react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import styles from '@/styles/CountryPage.module.css';

export interface CountryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CountryPagination: React.FC<CountryPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  // Build pagination window (e.g. 1 ... 4 5 6 ... 20)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 2; // Number of pages to show around current page

    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav aria-label="Phân trang danh sách phim" className={styles.paginationContainer}>
      {/* First Page */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(1)}
        disabled={currentPage <= 1}
        aria-label="Về trang đầu tiên"
        title="Trang đầu"
      >
        <FaAngleDoubleLeft aria-hidden="true" />
      </button>

      {/* Prev Page */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Về trang trước"
        title="Trang trước"
      >
        <FaChevronLeft aria-hidden="true" />
      </button>

      {/* Number Buttons & Ellipsis */}
      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span key={`ellipsis-${idx}`} className={styles.pageEllipsis} aria-hidden="true">
              •••
            </span>
          );
        }

        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            className={`${styles.pageBtn} ${isActive ? styles.pageBtnActive : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Trang ${p}`}
          >
            {p}
          </button>
        );
      })}

      {/* Next Page */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Đến trang sau"
        title="Trang sau"
      >
        <FaChevronRight aria-hidden="true" />
      </button>

      {/* Last Page */}
      <button
        type="button"
        className={styles.pageBtn}
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage >= totalPages}
        aria-label="Đến trang cuối cùng"
        title="Trang cuối"
      >
        <FaAngleDoubleRight aria-hidden="true" />
      </button>
    </nav>
  );
};

export default CountryPagination;
