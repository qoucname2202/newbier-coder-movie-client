import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { authorize } from 'passport';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from '../../styles/MovieCategory.module.css';
import Skeleton from '../UI/Skeleton';
import Moviecountry from './Moviecountry';
import upcomingMovieService from '../../API/services/upcomingMovieService';
import { mockMovies } from '../../mock/mockMovies';
import SectionHeader from './SectionHeader';
import MovieCardVertical from './MovieCardVertical';
import MovieCardHorizontal from './MovieCardHorizontal';

const getCountdownText = (releaseDate) => {
  const now = new Date();
  const timeDiff = releaseDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysDiff <= 0) {
    return "Đã ra mắt";
  } else if (daysDiff === 1) {
    return "Ra mắt ngày mai";
  } else if (daysDiff <= 7) {
    return `Ra mắt sau ${daysDiff} ngày`;
  } else if (daysDiff <= 30) {
    const weeks = Math.ceil(daysDiff / 7);
    return `Ra mắt sau ${weeks} tuần`;
  } else {
    const months = Math.ceil(daysDiff / 30);
    return `Ra mắt sau ${months} tháng`;
  }
};

const MovieCategory = ({ title, endpoint, showTopMovies = true }) => {
  const [movies, setMovies] = useState(mockMovies);
  const [featuredMovies, setFeaturedMovies] = useState(mockMovies.slice(0, 5));
  const [topMovies, setTopMovies] = useState(mockMovies.slice(4, 10));
  const [mostViewedMovies, setMostViewedMovies] = useState(mockMovies.slice(0, 6));
  const [upcomingMovies, setUpcomingMovies] = useState(mockMovies.slice(2, 6));
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const [previewTimer, setPreviewTimer] = useState(null);
  const [previewMovie, setPreviewMovie] = useState(null);
  const previewTimeoutRef = useRef(null);  const [showBackToTop, setShowBackToTop] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [currentTrailerMovie, setCurrentTrailerMovie] = useState(null);

  const topMoviesSettings = {
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

  const horizontalSliderSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: mounted && isMobile ? 1.3 : 3.5,
    slidesToScroll: 1,
    swipeToSlide: true,
    draggable: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2.5,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1.8,
          slidesToScroll: 1,
          arrows: false
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1.35,
          slidesToScroll: 1,
          arrows: false
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1.25,
          slidesToScroll: 1,
          arrows: false
        }
      }
    ]
  };


  const handleImageLoad = (id) => {
    if (!loadedImages[id]) {
      localStorage.setItem(`img_loaded_${id}`, 'true');

      setTimeout(() => {
        setLoadedImages(prev => ({
          ...prev,
          [id]: true
        }));
      }, 100);
    }
  };

  useEffect(() => {
    const cachedLoadedImages = {};
    const movies = [...featuredMovies, ...topMovies];

    movies.forEach(movie => {
      if (movie && movie.slug) {
        const featuredImageId = `featured-${movie.slug}`;
        const topImageId = `top-${movie.slug}`;

        if (localStorage.getItem(`img_loaded_${featuredImageId}`) === 'true') {
          cachedLoadedImages[featuredImageId] = true;
        }

        if (localStorage.getItem(`img_loaded_${topImageId}`) === 'true') {
          cachedLoadedImages[topImageId] = true;
        }
      }
    });

    if (Object.keys(cachedLoadedImages).length > 0) {
      setLoadedImages(prev => ({
        ...prev,
        ...cachedLoadedImages
      }));
    }
  }, [featuredMovies, topMovies]);

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

  const fallbackToMockMovies = () => {
    setMovies(mockMovies);
    setFeaturedMovies(mockMovies.slice(0, 5));
    setTopMovies(mockMovies.slice(4, 10));
    setMostViewedMovies(mockMovies.slice(0, 6));
    setUpcomingMovies(mockMovies.slice(2, 6));
  };

  const fetchMovies = async (pageNumber = 1, limit = 24) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/movies?page=${pageNumber}&limit=${limit}`
      );
      if (!response.ok) throw new Error('API server unavailable');
      const result = await response.json();

      if (result.data && result.data.movies && result.data.movies.length > 0) {
        const { movies, pagination } = result.data;

        const processedMovies = movies.map(movie => ({
          ...movie,
          thumb_url: movie.thumb_url?.startsWith('http')
            ? movie.thumb_url
            : `${movie.thumb_url}`,
          poster_url: movie.poster_url?.startsWith('http')
            ? movie.poster_url
            : `${movie.poster_url}`
        }));

        if (pageNumber === 1) {
          setFeaturedMovies(processedMovies.slice(0, 5));
          setTopMovies(processedMovies.slice(5, 17));     // 12 phim top
          setMovies(processedMovies);

          fetchMostViewedMovies();

          fetchUpcomingMovies();
        } else {
          setMovies(prevMovies => [...prevMovies, ...processedMovies]);
        }
      } else {
        fallbackToMockMovies();
      }
    } catch (error) {
      console.warn('API backend chưa bật hoặc lỗi mạng, tự động dùng mock data an toàn');
      fallbackToMockMovies();
    } finally {
      setLoading(false);
    }
  };

  const fetchMostViewedMovies = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/movie-views/most-viewed?days=1&limit=10&sort=createdAt`);

      if (!response.ok) {
        throw new Error('Failed to fetch most viewed movies');
      }

      const result = await response.json();

      if (result.message && result.data && result.data.movies) {
        const processedMovies = result.data.movies.map(movie => {
          const createdAt = movie.createdAt || movie.updatedAt || null;
          const isRecent = createdAt ?
            (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24) < 7 :
            false;

          return {
            ...movie,
            isRecent
          };
        });

        const sortedMovies = processedMovies.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA; // Newest first
        });

        setMostViewedMovies(sortedMovies);
      } else {
        console.error('Invalid data format from most-viewed API:', result);
        const fallbackResponse = await fetch(`http://localhost:5000/api/movies?limit=10&sort=-createdAt`);
        const fallbackResult = await fallbackResponse.json();

        if (fallbackResult.data && fallbackResult.data.movies) {

          const processedMovies = fallbackResult.data.movies.map(movie => {
            const createdAt = movie.createdAt || movie.updatedAt || null;
            const isRecent = createdAt ?
              (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24) < 7 :
              false;

            return {
              ...movie,
              isRecent
            };
          });

          setMostViewedMovies(processedMovies);
        }
      }
    } catch (error) {
      console.error('Error fetching most viewed movies:', error);
      try {
        const fallbackResponse = await fetch(`http://localhost:5000/api/movies?limit=10&sort=-createdAt`);
        const fallbackResult = await fallbackResponse.json();

        if (fallbackResult.data && fallbackResult.data.movies) {

          // Process movies to add isRecent flag
          const processedMovies = fallbackResult.data.movies.map(movie => {
            const createdAt = movie.createdAt || movie.updatedAt || null;
            const isRecent = createdAt ?
              (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24) < 7 :
              false;

            return {
              ...movie,
              isRecent
            };
          });

          setMostViewedMovies(processedMovies);
        }
      } catch (fallbackError) {
        setMostViewedMovies(mockMovies.slice(0, 6));
      }
    }
  };
  const fetchUpcomingMovies = async () => {
    try {
      const result = await upcomingMovieService.getUpcomingMovies(1, 30);

      if (result.success && result.upcomingMovies && result.upcomingMovies.length > 0) {
        setUpcomingMovies(result.upcomingMovies);
      } else {
        setUpcomingMovies(mockMovies.slice(2, 7));
      }
    } catch (error) {
      setUpcomingMovies(mockMovies.slice(2, 7));
    }
  };

  const fetchPublicUpcomingMovies = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/movies/upcoming?limit=10`);
      const data = await response.json();

      if (data.success && data.movies) {
        const processedMovies = data.movies.map(movie => {
          const releaseDate = movie.release_date ? new Date(movie.release_date) : new Date();
          const formattedDate = releaseDate.toLocaleDateString('vi-VN');

          return {
            ...movie,
            formattedReleaseDate: formattedDate,
            daysUntilRelease: Math.ceil((releaseDate - new Date()) / (1000 * 60 * 60 * 24)),
            countdownText: movie.release_date ? getCountdownText(releaseDate) : 'Sắp ra mắt'
          };
        });

        setUpcomingMovies(processedMovies);
      }
    } catch (fallbackError) {
      console.error('Error fetching public upcoming movies:', fallbackError);
    }
  };

  const handlePlayTrailer = (movie) => {
    try {
      setCurrentTrailerMovie(movie);
      setShowTrailerModal(true);
      setTrailerUrl('');

      const searchQuery = encodeURIComponent(`${movie.name} ${movie.origin_name || ''} ${movie.year || ''} official trailer`);

      fetch(`https://api.dailymotion.com/videos?fields=id,title,thumbnail_url&search=${searchQuery}&limit=1`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.list && data.list.length > 0) {
            const videoId = data.list[0].id;
            const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
            setTimeout(() => {
              setTrailerUrl(embedUrl);
            }, 500);
          } else {
            throw new Error('Không tìm thấy video trên Dailymotion');
          }
        })
        .catch(error => {
          console.error('Lỗi khi tìm kiếm trên Dailymotion:', error);

          const fallbackQuery = encodeURIComponent(`${movie.name} trailer`);

          fetch(`https://api.dailymotion.com/videos?fields=id,title&search=${fallbackQuery}&limit=1`)
            .then(response => response.json())
            .then(data => {
              if (data.list && data.list.length > 0) {
                const videoId = data.list[0].id;
                const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;

                setTimeout(() => {
                  setTrailerUrl(embedUrl);
                }, 500);
              } else {
                throw new Error('Không tìm thấy video với tìm kiếm đơn giản hơn');
              }
            })
            .catch(innerError => {
              console.error('Lỗi với tìm kiếm đơn giản hơn:', innerError);
              window.open(`https://www.dailymotion.com/search/${searchQuery}`, '_blank');
              setShowTrailerModal(false);
            });
        });

    } catch (error) {
      console.error('Lỗi khi tải trailer:', error);
      const fallbackQuery = encodeURIComponent(`${movie.name} trailer`);
      window.open(`https://www.dailymotion.com/search/${fallbackQuery}`, '_blank');
      setShowTrailerModal(false);
    }
  };

  useEffect(() => {
    fetchMovies(1);
    fetchUpcomingMovies();
  }, [endpoint]);

  useEffect(() => {
    if (featuredMovies.length > 0) {
      const autoSlideInterval = setInterval(() => {
        if (!isTransitioning) {
          handleNext();
        }
      }, 5000);

      return () => clearInterval(autoSlideInterval);
    }
  }, [featuredMovies, activeIndex, isTransitioning]);

  useEffect(() => {
    if (featuredMovies.length > 0) {
      featuredMovies.forEach(movie => {
        const img = new Image();
        img.src = movie.thumb_url || movie.poster_url || '/placeholder.jpg';
      });
    }
  }, [featuredMovies]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    // Only run on client-side
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        setIsMobile(window.innerWidth < 768);
      };

      // Set initial width
      handleResize();

      window.addEventListener('resize', handleResize);
      window.dispatchEvent(new Event('resize'));
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const handlePrev = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? featuredMovies.length - 1 : prevIndex - 1
    );

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
 //
  const handleNext = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    const nextIndex = activeIndex === featuredMovies.length - 1 ? 0 : activeIndex + 1;
    const nextMovie = featuredMovies[nextIndex];
    const img = new Image();
    img.src = nextMovie.thumb_url || nextMovie.poster_url || '/placeholder.jpg';

    setActiveIndex(nextIndex);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isTransitioning) {
      if (touchStart - touchEnd > 75) {
        // Swipe left - go next
        handleNext();
      } else if (touchEnd - touchStart > 75) {
        // Swipe right - go previous
        handlePrev();
      }
    }
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="movie-section mb-5">
      {previewMovie && previewMovie.episodes && previewMovie.episodes[0] && (
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
      )}      {loading && featuredMovies.length === 0 && (
        <div className="featured-movies mb-4">
          <div
            className="position-relative featured-container"
            style={{
              height: windowWidth < 480 ? '450px' : windowWidth < 768 ? '500px' : '800px',
              width: '100%',
              overflow: 'hidden',
              background: '#181818'
            }}
          >
            {/* Backdrop skeleton with subtle animation */}
            <div className="position-absolute top-0 start-0 w-100 h-100" style={{ opacity: 0.4 }}>
              <Skeleton height="100%" width="100%" />
            </div>

            {/* Gradient overlay for more depth */}
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
                zIndex: 2
              }}
            />
              {/* Movie cards carousel */}
            <div className="d-flex justify-content-center align-items-center h-100" style={{ zIndex: 3, position: 'relative' }}>
              {[...Array(5)].map((_, index) => {
                // Calculate position relative to center (index 2)
                const totalItems = 5;
                let position = index - 2; // Center card is at index 2, so position will be -2, -1, 0, 1, 2

                let zIndex = 4 - Math.abs(position);
                let scale = position === 0 ? 1 : 1 - Math.abs(position) * 0.2;

                let translateX = position * (
                  windowWidth < 480 ? 100 :
                  windowWidth < 768 ? 150 :
                  250
                );

                let opacity = 1 - Math.abs(position) * 0.2;

                let visibility =
                  windowWidth < 480 ? (Math.abs(position) <= 0 ? 'visible' : 'hidden') :
                  windowWidth < 768 ? (Math.abs(position) <= 1 ? 'visible' : 'hidden') :
                  (Math.abs(position) <= 2 ? 'visible' : 'hidden');

                let rotation = position * (
                  windowWidth < 480 ? -3 :
                  windowWidth < 768 ? -5 :
                  -15
                );

                return (
                  <div
                    key={`featured-skeleton-${index}`}
                    className="position-absolute"
                    style={{
                      width: windowWidth < 480 ? '220px' : windowWidth < 768 ? '280px' : '400px',
                      visibility,
                      zIndex,
                      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotation}deg)`,
                      transition: 'all 0.5s ease',
                      left: '50%',
                      marginLeft: windowWidth < 480 ? '-110px' : windowWidth < 768 ? '-140px' : '-200px',
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                      opacity
                    }}
                  >
                    <div className="card bg-dark border-0" style={{
                      boxShadow: position === 0
                        ? '0 10px 30px rgba(128, 128, 128, 0.3)'
                        : '0 5px 15px rgba(0, 0, 0, 0.5)'
                    }}>
                      {/* Movie poster skeleton */}
                      <div className="position-relative" style={{ borderRadius: '15px 15px 0 0', overflow: 'hidden' }}>
                        <Skeleton
                          height={windowWidth < 480 ? '330px' : windowWidth < 768 ? '400px' : '600px'}
                          borderRadius="15px 15px 0 0"
                        />
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination dots skeleton */}
            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 10 }}>
              <div className="d-flex gap-2">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={`indicator-skeleton-${index}`}
                    style={{                      width: index === 0 ? '30px' : '10px',
                      height: '10px',
                      borderRadius: '5px',
                      background: index === 0 ? 'rgba(128, 128, 128, 0.7)' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {featuredMovies.length > 0 && (
        <div className="featured-movies mb-4">
          <div
            className="position-relative featured-container"
            style={{
              height: windowWidth < 480 ? '450px' : windowWidth < 768 ? '500px' : '800px',
              width: '100%',
              overflow: 'hidden',
              background: '#000'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {featuredMovies[activeIndex] && (
              <>
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    backgroundImage: `url(${featuredMovies[activeIndex].backdrop_url || featuredMovies[activeIndex].poster_url || featuredMovies[activeIndex].thumb_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    filter: 'brightness(1)',
                    opacity: 1,
                    transition: 'all 0.7s ease-in-out',
                    zIndex: 1

                  }}
                />

                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
                    zIndex: 1
                  }}
                />
              </>
            )}

            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                background: 'radial-gradient(circle at center, rgba(255,0,0,0.07) 0%, rgba(0,0,0,0) 70%)',
                zIndex: 2
              }}
            />

            <div className="d-flex justify-content-center align-items-center h-100" style={{ zIndex: 3, position: 'relative' }}>
              {featuredMovies.map((movie, index) => {
                const totalItems = featuredMovies.length;
                let position = (index - activeIndex + totalItems) % totalItems;

                if (position > Math.floor(totalItems / 2)) {
                  position = position - totalItems;
                }

                let zIndex = 4 - Math.abs(position);
                let scale = position === 0 ? 1 : 1 - Math.abs(position) * 0.2;

                let translateX = position * (
                  windowWidth < 480 ? 100 :
                  windowWidth < 768 ? 150 :
                  250
                );

                let opacity = 1 - Math.abs(position) * 0.2;

                let visibility =
                  windowWidth < 480 ? (Math.abs(position) <= 0 ? 'visible' : 'hidden') :
                  windowWidth < 768 ? (Math.abs(position) <= 1 ? 'visible' : 'hidden') :
                  (Math.abs(position) <= 2 ? 'visible' : 'hidden');

                let rotation = position * (
                  windowWidth < 480 ? -3 :
                  windowWidth < 768 ? -5 :
                  -15
                );

                let cardWidth =
                  windowWidth < 480 ? '220px' :
                  windowWidth < 768 ? '280px' :
                  '400px';

                let marginLeft =
                  windowWidth < 480 ? '-110px' :
                  windowWidth < 768 ? '-140px' :
                  '-200px';

                const imageId = `featured-${movie.slug}`;

                return (
                  <div
                    key={imageId}
                    className="position-absolute"
                    style={{
                      width: cardWidth,
                      visibility,
                      zIndex,
                      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotation}deg)`,
                      opacity,
                      transition: 'all 0.5s ease',
                      cursor: 'pointer',
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                      left: '50%',
                      marginLeft
                    }}
                    onMouseOver={(e) => {
                      if (position !== 0) {
                        e.currentTarget.style.transform = `translateX(${translateX}px) scale(${scale * 1.05}) rotateY(${rotation * 0.8}deg)`;
                      }
                      handleMouseEnter(movie);
                    }}
                    onMouseOut={(e) => {
                      if (position !== 0) {
                        e.currentTarget.style.transform = `translateX(${translateX}px) scale(${scale}) rotateY(${rotation}deg)`;
                      }
                      handleMouseLeave();
                    }}
                    onClick={() => {
                      if (position !== 0 && !isTransitioning) {
                        setActiveIndex(index);
                      } else if (position === 0) {
                        window.location.href = `/movie/${movie.slug}`;
                      }
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="card bg-dark border-0">
                      <div className={`position-relative ${styles.moviePoster}`}>
                        <div
                          className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`}
                          style={{
                            height: windowWidth < 480 ? '330px' : windowWidth < 768 ? '400px' : '600px',
                            backgroundImage: `url(${movie.thumb_url || movie.poster_url})`,
                            backgroundSize: 'cover',
                            filter: loadedImages[imageId] ? 'none' : 'blur(10px)',
                            transition: 'filter 0.3s ease-in-out',
                            borderRadius: '15px 15px 0 0'
                          }}
                        >
                          {!loadedImages[imageId] && (
                            <Skeleton height={windowWidth < 480 ? '330px' : windowWidth < 768 ? '400px' : '600px'} borderRadius="15px 15px 0 0" />
                          )}
                          <img
                            src={movie.thumb_url || movie.poster_url}
                            alt={movie.name}
                            className="card-img-top"
                            loading="lazy"
                            style={{
                              height: windowWidth < 480 ? '330px' : windowWidth < 768 ? '400px' : '600px',
                              objectFit: 'cover',
                              borderRadius: '15px 15px 0 0',
                              boxShadow: position === 0
                                ? '0 10px 30px rgba(255, 0, 0, 0.3)'
                                : '0 5px 15px rgba(0, 0, 0, 0.5)'
                            }}
                            onLoad={() => handleImageLoad(imageId)}
                            onError={(e) => {
                              e.target.src = "/placeholder.jpg";
                              handleImageLoad(imageId);
                            }}
                          />
                        </div>

                        <div
                          className="position-absolute top-0 start-0 w-100 h-100"
                          style={{
                            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                            borderRadius: '15px 15px 0 0',
                            opacity: 1,
                            transition: 'opacity 0.3s'
                          }}
                        />

                        <Link
                          href={`/movie/${movie.slug}`}
                          className={`btn btn-sm ${styles.watchButton}`}
                        >
                          <i className="bi bi-play-fill"></i>
                        </Link>

                        <div className="position-absolute bottom-0 start-0 m-3" style={{ zIndex: 5 }}>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 10 }}>
              <div className="d-flex gap-2">
                {featuredMovies.map((_, index) => (
                  <button
                    key={index}
                    className="p-0 border-0"
                    style={{
                      width: index === activeIndex ? '30px' : '10px',
                      height: '10px',
                      borderRadius: '5px',
                      background: index === activeIndex ? '#dc3545' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => !isTransitioning && setActiveIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTopMovies && topMovies.length > 0 && (
        <div className="top-movies mb-5">
          <SectionHeader
            title="Phim Đề Xuất"
            badge="HOT"
            viewAllHref="/danh-sach/phim-de-xuat"
          />
          <div className={styles.sliderContainer}>
            <Slider
              key={`top-slider-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
              {...topMoviesSettings}
            >
              {topMovies.map((movie) => (
                <div
                  key={`top-${movie.slug}`}
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
          </div>
        </div>
      )}

      {mostViewedMovies.length > 0 && (
        <div className="most-viewed-movies mb-5">
          <SectionHeader
            title="Phim Được Xem Nhiều Nhất"
            badge="TOP 10"
            viewAllHref="/danh-sach/phim-hot"
          />
          <div className={styles.sliderContainer}>
            <Slider
              key={`horizontal-slider-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
              {...horizontalSliderSettings}
            >
              {mostViewedMovies.map((movie, index) => (
                <div
                  key={`most-viewed-${movie.slug}`}
                  className={styles.sliderItem}
                >
                  <MovieCardHorizontal
                    movie={movie}
                    rank={index + 1}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}

      {upcomingMovies && upcomingMovies.length > 0 && (
        <div className="upcoming-movies mb-5">
          <SectionHeader
            title={`Phim Sắp Ra Mắt (${upcomingMovies.length})`}
            badge="SẮP CHIẾU"
            viewAllHref="/danh-sach/phim-sap-chieu"
          />
          <div className={styles.sliderContainer}>
            <Slider
              key={`upcoming-slider-${mounted ? (isMobile ? 'm' : 'd') : 's'}`}
              {...topMoviesSettings}
            >
              {upcomingMovies.map((movie) => (
                <div
                  key={`upcoming-${movie.slug}`}
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
          </div>
        </div>
      )}

      {showTopMovies && <Moviecountry />}

      <SectionHeader
        title={title || "Danh Mục Phim"}
        viewAllHref="/danh-sach"
      />

      {/* Clean responsive movie grid with MovieCardVertical */}
      <div className="row movie-grid g-2 g-sm-3">
        {loading && page === 1
          ? [...Array(10)].map((_, i) => (
              <div key={`skeleton-${i}`} className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2-4 mb-3 mb-sm-4">
                <div className="card h-100 bg-dark border-0">
                  <Skeleton height="280px" borderRadius="8px" />
                  <div className="card-body p-2">
                    <Skeleton height="18px" width="85%" />
                    <div className="mt-1">
                      <Skeleton height="14px" width="65%" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : movies.slice(0, page * 10).map((movie) => (
              <div
                key={movie.slug}
                className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2-4 mb-3 mb-sm-4"
              >
                <MovieCardVertical
                  movie={movie}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            ))}
      </div>

      <div className="text-center mt-4">
        <button
          className="btn btn-outline-danger px-4"
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Xem thêm'}
        </button>
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#808080',
            color: 'white',
            border: 'none',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.38)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '1.5rem',
            zIndex: 1000,
            opacity: 0.8,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <i className="bi bi-arrow-up"></i>
        </button>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .video-preview-overlay {
          animation: fadeIn 0.3s ease-in-out;
        }
        .col-xl-2-4 {
          flex: 0 0 20%;
          max-width: 20%;
        }
        .movie-grid {
          margin-right: -10px;
          margin-left: -10px;
        }
        .movie-grid > [class*="col-"] {
          padding-right: 10px;
          padding-left: 10px;
        }
        .slick-list {
          padding: 14px 5% 18px 0 !important;
          margin-top: -14px !important;
          margin-bottom: -18px !important;
        }
        .slick-track {
          margin-left: 0;
        }
        .mobile-movie-slider .slick-list {
          overflow: visible !important;
          padding: 0 15% 0 0 !important;
        }
        .mobile-movie-slider .slick-track {
          margin-left: 0;
          display: flex !important;
        }
        .mobile-movie-slider .slick-slide {
          height: inherit !important;
          margin: 0 10px;
        }
        @media (max-width: 576px) {
          .mobile-movie-slider .slick-slide {
            margin: 0 5px;
          }
        }
        @media (max-width: 1200px) {
          .col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
        @media (max-width: 768px) {
          .featured-container {
            height: 500px !important;
          }
          .movie-grid {
            margin-right: -7px;
            margin-left: -7px;
          }
          .movie-grid > [class*="col-"] {
            padding-right: 7px;
            padding-left: 7px;
          }
          .video-preview-overlay {
            width: 90% !important;
            max-width: 400px !important;
          }
          .card-body {
            padding: 10px;
          }
          h3 {
            font-size: 1.5rem;
            margin-bottom: 0.75rem !important;
          }
          h6 {
            font-size: 0.9rem;
          }
          .btn {
            padding: 0.25rem 0.75rem;
            font-size: 0.875rem;
          }
          .mb-5 {
            margin-bottom: 2rem !important;
          }
          .mb-4 {
            margin-bottom: 1.25rem !important;
          }
        }
        @media (max-width: 576px) {
          .featured-container {
            height: 450px !important;
          }
          .movie-grid {
            margin-right: -5px;
            margin-left: -5px;
          }
          .movie-grid > [class*="col-"] {
            padding-right: 5px;
            padding-left: 5px;
          }
          .card-body {
            padding: 8px;
          }
          h3 {
            font-size: 1.25rem;
          }
          h6 {
            font-size: 0.8rem;
          }
          .badge {
            font-size: 65%;
            padding: 0.25em 0.4em;
          }
          .mb-5 {
            margin-bottom: 1.5rem !important;
          }
          .mb-4 {
            margin-bottom: 1rem !important;
          }
        }        @media (max-width: 480px) {
          .featured-container {
            height: 400px !important;
          }

          /* Mobile-specific trailer modal optimizations */
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-start !important;
            padding-top: 20px !important;
          }

          .trailer-modal-content {
            width: 95vw !important;
            max-width: 95vw !important;
            border-radius: 4px !important;
            margin: 0 10px !important;
            max-height: 95vh !important;
            overflow-y: auto !important;
          }

          .modal-header {
            padding: 0.75rem !important;
            flex-wrap: wrap !important;
          }

          .modal-header h5 {
            font-size: 1rem !important;
            line-height: 1.2 !important;
            margin-right: 1rem !important;
            flex: 1 !important;
          }

          .btn-close {
            padding: 0.5rem !important;
            font-size: 1.25rem !important;
            min-width: 44px !important;
            min-height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .trailer-container {
            margin: 0.5rem !important;
            min-height: 250px !important;
          }

          .trailer-loading {
            min-height: 250px !important;
            padding: 1rem !important;
          }

          .trailer-loading p {
            font-size: 0.9rem !important;
            text-align: center !important;
            margin: 0 !important;
          }

          .trailer-movie-info {
            padding: 0 0.75rem 1rem !important;
          }

          .trailer-movie-info h6 {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
          }

          .trailer-movie-info .d-flex.justify-content-between {
            flex-direction: column !important;
            gap: 1rem !important;
          }

          .trailer-movie-info .d-flex.gap-2 {
            align-self: stretch !important;
          }

          .trailer-movie-info .badge {
            font-size: 0.75rem !important;
            padding: 0.25rem 0.5rem !important;
          }

          .trailer-movie-info .btn {
            flex: 1 !important;
            min-height: 44px !important;
            font-size: 0.85rem !important;
            padding: 0.75rem !important;
          }

          .movie-description {
            margin-bottom: 1rem !important;
          }

          .movie-description p {
            font-size: 0.85rem !important;
            max-height: 120px !important;
            line-height: 1.4 !important;
            padding: 0.75rem !important;
          }

          .movie-description h6,
          .trailer-movie-info h6.text-white-50 {
            font-size: 0.85rem !important;
            margin-bottom: 0.5rem !important;
          }
        }
      `}</style>
      {showTrailerModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.3s ease',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target.classList.contains('modal-overlay')) {
              setShowTrailerModal(false);
              setTimeout(() => setTrailerUrl(''), 100);
            }
          }}
        >
          <div
            className="trailer-modal-content"
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.95)',
              borderRadius: '8px',
              maxWidth: '90vw',
              width: '900px',
              margin: '0 auto',
              position: 'relative',
              boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              animation: 'fadeIn 0.3s ease'
            }}
          >            <div
              className="modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#000000'
              }}
            >
              <h5 style={{ color: 'white', margin: 0 }}>
                Trailer: {currentTrailerMovie?.name}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowTrailerModal(false);
                  setTimeout(() => setTrailerUrl(''), 100);
                }}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem' }}
              >×</button>
            </div>
            <div
              className="trailer-container"
              style={{
                margin: '1rem',
                position: 'relative',
                minHeight: '400px'
              }}
            >
              {trailerUrl ? (
                <div className="ratio ratio-16x9">
                  <iframe
                    src={trailerUrl}
                    title={`Trailer phim ${currentTrailerMovie?.name}`}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="rounded"
                    style={{ borderRadius: '4px' }}
                  ></iframe>
                </div>
              ) : (
                <div
                  className="trailer-loading"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    backgroundColor: '#111'
                  }}
                >
                  <div className="spinner-border text-danger mb-3" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="text-light">Đang tìm trailer cho phim {currentTrailerMovie?.name}...</p>
                </div>              )}
            </div>

            {currentTrailerMovie && (
              <div className="trailer-movie-info" style={{ padding: '0 1rem 1.5rem', color: 'white' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="text-danger mb-1">{currentTrailerMovie.origin_name}</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {currentTrailerMovie.formattedReleaseDate && (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-calendar-event me-1"></i>
                          {currentTrailerMovie.formattedReleaseDate}
                        </span>
                      )}
                      {currentTrailerMovie.countdownText && (
                        <span className="badge bg-danger">
                          <i className="bi bi-hourglass-split me-1"></i>
                          {currentTrailerMovie.countdownText}
                        </span>
                      )}
                      {currentTrailerMovie.type && (
                        <span className="badge bg-secondary">
                          {currentTrailerMovie.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                        </span>
                      )}
                      {currentTrailerMovie.lang && (
                        <span className="badge bg-info">
                          {currentTrailerMovie.lang || 'Vietsub'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(currentTrailerMovie.name + ' ' + currentTrailerMovie.origin_name + ' phim')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-light"
                    >
                      <i className="bi bi-google me-1"></i>
                      Tìm kiếm
                    </a>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: currentTrailerMovie.name,
                            text: `Xem trailer phim ${currentTrailerMovie.name}`,
                            url: window.location.href
                          })
                          .catch(err => {});
                        } else {
                          navigator.clipboard.writeText(window.location.href)
                            .then(() => alert('Đã sao chép liên kết vào clipboard'))
                            .catch(err => {});
                        }
                      }}
                    >
                      <i className="bi bi-share me-1"></i>
                      Chia sẻ
                    </button>
                  </div>
                </div>

                {currentTrailerMovie.category && Array.isArray(currentTrailerMovie.category) && currentTrailerMovie.category.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-white-50 mb-1">Thể loại:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {currentTrailerMovie.category.map((cat, index) => (
                        cat?.name && (
                          <span key={index} className="badge bg-primary me-1 mb-1">
                            {cat.name}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {currentTrailerMovie.content && (
                  <div className="movie-description mb-3">
                    <h6 className="text-white-50 mb-1">Nội dung:</h6>
                    <p className="small text-white" style={{
                      maxHeight: '80px',
                      overflow: 'auto',
                      textAlign: 'justify',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px'
                    }}>
                      {currentTrailerMovie.content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieCategory;
