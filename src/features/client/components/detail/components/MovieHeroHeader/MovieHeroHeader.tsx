import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LOCAL_DEFAULT_BACKDROP, LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import { getWatchProgress } from '@/utils/watchProgress';
import { pickImageSrc, BACKDROP_FIELDS, POSTER_FIELDS } from '@/utils/imageSource';
import { formatYear, getTaxonomyName, getTaxonomySlug } from '@/utils/taxonomy';
import type { WatchEpisode, WatchServer } from '@/features/client/components/detail/components/WatchSidebarPlaylist/WatchSidebarPlaylist';
import styles from './MovieHeroHeader.module.css';

/**
 * @file MovieHeroHeader.tsx
 * @description Ultra-cinematic widescreen hero showcase for the movie detail page.
 * Features 21:9 immersive backdrop, high-contrast poster with 3D depth,
 * multi-tier action CTA deck (Play, Resume, Trailer, Favorite, Share),
 * quick metadata pills bar, high-density bento facts, and expandable synopsis.
 */

interface CountryEntry {
  name?: string;
  slug?: string;
}

interface CategoryEntry {
  name?: string;
  slug?: string;
}

interface DirectorEntry {
  name?: string;
  slug?: string;
  role?: string;
}

interface ActorEntry {
  name?: string;
  slug?: string;
  role?: string;
}

interface ParsedPersonItem {
  name: string;
  slug?: string;
  role?: string;
  initials: string;
}

/**
 * Extracts uppercase 1-2 letter initials from a person's name for artistic badge display.
 * @param name - Full name of actor or director
 * @returns 1-2 character uppercase initials
 */
const extractInitials = (name?: string): string => {
  if (!name) return '★';
  const clean = name.trim().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, ' ');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '★';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export interface HeroHeaderMovie {
  _id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  content?: string;
  quality?: string;
  lang?: string;
  year?: number | string;
  time?: string;
  rating?: number | string;
  ratingCount?: number;
  status?: string;
  type?: 'series' | 'single' | string;
  view?: number;
  director?: string;
  actor?: string;
  directors?: DirectorEntry[];
  actors?: ActorEntry[];
  country?: CountryEntry[];
  category?: CategoryEntry[];
  poster_url?: string;
  thumb_url?: string;
  backdrop_url?: string;
  episodes?: WatchServer[];
  trailer_url?: string;
  trailer?: { url?: string; key?: string; site?: string } | string | null;
  [key: string]: unknown;
}

export interface MovieHeroHeaderProps {
  movie?: HeroHeaderMovie | null;
  onPlayTrailer?: (movie: HeroHeaderMovie) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onReport?: () => void;
}

/** Watch progress payload definition */
interface WatchProgressPayload {
  epSlug?: string;
  serverIndex?: number;
  episodeIndex?: number;
  epName?: string;
}

export const MovieHeroHeader: React.FC<MovieHeroHeaderProps> = ({
  movie,
  onPlayTrailer,
  isFavorite = false,
  onToggleFavorite,
  onReport
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState<boolean>(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState<boolean>(false);
  const [savedProgress, setSavedProgress] = useState<WatchProgressPayload | null>(null);

  // Sync saved watch progress from localStorage
  useEffect(() => {
    if (!movie?.slug) return;
    const progress = getWatchProgress(movie.slug) as WatchProgressPayload | null;
    if (progress && progress.epSlug) {
      setSavedProgress(progress);
    }
  }, [movie?.slug]);

  const handleShare = useCallback((): void => {
    if (typeof window !== 'undefined') {
      try {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      } catch {
        // Fallback if clipboard API is restricted
      }
    }
  }, []);

  if (!movie) return null;

  // Derive series vs single movie attributes
  const firstServer: WatchEpisode[] = movie.episodes?.[0]?.server_data || [];
  const totalEpisodesCount = firstServer.length;
  const isSeries = movie.type === 'series' || totalEpisodesCount > 1;

  const firstEp = firstServer[0];
  const firstEpSlug = firstEp?.slug || 'tap-1';

  const latestEp = firstServer[totalEpisodesCount - 1];
  const latestEpSlug = latestEp?.slug || firstEpSlug;
  const latestEpName: string = latestEp?.name || (totalEpisodesCount > 0 ? String(totalEpisodesCount) : '1');

  // URL routes
  const watchFirstUrl = `/movie/${movie.slug}/watch?ep=${encodeURIComponent(firstEpSlug)}`;
  const watchLatestUrl = `/movie/${movie.slug}/watch?ep=${encodeURIComponent(latestEpSlug)}`;
  const watchResumeUrl = savedProgress?.epSlug
    ? `/movie/${movie.slug}/watch?ep=${encodeURIComponent(savedProgress.epSlug)}&server=${savedProgress.serverIndex || 0}`
    : watchFirstUrl;

  // Metadata representations
  const categories: CategoryEntry[] = movie.category || [];
  const countries: CountryEntry[] = movie.country || [];
  const ratingVal: string = movie.rating ? Number(movie.rating).toFixed(1) : '8.8';

  // Formatted viewership counter (Short format e.g. 1.4M / 250K and full format)
  const formattedViews = useMemo((): string => {
    const v = Number(movie.view || 0);
    if (v >= 1_000_000) {
      return `${(v / 1_000_000).toFixed(1)}M`;
    }
    if (v >= 1_000) {
      return `${(v / 1_000).toFixed(1)}K`;
    }
    return v > 0 ? v.toLocaleString('vi-VN') : '1.4M';
  }, [movie.view]);

  const fullViewsFormatted = useMemo((): string => {
    const v = Number(movie.view || 0);
    return v > 0 ? `${v.toLocaleString('vi-VN')} lượt xem` : 'Hơn 1.400.000 lượt xem';
  }, [movie.view]);

  // Robust Cast Parsing: parses either actors array or comma-separated string into rich capsule objects
  const castList: ParsedPersonItem[] = useMemo(() => {
    if (Array.isArray(movie.actors) && movie.actors.length > 0) {
      return movie.actors
        .filter((a) => a && a.name && a.name.trim())
        .map((a, i) => ({
          name: a.name!.trim(),
          slug: a.slug || `actor-${i}`,
          role: a.role || 'Diễn viên chính',
          initials: extractInitials(a.name)
        }));
    }
    if (typeof movie.actor === 'string' && movie.actor.trim() !== '') {
      return movie.actor
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name, i) => ({
          name,
          slug: `actor-${i}`,
          role: 'Diễn viên chính',
          initials: extractInitials(name)
        }));
    }
    return [];
  }, [movie.actors, movie.actor]);

  const actorsDisplay: string = useMemo(() => {
    if (castList.length > 0) {
      return castList.slice(0, 6).map((a) => a.name).join(', ');
    }
    return typeof movie.actor === 'string' && movie.actor.trim() ? movie.actor.trim() : 'Đang cập nhật';
  }, [castList, movie.actor]);

  // Director details resolution
  const directorDisplay: string = useMemo(() => {
    if (movie.directors && movie.directors.length > 0) {
      const names = movie.directors.map((d) => d.name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    if (typeof movie.director === 'string' && movie.director.trim() !== '') {
      return movie.director.trim();
    }
    return 'Đang cập nhật';
  }, [movie.directors, movie.director]);

  const directorInitials: string = useMemo(() => {
    return extractInitials(directorDisplay !== 'Đang cập nhật' ? directorDisplay : 'ĐĐ');
  }, [directorDisplay]);

  // Dynamic rating score for star display (0-5 scale)
  const numericRating = useMemo((): number => {
    const val = Number(movie.rating || 8.8);
    return isNaN(val) ? 8.8 : val;
  }, [movie.rating]);

  const starScore = useMemo((): number => {
    return Math.min(5, Math.max(0, numericRating / 2));
  }, [numericRating]);

  const votesText = useMemo((): string => {
    if (movie.ratingCount) {
      return `${Number(movie.ratingCount).toLocaleString('vi-VN')} đánh giá`;
    }
    const satisfaction = Math.round(Math.min(99, Math.max(80, numericRating * 10.4)));
    return `${satisfaction}% khán giả đề xuất`;
  }, [movie.ratingCount, numericRating]);

  // Status badge display
  let statusText = 'Hoàn Thành';
  if (movie.status === 'ongoing') {
    statusText = `Đang Chiếu (Tập ${latestEpName})`;
  } else if (movie.status === 'upcoming') {
    statusText = 'Sắp Công Chiếu';
  } else if (isSeries && totalEpisodesCount > 0) {
    statusText = `Trọn Bộ (${totalEpisodesCount}/${totalEpisodesCount})`;
  }

  const synopsis: string = movie.content || 'Nội dung bộ phim đang được cập nhật.';
  const synopsisRef = useRef<HTMLParagraphElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState<boolean>(() => synopsis.length > 200);

  useEffect(() => {
    const el = synopsisRef.current;
    if (!el) return;

    const checkOverflow = (): void => {
      if (!synopsisExpanded && el) {
        setHasOverflow(el.scrollHeight > el.clientHeight + 4);
      }
    };

    const timer = setTimeout(checkOverflow, 40);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [synopsis, synopsisExpanded]);

  const handleOpenTrailer = (): void => {
    if (onPlayTrailer) {
      onPlayTrailer(movie);
    }
  };

  return (
    <section className={styles.heroWrapper} aria-label="Thông tin chi tiết phim">
      {/* 1. Cinematic Multi-Layer Backdrop Banner */}
      <div className={styles.backdropLayer}>
        <img
          src={pickImageSrc(
            movie as unknown as Record<string, unknown>,
            BACKDROP_FIELDS,
            LOCAL_DEFAULT_BACKDROP
          )}
          alt=""
          className={styles.backdropImg}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.onerror = null;
            img.src = LOCAL_DEFAULT_BACKDROP;
          }}
        />
        <div className={styles.backdropGradient} />
      </div>

      {/* 2. Main Content Showcase */}
      <div className={styles.mainContainer}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumbNav} aria-label="Điều hướng trang">
          <Link href="/" className={styles.breadItem}>
            <i className="fas fa-home me-1" />
            Trang Chủ
          </Link>
          <span className={styles.breadDivider}>/</span>
          <Link href={isSeries ? '/browse/series' : '/browse/movies'} className={styles.breadItem}>
            {isSeries ? 'Phim Bộ' : 'Phim Lẻ'}
          </Link>
          {categories.length > 0 && getTaxonomyName(categories[0]) && (
            <>
              <span className={styles.breadDivider}>/</span>
              <Link
                href={`/genre/${encodeURIComponent(getTaxonomySlug(categories[0]))}`}
                className={styles.breadItem}
              >
                {getTaxonomyName(categories[0])}
              </Link>
            </>
          )}
          <span className={styles.breadDivider}>/</span>
          <span className={styles.breadActive}>{movie.name}</span>
        </nav>

        {/* 2-Column Cinema Showcase Grid */}
        <div className={styles.showcaseGrid}>
          {/* Left Column: 2:3 Vertical Poster + Interactive Actions */}
          <div className={styles.leftCol}>
            <div className={styles.posterWrapper}>
              <img
                src={pickImageSrc(
                  movie as unknown as Record<string, unknown>,
                  POSTER_FIELDS,
                  LOCAL_DEFAULT_POSTER
                )}
                alt={movie.name || 'Poster'}
                className={styles.posterImg}
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = LOCAL_DEFAULT_POSTER;
                }}
              />

              {/* Corner Badges */}
              <div className={styles.qualityBadge}>
                {movie.quality || 'Full HD'}
              </div>

              {ratingVal && (
                <div className={styles.ratingBadge}>
                  <i className="fas fa-star me-1" />
                  <span>{ratingVal}</span>
                </div>
              )}

              {/* Status Ribbon on Poster */}
              <div className={styles.statusRibbon}>
                {statusText}
              </div>

              {/* Hover Trailer Overlay Button */}
              {onPlayTrailer && (
                <div className={styles.playOverlay} onClick={handleOpenTrailer}>
                  <div className={styles.playCirclePulse} title="Xem trailer phim">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <span className={styles.playOverlayText}>XEM TRAILER</span>
                </div>
              )}
            </div>

            {/* Primary Action Button Deck */}
            <div className={styles.actionButtonGroup}>
              {isSeries ? (
                <>
                  {savedProgress && savedProgress.episodeIndex && savedProgress.episodeIndex > 0 ? (
                    <>
                      <button
                        type="button"
                        className={styles.btnWatchPrimary}
                        onClick={() => router.push(watchResumeUrl)}
                        title={`Tiếp tục xem ${savedProgress.epName}`}
                      >
                        <i className="fas fa-play me-2" />
                        <span>Tiếp Tục ({savedProgress.epName?.toLowerCase().startsWith('tập') ? savedProgress.epName : `Tập ${savedProgress.epName}`})</span>
                      </button>

                      <button
                        type="button"
                        className={styles.btnWatchSecondary}
                        onClick={() => router.push(watchFirstUrl)}
                        title="Xem lại từ tập 1"
                      >
                        <i className="fas fa-redo me-2" />
                        <span>Xem Từ Đầu (Tập 1)</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.btnWatchPrimary}
                        onClick={() => router.push(watchFirstUrl)}
                        title="Bắt đầu xem phim từ tập 1"
                      >
                        <i className="fas fa-play me-2" />
                        <span>XEM PHIM (TẬP 1)</span>
                      </button>

                      {totalEpisodesCount > 1 && (
                        <button
                          type="button"
                          className={styles.btnWatchSecondary}
                          onClick={() => router.push(watchLatestUrl)}
                          title={`Xem tập ${latestEpName}`}
                        >
                          <i className="fas fa-forward me-2" />
                          <span>Tập Mới Nhất ({latestEpName})</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className={styles.btnWatchPrimary}
                  onClick={() => router.push(watchResumeUrl)}
                >
                  <i className="fas fa-play me-2" />
                  <span>{savedProgress ? 'TIẾP TỤC XEM' : 'XEM PHIM NGAY'}</span>
                </button>
              )}

              {/* Secondary Interactive Action Row */}
              <div className={styles.interactiveToolbar}>
                <button
                  type="button"
                  className={`${styles.toolBtn} ${isFavorite ? styles.toolBtnActive : ''}`}
                  onClick={onToggleFavorite}
                  title={isFavorite ? 'Bỏ theo dõi bộ phim' : 'Thêm phim vào danh sách theo dõi'}
                >
                  <i className={`${isFavorite ? 'fas fa-heart text-danger' : 'far fa-heart'} ${isFavorite ? styles.heartActive : ''}`} />
                  <span>{isFavorite ? 'Đã Lưu' : 'Theo Dõi'}</span>
                </button>

                {onPlayTrailer && (
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={handleOpenTrailer}
                    title="Xem trailer chính thức"
                  >
                    <i className="fas fa-film text-warning" />
                    <span>Trailer</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={handleShare}
                  title="Sao chép liên kết phim"
                >
                  <i className={copied ? 'fas fa-check text-success' : 'fas fa-share-alt text-info'} />
                  <span>{copied ? 'Đã Chép' : 'Chia Sẻ'}</span>
                </button>

                {onReport && (
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={onReport}
                    title="Báo cáo lỗi phát sóng hoặc phụ đề"
                  >
                    <i className="fas fa-flag text-secondary" />
                    <span>Báo Lỗi</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Titles, Rating Spotlight, Telemetry Capsules, Details & Storyline */}
          <div className={styles.rightCol}>
            {/* 1. Header Top Row: Titles & Dedicated Eye-Catching Rating Spotlight */}
            <div className={styles.headerTopRow}>
              <div className={styles.titleSection}>
                <h1 className={styles.mainTitle}>{movie.name}</h1>
                {movie.origin_name && (
                  <h2 className={styles.originTitle}>{movie.origin_name}</h2>
                )}
              </div>

              {/* Dedicated Eye-Catching Rating Spotlight Widget */}
              <div className={styles.ratingSpotlightCard} title={`${ratingVal}/10 điểm đánh giá`}>
                <div className={styles.ratingScoreBox}>
                  <i className="fas fa-star text-warning" />
                  <span className={styles.ratingMainNumber}>{ratingVal}</span>
                  <span className={styles.ratingScale}>/10</span>
                </div>
                <div className={styles.ratingMetaCol}>
                  <div className={styles.starsRow} aria-label={`${starScore.toFixed(1)} trên 5 sao`}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const fill = starScore - i;
                      if (fill >= 0.75) {
                        return <i key={i} className="fas fa-star text-warning" />;
                      }
                      if (fill >= 0.25) {
                        return <i key={i} className="fas fa-star-half-alt text-warning" />;
                      }
                      return <i key={i} className="far fa-star text-muted" />;
                    })}
                  </div>
                  <span className={styles.ratingVotesLabel}>{votesText}</span>
                </div>
              </div>
            </div>

            {/* 2. Unbreakable Cinema Telemetry Capsules Deck (Không bao giờ bị vỡ khi responsive) */}
            <div className={styles.telemetryCapsulesDeck} aria-label="Thông số kỹ thuật">
              {/* Định dạng & Phân giải */}
              <div className={styles.telemetryCapsuleHighlight}>
                <span className={styles.capsuleIconBox}>
                  <i className={`fas ${isSeries ? 'fa-tv' : 'fa-film'} text-danger`} />
                </span>
                <span className={styles.capsulePrimaryText}>
                  {isSeries ? 'PHIM BỘ' : 'PHIM LẺ'}
                </span>
                <span className={styles.capsuleDivider}>•</span>
                <span className={styles.capsuleBadgeTag}>
                  {movie.quality || (isSeries ? 'FHD' : '4K ULTRA HD')}
                </span>
              </div>

              {/* Năm phát hành */}
              {movie.year && (
                <div className={styles.telemetryCapsule}>
                  <span className={styles.capsuleIconBox}>
                    <i className="far fa-calendar-alt text-warning" />
                  </span>
                  <span className={styles.capsuleText}>Năm {formatYear(movie.year)}</span>
                </div>
              )}

              {/* Thời lượng */}
              <div className={styles.telemetryCapsule}>
                <span className={styles.capsuleIconBox}>
                  <i className="far fa-clock text-info" />
                </span>
                <span className={styles.capsuleText}>
                  {movie.time || (isSeries ? '45 phút / tập' : '110 phút')}
                </span>
              </div>

              {/* Lượt xem */}
              <div className={styles.telemetryCapsuleFire} title={fullViewsFormatted}>
                <span className={styles.capsuleIconBox}>
                  <i className="fas fa-fire text-danger" />
                </span>
                <span className={styles.capsuleFireText}>{formattedViews}</span>
                <span className={styles.capsuleSubLabel}>lượt xem</span>
              </div>

              {/* Độ tuổi */}
              <div className={styles.telemetryCapsule}>
                <span className={styles.capsuleAgeTag}>T16</span>
                <span className={styles.capsuleText}>Khuyên xem</span>
              </div>

              {/* Bản dịch */}
              <div className={styles.telemetryCapsule}>
                <span className={styles.capsuleIconBox}>
                  <i className="fas fa-headphones text-success" />
                </span>
                <span className={styles.capsuleText}>
                  {movie.lang || 'VietSub + Thuyết Minh'}
                </span>
              </div>
            </div>

            {/* 3. Cinema Specs & Genre Showcase Card (Thiết kế đẹp, đồng bộ với các phần bên dưới) */}
            <div className={styles.detailsBentoCard}>
              {/* Top Section: Đạo Diễn, Quốc Gia, Trạng Thái */}
              <div className={styles.detailsGrid}>
                {/* Đạo diễn */}
                <div className={styles.detailItem}>
                  <div className={styles.detailIconCircle}>
                    <i className="fas fa-video text-danger" />
                  </div>
                  <div className={styles.detailTextCol}>
                    <span className={styles.detailLabel}>ĐẠO DIỄN</span>
                    <span className={styles.detailValue} title={directorDisplay}>
                      {directorDisplay}
                    </span>
                  </div>
                </div>

                {/* Quốc gia */}
                <div className={styles.detailItem}>
                  <div className={styles.detailIconCircle}>
                    <i className="fas fa-globe-asia text-info" />
                  </div>
                  <div className={styles.detailTextCol}>
                    <span className={styles.detailLabel}>QUỐC GIA</span>
                    <div className={styles.countryLinksDeck}>
                      {countries.length > 0 ? (
                        countries.map((c, i) => (
                          <span key={c.slug || String(i)}>
                            {i > 0 && ', '}
                            <Link
                              href={`/country/${encodeURIComponent(c.slug || '')}`}
                              className={styles.countryLink}
                            >
                              {c.name}
                            </Link>
                          </span>
                        ))
                      ) : (
                        <span className={styles.detailValue}>Toàn cầu</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trạng thái phát sóng */}
                <div className={styles.detailItem}>
                  <div className={styles.detailIconCircle}>
                    <i className="fas fa-satellite-dish text-success" />
                  </div>
                  <div className={styles.detailTextCol}>
                    <span className={styles.detailLabel}>TRẠNG THÁI</span>
                    <span className={styles.statusLiveValue}>
                      <span className={styles.livePulseDot} />
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Dải Thể Loại Phim */}
              <div className={styles.genresSection}>
                <div className={styles.genreLabelGroup}>
                  <i className="fas fa-tags text-warning me-2" />
                  <span className={styles.genreSectionLabel}>THỂ LOẠI:</span>
                </div>
                <div className={styles.genresDeck}>
                  {categories.length > 0 ? (
                    categories.map((cat, idx) => {
                      const name = getTaxonomyName(cat);
                      const slug = getTaxonomySlug(cat);
                      if (!name) return null;
                      return (
                        <Link
                          key={slug || String(idx)}
                          href={`/genre/${encodeURIComponent(slug)}`}
                          className={styles.genreCapsulePill}
                          title={`Khám phá phim thể loại ${name}`}
                        >
                          <span>{name}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <span className={styles.emptyText}>Đang cập nhật thể loại</span>
                  )}
                </div>
              </div>
            </div>

              {/* Bento Card 4: Dàn Sao & Diễn Viên (Starlight Cast Showcase - Full Width Bento Span) */}
              <div className={styles.bentoCardCast}>
                <div className={styles.bentoCardHeader}>
                  <div className={styles.bentoCardIcon}>
                    <i className="fas fa-users" />
                  </div>
                  <div className={styles.castTitleWrap}>
                    <h3 className={styles.bentoCardTitle}>DÀN DIỄN VIÊN NGÔI SAO</h3>
                    {castList.length > 0 && (
                      <span className={styles.castCountPill}>{castList.length} nghệ sĩ</span>
                    )}
                  </div>
                </div>

                <div className={styles.castCapsulesDeck}>
                  {castList.length > 0 ? (
                    <>
                      {castList.slice(0, 6).map((actor, idx) => (
                        <div key={actor.slug || String(idx)} className={styles.actorCapsule}>
                          <div className={styles.actorInitialsRing}>
                            <span>{actor.initials}</span>
                          </div>
                          <div className={styles.actorMetaInfo}>
                            <span className={styles.actorNameText} title={actor.name}>
                              {actor.name}
                            </span>
                            <span className={styles.actorRoleSub}>Diễn viên chính</span>
                          </div>
                        </div>
                      ))}
                      {castList.length > 6 && (
                        <div className={styles.actorMoreCapsule}>
                          <div className={styles.actorMoreRing}>
                            <span>+{castList.length - 6}</span>
                          </div>
                          <span className={styles.actorMoreLabel}>Nghệ sĩ khác</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className={styles.actorsPlainFallback}>{actorsDisplay}</span>
                  )}
                </div>
              </div>

            {/* 4. Cinematic Editorial Storyline Spotlight (Cốt Truyện Điện Ảnh Độc Bản) */}
            <div className={styles.editorialStorylineCard}>
              <div className={styles.storylineHeader}>
                <div className={styles.storylineTitleGroup}>
                  <span className={styles.storylineIconPulse}>
                    <i className="fas fa-quote-left text-danger" />
                  </span>
                  <div>
                    <h3 className={styles.storylineHeadline}>CỐT TRUYỆN ĐIỆN ẢNH</h3>
                    <span className={styles.storylineSubTitle}>Bối cảnh cốt truyện & diễn biến chính</span>
                  </div>
                </div>
                <div className={styles.spoilerFreeTag}>
                  <i className="fas fa-shield-halved text-success me-1" />
                  <span>Spoiler-Free</span>
                </div>
              </div>

              <div className={styles.storylineContent}>
                <p
                  ref={synopsisRef}
                  className={`${styles.storylineParagraph} ${!synopsisExpanded && hasOverflow ? styles.storylineClamped : ''}`}
                >
                  <span className={styles.decorativeQuote}>“</span>
                  {synopsis}
                </p>

                {hasOverflow && (
                  <button
                    type="button"
                    className={styles.btnToggleStoryline}
                    onClick={() => setSynopsisExpanded((prev) => !prev)}
                    aria-expanded={synopsisExpanded}
                    title={synopsisExpanded ? 'Thu gọn cốt truyện' : 'Xem toàn bộ cốt truyện'}
                  >
                    <span>{synopsisExpanded ? 'Thu gọn tóm tắt' : 'Đọc tiếp toàn bộ cốt truyện'}</span>
                    <i className={`fas ${synopsisExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} ms-2`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MovieHeroHeader;
