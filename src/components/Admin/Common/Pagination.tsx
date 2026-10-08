// src/components/Admin/Common/Pagination.tsx
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (endPage - startPage + 1 < 5) {
    if (startPage === 1) {
      endPage = Math.min(5, totalPages);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 4);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous"
          >
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>

        {startPage > 1 && (
          <>
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(1)}>1</button>
            </li>
            {startPage > 2 && (
              <li className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            )}
          </>
        )}

        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(number)}
            >
              {number}
            </button>
          </li>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <li className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            )}
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next"
          >
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>

      <style jsx>{`
        :global(.pagination) {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        :global(.pagination .page-item) {
          margin: 0;
        }

        :global(.pagination .page-link) {
          background-color: #111723 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #cbd5e1 !important;
          border-radius: 6px !important;
          min-width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.15s ease;
          box-shadow: none !important;
          cursor: pointer;
        }

        :global(.pagination .page-link:hover) {
          background-color: #1a2234 !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        :global(.pagination .page-item.active .page-link) {
          background-color: #e50914 !important;
          border-color: #e50914 !important;
          color: #ffffff !important;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(229, 9, 20, 0.35) !important;
        }

        :global(.pagination .page-item.disabled .page-link) {
          background-color: rgba(255, 255, 255, 0.02) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
          color: #475569 !important;
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </nav>
  );
};

export default Pagination;