import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Layout/Navbar";
import styles from "../styles/Movies.module.css";
import Skeleton from "../components/UI/Skeleton";
import { FaPlayCircle, FaStar, FaFilm, FaChevronDown, FaSync } from "react-icons/fa";

// Series page component for "Phim Bộ" (TV series)
const Series = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const [totalSeries, setTotalSeries] = useState(0);
    // Bộ lọc phim - Use hardcoded filter options like in movies.js
  // Hardcoded filter options
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
    type: "series" // Default to type "series" for series page
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  
  const [sortOption, setSortOption] = useState("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Hàm sắp xếp phim theo tùy chọn đã chọn
  const sortSeriesData = (seriesList) => {
    if (!Array.isArray(seriesList)) return [];
    
    const seriesCopy = [...seriesList];
    
    switch (sortOption) {
      case 'a-z':
        return seriesCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return seriesCopy.sort((a, b) => b.name.localeCompare(a.name));
      case 'highest-rating':
        return seriesCopy.sort((a, b) => b.rating - a.rating);
      case 'lowest-rating':
        return seriesCopy.sort((a, b) => a.rating - b.rating);
      case 'newest':
        return seriesCopy.sort((a, b) => new Date(b.modified?.time || b.modified || b.created_at || 0) - new Date(a.modified?.time || a.modified || a.created_at || 0));
      case 'oldest':
        return seriesCopy.sort((a, b) => new Date(a.modified?.time || a.modified || a.created_at || 0) - new Date(b.modified?.time || b.modified || b.created_at || 0));
      case 'year-desc':
        return seriesCopy.sort((a, b) => b.year - a.year);
      case 'year-asc':
        return seriesCopy.sort((a, b) => a.year - b.year);
      default:
        return seriesCopy;
    }
  };

  // Hàm xử lý thay đổi tùy chọn sắp xếp
  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  // Lấy tên hiển thị của tùy chọn sắp xếp hiện tại
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

  // Tắt/mở dropdown sắp xếp
  const toggleSortDropdown = (e) => {
    e.stopPropagation();
    setShowSortOptions(!showSortOptions);
    setShowCategoryDropdown(false);
    setShowCountryDropdown(false);
    setShowYearDropdown(false);
  };
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
  }, [showCategoryDropdown, showCountryDropdown, showYearDropdown, showSortOptions]);  useEffect(() => {
    // Initial load of series
    fetchSeries(1);
  }, []);
  
  // We're removing automatic filtering on filter/sort change
  // Instead we'll use an Apply button
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
  
  const handleCategorySelect = (category) => {
    // Just update filter state without fetching
    setFilters(prev => {
      const newFilters = { ...prev, category };
      console.log("Selecting category:", category);
      return newFilters;
    });
    setShowCategoryDropdown(false);
  };
  
  const handleCountrySelect = (country) => {
    // Just update filter state without fetching
    setFilters(prev => {
      const newFilters = { ...prev, country };
      console.log("Selecting country:", country);
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
    fetchSeries(1);
  };

  const fetchSeries = async (pageNumber) => {
    try {
      setLoading(true);
      
      // Tạo query parameters từ các bộ lọc
      let queryParams = `page=${pageNumber}&limit=24`;
      
      // Thêm các bộ lọc vào query parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams += `&${key}=${filters[key]}`;
        }
      });
      
      // Log query parameters for debugging
      console.log('Fetching series with params:', queryParams);
      
      // Fetch TV series (Phim Bộ) using the backend API with appropriate type parameter
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${apiUrl}/movies?${queryParams}`
      );
      
      const result = await response.json();
      
      if (result.data && result.data.movies) {
        const { movies: newSeries, pagination } = result.data;
          // Process series for display
        const processedSeries = newSeries.map(series => ({
          ...series,
          thumb_url: series.thumb_url?.startsWith('http') 
            ? series.thumb_url 
            : `${series.thumb_url}`,
          poster_url: series.poster_url?.startsWith('http')
            ? series.poster_url
            : `${series.poster_url}`
        }));
        
        // First deduplicate the series
        const uniqueSeries = [];
        const seenSlugs = new Set();
        const seenIds = new Set();
        
        processedSeries.forEach(series => {
          // Create a composite identifier when slug/id is missing
          const compositeId = !series.slug && !series._id && !series.id 
            ? `${series.name}-${series.year || ''}-${series.origin_name || ''}`
            : null;
            
          // Check if we've already seen this series
          if (
            (series.slug && seenSlugs.has(series.slug)) || 
            (series._id && seenIds.has(series._id)) ||
            (series.id && seenIds.has(series.id)) ||
            (compositeId && seenIds.has(compositeId))
          ) {
            return; // Skip this series
          }
          
          // Add to seen sets
          if (series.slug) seenSlugs.add(series.slug);
          if (series._id) seenIds.add(series._id);
          if (series.id) seenIds.add(series.id);
          if (compositeId) seenIds.add(compositeId);
          
          // Add to unique series
          uniqueSeries.push(series);
        });
        
        console.log(`Deduplicated to ${uniqueSeries.length} series`);
        
        // Sort series based on selected sort option
        const sortedSeries = sortSeriesData(uniqueSeries);
        
        // If it's the first page, replace series; otherwise, append unique ones
        if (pageNumber === 1) {
          setSeries(sortedSeries);
        } else {
          setSeries(prev => {
            // Use a Map to track existing series by all possible identifiers
            const existingSeriesMap = new Map();
            
            // Add all existing series to the map with multiple keys
            prev.forEach(s => {
              if (s._id) existingSeriesMap.set(s._id, s);
              if (s.id) existingSeriesMap.set(s.id, s);
              if (s.slug) existingSeriesMap.set(s.slug, s);
              // Also use a composite key to catch edge cases
              const compositeKey = `${s.name}-${s.year}-${s.origin_name}`;
              existingSeriesMap.set(compositeKey, s);
            });
            
            // Filter only series that don't exist in our map
            const uniqueNewSeries = sortedSeries.filter(s => {
              // Check against all possible identifiers
              const idExists = (s._id && existingSeriesMap.has(s._id)) || 
                              (s.id && existingSeriesMap.has(s.id)) || 
                              (s.slug && existingSeriesMap.has(s.slug));
              
              // Also check by composite key
              const compositeKey = `${s.name}-${s.year}-${s.origin_name}`;
              const compositeExists = existingSeriesMap.has(compositeKey);
              
              return !idExists && !compositeExists;
            });
            
            console.log(`Found ${uniqueNewSeries.length} truly unique new series`);
            return [...prev, ...uniqueNewSeries];
          });
        }
        
        // Update pagination information
        setTotalSeries(pagination?.totalItems || 0);
        setHasMore(pagination?.currentPage < pagination?.totalPages);
        
      } else {
        console.error('Error fetching series:', result.message || 'Unknown error');
        if (pageNumber === 1) {
          setSeries([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      if (pageNumber === 1) {
        setSeries([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };
  const loadMore = () => {
    if (!loading && hasMore) {
      // Set a loading state
      setLoading(true);
      
      // Calculate the next page
      const nextPage = page + 1;
      console.log(`Loading more series, page ${nextPage}`);
      
      // Add a small delay to prevent race conditions with multiple clicks
      setTimeout(() => {
        fetchSeries(nextPage);
      }, 50);
    }
  };

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  return (
    <>
      <Head>
        <title>Phim Bộ | Movie Streaming</title>
        <meta name="description" content="Xem phim bộ hay nhất và mới nhất trên Movie Streaming" />
      </Head>
      
      <div className={styles.container}> 
        <div className="container py-5 mt-5">
          <div className="row mb-4">
            <div className="col-12">
              <h1 className="text-white">Phim Bộ</h1>
              <p className="text-secondary">
                Tổng hợp các bộ phim truyền hình, phim bộ hay nhất, cập nhật nhanh nhất
                {totalSeries > 0 && ` (${totalSeries} phim)`}
              </p>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-12 d-flex flex-wrap gap-3">              <div className="dropdown">
                <button 
                  className={`btn ${filters.category ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center rounded-pill`}
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
              </div>                <div className="dropdown">
                <button
                  className={`btn ${filters.country ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center rounded-pill`}
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
                  className={`btn ${filters.year ? 'btn-danger' : 'btn-outline-secondary'} dropdown-toggle d-flex align-items-center rounded-pill`}
                  onClick={handleYearToggle}
                >
                  {filters.year || "Năm"} <FaChevronDown className="ms-2" />
                </button>                {showYearDropdown && (
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
                          className={`dropdown-item ${filters.year === year.toString() ? 'active' : ''}`} 
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>              <div className="dropdown">
                <button 
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center rounded-pill" 
                  onClick={toggleSortDropdown}
                >
                  {getSortOptionName()} <FaChevronDown className="ms-2" />
                </button>                {showSortOptions && (
                  <ul className="dropdown-menu show dropdown-menu-dark" style={{minWidth: '200px'}}>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'newest' ? 'active' : ''}`}
                        onClick={() => handleSortChange('newest')}
                      >
                        Mới nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'oldest' ? 'active' : ''}`}
                        onClick={() => handleSortChange('oldest')}
                      >
                        Cũ nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'a-z' ? 'active' : ''}`}
                        onClick={() => handleSortChange('a-z')}
                      >
                        A-Z
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'z-a' ? 'active' : ''}`}
                        onClick={() => handleSortChange('z-a')}
                      >
                        Z-A
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'highest-rating' ? 'active' : ''}`}
                        onClick={() => handleSortChange('highest-rating')}
                      >
                        Đánh giá cao nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'lowest-rating' ? 'active' : ''}`}
                        onClick={() => handleSortChange('lowest-rating')}
                      >
                        Đánh giá thấp nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'year-desc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('year-desc')}
                      >
                        Năm mới nhất
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`dropdown-item ${sortOption === 'year-asc' ? 'active' : ''}`}
                        onClick={() => handleSortChange('year-asc')}
                      >
                        Năm cũ nhất
                      </button>
                    </li>
                  </ul>
                )}
              </div>
                {/* Apply Filters Button */}
              <button
                className="btn btn-danger d-flex align-items-center rounded-pill"
                onClick={applyFilters}
                disabled={loading}
              >
                Áp dụng bộ lọc
              </button>
              {/* Refresh Button */}
              <button
                className="btn btn-outline-light d-flex align-items-center ms-auto rounded-pill"
                onClick={() => {
                  setLoading(true);
                  setPage(1);
                  fetchSeries(1);
                }}
                disabled={loading}
              >
                <FaSync className={`me-2 ${loading ? 'spin' : ''}`} />
                {loading ? 'Đang làm mới...' : 'Làm mới'}
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
                      Thể loại: {categories.find(c => c.id === filters.category)?.name || filters.category}
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
                      Quốc gia: {countries.find(c => c.code === filters.country)?.name || filters.country}
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
                    className="btn btn-sm btn-outline-secondary rounded-pill" 
                    onClick={() => {
                      setFilters({ category: "", country: "", year: "", type: "series" });
                      // Apply the cleared filters immediately
                      setTimeout(() => {
                        setLoading(true);
                        fetchSeries(1);
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
            {loading && page === 1 
              ? [...Array(24)].map((_, i) => (
                  <div key={`skeleton-${i}`} className="col">
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
                ))
              : series.map((series) => {
                  const imageId = `series-${series.slug}`;
                  return (
                    <div 
                      key={series.slug} 
                      className="col"
                    >
                      <div className={`card h-100 bg-dark border-0 ${styles.movieCard}`}>
                        <div className={`position-relative ${styles.moviePoster}`}>
                          <div 
                            className={`blur-load ${loadedImages[imageId] ? 'loaded' : ''}`}
                            style={{ 
                              backgroundImage: `url(${series.thumb_url}?blur=30)`,
                              backgroundSize: 'cover',
                              filter: loadedImages[imageId] ? 'none' : 'blur(10px)',
                              transition: 'filter 0.3s ease-in-out',
                              height: '300px',
                              borderRadius: '8px'
                            }}
                          >
                            {!loadedImages[imageId] && (
                              <Skeleton height="300px" borderRadius="8px" />
                            )}
                            <img
                              src={series.thumb_url || series.poster_url || "/placeholder.jpg"}
                              className={`card-img-top ${styles.movieImage}`}
                              alt={series.name}
                              loading="lazy"
                              style={{ 
                                height: '300px', 
                                objectFit: 'cover', 
                                borderRadius: '8px' 
                              }}
                              onLoad={() => handleImageLoad(imageId)}
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                                handleImageLoad(imageId);
                              }}
                            />
                          </div>
                          
                          <div className={styles.overlay}>
                            <Link 
                              href={`/movie/${series.slug}`}
                              className={styles.playButton}
                            >
                              <FaPlayCircle size={48} />
                            </Link>
                          </div>
                          
                          <div className={styles.movieInfo}>
                            {series.year && (
                              <span className="badge bg-danger me-1">
                                {series.year}
                              </span>
                            )}
                            {series.quality && (
                              <span className="badge bg-primary me-1">
                                {series.quality}
                              </span>
                            )}
                            {series.lang && (
                              <span className="badge bg-info">
                                {series.lang || 'Vietsub'}
                              </span>
                            )}
                          </div>
                          
                          {series.rating > 0 && (
                            <div className={styles.ratingBadge}>
                              <FaStar /> {series.rating.toFixed(1)}
                            </div>
                          )}
                          
                          {series.episodes && series.episodes[0] && series.episodes[0].server_data && (
                            <div className={styles.episodeBadge}>
                              <FaFilm /> {series.episodes[0].server_data.length} tập
                            </div>
                          )}                        </div>
                          <div className="card-body py-0 px-1" style={{backgroundColor: "#1a1a1a", minHeight: "auto"}}>
                          <h6 className={`card-title text-white mb-0 ${styles.movieTitleEllipsis}`}>
                            {series.name}
                          </h6>
                          {series.origin_name && (
                            <p className="card-text small text-muted text-truncate mb-0" style={{fontSize: "10px", lineHeight: 1, maxHeight: "14px"}}>
                              {series.origin_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
            {!loading && hasMore && (
            <div className="text-center mt-4 mb-5">
              <button 
                className="btn btn-outline-danger px-4 py-2 rounded-pill"
                onClick={loadMore}
              >
                Xem thêm
              </button>
            </div>
          )}
          
          {loading && page > 1 && (
            <div className="text-center mt-4 mb-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mt-2">Đang tải thêm phim...</p>
            </div>
          )}
            {!loading && series.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3">
                <FaPlayCircle size={60} className="text-secondary" />
              </div>
              <h3 className="text-white">Không tìm thấy phim</h3>
              <p className="text-secondary">
                {(filters.category || filters.country || filters.year) 
                  ? 'Không có phim bộ nào phù hợp với bộ lọc hiện tại.'
                  : 'Hiện chưa có phim bộ nào trong hệ thống. Vui lòng quay lại sau.'
                }
              </p>
              {(filters.category || filters.country || filters.year) && (                <button
                  className="btn btn-outline-light mt-3 rounded-pill"
                  onClick={() => {
                    setFilters({ category: "", country: "", year: "", type: "series" });
                    setTimeout(() => {
                      setLoading(true);
                      fetchSeries(1);
                    }, 0);
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
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
        }        .dropdown-menu {
          background-color: #212529;
          color: white;
          border: 1px solid rgba(255,255,255,0.15);
          max-height: 300px;
          overflow-y: auto;
          z-index: 1030;
          min-width: 200px;
        }

        .dropdown-item {
          color: rgba(255,255,255,0.8);
          padding: 8px 16px;
        }        .dropdown-item:hover {
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

export default Series;