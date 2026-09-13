import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from '../../styles/MovieCategory.module.css'; 
import Skeleton from '../UI/Skeleton';

const Moviecountry = () => {
  const [countriesData, setCountriesData] = useState({
    korean: {
      title: 'Phim Hàn Quốc Mới',
      movies: [],
      loading: true
    },
    chinese: {
      title: 'Phim Trung Quốc Mới',
      movies: [],
      loading: true
    }
  });
  const [loadedImages, setLoadedImages] = useState({});
  const [previewMovie, setPreviewMovie] = useState(null);
  const previewTimeoutRef = useRef(null);

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    swipeToSlide: true,
    draggable: true,
    variableWidth: false,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1.7,
          slidesToScroll: 1,
          arrows: false,
          centerMode: true,
          centerPadding: '30px',
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1.3,
          slidesToScroll: 1,
          arrows: false,
          centerMode: true,
          centerPadding: '20px',
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
    try {
      setCountriesData(prev => ({
        ...prev,
        [countryKey]: {
          ...prev[countryKey],
          loading: true,
          movies: []
        }
      }));
  
      // Gọi API để lấy tất cả phim (hoặc có thể thêm filter phía server nếu hỗ trợ)
      const response = await fetch(`http://localhost:5000/api/movies?page=1&limit=100`);
      const result = await response.json();
  
      if (result.data?.movies) {
        // Lọc phim theo country.slug
        const filteredMovies = result.data.movies.filter(movie => {
          // Kiểm tra nếu movie.country là mảng và có phần tử khớp slug
          return movie.country?.some?.(c => c.slug === countryCode);
        });
  
        // Xử lý URL hình ảnh
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
            movies: processedMovies,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(`Lỗi khi tải phim ${countryKey}:`, error);
      setCountriesData(prev => ({
        ...prev,
        [countryKey]: {
          ...prev[countryKey],
          loading: false,
          error: error.message
        }
      }));
    }
  };
  
  // Sử dụng useEffect để fetch dữ liệu khi component mount
  useEffect(() => {
    const abortController = new AbortController();
  
    // Fetch phim Hàn Quốc và Trung Quốc
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
  }, []); // Chỉ chạy một lần khi component mount

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
        <h3 className="text-white mb-3">{countriesData.korean.title}</h3>
        <div className={styles.sliderContainer}>
          {countriesData.korean.loading ? (
            <div className="row g-3">
              {[...Array(4)].map((_, i) => (
                <div key={`korean-skeleton-${i}`} className="col">
                  <div className="card h-100 bg-dark border-0">
                    <Skeleton height="220px" />
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
            <Slider {...sliderSettings}>
              {countriesData.korean.movies.map((movie) => {
                const imageId = `han-quoc-${movie.slug}`;
                return (
                  <div 
                    key={imageId} 
                    className="px-2"
                    onMouseEnter={() => handleMouseEnter(movie)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="card bg-dark border-0">
                      <div className="position-relative">
                        <img
                          src={movie.poster_url}
                          className="card-img-top"
                          alt={movie.name}
                          loading="lazy"
                          style={{ 
                            height: '220px', 
                            objectFit: 'cover', 
                            borderRadius: '8px'
                          }}
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />  
                        
                        <div 
                          className="position-absolute top-0 start-0 w-100 h-100" 
                          style={{ 
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                            borderRadius: '8px'
                          }}
                        ></div>
                        
                        <Link 
                          href={`/movie/${movie.slug}`}
                          className="btn btn-danger position-absolute top-50 start-50 translate-middle"
                        >
                          <i className="bi bi-play-fill"></i>
                        </Link>
                        
                        <div className="position-absolute bottom-0 start-0 p-2 w-100">
                          <h6 className="text-white mb-1 text-truncate">{movie.name}</h6>
                          <div className="d-flex flex-wrap gap-1 mb-1">
                            {movie.episode_current && (
                              <span className="badge bg-success me-1">
                                {movie.episode_current}
                              </span>
                            )}
                            <span className="badge bg-info">
                              {movie.lang}
                            </span>
                            {movie.year && (
                              <span className="badge bg-danger">
                                {movie.year}
                              </span>
                            )}
                            {movie.quality && (
                              <span className="badge bg-primary ms-1">
                                {movie.quality}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Slider>
          )}
        </div>
      </div>

      {/* Chinese Movies Section */}
      <div className="top-movies mb-5">
        <h3 className="text-white mb-3">{countriesData.chinese.title}</h3>
        <div className={styles.sliderContainer}>
          {countriesData.chinese.loading ? (
            <div className="row g-3">
              {[...Array(4)].map((_, i) => (
                <div key={`chinese-skeleton-${i}`} className="col">
                  <div className="card h-100 bg-dark border-0">
                    <Skeleton height="220px" />
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
            <Slider {...sliderSettings}>
              {countriesData.chinese.movies.map((movie) => {
                const imageId = `trung-quoc-${movie.slug}`;
                return (
                  <div 
                    key={imageId} 
                    className="px-2"
                    onMouseEnter={() => handleMouseEnter(movie)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="card bg-dark border-0">
                      <div className="position-relative">
                        <img
                          src={movie.poster_url}
                          className="card-img-top"
                          alt={movie.name}
                          loading="lazy"
                          style={{ 
                            height: '220px', 
                            objectFit: 'cover', 
                            borderRadius: '8px'
                          }}
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        
                        <div 
                          className="position-absolute top-0 start-0 w-100 h-100" 
                          style={{ 
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                            borderRadius: '8px'
                          }}
                        ></div>
                        
                        <Link 
                          href={`/movie/${movie.slug}`}
                          className="btn btn-danger position-absolute top-50 start-50 translate-middle"
                        >
                          <i className="bi bi-play-fill"></i>
                        </Link>
                        
                        <div className="position-absolute bottom-0 start-0 p-2 w-100">
                          <h6 className="text-white mb-1 text-truncate">{movie.name}</h6>
                          <div className="d-flex flex-wrap gap-1 mb-1">
                            {movie.episode_current && (
                              <span className="badge bg-success me-1">
                                {movie.episode_current}
                              </span>
                            )}
                            <span className="badge bg-info">
                              {movie.lang}
                            </span>
                            {movie.year && (
                              <span className="badge bg-danger">
                                {movie.year}
                              </span>
                            )}
                            {movie.quality && (
                              <span className="badge bg-primary ms-1">
                                {movie.quality}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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