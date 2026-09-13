import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from 'next/router';
import movieService from "../API/services/movieService";
import searchHistoryService from "../API/services/searchHistoryService";
import searchSuggestionService from "../API/services/searchSuggestionService";
import { useAuth } from "../utils/auth";
import Image from 'next/image';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        category: '',
        country: '',
        year: '',
        duration: ''
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalMovies, setTotalMovies] = useState(0);
    const [imageLoading, setImageLoading] = useState({});
    const [showBackToTop, setShowBackToTop] = useState(false);

    // States for search suggestions
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    const { isAuthenticated } = useAuth();

    const [searchMode, setSearchMode] = useState('manual');
    const [typingTimeout, setTypingTimeout] = useState(null);

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

    const years = Array.from({ length: 17 }, (_, i) => 2026 - i);

    const durations = [
        { value: "short", label: "Ngắn (< 60 phút)" },
        { value: "medium", label: "Trung bình (60-120 phút)" },
        { value: "long", label: "Dài (> 120 phút)" },
    ];

    const handleImageLoaded = (movieId) => {
        localStorage.setItem(`img_loaded_${movieId}`, 'true');
        setTimeout(() => {
            setImageLoading(prev => ({
                ...prev,
                [movieId]: false
            }));
        }, 50);
    };

    useEffect(() => {
        const cachedLoadedImages = {};
        movies.forEach(movie => {
            const movieId = movie.uniqueId || movie.id || movie._id || movie.slug;
            if (localStorage.getItem(`img_loaded_${movieId}`) === 'true') {
                cachedLoadedImages[movieId] = false;
            }
        });

        if (Object.keys(cachedLoadedImages).length > 0) {
            setImageLoading(prev => ({
                ...prev,
                ...cachedLoadedImages
            }));
        }
    }, [movies]);

    const fetchMovies = async (searchQuery, pageNumber = 1, isLoadMore = false) => {
        try {
            setLoading(true);
            setError(null);

            const currentQuery = searchQuery !== undefined ? searchQuery : query;

            const searchFilters = {
                category: filters.category || undefined,
                country: filters.country || undefined,
                year: filters.year || undefined,
                duration: filters.duration || undefined
            };

            const response = await movieService.searchMovies(
                currentQuery,
                {
                    ...searchFilters,
                    search_description: true,
                    search_all_fields: true
                },
                pageNumber,
                20
            );

            if (response && response.hits) {
                const processedMovies = response.hits.map(movie => ({
                    ...movie,
                    uniqueId: movie.id || movie._id || movie.slug,
                    thumb_url: movie.thumb_url || movie.poster_url || "/img/Phim.png"
                }));

                const newImageLoadingState = {};
                processedMovies.forEach(movie => {
                    const movieId = movie.uniqueId || movie.id || movie._id || movie.slug;
                    newImageLoadingState[movieId] = true;
                });

                setImageLoading(prev => ({
                    ...prev,
                    ...newImageLoadingState
                }));

                if (isLoadMore) {
                    setMovies(prevMovies => {
                        const existingIds = new Set(prevMovies.map(m => m.uniqueId || m.id || m._id || m.slug));

                        const newUniqueMovies = processedMovies.filter(
                            movie => !existingIds.has(movie.uniqueId || movie.id || movie._id || movie.slug)
                        );

                        return [...prevMovies, ...newUniqueMovies];
                    });
                } else {
                    setMovies(processedMovies);
                }

                setTotalMovies(response.total);
                setTotalPages(Math.ceil(response.total / 20));
            } else {
                console.error("Không nhận được dữ liệu phim hợp lệ:", response);
                setError("Không nhận được dữ liệu phim hợp lệ từ máy chủ");
                if (!isLoadMore) {
                    setMovies([]);
                }
            }

            setInitialLoad(false);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm phim:", error);
            setError(`Lỗi khi tìm kiếm phim: ${error.message}`);
            if (!isLoadMore) {
                setMovies([]);
            }
            setInitialLoad(false);
        } finally {
            setLoading(false);
        }
    };

    // Fetch search suggestions from Elasticsearch
    const fetchSearchSuggestions = async (searchQuery) => {
        if (searchQuery.trim().length < 2) {
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            setLoadingSuggestions(true);
            setShowSuggestions(true);

            const response = await searchSuggestionService.getSuggestions(searchQuery);

            if (response.success && Array.isArray(response.suggestions)) {
                setSearchSuggestions(response.suggestions);
            } else {
                setSearchSuggestions([]);
            }
        } catch (error) {
            console.error("Error fetching search suggestions:", error);
            setSearchSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Handle search suggestion click
    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        setShowSuggestions(false);

        // Save to search history if authenticated
        if (isAuthenticated) {
            searchHistoryService.saveSearchHistory(suggestion, filters)
                .catch(error => console.error("Error saving to search history:", error));
        }

        // Save to localStorage
        localStorage.setItem('lastSearchQuery', suggestion.trim());

        // Perform search
        fetchMovies(suggestion, 1, false);

        // Update URL
        updateUrlWithQueryAndFilters(suggestion);
    };

    const debouncedQuery = useDebounce(query, 800);

    const [enableAutoSearch, setEnableAutoSearch] = useState(true);

    const updateUrlWithQueryAndFilters = (searchQuery) => {
        const queryParams = {};

        if (searchQuery && searchQuery.trim()) {
            queryParams.q = searchQuery.trim();
        }

        if (filters.category) queryParams.category = filters.category;
        if (filters.country) queryParams.country = filters.country;
        if (filters.year) queryParams.year = filters.year;
        if (filters.duration) queryParams.duration = filters.duration;

        router.push({
            pathname: '/search',
            query: queryParams
        }, undefined, { shallow: true });
    };

    const fetchMoviesWithFilters = (searchQuery, pageNum = 1, isLoadMore = false) => {
        fetchMovies(searchQuery, pageNum, isLoadMore);
    };

    useEffect(() => {
        if (debouncedQuery !== undefined && enableAutoSearch && debouncedQuery.length > 1) {
            updateUrlWithQueryAndFilters(debouncedQuery);

            fetchMoviesWithFilters(debouncedQuery);
        }
    }, [debouncedQuery, enableAutoSearch]);

    const handleSearchInputChange = (e) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        setPage(1);

        window.userIsTyping = true;

        if (typingTimeout) clearTimeout(typingTimeout);
        const newTimeout = setTimeout(() => {
            window.userIsTyping = false;
        }, 3000);
        setTypingTimeout(newTimeout);

        if (newQuery.length < query.length) {
            setEnableAutoSearch(false);
            setTimeout(() => setEnableAutoSearch(true), 3000);
        }

        if (newQuery === '') {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('lastSearchQuery');
            }

            if (filters.category || filters.country || filters.year || filters.duration) {
                const queryParams = {};
                if (filters.category) queryParams.category = filters.category;
                if (filters.country) queryParams.country = filters.country;
                if (filters.year) queryParams.year = filters.year;
                if (filters.duration) queryParams.duration = filters.duration;

                router.push({
                    pathname: '/search',
                    query: queryParams
                }, undefined, { shallow: true });
            } else {
                router.push('/search', undefined, { shallow: true });
            }
        } else {
            // Fetch search suggestions
            fetchSearchSuggestions(newQuery);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setPage(1);

        const queryParams = {};

        if (query.trim()) {
            queryParams.q = query.trim();
        }

        if (filters.category) queryParams.category = filters.category;
        if (filters.country) queryParams.country = filters.country;
        if (filters.year) queryParams.year = filters.year;
        if (filters.duration) queryParams.duration = filters.duration;

        router.push({
            pathname: '/search',
            query: queryParams
        }, undefined, { shallow: true });

        await fetchMovies(query, 1, false);

        if (isAuthenticated && query.trim()) {
            try {
                await searchHistoryService.saveSearchHistory(query, filters);
            } catch (error) {
                console.error("Lỗi khi lưu lịch sử tìm kiếm:", error);
            }
        }
    };

    const handleFilterChange = (filterType, value) => {
        setLoading(true);
        setFilters(prev => {
            const updatedFilters = {
                ...prev,
                [filterType]: value
            };

            const queryParams = {
                q: query.trim()
            };
            if (updatedFilters.category) queryParams.category = updatedFilters.category;
            if (updatedFilters.country) queryParams.country = updatedFilters.country;
            if (updatedFilters.year) queryParams.year = updatedFilters.year;
            if (updatedFilters.duration) queryParams.duration = updatedFilters.duration;

            router.push({
                pathname: '/search',
                query: queryParams
            }, undefined, { shallow: true });

            setPage(1);
            fetchMovies(query, 1, false);

            return updatedFilters;
        });
    };

    const loadMore = () => {
        if (page < totalPages) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMovies(query, nextPage, true);
        }
    };

    useEffect(() => {
        if (router.isReady) {
            if (window.userIsTyping) return;

            let urlQuery = router.query.q || "";
            const urlCategory = router.query.category || "";
            const urlCountry = router.query.country || "";
            const urlYear = router.query.year || "";
            const urlDuration = router.query.duration || "";

            if (!urlQuery && !query && initialLoad) {
                const lastSearchQuery = typeof window !== 'undefined' ? localStorage.getItem('lastSearchQuery') : null;
                if (lastSearchQuery) {
                    urlQuery = lastSearchQuery;
                    router.replace({
                        pathname: '/search',
                        query: {
                            q: urlQuery,
                            ...(urlCategory && { category: urlCategory }),
                            ...(urlCountry && { country: urlCountry }),
                            ...(urlYear && { year: urlYear }),
                            ...(urlDuration && { duration: urlDuration })
                        }
                    }, undefined, { shallow: true });
                }
            }

            if ((urlQuery !== "" || query === "") && urlQuery !== query) {
                setQuery(urlQuery);
            }

            const shouldUpdateFilters =
                urlCategory !== filters.category ||
                urlCountry !== filters.country ||
                urlYear !== filters.year ||
                urlDuration !== filters.duration;

            if (shouldUpdateFilters) {
                setFilters({
                    category: urlCategory,
                    country: urlCountry,
                    year: urlYear,
                    duration: urlDuration
                });
            }

            const hasSearch = urlQuery || urlCategory || urlCountry || urlYear || urlDuration;
            if (hasSearch && !window.userIsTyping) {
                fetchMovies(urlQuery, 1, false);
            }
        }
    }, [router.isReady, router.query]);

    const showLoadMore = !loading && movies.length > 0 && page < totalPages;

    const highlightSearchTerms = (text, searchQuery) => {
        if (!searchQuery || !text) return text;

        const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        return text.replace(regex, '<span class="highlight-match">$1</span>');
    };

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

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-black min-vh-100 text-white">
            <div className="container py-5 mt-5">
                <h1 className="mb-4">Tìm kiếm phim</h1>

                {/* Search input */}
                <form onSubmit={handleSearch} className="mb-4">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control bg-dark text-white border-dark"
                            placeholder="Gõ tên phim, diễn viên, phim hành động năm 2020..."
                            value={query}
                            onChange={handleSearchInputChange}
                            autoComplete="off"
                            ref={searchInputRef}
                        />
                        <button
                            type="submit"
                            className="btn btn-danger"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="fas fa-search me-2"></i>
                            )}
                            Tìm kiếm
                        </button>
                    </div>

                </form>

                {/* Search suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="search-suggestions bg-dark text-white p-3 rounded" ref={suggestionsRef}>
                        <ul className="list-unstyled mb-0">
                            {searchSuggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="suggestion-item py-2 px-3 rounded mb-2 cursor-pointer"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Filters */}
                <div className="row mb-4">
                    {/* Category Filter */}
                    <div className="col-md-3 mb-3">
                        <select
                            className="form-select bg-dark text-white border-dark"
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">Tất cả thể loại</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    {/* Country Filter */}
                    <div className="col-md-3 mb-3">
                        <select
                            className="form-select bg-dark text-white border-dark"
                            value={filters.country}
                            onChange={(e) => handleFilterChange('country', e.target.value)}
                        >
                            <option value="">Tất cả quốc gia</option>
                            {countries.map((country, index) => (
                                <option key={index} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Filter */}
                    <div className="col-md-3 mb-3">
                        <select
                            className="form-select bg-dark text-white border-dark"
                            value={filters.year}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                        >
                            <option value="">Tất cả năm</option>
                            {years.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {/* Duration Filter - New */}
                    <div className="col-md-3 mb-3">
                        <select
                            className="form-select bg-dark text-white border-dark"
                            value={filters.duration}
                            onChange={(e) => handleFilterChange('duration', e.target.value)}
                        >
                            <option value="">Tất cả độ dài</option>
                            {durations.map((duration, index) => (
                                <option key={index} value={duration.value}>{duration.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active filters display */}
                {(filters.category || filters.country || filters.year || filters.duration) && (
                    <div className="mb-4">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span className="text-muted">Bộ lọc đang áp dụng:</span>

                            {filters.category && (
                                <span className="badge bg-danger p-2">
                                    Thể loại: {filters.category}
                                    <button
                                        className="btn btn-sm ms-2 p-0 text-white"
                                        onClick={() => handleFilterChange('category', '')}
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
                                        onClick={() => handleFilterChange('country', '')}
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
                                        onClick={() => handleFilterChange('year', '')}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            )}

                            {filters.duration && (
                                <span className="badge bg-danger p-2">
                                    Độ dài: {durations.find(d => d.value === filters.duration)?.label || filters.duration}
                                    <button
                                        className="btn btn-sm ms-2 p-0 text-white"
                                        onClick={() => handleFilterChange('duration', '')}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </span>
                            )}

                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    setFilters({ category: '', country: '', year: '', duration: '' });
                                    fetchMovies(query, 1, false);
                                }}
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    </div>
                )}                {/* Skeleton Loading Component */}
                {loading && movies.length === 0 ? (
                    <div className="row g-4">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                <div className="skeleton-card h-100">
                                    <div className="skeleton-poster position-relative">
                                        <div className="skeleton-shimmer"></div>
                                        {/* Skeleton badges */}
                                        <div className="skeleton-badges year-quality">
                                            <div className="skeleton-badge"></div>
                                            <div className="skeleton-badge ms-1"></div>
                                        </div>
                                        <div className="skeleton-badges episode-status">
                                            <div className="skeleton-badge-wide"></div>
                                        </div>
                                    </div>
                                    <div className="skeleton-info p-2">
                                        <div className="skeleton-title"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        {!loading && movies.length === 0 && (
                            <div className="alert alert-warning">
                                Không tìm thấy phim phù hợp với tiêu chí tìm kiếm
                            </div>
                        )}

                        {movies.length > 0 && (
                            <>
                                <div className="mb-3 text-muted">
                                    {query && <span>Kết quả tìm kiếm cho "{query}": </span>}
                                    Tìm thấy {totalMovies} kết quả
                                </div>
                                <div className="row g-4">
                                    {movies.map((movie) => (
                                        <div key={movie.uniqueId || movie.id || movie._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                            <div className="movie-card h-100" onClick={() => router.push(`/movie/${movie.slug}`)}>
                                                <div className="position-relative movie-poster-container">
                                                    <img
                                                        src={movie.thumb_url || movie.poster_url || "/img/Phim.png"}
                                                        alt={movie.name}
                                                        className={`w-100 rounded movie-poster ${imageLoading[movie.uniqueId || movie.id || movie._id] ? 'loading' : 'loaded'}`}
                                                        onLoad={() => handleImageLoaded(movie.uniqueId || movie.id || movie._id)}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/img/Phim.png";
                                                            handleImageLoaded(movie.uniqueId || movie.id || movie._id);
                                                        }}
                                                        loading="lazy"
                                                    />

                                                    <div className="overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                                                        <button className="play-button">
                                                            <i className="bi bi-play-fill"></i>
                                                        </button>
                                                    </div>

                                                    <div className="movie-badges year-quality">
                                                        <span className="badge bg-danger">{movie.year}</span>
                                                        {movie.quality && (
                                                            <span className="badge bg-primary ms-1">{movie.quality}</span>
                                                        )}
                                                    </div>

                                                    <div className="movie-badges episode-status">
                                                        {movie.type === 'series' ? (
                                                            movie.episode_current ? (
                                                                <span className="badge bg-success">
                                                                    {movie.episode_current === 'Full' ? 'Full' :
                                                                     movie.episode_current.includes('/') ? `Hoàn Tất (${movie.episode_current})` :
                                                                     `Hoàn Tất (${movie.episode_current}/??)`}
                                                                </span>
                                                            ) : (
                                                                movie.episodes && movie.episodes[0] && (
                                                                    <span className="badge bg-success">
                                                                        {movie.episodes[0].server_data ?
                                                                        `Hoàn Tất (${movie.episodes[0].server_data.length}/?)` : 'Tập 1/?'}
                                                                    </span>
                                                                )
                                                            )
                                                        ) : (
                                                            <span className="badge bg-success">Full</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="movie-info p-2">
                                                    <h3 className="h6 mb-1 movie-title"
                                                        dangerouslySetInnerHTML={{
                                                            __html: query ? highlightSearchTerms(movie.name, query) : movie.name
                                                        }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load more skeleton when loading more */}
                                {loading && movies.length > 0 && (
                                    <div className="row g-4 mt-2">
                                        {Array.from({ length: 6 }).map((_, index) => (
                                            <div key={`loadmore-${index}`} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                                <div className="skeleton-card h-100">
                                                    <div className="skeleton-poster position-relative">
                                                        <div className="skeleton-shimmer"></div>
                                                        <div className="skeleton-badges year-quality">
                                                            <div className="skeleton-badge"></div>
                                                            <div className="skeleton-badge ms-1"></div>
                                                        </div>
                                                        <div className="skeleton-badges episode-status">
                                                            <div className="skeleton-badge-wide"></div>
                                                        </div>
                                                    </div>
                                                    <div className="skeleton-info p-2">
                                                        <div className="skeleton-title"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Load more button */}
                                {showLoadMore && (
                                    <div className="text-center mt-4">
                                        <button
                                            className="btn btn-outline-danger px-4"
                                            onClick={loadMore}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            ) : null}
                                            Xem thêm
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
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
                .form-select {
                    cursor: pointer;
                }

                .form-select:focus {
                    border-color:rgb(109, 98, 99);
                    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
                }

                .movie-card {
                    background: #1a1a1a;
                    border-radius: 10px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .movie-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
                }

                /* Custom scrollbar styles */
                ::-webkit-scrollbar {
                    width: 4px;
                    height: 6px;
                }

                ::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb {
                    background: rgba(99, 97, 97, 0.5);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(126, 121, 121, 0.8);
                }

                * {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(95, 94, 94, 0.5) rgba(0, 0, 0, 0.2);
                }

                /* Responsive styles for mobile devices */
                @media (max-width: 767px) {
                    .container {
                        padding-left: 10px;
                        padding-right: 10px;
                    }

                    .movie-poster-container {
                        height: 200px;                    }

                    .movie-title {
                        font-size: 0.8rem;                    }

                    .mb-4 {
                        margin-bottom: 1rem !important;
                    }

                    .btn {
                        padding: 0.375rem 0.75rem;
                        font-size: 0.875rem;
                    }

                    [aria-label="Back to top"] {
                        bottom: 20px;
                        right: 20px;
                        width: 40px;
                        height: 40px;
                        font-size: 1.2rem;
                    }

                    .badge {
                        font-size: 0.7rem;
                        padding: 0.35rem 0.5rem;
                        margin-bottom: 5px;
                    }

                    .row.g-4 {
                        row-gap: 10px !important;
                    }

                    .col-6 {
                        padding-left: 5px;
                        padding-right: 5px;
                    }
                }

                @media (max-width: 400px) {
                    .badge {
                        font-size: 0.6rem;
                        padding: 0.25rem 0.4rem;
                    }

                    .container {
                        padding-left: 8px;
                        padding-right: 8px;
                    }

                    h1 {
                        font-size: 1.5rem;
                        margin-bottom: 0.8rem !important;
                    }

                    .movie-poster-container {
                        height: 180px;
                    }

                    .play-button {
                        width: 40px;
                        height: 40px;
                    }

                    .play-button i {
                        font-size: 30px;
                    }
                }

                /* Movie poster container */
                .movie-poster-container {
                    height: 250px;
                    width: 100%;
                    position: relative;
                    background-color: #2a2a2a;
                    overflow: hidden;
                    border-radius: 8px;
                }

                .movie-poster.loading {
                    opacity: 1;
                    filter: blur(15px);
                    transition: opacity 0.3s ease, filter 0.5s ease;
                    animation: pulseImage 2s infinite ease-in-out;
                }

                .movie-poster.loaded {
                    opacity: 1;
                    filter: blur(0);
                    transition: opacity 0.3s ease, filter 0.3s ease;
                }

                @keyframes pulseImage {
                    0% { opacity: 0.7; }
                    50% { opacity: 0.9; }
                    100% { opacity: 0.7; }
                }

                .movie-content {
                    position: relative;
                    height: 100%;
                    width: 100%;
                    opacity: 1;
                    transition: opacity 0.3s ease;
                }

                .overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%);
                    z-index: 2;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    border-radius: 3px;
                }

                .movie-card:hover .overlay {
                    opacity: 1;
                }

                .play-button {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.6);
                    color: rgba(169, 143, 146, 0.69);
                    border: none;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    z-index: 3;
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    box-shadow: 0 0 20px rgba(220, 195, 197, 0.4);
                    backdrop-filter: blur(5px);
                }

                .play-button i {
                    font-size: 40px;
                    margin-left: 5px;
                    text-shadow: 0 1px 3px rgba(107, 104, 104, 0.19);
                }

                .play-button:hover {
                    opacity: 1;
                    color: #fff;
                    background-color: rgba(152, 148, 148, 0.36);
                    box-shadow: 0 0 25px rgba(150, 144, 144, 0.44);
                    transform: translate(-50%, -50%) scale(1.3);
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(180, 177, 178, 0.46); }
                    70% { box-shadow: 0 0 0 10px rgba(162, 149, 150, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(177, 159, 160, 0); }
                }

                .movie-card:hover .play-button {
                    opacity: 1;
                    animation: pulse 1.5s infinite;
                }

                .movie-info {
                    background: #1a1a1a;
                }

                .badge .btn:hover {
                    opacity: 0.8;
                }

                /* Highlight text styling */
                .highlight-text {
                    max-height: 45px;
                    overflow: hidden;
                    font-size: 11px !important;
                    color: rgba(255, 255, 255, 0.6) !important;
                    line-height: 1.4;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                /* Movie title styling */
                .movie-title {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .highlight-match {
                    color: #e50914;
                    font-weight: bold;
                    background-color: rgba(229, 9, 20, 0.1);
                    padding: 0 2px;
                    border-radius: 2px;
                }

                em {
                    color: #e50914;
                    font-weight: bold;
                    background-color: rgba(229, 9, 20, 0.1);
                    padding: 0 2px;
                    border-radius: 2px;
                    font-style: normal;
                }

                /* CSS cho movie badges */
                .movie-badges {
                    position: absolute;
                    z-index: 3;
                }

                .movie-badges.year-quality {
                    top: 0;
                    right: 0;
                    margin: 0.5rem;
                }

                .movie-badges.episode-status {
                    bottom: 0;
                    left: 0;
                    margin: 0.5rem;
                }

                /* Back to Top button styling */
                .back-to-top {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: opacity 0.3s ease, transform 0.3s ease;
                }

                .back-to-top:hover {
                    transform: scale(1.1);
                }

                /* Custom scrollbar styling to match MovieCategory component */
                ::-webkit-scrollbar {
                    width: 4px;
                    height: 6px;
                }

                ::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb {
                    background: rgba(99, 97, 97, 0.5);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(126, 121, 121, 0.8);
                }

                * {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(95, 94, 94, 0.5) rgba(0, 0, 0, 0.2);
                }

                .search-suggestions {
                    position: absolute;
                    z-index: 1000;
                    width: calc(100% - 115px);
                    max-height: 300px;
                    overflow-y: auto;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    margin-top: -1rem;
                    border: 1px solid rgba(110, 106, 106, 0.2);
                }

                .suggestion-item {
                    transition: all 0.2s ease;
                    cursor: pointer;
                    border-left: 3px solid transparent;
                }

                .suggestion-item:hover {
                    background-color: rgba(229, 9, 20, 0.1);
                    border-left: 3px solid #e50914;
                    padding-left: 10px;
                }
                  .cursor-pointer {
                    cursor: pointer;
                }

                /* Skeleton Loading Styles */
                .skeleton-card {
                    background: #1a1a1a;
                    border-radius: 10px;
                    overflow: hidden;
                    animation: pulse 2s infinite ease-in-out;
                }

                .skeleton-poster {
                    height: 250px;
                    width: 100%;
                    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
                    background-size: 200% 100%;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                }

                .skeleton-shimmer {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    animation: shimmer 1.5s infinite;
                }

                @keyframes shimmer {
                    0% {
                        left: -100%;
                    }
                    100% {
                        left: 100%;
                    }
                }

                .skeleton-badges {
                    position: absolute;
                    z-index: 3;
                }

                .skeleton-badges.year-quality {
                    top: 0;
                    right: 0;
                    margin: 0.5rem;
                    display: flex;
                    gap: 0.25rem;
                }

                .skeleton-badges.episode-status {
                    bottom: 0;
                    left: 0;
                    margin: 0.5rem;
                }

                .skeleton-badge {
                    width: 35px;
                    height: 20px;
                    background: #3a3a3a;
                    border-radius: 3px;
                    animation: skeletonPulse 1.5s infinite;
                }

                .skeleton-badge-wide {
                    width: 60px;
                    height: 20px;
                    background: #3a3a3a;
                    border-radius: 3px;
                    animation: skeletonPulse 1.5s infinite;
                }

                .skeleton-info {
                    background: #1a1a1a;
                    padding: 0.5rem;
                }

                .skeleton-title {
                    height: 16px;
                    background: #3a3a3a;
                    border-radius: 3px;
                    width: 80%;
                    animation: skeletonPulse 1.5s infinite;
                }

                @keyframes skeletonPulse {
                    0% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.6;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                /* Responsive skeleton styles */
                @media (max-width: 767px) {
                    .skeleton-poster {
                        height: 200px;
                    }

                    .skeleton-badge {
                        width: 30px;
                        height: 18px;
                    }

                    .skeleton-badge-wide {
                        width: 50px;
                        height: 18px;
                    }
                }

                @media (max-width: 400px) {
                    .skeleton-poster {
                        height: 180px;
                    }

                    .skeleton-badge {
                        width: 25px;
                        height: 16px;
                    }

                    .skeleton-badge-wide {
                        width: 40px;
                        height: 16px;
                    }

                    .skeleton-title {
                        height: 14px;
                    }
                }

            `}</style>
        </div>
    );
}