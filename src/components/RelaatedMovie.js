import React from 'react';
import Link from 'next/link';
import styles from '../styles/RelatedMovies.module.css';

const RelatedMovies = ({ movies }) => {
  return (
    <div className={styles.relatedMoviesContainer}>
      <h5 className={styles.sectionTitle}>Phim Cùng Thể Loại</h5>
      <div className={styles.moviesGrid}>
        {movies.map((movie, index) => (
          <Link 
            href={`/movie/${movie.slug}`} 
            key={index}
            className={styles.movieCard}
          >
            <div className={styles.posterWrapper}>
              <img
                src={movie.thumb_url}
                alt={movie.name}
                className={styles.poster}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/img/default-poster.jpg";
                }}
              />
              <div className={styles.overlay}>
                <button className={styles.playButton}>
                  <i className="fas fa-play"></i>
                </button>
              </div>
            </div>
            <h6 className={styles.movieTitle}>{movie.name}</h6>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedMovies;