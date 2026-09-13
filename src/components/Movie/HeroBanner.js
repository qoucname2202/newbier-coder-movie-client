import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../styles/HeroBanner.module.css';

import { mockFeaturedMovie } from '../../mock/mockMovies';

const HeroBanner = () => {
  const [featuredMovie, setFeaturedMovie] = useState(mockFeaturedMovie);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeaturedMovie = async () => {
      try {
        const response = await fetch('https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=1');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const movie = data.items.find(m => m.poster_url || m.thumb_url);
          if (movie) {
            setFeaturedMovie({
              ...movie,
              backdrop_url: movie.poster_url || movie.thumb_url,
              content: movie.content || movie.origin_name || ''
            });
          }
        }
      } catch (error) {
        // Fallback an toàn về mock data, không ném lỗi
        console.warn('API banner không khả dụng, sử dụng mockFeaturedMovie');
        setFeaturedMovie(mockFeaturedMovie);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMovie();
  }, []);

  if (loading) {
    return (
      <div className={styles.heroLoading}>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const movie = featuredMovie || mockFeaturedMovie;

  return (
    <div className={styles.heroBanner}>
      <div className={styles.heroImage}>
        <img
          src={movie.backdrop_url || movie.poster_url || movie.thumb_url}
          alt={movie.name}
          className={styles.bannerImage}
        />
        <div className={styles.overlay}></div>
      </div>
      <div className={`container ${styles.heroContent}`}>
        <h1 className={styles.title}>{movie.name}</h1>
        {movie.origin_name && (
          <h2 className={styles.subTitle}>{movie.origin_name} ({movie.year || '2024'})</h2>
        )}
        {movie.content && (
          <p className={styles.description}>
            {movie.content.length > 220 ? `${movie.content.substring(0, 220)}...` : movie.content}
          </p>
        )}
        <div className="d-flex gap-3">
          <Link href={`/movie/${movie.slug || '#'}`} className="btn btn-danger btn-lg">
            <i className="fas fa-play me-2"></i> Xem phim
          </Link>
          <Link href={`/movie/${movie.slug || '#'}`} className="btn btn-outline-light btn-lg">
            <i className="fas fa-info-circle me-2"></i> Chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
