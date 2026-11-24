import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaFilm,
  FaHeart,
  FaBookmark,
  FaHistory,
  FaSignOutAlt,
  FaUserCircle,
  FaUserPlus,
  FaTimesCircle,
  FaChevronDown,
  FaCog
} from 'react-icons/fa';
import { useRouter } from 'next/router';
import { getApiOrigin } from '@/config/apiBase';
import { getStoredAccessToken } from '@/API/services/authService';

// Zustand store cho user (cache profile + favorites)
import { useUserStore } from '@/stores/useUserStore';

// .js deps - cast for strict TS
import { useAuth as useAuthRaw, isAdminUser } from '@/context/AuthContext';
const { useAuth } = { useAuth: useAuthRaw as unknown as () => AuthApi };
import searchHistoryServiceRaw from '@/API/services/searchHistoryService';
const searchHistoryService = searchHistoryServiceRaw as unknown as {
  saveSearchHistory: (q: string, filters?: Record<string, unknown>) => Promise<unknown>;
};
import FeedbackFormRaw from '@/features/shared/components/Feedback/FeedbackForm';
const FeedbackFormComponent = FeedbackFormRaw as unknown as React.ComponentType<{
  isOpen: boolean;
  onClose: () => void;
  ref?: React.Ref<unknown>;
}>;
import movieServiceRaw, { safeFetchJson, extractMovieList } from '@/API/services/movieService';
const movieService = movieServiceRaw as unknown as {
  getHeroMovies: (limit?: number) => Promise<unknown[]>;
};
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { TMDB_CONFIG } from '@/config/systemConfig';
import { apiPath } from '@/config/apiPaths';
import { useClientYears } from '@/features/client/years/hooks/useClientYears';
import { useClientCountries } from '@/features/client/countries';
import {
  MAIN_NAV_ITEMS,
  NAVBAR_SEARCH_CONFIG
} from '@/config/navigationConfig';

/** ---------- local types ---------- */
interface AuthUser {
  avatar?: string;
  image?: string;
  fullname?: string;
  name?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  [key: string]: unknown;
}

interface AuthApi {
  user: AuthUser | null;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

interface IndicatorStyle {
  left?: number;
  width?: number;
  opacity: number;
}

interface NavSubItem {
  slug: string;
  name: string;
  href: string;
}

interface NavItemBase {
  id: string;
  label: string;
  type?: 'link' | 'dropdown';
  href?: string;
  matchExact?: boolean;
  matchPrefix?: string;
  dropdownType?: 'genres' | 'countries' | 'years';
  items?: NavSubItem[];
}

interface SearchResultActor {
  id?: number;
  name?: string;
  original_name?: string;
  profile_path?: string | null;
  known_for_department?: string;
  known_for?: Array<{ title?: string; name?: string }>;
  [key: string]: unknown;
}

interface SearchResultMovie {
  name?: string;
  title?: string;
  origin_name?: string;
  original_title?: string;
  year?: number | string;
  chieurap?: boolean;
  quality?: string;
  episode_current?: string;
  time?: string;
  type?: string;
  poster_url?: string;
  thumb_url?: string;
  slug?: string;
  id?: string | number;
  _id?: string | number;
  createdAt?: string;
  [key: string]: unknown;
}

const USER_ICONS = {
  user: <FaUserCircle className="me-2 text-primary" />,
  heart: <FaHeart className="me-2 text-danger" />,
  bookmark: <FaBookmark className="me-2 text-warning" />,
  history: <FaHistory className="me-2 text-info" />
};

interface CinemaAvatarSvgProps {
  size?: number;
  className?: string;
}

/**
 * A modern vector SVG cinema avatar.
 *
 * The gradient is bright and colorful, so the default placeholder never
 * looks completely black against the dark navbar. The signature cinema
 * palette is used (warm amber to coral to magenta).
 */
export const CinemaAvatarSvg: React.FC<CinemaAvatarSvgProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ width: `${size}px`, height: `${size}px`, display: 'block', flexShrink: 0 }}
    aria-label="Avatar"
  >
    <defs>
      <linearGradient id="cinemaAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="55%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
      <linearGradient id="cinemaAvatarIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fff7ed" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="17.5" fill="url(#cinemaAvatarGrad)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
    <circle cx="18" cy="13" r="5.25" fill="url(#cinemaAvatarIconGrad)" />
    <path
      d="M8.5 28.5C8.5 23.5 12.2 20.5 18 20.5C23.8 20.5 27.5 23.5 27.5 28.5C27.5 29.5 26.8 30 25.8 30H10.2C9.2 30 8.5 29.5 8.5 28.5Z"
      fill="url(#cinemaAvatarIconGrad)"
    />
  </svg>
);

const getAvatarUrl = (user: AuthUser | null | undefined): string | null => {
  if (!user) return null;

  let avatarUrl: string | undefined = user.avatar || user.image;
  if (!avatarUrl || avatarUrl === '/img/avatar.png') return null;

  if (avatarUrl.startsWith('/')) {
    const baseWithoutApi = getApiOrigin();

    avatarUrl = `${baseWithoutApi}${avatarUrl}`;
  }

  if (!avatarUrl.includes('?') &&
      !avatarUrl.includes('googleusercontent.com') &&
      !avatarUrl.includes('cloudinary.com')) {
    avatarUrl = `${avatarUrl}?t=${Date.now()}`;
  }

  return avatarUrl;
};

interface UserAvatarDisplayProps {
  user: AuthUser | null;
  size?: number;
  className?: string;
}

const UserAvatarDisplay: React.FC<UserAvatarDisplayProps> = ({ user, size = 34, className = '' }) => {
  const [imgError, setImgError] = useState<boolean>(false);
  const avatarUrl = getAvatarUrl(user);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar, user?.image]);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.fullname || user?.name || 'User Avatar'}
        className={`rounded-circle ${className}`}
        style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }

  return <CinemaAvatarSvg size={size} className={`rounded-circle ${className}`} />;
};

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);

  // Navigation Dropdown States
  const [showGenresDropdown, setShowGenresDropdown] = useState<boolean>(false);
  const [showCountriesDropdown, setShowCountriesDropdown] = useState<boolean>(false);
  const [showYearsDropdown, setShowYearsDropdown] = useState<boolean>(false);
  const [lockedDropdown, setLockedDropdown] = useState<'genres' | 'countries' | 'years' | null>(null);
  const [mobileGenresOpen, setMobileGenresOpen] = useState<boolean>(false);
  const [mobileCountriesOpen, setMobileCountriesOpen] = useState<boolean>(false);
  const [mobileYearsOpen, setMobileYearsOpen] = useState<boolean>(false);
  const { activeYears } = useClientYears();
  const { countries: activeCountries } = useClientCountries();
  const dropdownCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dual Search Dropdown States
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [searchMoviesResult, setSearchMoviesResult] = useState<SearchResultMovie[]>([]);
  const [searchActorsResult, setSearchActorsResult] = useState<SearchResultActor[]>([]);
  const [searchDropdownLoading, setSearchDropdownLoading] = useState<boolean>(false);

  // Search History States
  const [searchHistory, setSearchHistory] = useState<unknown[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  const [searchHistoryLoading, setSearchHistoryLoading] = useState<boolean>(false);

  const router = useRouter();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  // ---- The Zustand store: the user data is synced with the cache on
  // login and on logout ----
  // IMPORTANT: every selector has to return a primitive value or a stable
  // reference (a function). It must NOT return a new `{...}` object,
  // because Zustand would see a different reference, the component would
  // re-render, and the loop would never end.
  //
  // The navbar only re-renders when `isAuthenticated` changes.
  const zustandIsAuthenticated = useUserStore((s) => s.isAuthenticated);
  const setCachedProfile = useUserStore((s) => s.setCachedProfile);
  const setToken = useUserStore((s) => s.setToken);
  const zustandLogout = useUserStore((s) => s.logout);

  // The store is synced when the user signs in or signs out.
  useEffect(() => {
    // The auth state is not resolved yet: the store must not be touched,
    // otherwise the persisted favorite cache would be wiped on every load.
    if (authLoading) return;

    if (isAuthenticated && user) {
      // The profile is cached in the Zustand store.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCachedProfile(user as any);
      // The token is synced when there is one. It is read from the MEMORY of
      // the tab: it is not stored in the Web Storage any more.
      const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
      if (token) setToken(token);
    } else if (!isAuthenticated) {
      // On logout the cache is cleared.
      zustandLogout();
    }
  }, [isAuthenticated, authLoading, user, setCachedProfile, setToken, zustandLogout]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchWrapperRef = useRef<HTMLDivElement | null>(null);
  const genresDropdownRef = useRef<HTMLLIElement | null>(null);
  const countriesDropdownRef = useRef<HTMLLIElement | null>(null);
  const yearsDropdownRef = useRef<HTMLLIElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLUListElement | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
    opacity: 0
  });

  const isActive = (path: string): boolean => {
    if (path === '/' && router.pathname === '/') return true;
    if (path !== '/' && router.pathname.startsWith(path)) return true;
    return false;
  };

  const isGenreActive = (): boolean => router.pathname.startsWith('/genre');
  const isCountryActive = (): boolean =>
    router.pathname.startsWith('/country') ||
    router.pathname.startsWith('/quoc-gia') ||
    router.asPath.startsWith('/country') ||
    router.asPath.startsWith('/quoc-gia');
  const isYearActive = (): boolean => Boolean(router.query.year);

  const handleDropdownMouseEnter = (type: 'genres' | 'countries' | 'years'): void => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    setShowGenresDropdown(type === 'genres');
    setShowCountriesDropdown(type === 'countries');
    setShowYearsDropdown(type === 'years');
  };

  const _unusedOldLeave1 = (type?: string): void => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    if (type === 'genres') {
      setShowGenresDropdown(true);
      if (lockedDropdown !== 'countries') setShowCountriesDropdown(false);
    } else if (type === 'countries') {
      setShowCountriesDropdown(true);
      if (lockedDropdown !== 'genres') setShowGenresDropdown(false);
    }
  };

  const handleDropdownMouseLeave = (type: 'genres' | 'countries' | 'years'): void => {
    if (lockedDropdown === type) return;
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    dropdownCloseTimeoutRef.current = setTimeout(() => {
      if (type === 'genres') {
        setShowGenresDropdown(false);
      } else if (type === 'countries') {
        setShowCountriesDropdown(false);
      } else if (type === 'years') {
        setShowYearsDropdown(false);
      }
    }, 380);
  };

  const _unusedOldLeave2 = (type?: string): void => {
    if (lockedDropdown === type) return;
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    dropdownCloseTimeoutRef.current = setTimeout(() => {
      if (type === 'genres') {
        setShowGenresDropdown(false);
      } else if (type === 'countries') {
        setShowCountriesDropdown(false);
      }
    }, 380);
  };

  const handleDropdownClick = (type: 'genres' | 'countries' | 'years'): void => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    if (lockedDropdown === type) {
      setLockedDropdown(null);
      setShowGenresDropdown(false);
      setShowCountriesDropdown(false);
      setShowYearsDropdown(false);
    } else {
      setLockedDropdown(type);
      setShowGenresDropdown(type === 'genres');
      setShowCountriesDropdown(type === 'countries');
      setShowYearsDropdown(type === 'years');
    }
  };

  const _unusedOldClick = (type: 'genres' | 'countries' = 'genres'): void => {
    if (dropdownCloseTimeoutRef.current) {
      clearTimeout(dropdownCloseTimeoutRef.current);
    }
    if (lockedDropdown === type) {
      setLockedDropdown(null);
      if (type === 'genres') setShowGenresDropdown(false);
      if (type === 'countries') setShowCountriesDropdown(false);
    } else {
      setLockedDropdown(type);
      if (type === 'genres') {
        setShowGenresDropdown(true);
        setShowCountriesDropdown(false);
      } else {
        setShowCountriesDropdown(true);
        setShowGenresDropdown(false);
      }
    }
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = (): void => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator for active navbar item
  useEffect(() => {
    const updateIndicator = (): void => {
      if (navRef.current && window.innerWidth >= 992) {
        const navItems = navRef.current.querySelectorAll<HTMLElement>('.nav-link');
        let activeItem: HTMLElement | null = null;

        navItems.forEach((item) => {
          if (item.classList.contains('active')) {
            activeItem = item;
          }
        });

        if (activeItem) {
          const { left, width } = (activeItem as HTMLElement).getBoundingClientRect();
          const navLeft = navRef.current?.getBoundingClientRect().left ?? 0;

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

  const fetchLiveSearch = async (queryText: string): Promise<void> => {
    const q = (queryText || '').trim();
    setSearchDropdownLoading(true);

    try {
      if (!q) {
        const [latestMovies, tmdbActors] = await Promise.all([
          movieService.getHeroMovies(NAVBAR_SEARCH_CONFIG.movieLimit).catch(() => []),
          fetch(`${TMDB_CONFIG.baseUrl}/person/popular?api_key=${TMDB_CONFIG.apiKey}&language=vi-VN&page=1`)
            .then((res) => res.ok ? res.json() : { results: [] })
            .then((data: { results?: SearchResultActor[] }) => (data.results || []).slice(0, NAVBAR_SEARCH_CONFIG.actorLimit))
            .catch(() => [])
        ]);

        setSearchMoviesResult(Array.isArray(latestMovies) ? (latestMovies as SearchResultMovie[]) : []);
        setSearchActorsResult(Array.isArray(tmdbActors) ? tmdbActors : []);
      } else {
        const [moviesResp, tmdbActors] = await Promise.all([
          safeFetchJson(apiPath(`moviesList`) + `?search=${encodeURIComponent(q)}&limit=${NAVBAR_SEARCH_CONFIG.movieLimit}`, {}, null)
            .then((res: unknown) => {
              const list = extractMovieList(res);
              if (Array.isArray(list) && list.length > 0) return list;
              return safeFetchJson(apiPath(`moviesSearch`) + `?q=${encodeURIComponent(q)}`, {}, [])
                .then(extractMovieList);
            })
            .catch(() => []),
          fetch(`${TMDB_CONFIG.baseUrl}/search/person?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(q)}&language=vi-VN&page=1`)
            .then((res) => res.ok ? res.json() : { results: [] })
            .then((data: { results?: SearchResultActor[] }) => (data.results || []).slice(0, NAVBAR_SEARCH_CONFIG.actorLimit))
            .catch(() => [])
        ]);

        setSearchMoviesResult(Array.isArray(moviesResp) ? (moviesResp as SearchResultMovie[]) : []);
        setSearchActorsResult(Array.isArray(tmdbActors) ? tmdbActors : []);
      }
    } catch (err) {

    } finally {
      setSearchDropdownLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isAuthenticated) {
        saveToSearchHistory(searchQuery);
      }
      localStorage.removeItem('lastSearchQuery');
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
      setShowSearchInput(false);
    }
  };

  const toggleSearchInput = (): void => {
    setShowSearchInput(!showSearchInput);
    if (!showSearchInput) {
      setShowSearchDropdown(true);
      fetchLiveSearch(searchQuery);
    }
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = (): void => {
    setIsMenuOpen(false);
    setMobileGenresOpen(false);
    setMobileCountriesOpen(false);
  };

  const toggleUserMenu = (): void => {
    setShowUserMenu(!showUserMenu);
  };

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      const navbarCollapse = document.getElementById('navbarNav');
      const navbarToggler = document.querySelector('.navbar-toggler');
      const userMenu = document.getElementById('userMenu');
      const userAvatar = document.querySelector('.profile-avatar');

      // Search dropdown click outside
      const inDesktopSearch = searchWrapperRef.current && searchWrapperRef.current.contains(target);
      const inMobileSearch = mobileSearchWrapperRef.current && mobileSearchWrapperRef.current.contains(target);
      if (!inDesktopSearch && !inMobileSearch) {
        setShowSearchDropdown(false);
      }

      // Genres dropdown click outside
      if (genresDropdownRef.current && !genresDropdownRef.current.contains(target)) {
        setShowGenresDropdown(false);
        setLockedDropdown((prev) => (prev === 'genres' ? null : prev));
      }

      // Countries dropdown click outside
      if (countriesDropdownRef.current && !countriesDropdownRef.current.contains(target)) {
        setShowCountriesDropdown(false);
        setLockedDropdown((prev) => (prev === 'countries' ? null : prev));
      }

      // User menu click outside
      if (showUserMenu && userMenu && !userMenu.contains(target) && userAvatar && !userAvatar.contains(target)) {
        setShowUserMenu(false);
      }

      // Mobile drawer click outside
      if (isMenuOpen && navbarCollapse && !navbarCollapse.contains(target) && !navbarToggler?.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowSearchInput(false);
        setShowUserMenu(false);
        setShowGenresDropdown(false);
        setShowCountriesDropdown(false);
        setLockedDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu, isMenuOpen]);

  const handleAvatarClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (isAuthenticated) {
      toggleUserMenu();
    } else {
      router.push('/auth/login');
    }
  };

  const handleProfileClick = (): void => {
    setShowUserMenu(false);
    router.push('/profile');
  };

  const handleLogout = (): void => {
    setShowUserMenu(false);
    logout();
  };

  const handleOverlayClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    closeMenu();
  };

  const saveToSearchHistory = async (query: string, filters: Record<string, unknown> = {}): Promise<void> => {
    if (!isAuthenticated || !query || typeof query !== 'string' || !query.trim()) return;
    try {
      await searchHistoryService.saveSearchHistory(query.trim(), filters);
    } catch (error) {

    }
  };

  // Dual search dropdown rendering
  const renderDualSearchDropdown = (): React.ReactNode => {
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
                      const title: string = movie.name || movie.title || 'Phim chưa đặt tên';
                      const originalTitle: string = movie.origin_name || movie.original_title || '';
                      const year: number | string = movie.year || (movie.createdAt ? new Date(movie.createdAt).getFullYear() : '2026');
                      const ratingBadge: string = movie.chieurap ? 'Chiếu Rạp' : (movie.quality || 'P');
                      const episodeBadge: string = movie.episode_current || movie.time || (movie.type === 'series' ? 'Nhiều tập' : 'Full');
                      const posterUrl: string = movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER;
                      const movieSlug: string = String(movie.slug || movie.id || movie._id || '');

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
                              <span className="meta-badge badge-year">{String(year)}</span>
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
                      const actorAvatar: string = actor.profile_path
                        ? TMDB_CONFIG.getImageUrl(actor.profile_path, 'w185', '/img/avatar.png')
                        : '/img/avatar.png';
                      const actorName: string = actor.name || actor.original_name || 'Diễn viên';
                      const actorRole: string = actor.known_for_department === 'Acting'
                        ? 'Diễn viên'
                        : (actor.known_for_department || 'Diễn viên');
                      const knownWork: string | undefined = actor.known_for?.[0]?.title || actor.known_for?.[0]?.name;
                      const actorId: number | undefined = actor.id;

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
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'navbar-scrolled' : 'navbar-top'}`}>
      {isMenuOpen && (
        <div
          className="menu-overlay d-lg-none"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <div className="container-fluid px-3 px-lg-5">
        {/* BRAND & TOGGLER */}
        <div className={`d-flex align-items-center ${showSearchInput ? 'd-none d-lg-flex' : ''}`}>
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

        {/* MOBILE CONTROLS */}
        <div className={`d-flex d-lg-none align-items-center ms-auto gap-2 ${showSearchInput ? 'd-none' : ''}`}>
          <button
            className="btn btn-link text-white p-2 mobile-search-trigger-btn"
            onClick={toggleSearchInput}
            aria-label="Mở tìm kiếm"
          >
            <FaSearch className="fs-5" />
          </button>

          <div className="profile-avatar" onClick={handleAvatarClick} title="Tài khoản cá nhân">
            <UserAvatarDisplay user={user} size={32} className="avatar-small" />
          </div>
        </div>

        {/* MOBILE FULL-WIDTH SEARCH BAR */}
        {showSearchInput && (
          <div className="mobile-search-fullbar d-flex d-lg-none align-items-center w-100" ref={mobileSearchWrapperRef}>
            <button
              type="button"
              className="btn btn-link text-white p-2 me-1 mobile-search-back-btn"
              onClick={() => {
                setShowSearchInput(false);
                setShowSearchDropdown(false);
              }}
              aria-label="Đóng tìm kiếm"
            >
              <FaTimes className="fs-5" />
            </button>
            <form onSubmit={handleSearch} className="mobile-search-box flex-grow-1 position-relative">
              <FaSearch className="mobile-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="mobile-search-input"
                placeholder="Tìm phim, diễn viên..."
                autoFocus
                ref={mobileSearchInputRef}
                onFocus={() => {
                  setShowSearchDropdown(true);
                  fetchLiveSearch(searchQuery);
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mobile-search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    fetchLiveSearch('');
                  }}
                  aria-label="Xoá tìm kiếm"
                >
                  <FaTimesCircle />
                </button>
              )}
            </form>
            {renderDualSearchDropdown()}
          </div>
        )}

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

          <ul className="navbar-nav align-items-lg-center mx-auto" ref={navRef}>
            {MAIN_NAV_ITEMS.map((navItem: NavItemBase) => {
              if (navItem.type === 'dropdown') {
                const isGenres = navItem.dropdownType === 'genres';
                const isCountries = navItem.dropdownType === 'countries';
                const isYears = navItem.dropdownType === 'years';
                const isOpen = isGenres
                  ? showGenresDropdown
                  : isCountries
                  ? showCountriesDropdown
                  : showYearsDropdown;
                const ref = isGenres
                  ? genresDropdownRef
                  : isCountries
                  ? countriesDropdownRef
                  : yearsDropdownRef;
                const isLocked = lockedDropdown === navItem.dropdownType;

                const active =
                  (navItem.matchPrefix ? router.pathname.startsWith(navItem.matchPrefix) || router.asPath.startsWith(navItem.matchPrefix) : false) ||
                  isLocked ||
                  (isCountries && isCountryActive()) ||
                  (isYears && isYearActive());

                // Strictly filter out inactive items and resolve dynamic client navigation
                const subItems: NavSubItem[] = isYears
                  ? activeYears
                      .filter((y) => y.isActive !== false)
                      .map((y) => ({
                        slug: y.slug,
                        name: y.name,
                        href: `/search?year=${encodeURIComponent(y.name)}`,
                      }))
                  : isCountries
                  ? (activeCountries && activeCountries.length > 0
                      ? activeCountries.map((c) => ({
                          slug: c.slug,
                          name: c.name,
                          href: `/quoc-gia/${c.slug}`,
                        }))
                      : (navItem.items || []).map((c) => ({
                          slug: c.slug,
                          name: c.name,
                          href: `/quoc-gia/${c.slug}`,
                        })))
                  : navItem.items || [];
                const popoverClass = isGenres
                  ? 'genres-popover'
                  : isCountries
                  ? 'countries-popover'
                  : 'years-popover';
                const gridClass = isGenres
                  ? 'genres-grid'
                  : isCountries
                  ? 'countries-grid'
                  : 'years-grid';
                // Active navigation item rendered below




                return (
                  <li
                    key={navItem.id}
                    className={`nav-item dropdown-wrapper ${active ? 'active' : ''}`}
                    ref={ref}
                    onMouseEnter={() => handleDropdownMouseEnter(navItem.dropdownType as 'genres' | 'countries' | 'years')}
                    onMouseLeave={() => handleDropdownMouseLeave(navItem.dropdownType as 'genres' | 'countries' | 'years')}
                  >
                    <button
                      type="button"
                      className={`nav-link nav-link-btn ${active ? 'active' : ''}`}
                      onClick={() => handleDropdownClick(navItem.dropdownType as 'genres' | 'countries' | 'years')}
                      aria-expanded={isOpen}
                    >
                      <span>{navItem.label}</span>
                      <FaChevronDown className={`chevron-icon ms-1 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className={`custom-dropdown-popover ${popoverClass} animate-fade-in d-none d-lg-block`}>
                        <div className={gridClass}>
                          {subItems.map((subItem) => (
                            <Link
                              key={subItem.slug}
                              href={subItem.href}
                              className="dropdown-grid-link"
                              onClick={() => {
                                setShowGenresDropdown(false);
                                setShowCountriesDropdown(false);
                                setShowYearsDropdown(false);
                                setLockedDropdown(null);
                              }}
                            >
                              <span className="dropdown-grid-label" title={subItem.name}>
                                {subItem.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="d-lg-none">
                      {isOpen && (
                        <div className="mobile-submenu">
                          {subItems.map((subItem) => (
                            <Link
                              key={subItem.slug}
                              href={subItem.href}
                              className="mobile-sublink"
                              onClick={closeMenu}
                            >
                              <span>{subItem.name}</span>
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
                : (navItem.href ? router.pathname.startsWith(navItem.href) : false);

              return (
                <li key={navItem.id} className={`nav-item ${active ? 'active' : ''}`}>
                  <Link
                    href={navItem.href || '/'}
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
              <Link href="/user/history" className="nav-link text-light py-2" onClick={closeMenu}>
                <FaHistory className="me-2 text-info" /> Lịch sử phim đã xem
              </Link>
              <Link href="/user/favorites" className="nav-link text-light py-2" onClick={closeMenu}>
                <FaHeart className="me-2 text-danger" /> Phim yêu thích
              </Link>
              {isAuthenticated ? (
                <>
                  {isAdminUser(user) && (
                    <Link
                      href="/admin"
                      className="nav-link admin-mobile-item py-2"
                      onClick={closeMenu}
                    >
                      <FaCog className="me-2" /> Trang quản lý
                      <span className="admin-badge ms-2">ADMIN</span>
                    </Link>
                  )}
                  <Link href="/profile" className="nav-link text-light py-2" onClick={closeMenu}>
                    <FaUserCircle className="me-2 text-primary" /> Hồ sơ của tôi
                  </Link>
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

            <div className="nav-indicator d-none d-lg-block" style={indicatorStyle} />
          </ul>

          {/* DESKTOP RIGHT ACTION SECTION */}
          <div className="d-none d-lg-flex align-items-center gap-3 ms-auto">
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

              {renderDualSearchDropdown()}
            </div>

            <div
              className="profile-avatar position-relative"
              onClick={handleAvatarClick}
              title={isAuthenticated ? (user?.fullname || user?.name || 'Tài khoản cá nhân') : 'Tài khoản / Đăng nhập'}
            >
              <UserAvatarDisplay user={user} size={36} className="avatar-desktop" />
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
                <UserAvatarDisplay user={user} size={38} className="me-2" />
                <div className="user-details">
                  <p className="user-name">{user?.fullname || user?.name || 'Thành viên'}</p>
                  <p className="user-email">{user?.email || 'Người dùng'}</p>
                </div>
              </div>
              <hr className="dropdown-divider my-2" />
              {/* Admin: Trang quản lý */}
              {isAdminUser(user) && (
                <>
                  <Link
                    href="/admin"
                    className="dropdown-item admin-item"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FaCog className="me-2" /> Trang quản lý
                    <span className="admin-badge">ADMIN</span>
                  </Link>
                  <hr className="dropdown-divider my-2" />
                </>
              )}
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/user/history');
                }}
              >
                <FaHistory className="me-2 text-info" /> Lịch sử phim đã xem
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/user/favorites');
                }}
              >
                <FaHeart className="me-2 text-danger" /> Phim yêu thích
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/profile');
                }}
              >
                <FaUserCircle className="me-2 text-primary" /> Hồ sơ của tôi
              </button>
              <hr className="dropdown-divider my-2" />
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <div className="user-info">
                <UserAvatarDisplay user={null} size={36} className="me-2" />
                <div className="user-details">
                  <p className="user-name">Khách xem phim</p>
                  <p className="user-email">Lịch sử & Phim đã lưu</p>
                </div>
              </div>
              <hr className="dropdown-divider my-2" />
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/user/history');
                }}
              >
                <FaHistory className="me-2 text-info" /> Lịch sử phim đã xem
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/user/favorites');
                }}
              >
                <FaHeart className="me-2 text-danger" /> Phim yêu thích
              </button>
              <hr className="dropdown-divider my-2" />
              <Link href="/auth/login" className="dropdown-item text-primary" onClick={() => setShowUserMenu(false)}>
                <FaUserCircle className="me-2" /> Đăng nhập
              </Link>
              <Link href="/auth/signup" className="dropdown-item text-secondary" onClick={() => setShowUserMenu(false)}>
                <FaUserPlus className="me-2" /> Đăng ký tài khoản
              </Link>
            </>
          )}
        </div>
      )}

      {/* FeedbackForm: .js dep, cast through unknown for strict TS */}
      {showFeedbackForm && (
        <FeedbackFormComponent
          isOpen={showFeedbackForm}
          onClose={() => setShowFeedbackForm(false)}
        />
      )}

      <style jsx global>{`
        .navbar {
          height: calc(64px + env(safe-area-inset-top, 0px));
          padding-top: env(safe-area-inset-top, 0px);
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

        .navbar-nav {
          position: relative;
          gap: 2px;
        }

        .nav-link,
        .nav-link-btn {
          font-size: 14.5px;
          font-weight: 500;
          color: #cbd5e1 !important;
          padding: 0.45rem 0.85rem !important;
          border-radius: 4px;
          background: transparent !important;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          white-space: nowrap;
          transition: color 0.18s ease;
        }

        .nav-link:hover,
        .nav-link-btn:hover {
          color: #ffffff !important;
          background: transparent !important;
        }

        .nav-link.active,
        .nav-link-btn.active {
          color: #ffffff !important;
          font-weight: 600;
          background: transparent !important;
        }

        .chevron-icon {
          font-size: 10px;
          color: #94a3b8;
          transition: transform 0.2s ease, color 0.18s ease;
        }

        .nav-link-btn:hover .chevron-icon {
          color: #ffffff;
        }

        .rotate-180 {
          transform: rotate(180deg);
          color: #e50914 !important;
        }

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

        .dropdown-wrapper {
          position: relative;
        }

        .custom-dropdown-popover {
          position: absolute;
          top: calc(100% + 8px);
          background: rgba(13, 17, 24, 0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 12px 14px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.15);
          z-index: 1050;
        }

        .genres-popover {
          width: 660px;
          max-width: calc(100vw - 32px);
          left: -40px;
          transform: none;
        }

        .genres-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px 8px;
        }

        .years-popover {
          width: 360px;
          max-width: calc(100vw - 32px);
          left: 50%;
          transform: translateX(-50%);
        }

        .years-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px 8px;
        }

        .countries-popover {
          width: 560px;
          max-width: calc(100vw - 32px);
          max-height: 480px;
          overflow-y: auto;
          left: 50%;
          transform: translateX(-50%);
        }

        .countries-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px 8px;
        }

        .years-popover {
          width: 360px;
          max-width: calc(100vw - 32px);
          left: 50%;
          transform: translateX(-50%);
        }

        .years-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px 8px;
        }

        .dropdown-grid-link {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 4px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          min-width: 0;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .dropdown-grid-link:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .dropdown-grid-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          width: 100%;
          min-width: 0;
        }

        .expanded-search-form {
          display: flex;
          align-items: center;
        }

        .expanded-search-box {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 9999px;
          padding: 0.36rem 0.95rem;
          width: 340px;
          height: 38px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .expanded-search-box:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.24);
        }

        .expanded-search-box:focus-within {
          background: rgba(13, 17, 23, 0.96);
          border-color: rgba(229, 9, 20, 0.85);
          box-shadow: 0 0 16px rgba(229, 9, 20, 0.32), 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .search-icon {
          color: #94a3b8;
          font-size: 13.5px;
          margin-right: 9px;
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
          font-size: 13.5px;
          width: 100%;
          outline: none;
        }

        .expanded-search-input::placeholder {
          color: #94a3b8;
          font-size: 13px;
        }

        .btn-clear-search {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 14.5px;
          cursor: pointer;
          padding: 2px 4px;
          display: flex;
          align-items: center;
          margin-left: 6px;
          transition: color 0.2s ease, transform 0.15s ease;
        }

        .btn-clear-search:hover {
          color: #ffffff;
          transform: scale(1.1);
        }

        .search-dual-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 440px;
          max-width: min(440px, calc(100vw - 32px));
          max-height: 520px;
          display: flex;
          flex-direction: column;
          background: rgba(13, 17, 24, 0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.15);
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

        .dropdown-item.admin-item {
          position: relative;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.12) 0%, rgba(229, 9, 20, 0.04) 100%);
          border: 1px solid rgba(229, 9, 20, 0.25);
          color: #ff6b6b;
          font-weight: 600;
          padding: 10px 12px;
          margin: 2px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }

        .dropdown-item.admin-item:hover {
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.25) 0%, rgba(229, 9, 20, 0.1) 100%);
          border-color: rgba(229, 9, 20, 0.5);
          color: #ffffff;
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(229, 9, 20, 0.25);
        }

        .dropdown-item.admin-item .me-2 {
          color: #e50914;
        }

        .admin-badge {
          background: linear-gradient(90deg, #e50914, #ff4d58);
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 6px rgba(229, 9, 20, 0.4);
        }

        .dropdown-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .admin-mobile-item {
          color: #ff6b6b !important;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.12) 0%, rgba(229, 9, 20, 0.04) 100%);
          border: 1px solid rgba(229, 9, 20, 0.25);
          border-radius: 6px;
          margin: 4px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-mobile-item:hover {
          color: #ffffff !important;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.25) 0%, rgba(229, 9, 20, 0.1) 100%);
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .nav-link,
          .nav-link-btn {
            font-size: 12.5px;
            padding: 0.3rem 0.45rem !important;
          }
          .expanded-search-box {
            width: 210px;
          }
          .navbar-logo {
            width: 95px;
          }
        }

        @media (min-width: 1200px) and (max-width: 1399px) {
          .nav-link,
          .nav-link-btn {
            font-size: 13.5px;
            padding: 0.35rem 0.65rem !important;
          }
          .expanded-search-box {
            width: 280px;
          }
        }

        @media (min-width: 1400px) {
          .expanded-search-box {
            width: 380px;
          }
        }

        @media (max-width: 991px) {
          .navbar-collapse {
            position: fixed;
            top: 0;
            left: -285px;
            width: 285px;
            max-width: 85vw;
            height: 100vh;
            height: 100dvh;
            background: rgba(8, 11, 16, 0.98);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            padding: calc(70px + env(safe-area-inset-top, 0px)) 1.25rem calc(2rem + env(safe-area-inset-bottom, 0px));
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

          .search-dual-dropdown {
            position: fixed;
            top: calc(64px + env(safe-area-inset-top, 0px));
            left: calc(10px + env(safe-area-inset-left, 0px));
            right: calc(10px + env(safe-area-inset-right, 0px));
            width: auto;
            max-width: none;
            max-height: calc(85vh - 64px - env(safe-area-inset-top, 0px));
            max-height: calc(85dvh - 64px - env(safe-area-inset-top, 0px));
            border-radius: 14px;
          }

          .mobile-search-fullbar {
            height: 48px;
            padding: 0 2px;
            gap: 6px;
          }
        }

        @media (max-width: 374px) {
          .navbar {
            height: calc(58px + env(safe-area-inset-top, 0px));
            padding-top: env(safe-area-inset-top, 0px);
          }
          .navbar-logo {
            width: 95px;
          }
          .mobile-search-box {
            height: 34px;
            padding: 0.25rem 0.6rem;
          }
          .mobile-search-input {
            font-size: 16px !important;
          }
          .search-dual-dropdown {
            top: calc(58px + env(safe-area-inset-top, 0px));
            left: calc(6px + env(safe-area-inset-left, 0px));
            right: calc(6px + env(safe-area-inset-right, 0px));
          }
        }

        /* Mobile Landscape mode: compact navigation */
        @media (orientation: landscape) and (max-height: 500px) {
          .navbar {
            height: 50px;
          }
          .navbar-logo {
            max-height: 26px;
            width: 90px;
          }
          .navbar-collapse {
            padding-top: 56px;
            width: 260px;
          }
          .search-dual-dropdown {
            top: 50px;
            max-height: calc(100vh - 54px);
            max-height: calc(100dvh - 54px);
          }
          .mobile-search-fullbar {
            height: 44px;
          }
        }

          .mobile-search-box {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 9999px;
            padding: 0.35rem 0.85rem;
            height: 38px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transition: all 0.2s ease;
          }

          .mobile-search-box:focus-within {
            background: rgba(13, 17, 24, 0.98);
            border-color: rgba(229, 9, 20, 0.85);
            box-shadow: 0 0 14px rgba(229, 9, 20, 0.35);
          }

          .mobile-search-icon {
            color: #94a3b8;
            font-size: 13px;
            margin-right: 8px;
            flex-shrink: 0;
          }

          .mobile-search-box:focus-within .mobile-search-icon {
            color: #e50914;
          }

          .mobile-search-input {
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 16px;
            width: 100%;
            outline: none;
          }

          .mobile-search-input::placeholder {
            color: #94a3b8;
            font-size: 13px;
          }

          .mobile-search-back-btn {
            border: none;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            color: #cbd5e1;
            transition: background 0.15s ease, color 0.15s ease;
          }

          .mobile-search-back-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }

          .mobile-search-clear-btn {
            background: transparent;
            border: none;
            color: #64748b;
            font-size: 15px;
            cursor: pointer;
            padding: 2px 4px;
            display: flex;
            align-items: center;
            margin-left: 6px;
            transition: color 0.2s ease;
          }

          .mobile-search-clear-btn:hover {
            color: #ffffff;
          }

          .mobile-search-trigger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            transition: background 0.2s ease;
          }

          .mobile-search-trigger-btn:hover {
            background: rgba(255, 255, 255, 0.1);
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
