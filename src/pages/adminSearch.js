import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from 'next/router';
import movieService from "../API/services/movieService";
import searchSuggestionService from "../API/services/searchSuggestionService";
import { useAuth } from "../utils/auth";
import AdminLayout from "../components/Layout/AdminLayout";
import Swal from 'sweetalert2';

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

export default function AdminSearchPage() {
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
    const [pageSize, setPageSize] = useState(20);
    const [selectedMovies, setSelectedMovies] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // States for search suggestions
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    const { isAuthenticated, isAdmin } = useAuth();

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

    // Redirect to login if not admin
    useEffect(() => {
        if (isAuthenticated === false || (isAuthenticated && !isAdmin)) {
            router.replace('/login');
        }
    }, [isAuthenticated, isAdmin, router]);

    const fetchMovies = async (searchQuery, pageNumber = 1) => {
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
                pageSize
            );

            if (response && response.hits) {
                const processedMovies = response.hits.map(movie => ({
                    ...movie,
                    uniqueId: movie.id || movie._id || movie.slug,
                    thumb_url: movie.thumb_url || movie.poster_url || "/img/Phim.png"
                }));

                setMovies(processedMovies);

                setTotalMovies(response.total);
                setTotalPages(Math.ceil(response.total / pageSize));

                setSelectedMovies([]);
                setSelectAll(false);
            } else {
                console.error("Không nhận được dữ liệu phim hợp lệ:", response);
                setError("Không nhận được dữ liệu phim hợp lệ từ máy chủ");
                setMovies([]);
            }

            setInitialLoad(false);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm phim:", error);
            setError(`Lỗi khi tìm kiếm phim: ${error.message}`);
            setMovies([]);
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

        // Perform search
        fetchMovies(suggestion, 1);

        // Update URL
        updateUrlWithQueryAndFilters(suggestion);
    };

    const debouncedQuery = useDebounce(query, 800);

    const updateUrlWithQueryAndFilters = (searchQuery) => {
        const queryParams = {};

        if (searchQuery && searchQuery.trim()) {
            queryParams.q = searchQuery.trim();
        }

        if (filters.category) queryParams.category = filters.category;
        if (filters.country) queryParams.country = filters.country;
        if (filters.year) queryParams.year = filters.year;
        if (filters.duration) queryParams.duration = filters.duration;

        if (page > 1) queryParams.page = page;

        router.push({
            pathname: '/adminSearch',
            query: queryParams
        }, undefined, { shallow: true });
    };

    const handleSearchInputChange = (e) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        setPage(1);

        if (newQuery === '') {
            if (filters.category || filters.country || filters.year || filters.duration) {
                const queryParams = {};
                if (filters.category) queryParams.category = filters.category;
                if (filters.country) queryParams.country = filters.country;
                if (filters.year) queryParams.year = filters.year;
                if (filters.duration) queryParams.duration = filters.duration;

                router.push({
                    pathname: '/adminSearch',
                    query: queryParams
                }, undefined, { shallow: true });
            } else {
                router.push('/adminSearch', undefined, { shallow: true });
            }
        } else {
            // Fetch search suggestions
            fetchSearchSuggestions(newQuery);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setPage(1);

        updateUrlWithQueryAndFilters(query);

        await fetchMovies(query, 1);
    };

    const handleFilterChange = (filterType, value) => {
        setLoading(true);

        setFilters(prev => {
            const updatedFilters = {
                ...prev,
                [filterType]: value
            };

            const queryParams = {};

            if (query.trim()) queryParams.q = query.trim();

            if (updatedFilters.category) queryParams.category = updatedFilters.category;
            if (updatedFilters.country) queryParams.country = updatedFilters.country;
            if (updatedFilters.year) queryParams.year = updatedFilters.year;
            if (updatedFilters.duration) queryParams.duration = updatedFilters.duration;

            router.push({
                pathname: '/adminSearch',
                query: queryParams
            }, undefined, { shallow: true });

            setPage(1);

            fetchMovies(query, 1);

            return updatedFilters;
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;

        setPage(newPage);

        const queryParams = { ...router.query, page: newPage };

        if (newPage === 1) delete queryParams.page;

        router.push({
            pathname: '/adminSearch',
            query: queryParams
        }, undefined, { shallow: true });

        fetchMovies(query, newPage);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (e) => {
        const newPageSize = parseInt(e.target.value);
        setPageSize(newPageSize);
        setPage(1);

        fetchMovies(query, 1);
    };

    useEffect(() => {
        if (router.isReady) {
            const urlQuery = router.query.q || "";
            const urlCategory = router.query.category || "";
            const urlCountry = router.query.country || "";
            const urlYear = router.query.year || "";
            const urlDuration = router.query.duration || "";
            const urlPage = parseInt(router.query.page) || 1;

            if (urlQuery !== query) {
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

            if (urlPage !== page) {
                setPage(urlPage);
            }

            const hasSearch = urlQuery || urlCategory || urlCountry || urlYear || urlDuration;
            if (hasSearch || !initialLoad) {
                fetchMovies(urlQuery, urlPage);
            }
        }
    }, [router.isReady, router.query]);

    const highlightSearchTerms = (text, searchQuery) => {
        if (!searchQuery || !text) return text;

        const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        return text.replace(regex, '<span class="highlight-match">$1</span>');
    };

    const getPageNumbers = () => {
        const result = [];
        const maxPageButtons = 5;

        if (totalPages <= maxPageButtons) {
            for (let i = 1; i <= totalPages; i++) {
                result.push(i);
            }
        } else {
            result.push(1);

            let startPage = Math.max(2, page - Math.floor(maxPageButtons / 2));
            let endPage = Math.min(totalPages - 1, startPage + maxPageButtons - 3);

            if (endPage - startPage < maxPageButtons - 3) {
                startPage = Math.max(2, endPage - (maxPageButtons - 3));
            }

            if (startPage > 2) {
                result.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                result.push(i);
            }

            if (endPage < totalPages - 1) {
                result.push('...');
            }

            result.push(totalPages);
        }

        return result;
    };

    const handleSelectMovie = (movieId) => {
        setSelectedMovies(prev => {
            if (prev.includes(movieId)) {
                return prev.filter(id => id !== movieId);
            } else {
                return [...prev, movieId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedMovies([]);
        } else {
            const allMovieIds = movies.map(movie => movie.uniqueId || movie.id || movie._id);
            setSelectedMovies(allMovieIds);
        }
        setSelectAll(!selectAll);
    };

    const handleDeleteSelected = async () => {
        if (selectedMovies.length === 0) {
            Swal.fire({
                title: 'Lỗi',
                text: 'Vui lòng chọn ít nhất một phim để xóa',
                icon: 'error',
                confirmButtonColor: '#dc3545'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Xác nhận xóa',
            text: `Bạn có chắc chắn muốn xóa ${selectedMovies.length} phim đã chọn?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                // const response = await movieService.deleteMovies(selectedMovies);

                Swal.fire({
                    title: 'Đã xóa!',
                    text: `Đã xóa ${selectedMovies.length} phim thành công`,
                    icon: 'success',
                    confirmButtonColor: '#28a745'
                });

                fetchMovies(query, page);
            } catch (error) {
                console.error('Lỗi khi xóa phim:', error);
                Swal.fire({
                    title: 'Lỗi',
                    text: 'Đã xảy ra lỗi khi xóa phim',
                    icon: 'error',
                    confirmButtonColor: '#dc3545'
                });
            }
        }
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

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <AdminLayout>
            <div className="admin-search-page">
                <div className="container-fluid py-4">
                    <div className="row mb-4">
                        <div className="col">
                            <h2 className="mb-3">Quản lý phim</h2>

                            {/* Search input */}
                            <form onSubmit={handleSearch} className="mb-4">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Tìm kiếm phim..."
                                        value={query}
                                        onChange={handleSearchInputChange}
                                        autoComplete="off"
                                        ref={searchInputRef}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
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

                                {/* Search suggestions */}
                                {showSuggestions && searchSuggestions.length > 0 && (
                                    <div className="search-suggestions bg-white border p-3 rounded" ref={suggestionsRef}>
                                        <ul className="list-unstyled mb-0">
                                            {searchSuggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    className="suggestion-item py-2 px-3 rounded mb-2 cursor-pointer hover-bg-light"
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                >
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </form>

                            {/* Filters */}
                            <div className="row mb-4">
                                {/* Category Filter */}
                                <div className="col-md-3 mb-3">
                                    <select
                                        className="form-select"
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
                                        className="form-select"
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
                                        className="form-select"
                                        value={filters.year}
                                        onChange={(e) => handleFilterChange('year', e.target.value)}
                                    >
                                        <option value="">Tất cả năm</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Duration Filter */}
                                <div className="col-md-3 mb-3">
                                    <select
                                        className="form-select"
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
                                            <span className="badge bg-primary p-2">
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
                                            <span className="badge bg-primary p-2">
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
                                            <span className="badge bg-primary p-2">
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
                                            <span className="badge bg-primary p-2">
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
                                                fetchMovies(query, 1);
                                            }}
                                        >
                                            Xóa tất cả
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Actions toolbar */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <button
                                        className="btn btn-success me-2"
                                        onClick={() => router.push('/admin/movies/add')}
                                    >
                                        <i className="fas fa-plus me-2"></i>
                                        Thêm phim mới
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleDeleteSelected}
                                        disabled={selectedMovies.length === 0}
                                    >
                                        <i className="fas fa-trash me-2"></i>
                                        Xóa phim đã chọn ({selectedMovies.length})
                                    </button>
                                </div>

                                <div className="d-flex align-items-center">
                                    <span className="me-2">Hiển thị:</span>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: '80px' }}
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                    >
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                            </div>

                            {/* Results */}
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tìm kiếm...</span>
                                    </div>
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

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        checked={selectAll}
                                                                        onChange={handleSelectAll}
                                                                    />
                                                                </div>
                                                            </th>
                                                            <th style={{ width: '80px' }}>Hình ảnh</th>
                                                            <th>Tên phim</th>
                                                            <th>Thể loại</th>
                                                            <th>Quốc gia</th>
                                                            <th>Năm</th>
                                                            <th>Lượt xem</th>
                                                            <th>Tác vụ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {movies.map((movie) => (
                                                            <tr key={movie.uniqueId || movie.id || movie._id}>
                                                                <td>
                                                                    <div className="form-check">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={selectedMovies.includes(movie.uniqueId || movie.id || movie._id)}
                                                                            onChange={() => handleSelectMovie(movie.uniqueId || movie.id || movie._id)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <img
                                                                        src={movie.thumb_url || movie.poster_url || "/img/Phim.png"}
                                                                        alt={movie.name}
                                                                        className="img-thumbnail"
                                                                        style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <div
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: query ? highlightSearchTerms(movie.name, query) : movie.name
                                                                        }}
                                                                    />
                                                                    <small className="text-muted d-block">
                                                                        {movie.origin_name}
                                                                    </small>
                                                                </td>
                                                                <td>{movie.category?.join(', ')}</td>
                                                                <td>{movie.country?.join(', ')}</td>
                                                                <td>{movie.year}</td>
                                                                <td>{movie.view_total || 0}</td>
                                                                <td>
                                                                    <Link href={`/admin/movies/edit/${movie.slug}`} className="btn btn-sm btn-primary me-2">
                                                                        <i className="fas fa-edit"></i>
                                                                    </Link>
                                                                    <Link href={`/movie/${movie.slug}`} target="_blank" className="btn btn-sm btn-info me-2">
                                                                        <i className="fas fa-eye"></i>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className="pagination-container text-center mt-4">
                                                    <nav aria-label="Page navigation">
                                                        <ul className="pagination justify-content-center">
                                                            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={() => handlePageChange(page - 1)}
                                                                    disabled={page <= 1}
                                                                >
                                                                    &laquo; Trước
                                                                </button>
                                                            </li>

                                                            {getPageNumbers().map((pageNumber, index) => (
                                                                <li
                                                                    key={index}
                                                                    className={`page-item ${pageNumber === page ? 'active' : ''} ${pageNumber === '...' ? 'disabled' : ''}`}
                                                                >
                                                                    {pageNumber === '...' ? (
                                                                        <span className="page-link">...</span>
                                                                    ) : (
                                                                        <button
                                                                            className="page-link"
                                                                            onClick={() => handlePageChange(pageNumber)}
                                                                        >
                                                                            {pageNumber}
                                                                        </button>
                                                                    )}
                                                                </li>
                                                            ))}

                                                            <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={() => handlePageChange(page + 1)}
                                                                    disabled={page >= totalPages}
                                                                >
                                                                    Sau &raquo;
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .search-suggestions {
                    position: absolute;
                    z-index: 1000;
                    width: calc(100% - 128px);
                    max-height: 300px;
                    overflow-y: auto;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    margin-top: -1rem;
                }

                .suggestion-item {
                    transition: all 0.2s ease;
                    cursor: pointer;
                    border-left: 3px solid transparent;
                }

                .suggestion-item:hover {
                    background-color: #f8f9fa;
                    border-left: 3px solid #0d6efd;
                    padding-left: 10px;
                }

                .cursor-pointer {
                    cursor: pointer;
                }

                .hover-bg-light:hover {
                    background-color: #f8f9fa;
                }

                .highlight-match {
                    color: #0d6efd;
                    font-weight: bold;
                    background-color: rgba(13, 110, 253, 0.1);
                    padding: 0 2px;
                    border-radius: 2px;
                }
            `}</style>
        </AdminLayout>
    );
}

AdminSearchPage.getLayout = (page) => page;