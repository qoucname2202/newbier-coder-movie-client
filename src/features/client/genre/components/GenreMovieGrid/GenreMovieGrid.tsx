/**
 * @file GenreMovieGrid.tsx
 * @description Cinema poster responsive grid rendering movie cards, trailer preview triggers,
 * and completion indicator when all movies in the genre have been loaded.
 */

import React from 'react';
import { GenreMovieItem } from '../../types/genre.types';
import MovieCardVertical from '@/features/shared/components/MovieCard/MovieCardVertical';
import type { MovieLite } from '@/features/shared/components/MovieCard/MovieCardVertical';
import { FaCheckCircle, FaArrowUp } from 'react-icons/fa';
import styles from './GenreMovieGrid.module.css';

export interface GenreMovieGridProps {
  movies: GenreMovieItem[];
  hasMore: boolean;
  totalCount: number;
  genreTitle: string;
  onPlayTrailer: (movie: GenreMovieItem) => void;
}

const GenreMovieGrid: React.FC<GenreMovieGridProps> = ({
  movies,
  hasMore,
  totalCount,
  genreTitle,
  onPlayTrailer
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className={styles.gridSection} aria-label={`Danh sách phim thuộc chủ đề ${genreTitle}`}>
      <div className={styles.movieGrid}>
        {movies.map((movie) => (
          <div key={movie.slug || movie._id || movie.id} className={styles.cardItem}>
            <MovieCardVertical
              movie={movie as unknown as MovieLite}
              onPlayTrailer={() => onPlayTrailer(movie)}
            />
          </div>
        ))}
      </div>

      {/* Catalog Completed Notice when all movies have been loaded */}
      {!hasMore && movies.length > 0 && (
        <div className={styles.catalogEndNotice}>
          <div>
            <div className={styles.endPill}>
              <FaCheckCircle className={styles.endCheckIcon} />
              <span>
                Bạn đã xem hết tất cả {movies.length} / {totalCount || movies.length} bộ phim thuộc chủ đề {genreTitle}
              </span>
            </div>
          </div>
          <div>
            <button
              type="button"
              className={styles.scrollTopButton}
              onClick={scrollToTop}
              aria-label="Cuộn về đầu trang"
            >
              <FaArrowUp size={11} />
              <span>Về đầu trang</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default GenreMovieGrid;
