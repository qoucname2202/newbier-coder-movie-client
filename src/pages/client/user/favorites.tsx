/**
 * favorites.tsx - The "Favorite Movies" page.
 *
 * DATA FLOW
 *   FavoritesPage
 *     -> favoritesService.getFavorites()
 *     -> GET {API}/users/me/favorites  (with header Authorization: Bearer <token>)
 *     -> backend returns the v1 envelope { responseStatus, responseData }
 *     -> the service maps the payload into the shape the UI expects
 *     -> the page renders the list
 *
 * WHY THE PAGE DOES NOT CALL fetch ITSELF
 * The page used to build the URL `${NEXT_PUBLIC_API_URL}/favorites` on its
 * own. That route does not exist on the backend (it answers
 * `404 Route not found`), so the page always showed a load error. The real
 * route is `/users/me/favorites`. Every HTTP call now lives in
 * favoritesService, so there is only one place that knows the real URL.
 *
 * THREE STATES THAT MUST STAY SEPARATE
 *   1. Not signed in  -> show the sign-in prompt, NOT a data load error.
 *   2. API failed    -> show the error message plus a "Try again" button that
 *                       calls the API again.
 *   3. Empty list    -> show the "no favorite movies yet" state.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef, MouseEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaHeart, FaSync, FaTrash, FaCheckSquare, FaSort } from 'react-icons/fa';
import favoritesService, {
  FavoritesServiceError,
  type FavoriteMovie
} from '@/API/services/favoritesService';
import { formatYear } from '@/utils/taxonomy';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '@/styles/Favorites.module.css';

/** The available sort orders for the favorites list. */
type SortOption = 'a-z' | 'z-a' | 'highest-rating' | 'lowest-rating' | 'newest' | 'oldest' | 'year-desc' | 'year-asc';
/** The available filter tabs: all movies, movies only, or series only. */
type FilterTab = 'all' | 'movie' | 'series';

/**
 * Error state of the page.
 *
 * The two cases are kept apart because the UI has to react differently to
 * each one.
 */
interface PageError {
  /**
   * true  = the user must sign in, so the page shows the "Sign in" button.
   * false = the data could not be loaded, so the page shows "Try again".
   */
  requiresAuth: boolean;
  message: string;
}

/**
 * The "Favorite Movies" page.
 *
 * @param inProfilePage - When true the page renders without its own container
 *                        and heading, because it is embedded in the Profile
 *                        screen. The sign-in redirect is also skipped in that
 *                        case so the user is not thrown out of the Profile.
 */
export default function FavoritesPage({ inProfilePage = false }: { inProfilePage?: boolean }) {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PageError | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  /**
   * Flag that marks a request as running.
   *
   * Two places can trigger `fetchFavorites` (the effect that runs when the
   * page opens, and the "Try again" button), so this flag makes sure only one
   * request runs at a time. Without it, clicking "Try again" several times
   * would send parallel requests, and a slow old response could overwrite a
   * newer one, leaving the list inconsistent.
   */
  const requestInFlightRef = useRef<boolean>(false);
  /**
   * Flag that marks the component as still mounted.
   *
   * React warns when state is updated after the component left the page, so
   * every asynchronous state update checks this flag first.
   */
  const isMountedRef = useRef<boolean>(true);

  // Marks the component as mounted, and clears the flag when it is removed.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Loads the favorite movies from the API.
   *
   * @returns true when the request succeeded, including the case where the
   *          backend returned an empty list. false when it failed.
   */
  const fetchFavorites = useCallback(async (): Promise<boolean> => {
    // Another request is already running, so this call is skipped.
    if (requestInFlightRef.current) return false;
    requestInFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const movies = await favoritesService.getFavorites();

      // The page was left while the request was pending, so do not update state.
      if (!isMountedRef.current) return false;

      // Success: replace the list with the real data and clear any old error.
      setFavorites(movies);
      setSelectedItems([]);
      setSelectMode(false);
      return true;
    } catch (err) {
      if (!isMountedRef.current) return false;

      if (err instanceof FavoritesServiceError) {
        // A code of 'unauthenticated' (HTTP 401) means the user is not signed
        // in or the token expired, so the page shows the sign-in state.
        setError({
          requiresAuth: err.code === 'unauthenticated',
          message: err.message
        });
      } else {
        // An unknown failure (network loss, HTTP 500, broken JSON) is a plain
        // data loading error.
        setError({
          requiresAuth: false,
          message: 'Có lỗi xảy ra khi tải danh sách yêu thích'
        });
      }
      setFavorites([]);
      return false;
    } finally {
      // The flag is always released, otherwise every later call would be
      // blocked forever.
      requestInFlightRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Loads the data when the page opens.
   *
   * The effect waits for `authLoading` to finish first. Right after mount the
   * sign-in state is still unknown, so calling the API at that moment would
   * send a request without a token and fail with a misleading 401.
   *
   * When the user is not signed in the API is not called at all.
   */
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Not signed in: show the sign-in state and skip the API call.
      setLoading(false);
      setFavorites([]);
      setError({
        requiresAuth: true,
        message: 'Bạn cần đăng nhập để xem danh sách yêu thích'
      });
      // The redirect only happens on the standalone page. On the Profile
      // screen the user stays where they are.
      if (!inProfilePage) {
        router.push('/auth/login');
      }
      return;
    }

    fetchFavorites();
  }, [isAuthenticated, authLoading, inProfilePage, router, fetchFavorites]);

  /**
   * Handles the "Try again" and "Refresh" buttons.
   *
   * The API is called again for real, the UI is not redrawn from old data.
   *
   * @returns Nothing. The result is reported with a toast message.
   */
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setError({
        requiresAuth: true,
        message: 'Bạn cần đăng nhập để xem danh sách yêu thích'
      });
      setLoading(false);
      if (!inProfilePage) {
        router.push('/auth/login');
      }
      return;
    }

    // Skip the call while another request is running, so repeated clicks do
    // not create parallel requests.
    if (requestInFlightRef.current) return;

    setRefreshing(true);
    try {
      const ok = await fetchFavorites();
      if (ok) {
        toast.success('Đã tải lại danh sách yêu thích!', {
          position: 'top-right',
          autoClose: 2500
        });
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, inProfilePage, router, fetchFavorites]);

  /**
   * Removes one movie from the favorites.
   *
   * @param movie - The movie to remove.
   * @returns Nothing. The result is reported with a toast message.
   */
  const handleRemoveFavorite = useCallback(async (movie: FavoriteMovie): Promise<void> => {
    // Keep the previous list so it can be restored when the API fails.
    const previous = favorites;
    // Optimistic update: the card disappears right away instead of waiting
    // for the server, which makes the UI feel fast.
    setFavorites((prev) => prev.filter((m) => m.id !== movie.id));

    try {
      setIsDeleting(true);
      // Both the id and the slug are sent because the backend may identify
      // the movie by either one.
      const result = await favoritesService.removeFromFavorites(movie.id, movie.slug);

      if (result.success) {
        toast.success('Đã xóa phim khỏi danh sách yêu thích!', {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        toast.error(result.message || 'Không thể xóa phim khỏi danh sách yêu thích');
        // The API reported a failure, so the optimistic update is rolled back
        // and the list is synced with the server again.
        setFavorites(previous);
        fetchFavorites();
      }
    } catch {
      // A network error or an exception also triggers the rollback.
      toast.error('Có lỗi xảy ra khi xóa phim khỏi danh sách yêu thích');
      setFavorites(previous);
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
    }
  }, [favorites, fetchFavorites]);

  /**
   * Turns the multi-select mode on or off.
   *
   * The current selection is cleared in both directions, so the next session
   * always starts from a clean state.
   *
   * @returns Nothing.
   */
  const toggleSelectMode = (): void => {
    setSelectMode((prev) => !prev);
    setSelectedItems([]);
  };

  /**
   * Toggles the selection of one movie in multi-select mode.
   *
   * @param movieId - Id of the movie to select or unselect.
   * @returns Nothing.
   */
  const toggleSelectItem = (movieId: string): void => {
    setSelectedItems((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  /**
   * Sorts the movie list with the currently selected order.
   *
   * @param movies - The movies to sort.
   * @returns A new sorted array. The input array is never modified, because
   *          `Array.sort` changes the array it is called on and that array is
   *          React state.
   */
  const sortFavorites = (movies: FavoriteMovie[]): FavoriteMovie[] => {
    if (!Array.isArray(movies)) return [];
    const copy = [...movies];
    // Compares by the date the movie was added. An invalid date counts as 0
    // so a broken value cannot break the sort.
    const byDate = (a: FavoriteMovie, b: FavoriteMovie): number => {
      const ta = new Date(a.dateAdded).getTime();
      const tb = new Date(b.dateAdded).getTime();
      return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
    };
    switch (sortOption) {
      case 'a-z': return copy.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a': return copy.sort((a, b) => b.title.localeCompare(a.title));
      case 'highest-rating': return copy.sort((a, b) => b.rating - a.rating);
      case 'lowest-rating': return copy.sort((a, b) => a.rating - b.rating);
      case 'newest': return copy.sort((a, b) => byDate(b, a));
      case 'oldest': return copy.sort((a, b) => byDate(a, b));
      // Number() is used because `year` can arrive as a string.
      case 'year-desc': return copy.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
      case 'year-asc': return copy.sort((a, b) => Number(a.year || 0) - Number(b.year || 0));
      default: return copy;
    }
  };

  /**
   * Filters the movies by the active tab.
   *
   * The backend uses more than one name for the same category, so both
   * variants are accepted: `movie` and `single` for movies, `series` and `tv`
   * for series.
   *
   * @returns The movies that match the selected tab.
   */
  const filteredFavorites: FavoriteMovie[] = useMemo(() => {
    if (selectedFilter === 'all') return favorites;
    if (selectedFilter === 'movie') {
      return favorites.filter((m) => m.type === 'movie' || m.type === 'single');
    }
    if (selectedFilter === 'series') {
      return favorites.filter((m) => m.type === 'series' || m.type === 'tv');
    }
    return favorites;
  }, [favorites, selectedFilter]);

  /**
   * The list that is actually displayed: the filtered movies, sorted.
   *
   * useMemo keeps the sort from running on every render.
   *
   * @returns The movies shown on the page.
   */
  const filteredList: FavoriteMovie[] = useMemo(
    () => sortFavorites(filteredFavorites),
    [filteredFavorites, sortOption]
  );

  /**
   * Returns the label of the active sort order, shown on the sort button.
   *
   * @returns The translated label of the current sort option.
   */
  const getSortOptionName = (): string => {
    switch (sortOption) {
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

  /**
   * Applies a new sort order and closes the dropdown.
   *
   * @param option - The sort order to apply.
   * @returns Nothing.
   */
  const handleSortChange = (option: SortOption): void => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  /**
   * Selects every visible movie, or clears the selection when everything is
   * already selected.
   *
   * @returns Nothing.
   */
  const handleSelectAll = (): void => {
    if (selectedItems.length === filteredList.length) setSelectedItems([]);
    else setSelectedItems(filteredList.map((m) => m.id));
  };

  /**
   * Removes all the selected movies.
   *
   * The API is called one movie after another, the successes and failures are
   * counted, and a single toast reports the summary. The list is always
   * reloaded at the end, so it matches the real state on the server.
   *
   * @returns Nothing. The result is reported with a toast message.
   */
  const handleRemoveSelected = async (): Promise<void> => {
    if (selectedItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một phim để xóa');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} phim đã chọn khỏi danh sách yêu thích?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      let successCount = 0;
      let errorCount = 0;

      // Deleted one by one, not with Promise.all, so the server does not
      // receive a burst of parallel requests.
      for (const movieId of selectedItems) {
        const movie = favorites.find((m) => m.id === movieId);
        const slug = movie?.slug;
        try {
          const result = await favoritesService.removeFromFavorites(movieId, slug);
          if (result.success) successCount++;
          else errorCount++;
        } catch {
          errorCount++;
        }
      }

      // Reload the list so it matches the real state on the server, even when
      // some of the deletions failed.
      await fetchFavorites();

      // Reports the outcome: all succeeded, partially succeeded, or all failed.
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Đã xóa ${successCount} phim khỏi danh sách yêu thích!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Đã xóa ${successCount} phim, nhưng không thể xóa ${errorCount} phim`);
      } else {
        toast.error('Không thể xóa các phim đã chọn');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xóa các phim đã chọn');
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
        setSelectMode(false);
      }
    }
  };

  /**
   * Handles a poster image that fails to load (404, broken network, ...).
   *
   * Setting `onerror` to null prevents an infinite loop: if the placeholder
   * image itself fails, this handler is not triggered again.
   *
   * Note: the fallback used to be `/img/Phim.png`, which is the "LOGO NAME /
   * TAGLINE HERE" logo image and looks like a broken movie. The SVG placeholder
   * poster is used instead.
   *
   * @param e - The error event of the image element.
   * @returns Nothing. The image source is replaced in place.
   */
  const handleImgError = (e: MouseEvent<HTMLImageElement>): void => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/img/placeholder-poster.svg';
  };

  const mainContent = (
    <>
      <div className={inProfilePage ? '' : 'container pt-3 pb-5'}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          {!inProfilePage && <h2 className="text-white">Phim yêu thích</h2>}
          {inProfilePage && <h3 className="section-header" style={{ marginTop: '20px' }}>Phim yêu thích</h3>}

          <div className="d-flex flex-wrap gap-2">
            <button
              className={inProfilePage ? 'refresh-button' : 'btn btn-outline-light d-flex align-items-center'}
              onClick={handleRefresh}
              disabled={refreshing || loading}
              type="button"
            >
              <FaSync className={`me-2 ${refreshing ? 'spin' : ''}`} />
              {refreshing ? 'Đang làm mới' : 'Làm mới'}
            </button>

            {!loading && filteredList.length > 0 && (
              <>
                <div className="dropdown">
                  <button
                    className="btn btn-outline-light dropdown-toggle"
                    type="button"
                    onClick={() => setShowSortOptions((s) => !s)}
                    aria-expanded={showSortOptions}
                  >
                    <FaSort className="me-1" /> {getSortOptionName()}
                  </button>
                  {showSortOptions && (
                    <ul className="dropdown-menu dropdown-menu-dark show">
                      {(['newest','oldest','a-z','z-a','highest-rating','lowest-rating','year-desc','year-asc'] as SortOption[]).map((opt) => (
                        <li key={opt}>
                          <button
                            className="dropdown-item"
                            onClick={() => handleSortChange(opt)}
                            type="button"
                          >
                            {opt === 'a-z' ? 'A-Z' : opt === 'z-a' ? 'Z-A' : opt === 'highest-rating' ? 'Đánh giá cao nhất' : opt === 'lowest-rating' ? 'Đánh giá thấp nhất' : opt === 'newest' ? 'Mới nhất' : opt === 'oldest' ? 'Cũ nhất' : opt === 'year-desc' ? 'Năm mới nhất' : 'Năm cũ nhất'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  className={`btn ${selectMode ? 'btn-danger' : 'btn-outline-light'} d-flex align-items-center`}
                  onClick={toggleSelectMode}
                  type="button"
                >
                  <FaCheckSquare className="me-2" /> Chọn nhiều
                </button>

                {selectMode && (
                  <>
                    <button className="btn btn-outline-light" onClick={handleSelectAll} type="button">
                      {selectedItems.length === filteredList.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={handleRemoveSelected}
                      disabled={selectedItems.length === 0 || isDeleting}
                      type="button"
                    >
                      <FaTrash className="me-1" /> Xóa đã chọn ({selectedItems.length})
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/*
          Main content area. The states are rendered in this order:
          1. loading            -> spinner
          2. error.requiresAuth -> sign-in prompt
          3. other error        -> error message plus a "Try again" button
          4. empty list         -> "no favorite movies yet" state
          5. otherwise          -> the grid of movies
        */}
        {loading ? (
          <div className="text-center py-5 my-5">
            <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="text-white mt-3">Đang tải danh sách yêu thích...</p>
          </div>
        ) : error ? (
          error.requiresAuth ? (
            /* Case 2: not signed in, so show the sign-in prompt instead of an error. */
            <div className="text-center py-5 my-5">
              <div className="mb-4 text-warning" style={{ fontSize: '4rem' }}>
                <FaHeart />
              </div>
              <h3 className="text-white mb-3">Bạn cần đăng nhập</h3>
              <p className="text-white bg-warning bg-opacity-25 p-3 rounded d-inline-block">{error.message}</p>
              <div className="mt-4 d-flex justify-content-center flex-wrap gap-2">
                <Link href="/auth/login" className="btn btn-danger">Đăng nhập</Link>
                <Link href="/" className="btn btn-outline-light">Về trang chủ</Link>
              </div>
            </div>
          ) : (
            /* Case 3: the data failed to load, so show the error and a "Try again" button. */
            <div className="text-center py-5 my-5">
              <div className="mb-4 text-warning" style={{ fontSize: '4rem' }}>
                <FaHeart />
              </div>
              <h3 className="text-white mb-3">Đã xảy ra lỗi khi tải danh sách yêu thích</h3>
              <p className="text-white bg-danger bg-opacity-25 p-3 rounded d-inline-block">{error.message}</p>
              <div className="mt-4 d-flex justify-content-center flex-wrap gap-2">
                <button className="btn btn-danger" onClick={handleRefresh} disabled={refreshing} type="button">
                  <FaSync className={`me-2 ${refreshing ? 'spin' : ''}`} /> Thử lại
                </button>
                <Link href="/" className="btn btn-outline-light">Về trang chủ</Link>
              </div>
            </div>
          )
        ) : filteredList.length === 0 ? (
          /* Case 4: the API returned an empty list, so show the "no favorites yet" state. */
          <div className={styles.emptyStateContainer}>
            <i className="bi bi-heart-fill display-1 text-danger mb-3"></i>
            <h4 className="text-white">Danh sách yêu thích trống</h4>
            <p className="text-muted">Bạn chưa có phim nào trong danh sách yêu thích</p>
            <Link href="/" className="btn btn-danger">Khám phá phim</Link>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-3 g-md-4">
            {filteredList.map((movie) => (
              <div key={movie.id} className="col">
                <div className={styles.movieCard}>
                  <div className={styles.movieImageContainer}>
                    {selectMode && (
                      /* The select checkbox, only shown in multi-select mode. A div
                         with role="checkbox" is used instead of an input so it can
                         be positioned on top of the poster. */
                      <div
                        className="position-absolute top-0 start-0 m-2"
                        style={{ zIndex: 10 }}
                        onClick={() => toggleSelectItem(movie.id)}
                        role="checkbox"
                        aria-checked={selectedItems.includes(movie.id)}
                        tabIndex={0}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            border: selectedItems.includes(movie.id) ? '2px solid #dc3545' : '2px solid #fff',
                            backgroundColor: selectedItems.includes(movie.id) ? '#dc3545' : 'transparent',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          {selectedItems.includes(movie.id) && (
                            <i className="bi bi-check"
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontSize: '14px'
                              }}
                            ></i>
                          )}
                        </div>
                      </div>
                    )}
                    {/* When the movie has a slug, the poster is wrapped in a Link
                        so clicking it opens the detail page. Without a slug the
                        poster is only displayed and cannot be clicked. */}
                    {movie.slug ? (
                      <Link href={`/movie/${movie.slug}`}>
                        <img
                          src={movie.thumbnail || '/img/placeholder-poster.svg'}
                          alt={movie.title}
                          className={styles.movieImage}
                          onError={handleImgError}
                        />
                      </Link>
                    ) : (
                      <img
                        src={movie.thumbnail || '/img/placeholder-poster.svg'}
                        alt={movie.title}
                        className={styles.movieImage}
                        onError={handleImgError}
                      />
                    )}
                    <div className={styles.movieOverlay}>
                      {!selectMode && (
                        /* The delete and play buttons are hidden in multi-select
                           mode, so they cannot be clicked by accident. */
                        <>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => handleRemoveFavorite(movie)}
                            disabled={isDeleting}
                            aria-label={`Xóa ${movie.title} khỏi danh sách yêu thích`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          {movie.slug ? (
                            <Link href={`/movie/${movie.slug}`} className={styles.watchButton}>
                              <i className="bi bi-play-fill"></i>
                            </Link>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.movieInfo}>
                    <h5 className={styles.movieTitle}>{movie.title}</h5>
                    {movie.original_title && (
                      <p className={styles.movieOriginalTitle}>{movie.original_title}</p>
                    )}
                    <div className={styles.movieMetaContainer}>
                      {movie.year ? (
                        <span className={styles.movieMeta}>
                          <i className="bi bi-calendar-event-fill"></i> {formatYear(movie.year)}
                        </span>
                      ) : null}
                      {movie.type && (
                        <span className={styles.movieMeta}>
                          {movie.type === 'series' || movie.type === 'tv' ? 'Phim bộ' : 'Phim lẻ'}
                        </span>
                      )}
                      {movie.quality && (
                        <span className={`${styles.movieMeta} ${styles.quality}`}>{movie.quality}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );

  if (inProfilePage) return mainContent;
  return <div className="bg-black min-vh-100">{mainContent}</div>;
}
