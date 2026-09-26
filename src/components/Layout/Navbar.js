import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  FaSearch, 
  FaBars, 
  FaTimes, 
  FaFilm, 
  FaTv, 
  FaHeart, 
  FaBookmark, 
  FaHistory, 
  FaSignOutAlt,
  FaUserCircle, 
  FaTimesCircle, 
  FaChevronDown
} from "react-icons/fa";
import { useRouter } from "next/router";
import { useAuth } from "../../utils/auth";
import searchHistoryService from "../../API/services/searchHistoryService";
import FeedbackForm from "../Feedback/FeedbackForm";
import movieService, { safeFetchJson, extractMovieList } from "@/API/services/movieService";
import { LOCAL_DEFAULT_POSTER } from "@/config/movieFallbackConfig";
import { TMDB_CONFIG } from "@/config/systemConfig";
import { 
  MAIN_NAV_ITEMS, 
  USER_NAV_ITEMS, 
  NAVBAR_SEARCH_CONFIG 
} from "@/config/navigationConfig";

const USER_ICONS = {
  user: <FaUserCircle className="me-2 text-primary" />,
  heart: <FaHeart className="me-2 text-danger" />,
  bookmark: <FaBookmark className="me-2 text-warning" />,
  history: <FaHistory className="me-2 text-info" />
};

const getAvatarUrl = (user) => {
  if (!user) return "/img/avatar.png";

  let avatarUrl = user.avatar || user.image || "/img/avatar.png";

  if (avatarUrl && avatarUrl.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const baseWithoutApi = baseUrl.endsWith('/api')
      ? baseUrl.substring(0, baseUrl.length - 4)
      : baseUrl;

    avatarUrl = `${baseWithoutApi}${avatarUrl}`;
  }

  if (!avatarUrl.includes('?') &&
      !avatarUrl.includes('googleusercontent.com') &&
      !avatarUrl.includes('cloudinary.com')) {
    avatarUrl = `${avatarUrl}?t=${Date.now()}`;
  }

  return avatarUrl;
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Navigation Dropdown States
  const [showGenresDropdown, setShowGenresDropdown] = useState(false);
  const [showCountriesDropdown, setShowCountriesDropdown] = useState(false);
  const [mobileGenresOpen, setMobileGenresOpen] = useState(false);
  const [mobileCountriesOpen, setMobileCountriesOpen] = useState(false);

  // Dual Search Dropdown States
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchMoviesResult, setSearchMoviesResult] = useState([]);
  const [searchActorsResult, setSearchActorsResult] = useState([]);
  const [searchDropdownLoading, setSearchDropdownLoading] = useState(false);

  // Search History States
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);

  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const mobileSearchWrapperRef = useRef(null);
  const genresDropdownRef = useRef(null);
  const countriesDropdownRef = useRef(null);
  const feedbackRef = useRef(null);
  const navRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0
  });

  const isActive = (path) => {
    if (path === '/' && router.pathname === '/') return true;
    if (path !== '/' && router.pathname.startsWith(path)) return true;
    return false;
  };

  const isGenreActive = () => router.pathname.startsWith('/the-loai');
  const isCountryActive = () => router.pathname.startsWith('/quoc-gia');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update sliding indicator for active navbar item
  useEffect(() => {
    const updateIndicator = () => {
      if (navRef.current && window.innerWidth >= 992) {
        const navItems = navRef.current.querySelectorAll('.nav-link');
        let activeItem = null;

        navItems.forEach(item => {
          if (item.classList.contains('active')) {
            activeItem = item;
          }
        });

        if (activeItem) {
          const { left, width } = activeItem.getBoundingClientRect();
          const navLeft = navRef.current.getBoundingClientRect().left;

          setIndicatorStyle({
            left: left - navLeft,
            width: width,
            opacity: 1
          });
        } else {
          setIndicatorStyle({ opacity: 0 });
        }
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [router.pathname, router.query]);

  const fetchLiveSearch = async (queryText) => {
    const q = (queryText || '').trim();
    setSearchDropdownLoading(true);

    try {
      if (!q) {
        // When empty, show latest spotlight movies and top popular performers
        const [latestMovies, tmdbActors] = await Promise.all([
          movieService.getHeroMovies(NAVBAR_SEARCH_CONFIG.movieLimit).catch(() => []),
          fetch(`${TMDB_CONFIG.baseUrl}/person/popular?api_key=${TMDB_CONFIG.apiKey}&language=vi-VN&page=1`)
            .then(res => res.ok ? res.json() : { results: [] })
            .then(data => (data.results || []).slice(0, NAVBAR_SEARCH_CONFIG.actorLimit))
            .catch(() => [])
        ]);

        setSearchMoviesResult(Array.isArray(latestMovies) ? latestMovies : []);
        setSearchActorsResult(Array.isArray(tmdbActors) ? tmdbActors : []);
      } else {
        // Query both backend movies and TMDB person search
        const [moviesResp, tmdbActors] = await Promise.all([
          safeFetchJson(`/movies?search=${encodeURIComponent(q)}&limit=${NAVBAR_SEARCH_CONFIG.movieLimit}`, {}, null)
            .then(res => {
              const list = extractMovieList(res);
              if (Array.isArray(list) && list.length > 0) return list;
              return safeFetchJson(`/movies/search?q=${encodeURIComponent(q)}`, {}, [])
                .then(extractMovieList);
            })
            .catch(() => []),
          fetch(`${TMDB_CONFIG.baseUrl}/search/person?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(q)}&language=vi-VN&page=1`)
            .then(res => res.ok ? res.json() : { results: [] })
            .then(data => (data.results || []).slice(0, NAVBAR_SEARCH_CONFIG.actorLimit))
            .catch(() => [])
        ]);

        setSearchMoviesResult(Array.isArray(moviesResp) ? moviesResp : []);
        setSearchActorsResult(Array.isArray(tmdbActors) ? tmdbActors : []);
      }
    } catch (err) {
      console.error('Error fetching live search:', err);
    } finally {
      setSearchDropdownLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setShowSearchDropdown(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchLiveSearch(newQuery);
    }, NAVBAR_SEARCH_CONFIG.debounceMs);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isAuthenticated) {
        saveToSearchHistory(searchQuery);
      }
      localStorage.setItem('lastSearchQuery', searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
      setShowSearchInput(false);
    }
  };

  const toggleSearchInput = () => {
    setShowSearchInput(!showSearchInput);
    if (!showSearchInput) {
      setShowSearchDropdown(true);
      fetchLiveSearch(searchQuery);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMobileGenresOpen(false);
    setMobileCountriesOpen(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      const navbarCollapse = document.getElementById("navbarNav");
      const navbarToggler = document.querySelector(".navbar-toggler");
      const userMenu = document.getElementById("userMenu");
      const userAvatar = document.querySelector(".profile-avatar");

      // Search dropdown click outside
      const inDesktopSearch = searchWrapperRef.current && searchWrapperRef.current.contains(event.target);
      const inMobileSearch = mobileSearchWrapperRef.current && mobileSearchWrapperRef.current.contains(event.target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowSearchDropdown(false);
      }

      // Genres dropdown click outside
      if (genresDropdownRef.current && !genresDropdownRef.current.contains(event.target)) {
        setShowGenresDropdown(false);
      }

      // Countries dropdown click outside
      if (countriesDropdownRef.current && !countriesDropdownRef.current.contains(event.target)) {
        setShowCountriesDropdown(false);
      }

      // User menu click outside
      if (showUserMenu && userMenu && !userMenu.contains(event.target) && userAvatar && !userAvatar.contains(event.target)) {
        setShowUserMenu(false);
      }

      // Mobile drawer click outside
      if (isMenuOpen && navbarCollapse && !navbarCollapse.contains(event.target) && !navbarToggler?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, isMenuOpen]);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      toggleUserMenu();
    } else {
      router.push('/auth/login');
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    router.push('/profile');
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    closeMenu();
  };

  const saveToSearchHistory = async (query, filters = {}) => {
    if (!isAuthenticated || !query || typeof query !== 'string' || !query.trim()) return;
    try {
      await searchHistoryService.saveSearchHistory(query.trim(), filters);
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  // Dual search dropdown rendering
  const renderDualSearchDropdown = () => {
    if (!showSearchDropdown) return null;

    const hasMovies = searchMoviesResult && searchMoviesResult.length > 0;
    const hasActors = searchActorsResult && searchActorsResult.length > 0;
    const isQueryEmpty = !searchQuery.trim();

    return (
      <div className="search-dual-dropdown animate-fade-in">
        {/* Top category label banner */}
        <div className="search-dropdown-banner">
          <span className="banner-title">
            {isQueryEmpty ? 'Gợi ý tìm kiếm' : `Kết quả cho "${searchQuery}"`}
          </span>
          <span className="banner-hint">Bao gồm phim & diễn viên</span>
        </div>

        <div className="search-dual-body">
          {searchDropdownLoading ? (
            <div className="search-loading-container">
              <div className="spinner-border spinner-border-sm text-danger" role="status" />
              <span className="search-loading-text">Đang tra cứu dữ liệu...</span>
            </div>
          ) : !hasMovies && !hasActors ? (
            <div className="search-empty-state">
              <FaSearch className="empty-icon text-muted mb-2" />
              <p className="empty-title">Không tìm thấy kết quả phù hợp</p>
              <p className="empty-desc">Thử tìm với từ khoá tên phim hoặc diễn viên khác</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: DANH SÁCH PHIM */}
              <div className="search-dual-section">
                <div className="section-header">
                  <div className="d-flex align-items-center gap-2">
                    <FaFilm className="section-icon text-danger" />
                    <span className="section-title">Danh sách phim</span>
                  </div>
                  {hasMovies && (
                    <span className="section-count">{searchMoviesResult.length} phim</span>
                  )}
                </div>

                {hasMovies ? (
                  <div className="search-items-list">
                    {searchMoviesResult.map((movie) => {
                      const title = movie.name || movie.title || 'Phim chưa đặt tên';
                      const originalTitle = movie.origin_name || movie.original_title || '';
                      const year = movie.year || (movie.createdAt ? new Date(movie.createdAt).getFullYear() : '2026');
                      const ratingBadge = movie.chieurap ? 'Chiếu Rạp' : (movie.quality || 'P');
                      const episodeBadge = movie.episode_current || movie.time || (movie.type === 'series' ? 'Nhiều tập' : 'Full');
                      const posterUrl = movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER;
                      const movieSlug = movie.slug || movie.id || movie._id;

                      return (
                        <Link
                          key={movieSlug}
                          href={`/movie/${movieSlug}`}
                          className="search-movie-row"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setShowSearchInput(false);
                          }}
                        >
                          <div className="movie-thumb-wrapper">
                            <img
                              src={posterUrl}
                              alt={title}
                              className="movie-thumb-img"
                              onError={(e) => {
                                e.currentTarget.src = LOCAL_DEFAULT_POSTER;
                              }}
                            />
                          </div>

                          <div className="movie-row-content">
                            <div className="movie-row-name" title={title}>
                              {title}
                            </div>
                            {originalTitle && originalTitle !== title && (
                              <div className="movie-row-origin" title={originalTitle}>
                                {originalTitle}
                              </div>
                            )}
                            <div className="movie-row-badges">
                              <span className="meta-badge badge-rating">{ratingBadge}</span>
                              <span className="meta-badge badge-year">{year}</span>
                              <span className="meta-badge badge-episode">{episodeBadge}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="section-empty-hint">Không có phim nào khớp từ khoá</div>
                )}
              </div>

              {/* SEPARATOR */}
              <div className="search-section-divider" />

              {/* SECTION 2: DANH SÁCH DIỄN VIÊN */}
              <div className="search-dual-section">
                <div className="section-header">
                  <div className="d-flex align-items-center gap-2">
                    <FaUserCircle className="section-icon text-warning" />
                    <span className="section-title">Danh sách diễn viên</span>
                  </div>
                  {hasActors && (
                    <span className="section-count">{searchActorsResult.length} người</span>
                  )}
                </div>

                {hasActors ? (
                  <div className="search-items-list">
                    {searchActorsResult.map((actor) => {
                      const actorAvatar = actor.profile_path
                        ? TMDB_CONFIG.getImageUrl(actor.profile_path, 'w185', '/img/avatar.png')
                        : '/img/avatar.png';
                      const actorName = actor.name || actor.original_name || 'Diễn viên';
                      const actorRole = actor.known_for_department === 'Acting'
                        ? 'Diễn viên'
                        : (actor.known_for_department || 'Diễn viên');
                      const knownWork = actor.known_for?.[0]?.title || actor.known_for?.[0]?.name;
                      const actorId = actor.id;

                      return (
                        <Link
                          key={actorId || actorName}
                          href={actorId ? `/performer/${actorId}` : `/search?q=${encodeURIComponent(actorName)}`}
                          className="search-actor-row"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setShowSearchInput(false);
                          }}
                        >
                          <img
                            src={actorAvatar}
                            alt={actorName}
                            className="actor-thumb-img"
                            onError={(e) => {
                              e.currentTarget.src = '/img/avatar.png';
                            }}
                          />
                          <div className="actor-row-content">
                            <div className="actor-row-name">{actorName}</div>
                            <div className="actor-row-sub">
                              {actorRole}
                              {knownWork ? ` • Phim: ${knownWork}` : ''}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="section-empty-hint">Không có diễn viên nào khớp từ khoá</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* BOTTOM ALL RESULTS CTA */}
        {searchQuery.trim() && (
          <div className="search-dropdown-footer">
            <Link
              href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
              className="footer-view-all"
              onClick={() => {
                setShowSearchDropdown(false);
                setShowSearchInput(false);
              }}
            >
              Xem tất cả kết quả cho &quot;{searchQuery.trim()}&quot; →
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? "navbar-scrolled" : "navbar-top"}`}>
      {isMenuOpen && (
        <div
          className="menu-overlay d-lg-none"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <div className="container-fluid px-3 px-lg-5">
        <div className="d-flex align-items-center">
          <button
            className="navbar-toggler border-0 d-lg-none p-0 me-2"
            type="button"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Mở menu"
          >
            <FaBars className="text-white fs-5" />
          </button>

          <Link href="/" className="navbar-brand d-flex align-items-center me-lg-4">
            <img
              src="/img/phimlogo-removebg-preview.png"
              alt="Logo"
              className="navbar-logo"
            />
          </Link>
        </div>

        {/* MOBILE CONTROLS (SEARCH & AVATAR) */}
        <div className="d-flex d-lg-none align-items-center ms-auto gap-2">
          <div className="position-relative" ref={mobileSearchWrapperRef}>
            {showSearchInput ? (
              <form onSubmit={handleSearch} className="mobile-search-form d-flex align-items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="form-control mobile-search-input"
                  placeholder="Tìm phim, diễn viên..."
                  autoFocus
                  ref={mobileSearchInputRef}
                  onFocus={() => {
                    setShowSearchDropdown(true);
                    fetchLiveSearch(searchQuery);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-icon-close text-secondary"
                  onClick={() => {
                    setShowSearchInput(false);
                    setShowSearchDropdown(false);
                  }}
                >
                  <FaTimes />
                </button>
              </form>
            ) : (
              <button
                className="btn btn-link text-white p-1"
                onClick={toggleSearchInput}
                aria-label="Tìm kiếm"
              >
                <FaSearch className="fs-5" />
              </button>
            )}

            {showSearchInput && renderDualSearchDropdown()}
          </div>

          <div className="profile-avatar" onClick={handleAvatarClick} title="Tài khoản cá nhân">
            <img
              src={getAvatarUrl(user)}
              alt="User Avatar"
              className="rounded-circle avatar-small"
              onError={(e) => {
                e.currentTarget.src = "/img/avatar.png";
              }}
            />
          </div>
        </div>

        {/* DESKTOP & MOBILE DRAWER NAVIGATION */}
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <div className="d-lg-none position-absolute top-0 end-0 p-3">
            <button
              className="btn btn-link text-white p-0 border-0"
              onClick={closeMenu}
              aria-label="Đóng menu"
            >
              <FaTimes style={{ fontSize: '22px' }} />
            </button>
          </div>

          {/* EXACT NAVBAR ATTRIBUTES IN SPECIFIED ORDER (FROM NAVIGATION_CONFIG) */}
          <ul className="navbar-nav align-items-lg-center mx-auto" ref={navRef}>
            {MAIN_NAV_ITEMS.map((navItem) => {
              if (navItem.type === 'dropdown') {
                const isGenres = navItem.dropdownType === 'genres';
                const isOpen = isGenres ? showGenresDropdown : showCountriesDropdown;
                const setIsOpen = isGenres ? setShowGenresDropdown : setShowCountriesDropdown;
                const ref = isGenres ? genresDropdownRef : countriesDropdownRef;
                const active = navItem.matchPrefix ? router.pathname.startsWith(navItem.matchPrefix) : false;

                return (
                  <li
                    key={navItem.id}
                    className={`nav-item dropdown-wrapper ${active ? 'active' : ''}`}
                    ref={ref}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                  >
                    <button
                      type="button"
                      className={`nav-link nav-link-btn ${active ? 'active' : ''}`}
                      onClick={() => setIsOpen(!isOpen)}
                      aria-expanded={isOpen}
                    >
                      <span>{navItem.label}</span>
                      <FaChevronDown className={`chevron-icon ms-1 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Desktop Popover */}
                    {isOpen && (
                      <div className={`custom-dropdown-popover ${isGenres ? 'genres-popover' : 'countries-popover'} animate-fade-in d-none d-lg-block`}>
                        <div className="popover-header">
                          <span className="popover-title">{isGenres ? 'Chủ Đề & Thể Loại' : 'Quốc Gia Sản Xuất'}</span>
                        </div>
                        <div className={isGenres ? 'genres-grid' : 'countries-grid'}>
                          {navItem.items.map((subItem) => (
                            <Link
                              key={subItem.slug}
                              href={subItem.href}
                              className={isGenres ? 'genre-item-link' : 'country-item-link'}
                              onClick={() => setIsOpen(false)}
                            >
                              {isGenres ? (
                                <>
                                  <span className="genre-dot" />
                                  <span className="genre-label">{subItem.name}</span>
                                </>
                              ) : (
                                <>
                                  <span className="country-label">{subItem.name}</span>
                                  {subItem.badge && <span className="country-badge">{subItem.badge}</span>}
                                </>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mobile Submenu */}
                    <div className="d-lg-none">
                      {isOpen && (
                        <div className="mobile-submenu">
                          {navItem.items.map((subItem) => (
                            <Link
                              key={subItem.slug}
                              href={subItem.href}
                              className="mobile-sublink"
                              onClick={closeMenu}
                            >
                              <span>{subItem.name}</span>
                              {subItem.badge && !isGenres && (
                                <span className="country-badge-mobile ms-2">{subItem.badge}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              }

              // Regular link
              const active = navItem.matchExact
                ? router.pathname === navItem.href
                : router.pathname.startsWith(navItem.href);

              return (
                <li key={navItem.id} className={`nav-item ${active ? 'active' : ''}`}>
                  <Link
                    href={navItem.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    {navItem.label}
                  </Link>
                </li>
              );
            })}

            {/* MOBILE ONLY USER DASHBOARD LINKS */}
            <li className="nav-item d-lg-none border-top border-secondary pt-3 mt-3">
              {isAuthenticated ? (
                <>
                  {USER_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="nav-link text-light py-2"
                      onClick={closeMenu}
                    >
                      {USER_ICONS[item.iconType]} {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="nav-link text-danger py-2 bg-transparent border-0 w-100 text-start"
                  >
                    <FaSignOutAlt className="me-2" /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="nav-link text-white py-2" onClick={closeMenu}>
                  <FaUserCircle className="me-2 text-danger" /> Đăng nhập / Đăng ký
                </Link>
              )}
            </li>

            {/* Minimalist gliding active indicator */}
            <div className="nav-indicator d-none d-lg-block" style={indicatorStyle} />
          </ul>

          {/* DESKTOP RIGHT ACTION SECTION */}
          <div className="d-none d-lg-flex align-items-center gap-3 ms-auto">
            {/* Search Input Box with Attached Dual Dropdown */}
            <div className="search-wrapper position-relative" ref={searchWrapperRef}>
              <form onSubmit={handleSearch} className="expanded-search-form">
                <div className="expanded-search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="expanded-search-input"
                    placeholder="Tìm phim, diễn viên..."
                    ref={searchInputRef}
                    onFocus={() => {
                      setShowSearchDropdown(true);
                      fetchLiveSearch(searchQuery);
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={() => {
                        setSearchQuery('');
                        fetchLiveSearch('');
                      }}
                      title="Xoá tìm kiếm"
                    >
                      <FaTimesCircle />
                    </button>
                  )}
                </div>
              </form>

              {/* DUAL DROPDOWN FOR MOVIES & ACTORS */}
              {renderDualSearchDropdown()}
            </div>

            {/* Profile Avatar & Minimalist Dropdown */}
            <div
              className="profile-avatar position-relative"
              onClick={handleAvatarClick}
              title={isAuthenticated ? (user?.fullname || user?.name || "Tài khoản cá nhân") : "Đăng nhập"}
            >
              <img
                src={getAvatarUrl(user)}
                alt="User Avatar"
                className="rounded-circle avatar-desktop"
                onError={(e) => {
                  e.currentTarget.src = "/img/avatar.png";
                }}
              />
              {isAuthenticated && <div className="user-status-indicator" />}
            </div>
          </div>
        </div>
      </div>

      {/* USER PROFILE DROPDOWN MENU */}
      {showUserMenu && (
        <div id="userMenu" className="user-menu animate-fade-in">
          {isAuthenticated ? (
            <>
              <div className="user-info">
                <img
                  src={getAvatarUrl(user)}
                  alt="User Avatar"
                  className="rounded-circle me-2"
                  style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = "/img/avatar.png"; }}
                />
                <div className="user-details">
                  <p className="user-name">{user?.fullname || user?.name || 'Thành viên'}</p>
                  <p className="user-email">{user?.email || 'Người dùng'}</p>
                </div>
              </div>
              <hr className="dropdown-divider my-2" />
              {USER_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className="dropdown-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push(item.href);
                  }}
                >
                  {USER_ICONS[item.iconType]} {item.label}
                </button>
              ))}
              <hr className="dropdown-divider my-2" />
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="auth-links">
              <Link href="/auth/login" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                Đăng nhập
              </Link>
              <Link href="/auth/signup" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                Đăng ký tài khoản
              </Link>
            </div>
          )}
        </div>
      )}

      {showFeedbackForm && (
        <FeedbackForm
          ref={feedbackRef}
          isOpen={showFeedbackForm}
          onClose={() => setShowFeedbackForm(false)}
        />
      )}

      {/* MINIMALIST MODERN DESIGN SYSTEM STYLES */}
      <style jsx global>{`
        /* Minimalist Header Shell */
        .navbar {
          height: 64px;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      backdrop-filter 0.3s ease,
                      box-shadow 0.3s ease,
                      border-color 0.3s ease;
          z-index: 1000;
        }

        .navbar-top {
          background: rgba(10, 14, 22, 0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .navbar-scrolled {
          background: rgba(8, 11, 16, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        }

        .navbar-logo {
          width: 120px;
          height: auto;
          max-height: 32px;
          object-fit: contain;
          transition: transform 0.2s ease;
        }

        .navbar-logo:hover {
          transform: scale(1.02);
        }

        /* Minimalist Navigation Items */
        .navbar-nav {
          position: relative;
          gap: 2px;
        }

        .nav-link,
        .nav-link-btn {
          font-size: 14.5px;
          font-weight: 500;
          color: #cbd5e1 !important;
          padding: 0.4rem 0.95rem !important;
          border-radius: 9999px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-link:hover,
        .nav-link-btn:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.07);
        }

        .nav-link.active,
        .nav-link-btn.active {
          color: #ffffff !important;
          font-weight: 600;
          background: rgba(229, 9, 20, 0.14);
        }

        .chevron-icon {
          font-size: 10px;
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .rotate-180 {
          transform: rotate(180deg);
          color: #e50914;
        }

        /* Sliding Red Glowing Underline Indicator */
        .nav-indicator {
          position: absolute;
          bottom: -4px;
          height: 2.5px;
          background: linear-gradient(90deg, #ff4d58, #e50914);
          border-radius: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px rgba(229, 9, 20, 0.7);
          pointer-events: none;
        }

        /* Dropdown Wrapper & Popovers */
        .dropdown-wrapper {
          position: relative;
        }

        .custom-dropdown-popover {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(13, 17, 24, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
          z-index: 1050;
        }

        .popover-header {
          padding: 4px 8px 8px;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .popover-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }

        /* Genres Popover */
        .genres-popover {
          width: 320px;
        }

        .genres-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
        }

        .genre-item-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 8px;
          color: #e2e8f0;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .genre-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #64748b;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .genre-item-link:hover {
          background: rgba(229, 9, 20, 0.15);
          color: #ffffff;
        }

        .genre-item-link:hover .genre-dot {
          background: #e50914;
          transform: scale(1.4);
        }

        /* Countries Popover */
        .countries-popover {
          width: 300px;
        }

        .countries-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
        }

        .country-item-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 8px;
          color: #e2e8f0;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .country-badge {
          font-size: 10px;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 5px;
          border-radius: 4px;
        }

        .country-item-link:hover {
          background: rgba(229, 9, 20, 0.15);
          color: #ffffff;
        }

        .country-item-link:hover .country-badge {
          background: rgba(229, 9, 20, 0.35);
          color: #ffffff;
        }

        /* Search Input Box */
        .expanded-search-form {
          display: flex;
          align-items: center;
        }

        .expanded-search-box {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 0.32rem 0.85rem;
          width: 220px;
          height: 36px;
          backdrop-filter: blur(12px);
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .expanded-search-box:focus-within {
          width: 280px;
          background: rgba(13, 17, 23, 0.94);
          border-color: rgba(229, 9, 20, 0.8);
          box-shadow: 0 0 14px rgba(229, 9, 20, 0.3), 0 4px 18px rgba(0, 0, 0, 0.45);
        }

        .search-icon {
          color: #94a3b8;
          font-size: 13px;
          margin-right: 8px;
          flex-shrink: 0;
          transition: color 0.25s ease;
        }

        .expanded-search-box:focus-within .search-icon {
          color: #e50914;
        }

        .expanded-search-input {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        .expanded-search-input::placeholder {
          color: #94a3b8;
          font-size: 12.5px;
        }

        .btn-clear-search {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          margin-left: 6px;
          transition: color 0.2s ease;
        }

        .btn-clear-search:hover {
          color: #ffffff;
        }

        /* DUAL SEARCH DROPDOWN (MOVIES & ACTORS) */
        .search-dual-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 390px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          background: rgba(13, 17, 24, 0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.7);
          overflow: hidden;
          z-index: 1060;
        }

        .search-dropdown-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .banner-title {
          font-size: 12.5px;
          font-weight: 600;
          color: #e2e8f0;
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .banner-hint {
          font-size: 11px;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .search-dual-body {
          flex: 1;
          overflow-y: auto;
          max-height: 380px;
          padding: 8px;
        }

        /* Sleek scrollbar */
        .search-dual-body::-webkit-scrollbar {
          width: 5px;
        }
        .search-dual-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.16);
          border-radius: 4px;
        }

        .search-dual-section {
          display: flex;
          flex-direction: column;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          margin-bottom: 4px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }

        .section-count {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 500;
        }

        .search-section-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 10px 4px;
        }

        .search-items-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        /* Movie Row */
        .search-movie-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .search-movie-row:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(2px);
        }

        .movie-thumb-wrapper {
          width: 38px;
          height: 52px;
          flex-shrink: 0;
          border-radius: 5px;
          overflow: hidden;
          background: #1e293b;
        }

        .movie-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .movie-row-content {
          flex: 1;
          min-width: 0;
        }

        .movie-row-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .movie-row-origin {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          margin-top: 1px;
        }

        .movie-row-badges {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
        }

        .meta-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 5px;
          border-radius: 4px;
          line-height: 1.3;
        }

        .badge-rating {
          background: rgba(229, 9, 20, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(229, 9, 20, 0.3);
        }

        .badge-year {
          background: rgba(255, 255, 255, 0.07);
          color: #e2e8f0;
        }

        .badge-episode {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }

        /* Actor Row */
        .search-actor-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .search-actor-row:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(2px);
        }

        .actor-thumb-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .actor-row-content {
          flex: 1;
          min-width: 0;
        }

        .actor-row-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .actor-row-sub {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }

        .section-empty-hint {
          font-size: 12px;
          color: #64748b;
          padding: 6px 8px;
          font-style: italic;
        }

        .search-loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 30px 15px;
        }

        .search-loading-text {
          font-size: 13px;
          color: #94a3b8;
        }

        .search-empty-state {
          text-align: center;
          padding: 30px 15px;
        }

        .empty-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .empty-desc {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 0;
        }

        .search-dropdown-footer {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        .footer-view-all {
          font-size: 12.5px;
          font-weight: 600;
          color: #ff4d58;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .footer-view-all:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        /* Profile Avatar & Menu */
        .profile-avatar {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .avatar-desktop {
          width: 36px;
          height: 36px;
          object-fit: cover;
          border: 2px solid transparent;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .avatar-small {
          width: 32px;
          height: 32px;
          object-fit: cover;
        }

        .profile-avatar:hover .avatar-desktop {
          border-color: #e50914;
          transform: scale(1.04);
        }

        .user-status-indicator {
          position: absolute;
          width: 9px;
          height: 9px;
          background-color: #22c55e;
          border-radius: 50%;
          bottom: 1px;
          right: 1px;
          border: 1.5px solid #0d1118;
        }

        .user-menu {
          position: absolute;
          top: 66px;
          right: 24px;
          width: 250px;
          background: rgba(13, 17, 24, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
          z-index: 1050;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .user-name {
          margin: 0;
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .user-email {
          margin: 0;
          font-size: 11.5px;
          color: #94a3b8;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 8px 10px;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          transition: background 0.15s ease;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .dropdown-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Mobile Drawer Specifics */
        @media (max-width: 991px) {
          .navbar-collapse {
            position: fixed;
            top: 0;
            left: -285px;
            width: 285px;
            height: 100vh;
            background: rgba(8, 11, 16, 0.98);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            padding: 70px 1.25rem 2rem;
            z-index: 1100;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
          }

          .navbar-collapse.show {
            left: 0;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
          }

          .nav-item {
            margin: 4px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 4px;
          }

          .nav-link,
          .nav-link-btn {
            width: 100%;
            justify-content: space-between;
            padding: 0.6rem 0.5rem !important;
            font-size: 15px;
          }

          .mobile-submenu {
            padding-left: 12px;
            margin: 4px 0 8px;
            border-left: 2px solid rgba(229, 9, 20, 0.4);
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .mobile-sublink {
            font-size: 13.5px;
            color: #cbd5e1;
            text-decoration: none;
            padding: 4px 0;
            display: flex;
            align-items: center;
          }

          .country-badge-mobile {
            font-size: 10px;
            color: #94a3b8;
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 6px;
            border-radius: 4px;
          }

          .search-dual-dropdown {
            position: fixed;
            top: 66px;
            left: 12px;
            right: 12px;
            width: auto;
            max-height: 75vh;
          }

          .mobile-search-form {
            position: relative;
            width: 180px;
          }

          .mobile-search-input {
            height: 32px;
            font-size: 12.5px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            border-radius: 9999px;
            padding: 0.2rem 1.8rem 0.2rem 0.8rem;
          }

          .mobile-search-input:focus {
            background: #0d1118;
            border-color: #e50914;
            color: #ffffff;
            box-shadow: none;
          }

          .btn-icon-close {
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
            padding: 2px;
            background: transparent;
            border: none;
          }

          .nav-indicator {
            display: none;
          }
        }

        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          z-index: 1080;
        }

        .animate-fade-in {
          animation: navFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes navFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
