import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Layout/Navbar";
import styles from "../styles/Movies.module.css";
import Skeleton from "../components/UI/Skeleton";
import { FaPlayCircle, FaStar, FaClock, FaChevronDown, FaSync } from "react-icons/fa";

// Movies page component for "Phim Lẻ" (single movies)
const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const [totalMovies, setTotalMovies] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Bộ lọc phim - Use a single filters object
  // Hardcoded filter options similar to search.js
  const categories = [
    "Hành Động",
    "Tình Cảm",
    "Hài Hước",
    "Cổ Trang",
    "Tâm Lý",
    "Hình Sự",
    "Chiến Tranh",
    "Thể Thao",
    "Võ Thuật",
    "Viễn Tưởng",
    "Phiêu Lưu",
    "Khoa Học",
    "Kinh Dị",
    "Âm Nhạc",
    "Thần Thoại",
    "Hoạt Hình"
  ];

  // Danh sách quốc gia
  const countries = [
    "Trung Quốc",
    "Hàn Quốc",
    "Nhật Bản",
    "Thái Lan",
    "Âu Mỹ",
    "Đài Loan",
    "Hồng Kông",
    "Ấn Độ",
    "Việt Nam"
  ];

  // Tạo danh sách năm từ năm hiện tại đến 2010
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2005 }, (_, i) => currentYear - i);

  const [filters, setFilters] = useState({
    category: "",
    country: "",
    year: "",
    type: "single" // Default to type "single" for movies page
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const [sortOption, setSortOption] = useState("newest"); // Default sort
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
      const dropdownMenus = document.querySelectorAll('.dropdown-menu');
      let clickedOutside = true;

      dropdownToggles.forEach(toggle => {
        if (toggle.contains(event.target)) {
          clickedOutside = false;
        }
      });
      dropdownMenus.forEach(menu => {
        if (menu.contains(event.target)) {
          clickedOutside = false;
        }
      });

      if (clickedOutside) {
        setShowCategoryDropdown(false);
        setShowCountryDropdown(false);
        setShowYearDropdown(false);
        setShowSortOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Initial load and fetch filters
  useEffect(() => {
    // Fetch initial movies on mount
    fetchMovies(1, false);
  }, []); // Run only once on mount
  
  // We're removing the automatic filter refresh on filter/sort change
  // Instead, we'll use an Apply button to trigger the fetch

  const handleCategoryToggle = (e) => {
    e.stopPropagation();
    setShowCategoryDropdown(prev => !prev);
    setShowCountryDropdown(false);
    setShowYearDropdown(false);
    setShowSortOptions(false);
  };

  const handleCountryToggle = (e) => {
    e.stopPropagation();
    setShowCountryDropdown(prev => !prev);
    setShowCategoryDropdown(false);
    setShowYearDropdown(false);
    setShowSortOptions(false);
  };

  const handleYearToggle = (e) => {
    e.stopPropagation();
    setShowYearDropdown(prev => !prev);
    setShowCategoryDropdown(false);
    setShowCountryDropdown(false);
    setShowSortOptions(false);
  };
  const handleCategorySelect = (categoryId) => {
    // Just update filter state without fetching
    setFilters(prev => {
      const newFilters = { ...prev, category: categoryId };
      console.log("Selecting category:", categoryId);
      return newFilters;
    });
    setShowCategoryDropdown(false);
  };

  const handleCountrySelect = (countryCode) => {
    // Just update filter state without fetching
    setFilters(prev => {
      const newFilters = { ...prev, country: countryCode };
      console.log("Selecting country:", countryCode);
      return newFilters;
    });
    setShowCountryDropdown(false);
  };

  const handleYearSelect = (year) => {
    // Just update filter state without fetching
    setFilters(prev => {
      const newFilters = { ...prev, year };
      console.log("Selecting year:", year);
      return newFilters;
    });
    setShowYearDropdown(false);
  };
  
  // New function to apply all filters at once
  const applyFilters = () => {
    setLoading(true);
    setPage(1);
    fetchMovies(1, false);
  };
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortOptions(false);
    // No longer triggers immediate fetch
  };

  const getSortOptionName = (option = sortOption) => {
    switch (option) {
      case 'a-z': return 'A-Z';
      case 'z-a': return 'Z-A';
      case 'highest-rating': return 'Đánh giá cao nhất';
      case 'lowest-rating': return 'Đánh giá thấp nhất';
      case 'newest': return 'Mới nhất';
      case 'oldest': return 'Cũ nhất';
      case 'year-desc': return 'Năm mới nhất';
      case 'year-asc': return 'Năm cũ nhất';
      default: return 'Mới nhất';
    }
  };

  const toggleSortDropdown = (e) => {
    e.stopPropagation();
    setShowSortOptions(!showSortOptions);
    setShowCategoryDropdown(false);
    setShowCountryDropdown(false);
    setShowYearDropdown(false);
  };
  const fetchMovies = async (pageNumber, isLoadMore = false) => {
    // Prevent duplicate fetching while already loading
    if (loading && !refreshing && pageNumber > 1) {
      console.log('Already loading, skipping fetch request');
      return;
    }
    
    // Keep track of the current fetch operation
    const currentFetchId = Date.now().toString();

    try {
      setLoading(true);
      // Clear movies only on refresh or filter/sort change (pageNumber === 1 and not loadMore)
      if (refreshing || (pageNumber === 1 && !isLoadMore)) {
        setMovies([]);
      }

      // Use the /api/search endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const searchUrl = `${apiUrl}/search`;

      // Build query parameters for the search endpoint
      const params = new URLSearchParams();
      params.append('q', ''); // Use empty query for filtering
      params.append('page', pageNumber);
      params.append('size', 24); // Keep the limit
      params.append('type', filters.type); // Always 'single' for this page

      if (filters.category) params.append('category', filters.category);
      if (filters.country) params.append('country', filters.country);
      if (filters.year) params.append('year', filters.year);
      if (sortOption) params.append('sort', sortOption); // Add sort option

      // Log the search parameters for debugging
      console.log('Searching movies with filters:', {
        type: filters.type,
        category: filters.category,
        country: filters.country,
        year: filters.year,
        sort: sortOption,
        page: pageNumber
      });

      const url = `${searchUrl}?${params.toString()}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('API Response:', result);      // Process response from the search API
      if (result && result.hits && Array.isArray(result.hits)) {
        const newMovies = result.hits; // Get movies array from hits
        const totalItems = result.total || 0; // Get total count
        const pageSize = 24;
        const totalPages = Math.ceil(totalItems / pageSize);

        console.log(`Found ${newMovies.length} movies of total ${totalItems}`);
        
        if (newMovies.length === 0) {
          console.log('No movies found with current filters');
        }

        // First, process the movies with all necessary fields
        const processedMovies = newMovies.map(movie => ({
          ...movie,
          // Ensure URLs are absolute if needed
          thumb_url: movie.thumb_url || movie.poster_url || '/placeholder.jpg',
          poster_url: movie.poster_url || movie.thumb_url || '/placeholder.jpg'
        }));
        
        // Then, deduplicate the movies by slug or other identifiers
        const uniqueMovies = [];
        const seenSlugs = new Set();
        const seenIds = new Set();
        
        processedMovies.forEach(movie => {
          // Create a composite identifier when slug/id is missing
          const compositeId = !movie.slug && !movie._id && !movie.id 
            ? `${movie.name}-${movie.year || ''}-${movie.origin_name || ''}`
            : null;
            
          // Check if we've already seen this movie
          if (
            (movie.slug && seenSlugs.has(movie.slug)) || 
            (movie._id && seenIds.has(movie._id)) ||
            (movie.id && seenIds.has(movie.id)) ||
            (compositeId && seenIds.has(compositeId))
          ) {
            return; // Skip this movie
          }
          
          // Add to seen sets
          if (movie.slug) seenSlugs.add(movie.slug);
          if (movie._id) seenIds.add(movie._id);
          if (movie.id) seenIds.add(movie.id);
          if (compositeId) seenIds.add(compositeId);
          
          // Add to unique movies
          uniqueMovies.push(movie);        });
        
        console.log(`Deduplicated to ${uniqueMovies.length} movies`);
        
        // Set movies based on page number
        if (pageNumber === 1 || !isLoadMore || refreshing) {
          // On the first page or refresh, just replace the movies
          setMovies(uniqueMovies);
        } else {
          // When loading more, ensure we only add unique movies by checking all possible IDs
          setMovies(prev => {
            // Use a Map to track existing movies by all possible identifiers (id, _id, slug)
            const existingMoviesMap = new Map();
            
            // Add all existing movies to the map with multiple keys
            prev.forEach(m => {
              if (m._id) existingMoviesMap.set(m._id, m);
              if (m.id) existingMoviesMap.set(m.id, m);
              if (m.slug) existingMoviesMap.set(m.slug, m);
              // Also use a composite key to catch edge cases
              const compositeKey = `${m.name}-${m.year}-${m.origin_name}`;
              existingMoviesMap.set(compositeKey, m);
            });
            
            // Filter only movies that don't exist in our map
            const uniqueNewMovies = uniqueMovies.filter(m => {
              // Check against all possible identifiers
              const idExists = (m._id && existingMoviesMap.has(m._id)) || 
                              (m.id && existingMoviesMap.has(m.id)) || 
                              (m.slug && existingMoviesMap.has(m.slug));
              
              // Also check by composite key for movies that might have changed ID but are the same
              const compositeKey = `${m.name}-${m.year}-${m.origin_name}`;
              const compositeExists = existingMoviesMap.has(compositeKey);
              
              return !idExists && !compositeExists;
            });
            
            console.log(`Found ${uniqueNewMovies.length} truly unique new movies`);
            return [...prev, ...uniqueNewMovies];
          });
        }

        setTotalMovies(totalItems);
        setHasMore(pageNumber < totalPages);
        setPage(pageNumber); // Update current page based on the fetch request
      } else {
        // Handle cases where search API returns no hits or error
        if (pageNumber === 1 || refreshing) {
          setMovies([]);
        }
        setHasMore(false);
        setTotalMovies(0);
        console.error("Search API did not return expected 'hits' structure:", result);
      }
    } catch (error) {
      console.error('Error fetching movies via search API:', error);
      if (pageNumber === 1 || refreshing) {
        setMovies([]);
      }
      setHasMore(false);
      setTotalMovies(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const loadMore = () => {
    if (!loading && hasMore) {
      // Set a loading state
      setLoading(true);
      
      // Calculate the next page
      const nextPage = page + 1;
      console.log(`Loading more movies, page ${nextPage}`);
      
      // Add a small delay to prevent race conditions with multiple clicks
      setTimeout(() => {
        fetchMovies(nextPage, true);
      }, 50);
    }
  };

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchMovies(1, false);
  };

  return (
    <>
      <Head>
        <title>Phim Lẻ | Movie Streaming</title>
        <meta name="description" content="Xem phim lẻ hay nhất và mới nhất trên Movie Streaming" />
      </Head>

      <div className={styles.container}>

        <div className="container py-5 mt-5">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="text-white">Phim Lẻ</h1>
              <p className="text-secondary">
                Tổng hợp các bộ phim lẻ, phim chiếu rạp hay nhất, cập nhật nhanh nhất
                {totalMovies > 0 && ` (${totalMovies} phim)`}
              </p>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12 d-flex flex-wrap gap-3 align-items-center">
              <div className="dropdown">
                <button
                  className={`btn ${filters.category ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center`}
                  onClick={handleCategoryToggle}
                  aria-expanded={showCategoryDropdown}
                >   
                  {filters.category || "Thể loại"} <FaChevronDown className="ms-2" />
                </button>
                {showCategoryDropdown && (
                  <ul className="dropdown-menu show dropdown-menu-dark">
                    <li>
                      <button
                        className={`dropdown-item ${!filters.category ? 'active' : ''}`}
                        onClick={() => handleCategorySelect("")}
                      >
                        Tất cả thể loại
                      </button>
                    </li>
                    {categories.map(category => (
                      <li key={category}>
                        <button
                          className={`dropdown-item ${filters.category === category ? 'active' : ''}`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className={`btn ${filters.country ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center`}
                  onClick={handleCountryToggle}
                  aria-expanded={showCountryDropdown}
                >
                  {filters.country || "Quốc gia"} <FaChevronDown className="ms-2" />
                </button>
                {showCountryDropdown && (
                  <ul className="dropdown-menu show dropdown-menu-dark">
                    <li>
                      <button
                        className={`dropdown-item ${!filters.country ? 'active' : ''}`}
                        onClick={() => handleCountrySelect("")}
                      >
                        Tất cả quốc gia
                      </button>
                    </li>
                    {countries.map(country => (
                      <li key={country}>
                        <button
                          className={`dropdown-item ${filters.country === country ? 'active' : ''}`}
                          onClick={() => handleCountrySelect(country)}
                        >
                          {country}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className={`btn ${filters.year ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center`}
                  onClick={handleYearToggle}
                  aria-expanded={showYearDropdown}
                >
                  {filters.year || "Năm"} <FaChevronDown className="ms-2" />
                </button>
                {showYearDropdown && (
                  <ul className="dropdown-menu show dropdown-menu-dark">
                    <li>
                      <button
                        className={`dropdown-item ${!filters.year ? 'active' : ''}`}
                        onClick={() => handleYearSelect("")}
                      >
                        Tất cả năm
                      </button>
                    </li>
                    {years.map(year => (
                      <li key={year}>
                        <button
                          className={`dropdown-item ${filters.year === year ? 'active' : ''}`}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                  onClick={toggleSortDropdown}
                  aria-expanded={showSortOptions}
                >
                  {getSortOptionName()} <FaChevronDown className="ms-2" />
                </button>
                {showSortOptions && (
                  <ul className="dropdown-menu show dropdown-menu-dark" style={{ minWidth: '200px' }}>
                    <li><button className={`dropdown-item ${sortOption === 'newest' ? 'active' : ''}`} onClick={() => handleSortChange('newest')}>Mới nhất</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'oldest' ? 'active' : ''}`} onClick={() => handleSortChange('oldest')}>Cũ nhất</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'a-z' ? 'active' : ''}`} onClick={() => handleSortChange('a-z')}>A-Z</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'z-a' ? 'active' : ''}`} onClick={() => handleSortChange('z-a')}>Z-A</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'highest-rating' ? 'active' : ''}`} onClick={() => handleSortChange('highest-rating')}>Đánh giá cao nhất</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'lowest-rating' ? 'active' : ''}`} onClick={() => handleSortChange('lowest-rating')}>Đánh giá thấp nhất</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'year-desc' ? 'active' : ''}`} onClick={() => handleSortChange('year-desc')}>Năm mới nhất</button></li>
                    <li><button className={`dropdown-item ${sortOption === 'year-asc' ? 'active' : ''}`} onClick={() => handleSortChange('year-asc')}>Năm cũ nhất</button></li>
                  </ul>
                )}
              </div>              <button
                className="btn btn-danger d-flex align-items-center"
                onClick={applyFilters}
                disabled={loading}
              >
                Áp dụng bộ lọc
              </button>
            
              <button
                className="btn btn-outline-light d-flex align-items-center ms-auto"
                onClick={handleRefresh}
                disabled={loading || refreshing}
              >
                <FaSync className={`me-2 ${refreshing ? 'spin' : ''}`} />
                {refreshing ? 'Đang làm mới...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {/* Active filter display */}
          {(filters.category || filters.country || filters.year) && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="text-white me-2">Lọc theo:</span>
                  
                  {filters.category && (
                    <span className="badge bg-danger p-2">
                      Thể loại: {filters.category}
                      <button 
                        className="btn btn-sm ms-2 p-0 text-white" 
                        onClick={() => setFilters(prev => ({ ...prev, category: "" }))}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  )}
                  
                  {filters.country && (
                    <span className="badge bg-danger p-2">
                      Quốc gia: {filters.country}
                      <button 
                        className="btn btn-sm ms-2 p-0 text-white" 
                        onClick={() => setFilters(prev => ({ ...prev, country: "" }))}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  )}
                  
                  {filters.year && (
                    <span className="badge bg-danger p-2">
                      Năm: {filters.year}
                      <button 
                        className="btn btn-sm ms-2 p-0 text-white" 
                        onClick={() => setFilters(prev => ({ ...prev, year: "" }))}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  )}
                    <button 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => {
                      setFilters({ category: "", country: "", year: "", type: "single" });
                      // Apply the cleared filters immediately
                      setTimeout(() => {
                        setLoading(true);
                        fetchMovies(1, false);
                      }, 0);
                    }}
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 row-cols-xl-5 g-4 mb-4">
            {(loading && page === 1 && !refreshing) || (refreshing) ? (
              // Show skeletons when loading
              [...Array(24)].map((_, i) => (
                <div key={`skeleton-${i}`} className="col mb-4">
                  <div className="card h-100 bg-dark border-0">
                    <Skeleton height="300px" borderRadius="8px" />
                    <div className="card-body p-2">
                      <Skeleton height="18px" width="85%" />
                      <div className="mt-1">
                        <Skeleton height="14px" width="65%" />
                      </div>
                    </div>
                  </div>
                </div>
              ))            ) : movies && movies.length > 0 ? (
              // Show movies if available
              movies.map((movie, index) => {
                // Generate a stable unique ID for each movie using all available identifiers
                const movieUniqueId = movie.slug || movie._id || movie.id || `movie-${index}-${movie.name}-${movie.year || ''}`;
                const imageId = `movie-${movieUniqueId}`;
                
                return (
                  <div
                    key={movieUniqueId}
                    className="col mb-4"
                  >
                    <div className={`card h-100 bg-dark border-0 ${styles.movieCard}`}>
                      <div className={`position-relative ${styles.moviePoster}`}>
                        <img
                          src={movie.thumb_url || movie.poster_url || "/img/Phim.png"}
                          className={`card-img-top ${styles.movieImage}`}
                          alt={movie.name}
                          loading="lazy"
                          style={{
                            height: '300px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                          onLoad={() => handleImageLoad(imageId)}
                          onError={(e) => {
                            e.target.src = "/img/Phim.png";
                            handleImageLoad(imageId);
                          }}
                        />

                        <div className={styles.overlay}>
                          <Link
                            href={`/movie/${movie.slug}`}
                            className={styles.playButton}
                          >
                            <FaPlayCircle size={48} />
                          </Link>
                        </div>

                        <div className={styles.movieInfo}>
                          {movie.year && (
                            <span className="badge bg-danger me-1">
                              {movie.year}
                            </span>
                          )}
                          {movie.quality && (
                            <span className="badge bg-primary me-1">
                              {movie.quality}
                            </span>
                          )}
                          {movie.lang && (
                            <span className="badge bg-info">
                              {movie.lang || 'Vietsub'}
                            </span>
                          )}
                        </div>

                        {movie.rating > 0 && (
                          <div className={styles.ratingBadge}>
                            <FaStar /> {movie.rating.toFixed(1)}
                          </div>
                        )}

                        {movie.time && (
                          <div className={styles.durationBadge}>
                            <FaClock /> {movie.time}
                          </div>
                        )}
                      </div>

                      <div className="card-body py-0 px-1" style={{backgroundColor: "#1a1a1a", minHeight: "auto"}}>
                        <h6 className={`card-title text-white mb-0 ${styles.movieTitleEllipsis}`}>
                          <Link href={`/movie/${movie.slug}`} legacyBehavior>
                            <a className="text-decoration-none stretched-link" style={{ color: 'inherit' }}>
                              {movie.name}
                            </a>
                          </Link>
                        </h6>
                        {movie.origin_name && (
                          <p className="card-text small text-muted text-truncate mb-0" style={{fontSize: "10px", lineHeight: 1, maxHeight: "14px"}} title={movie.origin_name}>
                            {movie.origin_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // No movies found message
              <div className="col-12">
                <div className="text-center py-5">
                  <div className="mb-3">
                    <FaPlayCircle size={60} className="text-secondary" />
                  </div>
                  <h3 className="text-white">Không tìm thấy phim</h3>
                  <p className="text-secondary">
                    Không có phim lẻ nào phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    className="btn btn-outline-light mt-3"
                    onClick={() => {
                      setFilters({ category: "", country: "", year: "", type: "single" });
                      setTimeout(() => fetchMovies(1, false), 0);
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            )}
          </div>

          {!loading && hasMore && (
            <div className="text-center mt-4 mb-5">
              <button
                className="btn btn-outline-danger px-4 py-2"
                onClick={loadMore}
                disabled={loading}
              >
                Xem thêm
              </button>
            </div>
          )}

          {loading && page > 1 && !refreshing && (
            <div className="text-center mt-4 mb-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-2">Đang tải thêm phim...</p>
            </div>
          )}

          {!loading && !refreshing && movies.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3">
                <FaPlayCircle size={60} className="text-secondary" />
              </div>
              <h3 className="text-white">Không tìm thấy phim</h3>
              <p className="text-secondary">
                Không có phim lẻ nào phù hợp với bộ lọc hiện tại.
              </p>              <button
                className="btn btn-outline-light mt-3"
                onClick={() => {
                  setFilters({ category: "", country: "", year: "", type: "single" });
                  // Apply the cleared filters immediately
                  setTimeout(() => {
                    setLoading(true);
                    fetchMovies(1, false);
                  }, 0);
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .movie-grid {
          margin-right: -10px;
          margin-left: -10px;
        }

        .movie-grid > [class*="col-"] {
          padding-right: 10px;
          padding-left: 10px;
        }

        @media (max-width: 1200px) {
          .col-xl-2 {
            flex: 0 0 20%;
            max-width: 20%;
          }
        }

        @media (max-width: 992px) {
          .col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }

        @media (max-width: 768px) {
          .movie-grid {
            margin-right: -7px;
            margin-left: -7px;
          }

          .movie-grid > [class*="col-"] {
            padding-right: 7px;
            padding-left: 7px;
          }
        }

        @media (max-width: 576px) {
          .movie-grid {
            margin-right: -5px;
            margin-left: -5px;
          }

          .movie-grid > [class*="col-"] {
            padding-right: 5px;
            padding-left: 5px;
          }
        }

        .dropdown-menu {
          background-color: #212529;
          color: white;
          border: 1px solid rgba(255,255,255,0.15);
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-item {
          color: rgba(255,255,255,0.8);
        }

        .dropdown-item:hover {
          background-color: rgba(255,255,255,0.1);
          color: white;
        }

        .dropdown-item.active, .dropdown-item:active {
          background-color: #dc3545;
          color: white;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ms-auto {
          margin-left: auto !important;
        }
      `}</style>
    </>
  );
};

export default Movies;