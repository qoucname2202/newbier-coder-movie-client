import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from '../../styles/MovieCategory.module.css';
import Skeleton from '../UI/Skeleton';
import { mockKoreanMovies, mockChineseMovies } from '../../mock/mockMovies';
import SectionHeader from './SectionHeader';
import MovieCardVertical from './MovieCardVertical';

const Moviecountry = () => {
  const [countriesData, setCountriesData] = useState({
    korean: {
      title: 'Phim Hàn Quốc Mới',
      movies: mockKoreanMovies,
      loading: false
    },
    chinese: {
      title: 'Phim Trung Quốc Mới',
      movies: mockChineseMovies,
      loading: false
    }
  });
  const [loadedImages, setLoadedImages] = useState({});
  const [previewMovie, setPreviewMovie] = useState(null);
  const previewTimeoutRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.dispatchEvent(new Event('resize'));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: mounted && isMobile ? 1.85 : 5.5,
    slidesToScroll: 1,
    swipeToSlide: true,
    draggable: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4.5,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3.5,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2.3,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1.85,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1.85,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 360,
        settings: {
          slidesToShow: 1.6,
          slidesToScroll: 1,
          arrows: false,
        }
      }
    ]
  };

  const handleMouseEnter = (movie) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(() => {
      setPreviewMovie(movie);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    setTimeout(() => {
      if (!document.querySelector(':hover > .video-preview-overlay')) {
        setPreviewMovie(null);
      }
    }, 300);
  };

  const closePreview = () => {
    setPreviewMovie(null);
  };
  const fetchMoviesByCountry = async (countryKey, countryCode) => {
    const fallbackList = countryKey === 'korean' ? mockKoreanMovies : mockChineseMovies;
    try {
      const response = await fetch(`http://localhost:5000/api/movies?page=1&limit=100`);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();

      if (result.data?.movies && result.data.movies.length > 0) {
        const filteredMovies = result.data.movies.filter(movie => {
          return movie.country?.some?.(c => c.slug === countryCode);
        });

        const processedMovies = filteredMovies.map(movie => ({
          ...movie,
          thumb_url: movie.thumb_url?.startsWith('http')
            ? movie.thumb_url
            : `${movie.thumb_url}`,
          poster_url: movie.poster_url?.startsWith('http')
            ? movie.poster_url
            : `${movie.poster_url}`,
          lang: movie.lang || 'Vietsub'
        }));

        setCountriesData(prev => ({
          ...prev,
          [countryKey]: {
            ...prev[countryKey],
            movies: processedMovies.length > 0 ? processedMovies : fallbackList,
            loading: false
          }
        }));
      } else {
        setCountriesData(prev => ({
          ...prev,
          [countryKey]: {
            ...prev[countryKey],
            movies: fallbackList,
            loading: false
          }
        }));
      }
    } catch (error) {
      setCountriesData(prev => ({
        ...prev,
        [countryKey]: {
          ...prev[countryKey],
          movies: fallbackList,
          loading: false,
          error: null
        }
      }));
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    const fetchInitialData = async () => {
      await Promise.all([
        fetchMoviesByCountry('korean', 'han-quoc'),
        fetchMoviesByCountry('chinese', 'trung-quoc')
      ]);
    };

    fetchInitialData();

    return () => {
      abortController.abort();
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="movie-countries-section mt-5">
      {previewMovie && previewMovie.episodes && previewMovie.episodes[0] && previewMovie.episodes[0].server_data && previewMovie.episodes[0].server_data[0] && (
        <div
          className="video-preview-overlay position-fixed"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1050,
            width: '450px',
            maxWidth: '90vw',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onMouseLeave={closePreview}
        >
          <div className="d-flex justify-content-between align-items-center p-2">
            <h6 className="text-white m-0 text-truncate" style={{ width: '90%' }}>
              {previewMovie.name}
            </h6>
            <button
              className="btn-close btn-close-white p-0"
              style={{ fontSize: '0.8rem' }}
              onClick={closePreview}
            ></button>
          </div>
          <div className="ratio ratio-16x9">
            <iframe
              src={previewMovie.episodes[0].server_data[0].link_embed}
              allowFullScreen
              className="rounded-bottom"
              style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            ></iframe>
          </div>
        </div>
      )}

      {/* Korean Movies Section */}
      <div className="top-movies mb-5">
        <SectionHeader
          title={countriesData.korean.title}
          badge="K-DRAMA"
          viewAllHref="/quoc-gia/han-quoc"
        />
        <div className={styles.sliderContainer}>
          {countriesData.korean.loading ? (
            <div className="row g-3">
              {[...Array(4)].map((_, i) => (
                <div key={`korean-skeleton-${i}`} className="col">
                  <div className="card h-100 bg-dark border-0">
                    <Skeleton height="280px" />
                    <div className="card-body">
                      <Skeleton height="18px" width="85%" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : countriesData.korean.movies.length === 0 ? (
            <div className="text-white text-center">Không tìm thấy phim Hàn Quốc</div>
          ) : (
            <Slider
              key={`korean-slider-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
              {...sliderSettings}
            >
              {countriesData.korean.movies.map((movie) => (
                <div
                  key={`han-quoc-${movie.slug}`}
                  className={styles.sliderItem}
                >
                  <MovieCardVertical
                    movie={movie}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>

      {/* Chinese Movies Section */}
      <div className="top-movies mb-5">
        <SectionHeader
          title={countriesData.chinese.title}
          badge="C-DRAMA"
          viewAllHref="/quoc-gia/trung-quoc"
        />
        <div className={styles.sliderContainer}>
          {countriesData.chinese.loading ? (
            <div className="row g-3">
              {[...Array(4)].map((_, i) => (
                <div key={`chinese-skeleton-${i}`} className="col">
                  <div className="card h-100 bg-dark border-0">
                    <Skeleton height="280px" />
                    <div className="card-body">
                      <Skeleton height="18px" width="85%" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : countriesData.chinese.movies.length === 0 ? (
            <div className="text-white text-center">Không tìm thấy phim Trung Quốc</div>
          ) : (
            <Slider
              key={`chinese-slider-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
              {...sliderSettings}
            >
              {countriesData.chinese.movies.map((movie) => (
                <div
                  key={`trung-quoc-${movie.slug}`}
                  className={styles.sliderItem}
                >
                  <MovieCardVertical
                    movie={movie}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .video-preview-overlay {
          animation: fadeIn 0.3s ease-in-out;
        }

        .card .btn-danger {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.8);
          transition: all 0.3s ease, box-shadow 0.3s ease;
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.5);
          z-index: 2;
        }

        .card:hover .btn-danger {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.5);
        }

        .card .btn-danger i {
          font-size: 2rem;
          z-index: 3;
          transition: transform 0.3s ease;
        }

        .card:hover .btn-danger i {
          transform: scale(1.2);
        }

        .slick-track {
          margin-left: 0;
        }

        .slick-prev,
        .slick-next {
          z-index: 10;
        }

        .slick-prev {
          left: 10px;
        }

        .slick-next {
          right: 10px;
        }

        .slick-prev:before,
        .slick-next:before {
          font-size: 24px;
        }

      `}</style>
    </div>
  );
};

export default Moviecountry;