import React, { useState, MouseEvent } from 'react';
import Link from 'next/link';
import {
  FaPlay,
  FaStar,
  FaHeart,
  FaHourglassHalf,
  FaFire,
  FaFireAlt,
  FaCrown,
  FaDragon,
  FaBolt,
  FaTv
} from 'react-icons/fa';
import { getTaxonomyName } from '@/utils/taxonomy';
import { cleanMovieTitle } from '@/utils/movieNormalizer';
import { getWatchProgress } from '@/utils/watchProgress';
import watchLaterService from '@/API/services/watchLaterService';
import styles from '@/styles/MovieCards.module.css';

/**
 * Enterprise 2:3 cinema vertical poster card with themed icon badges,
 * favorite heart button, friendly localized genre chips, and triple meta pills.
 */

const LOCAL_WATCH_LATER_KEY = 'user_local_watch_later';

/**
 * Map of foreign or slug taxonomy terms to friendly, natural Vietnamese genre names.
 */
const FRIENDLY_GENRE_MAP: Record<string, string> = {
  // English mappings
  'action': 'Hành Động',
  'adventure': 'Phiêu Lưu',
  'animation': 'Hoạt Hình',
  'anime': 'Anime',
  'comedy': 'Hài Hước',
  'crime': 'Hình Sự',
  'documentary': 'Tài Liệu',
  'drama': 'Tâm Lý',
  'family': 'Gia Đình',
  'fantasy': 'Thần Thoại',
  'history': 'Lịch Sử',
  'horror': 'Kinh Dị',
  'music': 'Âm Nhạc',
  'mystery': 'Bí Ẩn',
  'romance': 'Tình Cảm',
  'sci-fi': 'Viễn Tưởng',
  'scifi': 'Viễn Tưởng',
  'science fiction': 'Viễn Tưởng',
  'thriller': 'Gay Cấn',
  'war': 'Chiến Tranh',
  'western': 'Miền Tây',
  'martial-arts': 'Võ Thuật',
  'school': 'Học Đường',
  'costume': 'Cổ Trang',

  // Vietnamese slug mappings
  'hanh-dong': 'Hành Động',
  'tinh-cam': 'Tình Cảm',
  'hai-huoc': 'Hài Hước',
  'co-trang': 'Cổ Trang',
  'tam-ly': 'Tâm Lý',
  'chinh-kich': 'Chính Kịch',
  'kinh-di': 'Kinh Dị',
  'vien-tuong': 'Viễn Tưởng',
  'phieu-luu': 'Phiêu Lưu',
  'hoat-hinh': 'Hoạt Hình',
  'tai-lieu': 'Tài Liệu',
  'chien-tranh': 'Chiến Tranh',
  'hinh-su': 'Hình Sự',
  'vo-thuat': 'Võ Thuật',
  'kiem-hiep': 'Kiếm Hiệp',
  'bi-an': 'Bí Ẩn',
  'than-thoai': 'Thần Thoại',
  'gia-dinh': 'Gia Đình',
  'hoc-duong': 'Học Đường',
  'am-nhac': 'Âm Nhạc',
  'the-thao': 'Thể Thao',
  'khoa-hoc': 'Khoa Học',
  'chieu-rap': 'Chiếu Rạp',
  'phim-chieu-rap': 'Chiếu Rạp'
};

const toFriendlyGenre = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (FRIENDLY_GENRE_MAP[lower]) {
    return FRIENDLY_GENRE_MAP[lower];
  }
  const slugified = lower.replace(/\s+/g, '-');
  if (FRIENDLY_GENRE_MAP[slugified]) {
    return FRIENDLY_GENRE_MAP[slugified];
  }
  return trimmed;
};

/**
 * Safely extracts up to 2-3 friendly Vietnamese genre names.
 */
const extractFriendlyGenres = (movie: MovieLite, originName?: string): string[] => {
  const list: string[] = [];

  const rawCats = movie.category || movie.categories || movie.genres;
  if (Array.isArray(rawCats)) {
    for (const cat of rawCats) {
      const name = getTaxonomyName(cat);
      if (name) {
        const friendly = toFriendlyGenre(name);
        if (friendly && !list.includes(friendly)) {
          list.push(friendly);
        }
      }
      if (list.length >= 2) break;
    }
  }

  if (list.length > 0) {
    return list;
  }

  // Fallback if no category array
  if (movie.type === 'series') {
    list.push('Phim Bộ');
  } else if (movie.chieurap) {
    list.push('Chiếu Rạp');
  } else {
    list.push('Phim Lẻ');
  }

  if (originName) {
    list.push(toFriendlyGenre(originName));
  } else if (movie.country) {
    list.push(toFriendlyGenre(getTaxonomyName(movie.country)));
  }

  return list.slice(0, 2);
};

interface BadgeTheme {
  label: string;
  icon: React.ReactNode;
  className: string;
}

/**
 * Derives a themed badge with specific icon and vibrant glowing styling.
 */
const resolveBadgeTheme = (
  rank?: number,
  customBadge?: string,
  movieType?: string
): BadgeTheme => {
  const raw = String(customBadge || '').trim();
  const lower = raw.toLowerCase();

  // 1. HOT Badge (#HOT) -> Glowing Fiery Red/Amber
  if (lower.includes('hot')) {
    return {
      label: raw,
      icon: <FaFire className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeHot
    };
  }

  // 2. K-DRAMA (#K-DRAM, #K-DRAMA) -> Romantic Violet-Pink
  if (lower.includes('k-dram') || lower.includes('korean') || lower.includes('hàn')) {
    return {
      label: raw ? `${raw}` : 'K-DRAMA',
      icon: <FaHeart className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeKdrama
    };
  }

  // 3. C-DRAMA (#C-DRAM, #C-DRAMA) -> Imperial Dragon Crimson & Gold
  if (lower.includes('c-dram') || lower.includes('chinese') || lower.includes('trung')) {
    return {
      label: raw ? `${raw}` : 'C-DRAMA',
      icon: <FaDragon className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeCdrama
    };
  }

  // 4. TOP-TRENDING / TRENDING / TOP 10 -> Royal Crown Gold
  if (lower.includes('trend') || lower.includes('top')) {
    const text = raw ? (raw.startsWith('#') ? raw : `#${raw}`) : (rank ? `#${rank} Trending` : '#Trending');
    return {
      label: text,
      icon: <FaCrown className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeTrending
    };
  }

  // 5. ANIME & CARTOON -> Cyber Bolt Cyan & Violet
  if (lower.includes('anime') || lower.includes('cartoon') || lower.includes('hoạt')) {
    return {
      label: raw ? `${raw}` : 'ANIME',
      icon: <FaBolt className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeAnime
    };
  }

  // 6. MỚI NHẤT / NEW / LATEST -> Emerald Star
  if (lower.includes('mới') || lower.includes('new') || lower.includes('latest')) {
    return {
      label: raw,
      icon: <FaStar className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeNew
    };
  }

  // 7. Generic custom badge passed from section
  if (raw) {
    return {
      label: raw,
      icon: <FaFireAlt className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeDefault
    };
  }

  // 8. Rank number (e.g. 1, 2, 3...)
  if (typeof rank === 'number' && rank > 0) {
    return {
      label: `Trending`,
      icon: rank === 1 ? <FaCrown className={styles.badgeIcon} aria-hidden="true" /> : <FaFireAlt className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeTrending
    };
  }

  // 9. Default fallback
  if (movieType === 'series') {
    return {
      label: 'Trending Drama',
      icon: <FaTv className={styles.badgeIcon} aria-hidden="true" />,
      className: styles.badgeKdrama
    };
  }

  return {
    label: 'Top Trending',
    icon: <FaCrown className={styles.badgeIcon} aria-hidden="true" />,
    className: styles.badgeTrending
  };
};

/**
 * Picks a usable poster URL from the many fields the backend may return.
 */
const resolvePosterSrc = (
  movie: Record<string, unknown> | null | undefined,
  fallback: string
): string => {
  if (!movie || typeof movie !== 'object') return fallback;
  const candidates = [
    movie.poster_url,
    movie.posterUrl,
    movie.thumb_url,
    movie.thumbUrl,
    movie.imagePoster,
    movie.poster_path,
    movie.posterPath
  ];
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    if (/^https?:\/\//i.test(v)) return v;
    if (/^data:image\//i.test(v)) return v;
  }
  return fallback;
};

/**
 * Safely parses and formats movie duration into clean cinema format (e.g. "3h 12m" or "45m").
 */
const formatMovieDuration = (
  timeStr?: string | null,
  episodeCurrent?: string | null
): string => {
  if (timeStr && typeof timeStr === 'string') {
    const trimmed = timeStr.trim().toLowerCase();

    // Check if already in "Xh Ym" or "X giờ Y phút" format
    const hmMatch = trimmed.match(/(\d+)\s*(?:h|giờ)\s*(\d+)?\s*(?:m|p|phút)?/);
    if (hmMatch) {
      const h = hmMatch[1];
      const m = hmMatch[2] ? hmMatch[2] : '00';
      return `${h}h ${m}m`;
    }

    // Check if purely in minutes, e.g. "192 phút" or "192 min" or "192"
    const minMatch = trimmed.match(/(\d+)\s*(?:phút|min|m|$)/);
    if (minMatch) {
      const totalMinutes = parseInt(minMatch[1], 10);
      if (!isNaN(totalMinutes) && totalMinutes > 0) {
        if (totalMinutes >= 60) {
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          return mins > 0 ? `${hours}h ${mins < 10 ? '0' : ''}${mins}m` : `${hours}h`;
        }
        return `${totalMinutes}m`;
      }
    }

    // If it contains "tập", e.g. "45 phút/tập"
    if (trimmed.includes('tập') || trimmed.includes('/')) {
      return trimmed.replace('phút/tập', 'm/tập').replace('phút', 'm');
    }
  }

  if (episodeCurrent && typeof episodeCurrent === 'string' && episodeCurrent.trim()) {
    return episodeCurrent.trim();
  }

  return '1h 45m';
};

/**
 * Resolves age rating or certification tag (e.g. "PG-13", "18+", "16+", "P").
 */
const resolveAgeRating = (movie: MovieLite): string => {
  if (typeof movie.age_rating === 'string' && movie.age_rating.trim()) {
    return movie.age_rating.trim().toUpperCase();
  }
  if (typeof movie.certification === 'string' && movie.certification.trim()) {
    return movie.certification.trim().toUpperCase();
  }
  if (typeof movie.content_rating === 'string' && movie.content_rating.trim()) {
    return movie.content_rating.trim().toUpperCase();
  }
  if (movie.chieurap) {
    return 'PG-13';
  }
  const q = String(movie.quality || '').trim().toUpperCase();
  if (q.includes('4K') || q.includes('UHD')) return '4K';
  if (q.includes('CAM')) return 'CAM';
  return 'PG-13';
};

/** Minimal movie shape (compatible across project) */
export interface MovieLite {
  _id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  year?: number | string;
  type?: 'series' | 'single' | 'movie' | string;
  quality?: string;
  lang?: string;
  time?: string;
  age_rating?: string;
  certification?: string;
  content_rating?: string;
  chieurap?: boolean;
  category?: unknown;
  categories?: unknown;
  genres?: unknown;
  country?: unknown;
  episode_current?: string;
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
  vote_average?: number;
  rating?: number;
  tmdb?: { vote_average?: number; trailer_url?: string; trailer?: { key?: string; site?: string; name?: string; url?: string } };
  episodes?: Array<{ server_data?: Array<{ name?: string }> }>;
  trailer_url?: string;
  trailerUrl?: string;
  video_url?: string;
  videoUrl?: string;
  trailerLink?: string;
  trailer?: { key?: string; site?: string; name?: string; url?: string } | string | null;
  video?: { key?: string; site?: string; name?: string; url?: string } | string | null;
  youtube?: { key?: string; site?: string; name?: string; url?: string } | string | null;
  youtube_trailer?: { key?: string; site?: string; name?: string; url?: string } | string | null;
  movie_trailer?: { key?: string; site?: string; name?: string; url?: string } | string | null;
  [key: string]: unknown;
}

export interface MovieCardVerticalProps {
  movie?: MovieLite | null;
  rank?: number;
  badge?: string;
  onMouseEnter?: (movie: MovieLite) => void;
  onMouseLeave?: (movie: MovieLite) => void;
  onPlayTrailer?: (movie: MovieLite) => void;
  className?: string;
}

const MovieCardVertical: React.FC<MovieCardVerticalProps> = ({
  movie,
  rank,
  badge,
  onMouseEnter,
  onMouseLeave,
  onPlayTrailer,
  className = ''
}) => {
  const slug = String(movie?.slug || movie?._id || '');

  const [imgSrc, setImgSrc] = useState<string>(() =>
    resolvePosterSrc(movie as Record<string, unknown>, '/img/placeholder-poster.svg')
  );
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  // Watch Later favorite / bookmark state
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !slug) return false;
    try {
      const saved = localStorage.getItem(LOCAL_WATCH_LATER_KEY);
      if (saved) {
        const set: string[] = JSON.parse(saved);
        return Array.isArray(set) && set.includes(slug);
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [bookmarkLoading, setBookmarkLoading] = useState<boolean>(false);

  // Watch progress bar detection
  const [progressPercent] = useState<number | null>(() => {
    if (typeof window === 'undefined' || !slug) return null;
    try {
      const progress = getWatchProgress(slug);
      return progress && progress.updatedAt ? 40 : null;
    } catch {
      return null;
    }
  });

  if (!movie) return null;

  const movieName = cleanMovieTitle(getTaxonomyName(movie.name));
  const movieOriginName = movie.origin_name ? cleanMovieTitle(getTaxonomyName(movie.origin_name)) : '';

  // Extract rating with graceful fallback
  const rawRating: number | string | undefined = movie.vote_average || movie.rating || movie.tmdb?.vote_average;
  const ratingText: string = rawRating ? Number(rawRating).toFixed(1) : '8.2';

  // Derived taxonomy and badges
  const badgeTheme = resolveBadgeTheme(rank, badge, movie.type);
  const ageRating = resolveAgeRating(movie);
  const durationText = formatMovieDuration(movie.time, movie.episode_current);
  const friendlyGenres = extractFriendlyGenres(movie, movieOriginName);
  const rawQuality = movie.quality ? String(movie.quality).toUpperCase() : 'FHD';

  const handleToggleBookmark = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    try {
      const saved = localStorage.getItem(LOCAL_WATCH_LATER_KEY);
      let set: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(set)) set = [];

      if (nextState) {
        if (!set.includes(slug)) set.push(slug);
      } else {
        set = set.filter((s) => s !== slug);
      }
      localStorage.setItem(LOCAL_WATCH_LATER_KEY, JSON.stringify(set));

      if (nextState) {
        const parsedYear = typeof movie.year === 'number' ? movie.year : Number(movie.year);
        await watchLaterService.addToWatchLater({
          id: String(movie._id || ''),
          slug,
          title: movieName,
          name: movieName,
          origin_name: movieOriginName,
          poster_url: imgSrc,
          quality: rawQuality,
          lang: String(movie.lang || 'Vietsub'),
          year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : undefined
        });
      } else {
        await watchLaterService.removeFromWatchLater(String(movie._id || slug));
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <Link
      href={`/movie/${slug}`}
      className={`${styles.cardVertical} ${className}`}
      onMouseEnter={() => onMouseEnter && onMouseEnter(movie)}
      onMouseLeave={() => onMouseLeave && onMouseLeave(movie)}
      aria-label={movieName || 'Xem phim'}
    >
      <div className={styles.posterContainer}>
        <img
          src={imgSrc}
          alt={movieName || 'Poster phim'}
          className={`${styles.posterImg} ${isImageLoaded ? styles.posterImgLoaded : ''}`}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setImgSrc('/img/placeholder-poster.svg');
            setIsImageLoaded(true);
          }}
        />

        {/* Ambient Top and Bottom Depth Vignettes */}
        <div className={styles.posterTopFade} aria-hidden="true" />
        <div className={styles.posterBottomFade} aria-hidden="true" />

        {/* Top Header: Themed Icon Badge (Left) & Heart Button (Right) */}
        <div className={styles.topHeaderOverlay}>
          <span className={`${styles.trendingBadge} ${badgeTheme.className}`}>
            {badgeTheme.icon}
            <span>{badgeTheme.label}</span>
          </span>

          <button
            type="button"
            className={styles.favoriteBtn}
            onClick={handleToggleBookmark}
            aria-label={isBookmarked ? 'Bỏ thích phim này' : 'Yêu thích phim này'}
            title={isBookmarked ? 'Đã yêu thích' : 'Yêu thích'}
          >
            <FaHeart
              className={`${styles.heartIcon} ${isBookmarked ? styles.heartIconActive : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Thin Watch Progress Bar */}
        {progressPercent !== null && (
          <div className={styles.progressBarTrack} title={`Đã xem ${progressPercent}%`}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercent}%` }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Center Hover Play Overlay with Double Pulsating Radar Rings (No Text) */}
        <div className={styles.playOverlay}>
          <button
            type="button"
            className={styles.playCircle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onPlayTrailer) {
                onPlayTrailer(movie);
              }
            }}
            aria-label={`Xem trailer ${movieName}`}
            title={`Xem trailer ${movieName}`}
          >
            <FaPlay style={{ marginLeft: '2px', fontSize: '1rem' }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Card Content Information (Avatar Reference Design) */}
      <div className={styles.cardInfo}>
        <h4 className={styles.movieName} title={movieName}>
          {movieName}
        </h4>

        {/* Friendly Vietnamese Genre Chips */}
        <div className={styles.genresContainer} aria-label="Thể loại phim">
          {friendlyGenres.map((genre, idx) => (
            <span
              key={idx}
              className={`${styles.genreChip} ${idx === 0 ? styles.genreChipPrimary : ''}`}
              title={genre}
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Badges Row: [ PG-13 ] [ ⏳ 3h 12m ] [ ⭐ 8.2 ] */}
        <div className={styles.pillBadgesRow}>
          <span className={styles.pillAge}>{ageRating}</span>

          <span className={styles.pillDuration} title={`Thời lượng: ${durationText}`}>
            <FaHourglassHalf className={styles.pillDurationIcon} aria-hidden="true" />
            <span>{durationText}</span>
          </span>

          <span className={styles.pillRating} title={`Đánh giá: ${ratingText}/10`}>
            <FaStar className={styles.pillRatingIcon} aria-hidden="true" />
            <span>{ratingText}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MovieCardVertical;
