/**
 * @file pages/client/performer/[id].tsx
 * @description Actor / Performer profile page: calls GET /api/v1/actors/:slug,
 * renders high-impact cinema dark hero header, biography, statistics, awards,
 * and responsive filmography grid with direct movie playback links.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  FaStar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaFilm,
  FaEye,
  FaFire,
  FaAward,
  FaPlay,
  FaVenusMars,
  FaRulerVertical,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaWeibo
} from 'react-icons/fa';
import actorService, {
  type ActorDetailData,
  type ActorMovieCredit
} from '@/API/services/actorService';
import { formatYear } from '@/utils/taxonomy';
import styles from '@/styles/Performer.module.css';

const DEFAULT_AVATAR = '/img/user-avatar.png';
const DEFAULT_POSTER = '/img/placeholder-poster.svg';

export default function ActorDetailPage() {
  const router = useRouter();
  const slug = String(router.query.id || router.query.slug || '');

  const [actor, setActor] = useState<ActorDetailData | null>(null);
  const [movies, setMovies] = useState<ActorMovieCredit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [bioExpanded, setBioExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    const fetchActor = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch from Microservice API: GET /api/v1/actors/:slug
        const actorData = await actorService.getActorDetail(slug);

        if (actorData) {
          if (!isMounted) return;
          setActor(actorData);

          // 2. Fetch filmography of this actor
          const filmography = await actorService.getActorFilmography(actorData.name || slug);
          if (isMounted) {
            setMovies(filmography);
            setLoading(false);
          }
          return;
        }

        // 3. Fallback: If not found in actors API, try numeric TMDB or create baseline
        if (!isMounted) return;
        setActor({
          id: slug,
          name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug,
          gender: 'unknown',
          movieCount: 0,
          popularity: 1,
          viewCount: 1,
          biography: 'Thông tin về diễn viên đang được cập nhật.'
        });

        const filmography = await actorService.getActorFilmography(slug.replace(/-/g, ' '));
        if (isMounted) {
          setMovies(filmography);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError('Không thể tải thông tin diễn viên. Vui lòng thử lại sau.');
          setLoading(false);
        }
      }
    };

    fetchActor();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const filteredMovies = useMemo(() => {
    if (activeFilter === 'movie') {
      return movies.filter((m) => m.type === 'single' || m.type === 'movie');
    }
    if (activeFilter === 'series') {
      return movies.filter((m) => m.type === 'series' || m.type === 'tv');
    }
    return movies;
  }, [movies, activeFilter]);

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const calculateAge = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    try {
      const birth = new Date(dateStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  };

  const formatGender = (gender?: string): string => {
    if (gender === 'male') return 'Nam';
    if (gender === 'female') return 'Nữ';
    if (gender === 'other') return 'Khác';
    return 'Chưa rõ';
  };

  if (loading) {
    return (
      <div className={styles.actorPage}>
        <div className={styles.loadingContainer}>
          <div className="spinner-border text-danger" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p>Đang tải hồ sơ diễn viên...</p>
        </div>
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className={styles.actorPage}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Không tìm thấy diễn viên</h2>
          <p className={styles.errorText}>{error || 'Hồ sơ diễn viên này hiện chưa có trong cơ sở dữ liệu.'}</p>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-danger" onClick={() => router.back()}>
              Quay lại
            </button>
            <Link href="/" className="btn btn-outline-light">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const age = calculateAge(actor.dateOfBirth);
  const birthFormatted = formatDate(actor.dateOfBirth);
  const avatarUrl = actor.profileImage || DEFAULT_AVATAR;
  const backdropUrl = actor.coverImage || actor.profileImage || '';

  return (
    <div className={styles.actorPage}>
      <Head>
        <title>{actor.name} - Thông Tin Diễn Viên | Movie Stream</title>
        <meta
          name="description"
          content={`Xem thông tin tiểu sử, sự nghiệp và danh sách các phim nổi bật của diễn viên ${actor.name} trên Movie Stream.`}
        />
      </Head>

      {/* 1. Hero Header */}
      <section className={styles.heroBanner}>
        {backdropUrl && (
          <div
            className={styles.bannerBackdrop}
            style={{ backgroundImage: `url(${backdropUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className={styles.bannerOverlay} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.heroContent}>
            {/* Avatar Frame */}
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarContainer}>
                <img
                  src={avatarUrl}
                  alt={actor.name}
                  className={styles.avatarImg}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
              <div className={styles.verifiedBadge} title="Nghệ sĩ xác thực">
                <FaCheck />
              </div>
            </div>

            {/* Profile Details */}
            <div className={styles.profileDetails}>
              <div className={styles.badgeRow}>
                <span className={styles.roleBadge}>
                  {actor.knownFor || 'Diễn viên'}
                </span>
                {actor.nationality && (
                  <span className={styles.nationalityBadge}>{actor.nationality}</span>
                )}
                {actor.debutYear && (
                  <span className={styles.nationalityBadge}>Khởi nghiệp {actor.debutYear}</span>
                )}
              </div>

              <h1 className={styles.actorName}>{actor.name}</h1>
              {actor.birthName && actor.birthName !== actor.name && (
                <p className={styles.birthName}>Tên khai sinh: {actor.birthName}</p>
              )}

              {/* Statistics Counters */}
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={`${styles.statVal} ${styles.statValCinema}`}>
                    {actor.movieCount || movies.length}
                  </span>
                  <span className={styles.statLbl}>Phim tham gia</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statVal} ${styles.statValHighlight}`}>
                    <FaStar style={{ fontSize: '0.9rem', marginRight: '3px' }} />
                    {Number(actor.popularity || 8.8).toFixed(1)}
                  </span>
                  <span className={styles.statLbl}>Độ phổ biến</span>
                </div>
                {Boolean(actor.viewCount) && (
                  <div className={styles.statItem}>
                    <span className={styles.statVal}>
                      {Number(actor.viewCount).toLocaleString('vi-VN')}
                    </span>
                    <span className={styles.statLbl}>Lượt xem hồ sơ</span>
                  </div>
                )}
              </div>

              {/* Quick Facts */}
              <div className={styles.factsList}>
                {birthFormatted && (
                  <div className={styles.factItem}>
                    <FaCalendarAlt className={styles.factIcon} />
                    <span className={styles.factLabel}>Ngày sinh:</span>
                    <span className={styles.factValue}>
                      {birthFormatted} {age ? `(${age} tuổi)` : ''}
                    </span>
                  </div>
                )}
                {actor.placeOfBirth && (
                  <div className={styles.factItem}>
                    <FaMapMarkerAlt className={styles.factIcon} />
                    <span className={styles.factLabel}>Nơi sinh:</span>
                    <span className={styles.factValue}>{actor.placeOfBirth}</span>
                  </div>
                )}
                {actor.gender && actor.gender !== 'unknown' && (
                  <div className={styles.factItem}>
                    <FaVenusMars className={styles.factIcon} />
                    <span className={styles.factLabel}>Giới tính:</span>
                    <span className={styles.factValue}>{formatGender(actor.gender)}</span>
                  </div>
                )}
                {actor.height && (
                  <div className={styles.factItem}>
                    <FaRulerVertical className={styles.factIcon} />
                    <span className={styles.factLabel}>Chiều cao:</span>
                    <span className={styles.factValue}>{actor.height} cm</span>
                  </div>
                )}
              </div>

              {/* Social Media Links if any */}
              {actor.socialMedia && Object.keys(actor.socialMedia).length > 0 && (
                <div className={styles.socialLinks}>
                  {actor.socialMedia.facebook && (
                    <a
                      href={actor.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      title="Facebook"
                      aria-label="Facebook"
                    >
                      <FaFacebook />
                    </a>
                  )}
                  {actor.socialMedia.instagram && (
                    <a
                      href={actor.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      title="Instagram"
                      aria-label="Instagram"
                    >
                      <FaInstagram />
                    </a>
                  )}
                  {actor.socialMedia.twitter && (
                    <a
                      href={actor.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      title="Twitter"
                      aria-label="Twitter"
                    >
                      <FaTwitter />
                    </a>
                  )}
                  {actor.socialMedia.weibo && (
                    <a
                      href={actor.socialMedia.weibo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialBtn}
                      title="Weibo"
                      aria-label="Weibo"
                    >
                      <FaWeibo />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.container}>
        {/* 2. Biography Card */}
        {actor.biography && (
          <section className={styles.bioSection}>
            <h2 className={styles.sectionHeading}>
              <span className={styles.headingDot} />
              Tiểu Sử & Sự Nghiệp
            </h2>
            <div className={styles.bioParagraph}>
              {bioExpanded || actor.biography.length < 350 ? (
                actor.biography.split('\n').map((p, i) => (
                  <p key={i} style={{ marginBottom: '8px' }}>
                    {p}
                  </p>
                ))
              ) : (
                <p>{actor.biography.slice(0, 350)}...</p>
              )}
            </div>
            {actor.biography.length >= 350 && (
              <button
                type="button"
                className={styles.bioReadMoreBtn}
                onClick={() => setBioExpanded((prev) => !prev)}
              >
                {bioExpanded ? (
                  <>
                    <span>Thu gọn</span>
                    <FaChevronUp />
                  </>
                ) : (
                  <>
                    <span>Xem toàn bộ tiểu sử</span>
                    <FaChevronDown />
                  </>
                )}
              </button>
            )}
          </section>
        )}

        {/* 3. Awards if any */}
        {actor.awards && actor.awards.length > 0 && (
          <section className={styles.bioSection} style={{ marginTop: '20px' }}>
            <h2 className={styles.sectionHeading}>
              <FaAward className="text-warning me-2" />
              Giải Thưởng & Danh Hiệu
            </h2>
            <div className="d-flex flex-wrap gap-2">
              {actor.awards.map((award, idx) => (
                <span key={idx} className="badge bg-dark border border-secondary p-2">
                  🏆 {award}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Filmography Movies Grid */}
        <section className={styles.filmographySection}>
          <div className={styles.filmographyHeader}>
            <h2 className={styles.sectionHeading} style={{ margin: 0 }}>
              <FaFilm className="text-danger me-2" />
              Tuyển Tập Phim Đã Tham Gia ({filteredMovies.length})
            </h2>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${activeFilter === 'all' ? styles.filterTabBtnActive : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Tất cả ({movies.length})
              </button>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${activeFilter === 'series' ? styles.filterTabBtnActive : ''}`}
                onClick={() => setActiveFilter('series')}
              >
                Phim bộ (
                {movies.filter((m) => m.type === 'series' || m.type === 'tv').length}
                )
              </button>
              <button
                type="button"
                className={`${styles.filterTabBtn} ${activeFilter === 'movie' ? styles.filterTabBtnActive : ''}`}
                onClick={() => setActiveFilter('movie')}
              >
                Phim lẻ (
                {movies.filter((m) => m.type === 'single' || m.type === 'movie').length}
                )
              </button>
            </div>
          </div>

          {filteredMovies.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaFilm style={{ fontSize: '2.5rem', marginBottom: '12px' }} />
              <p>Chưa có danh sách phim cho danh mục này.</p>
            </div>
          ) : (
            <div className={styles.moviesGrid}>
              {filteredMovies.map((movie) => {
                const movieSlug = movie.slug || movie.id;
                const safeRating = Number(movie.rating || 8.6).toFixed(1);
                const yearText = formatYear(movie.year);

                return (
                  <Link
                    key={movie.id}
                    href={`/movie/${encodeURIComponent(movieSlug)}`}
                    className={styles.movieCard}
                    title={movie.name || movie.title}
                  >
                    <div className={styles.posterWrapper}>
                      <img
                        src={movie.poster_url || DEFAULT_POSTER}
                        alt={movie.name}
                        className={styles.posterImg}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = DEFAULT_POSTER;
                        }}
                      />
                      <div className={styles.posterOverlay} />

                      {movie.quality && (
                        <span className={styles.badgeQuality}>{movie.quality}</span>
                      )}

                      <div className={styles.playCenterHover}>
                        <div className={styles.playIconBtn}>
                          <FaPlay />
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardInfo}>
                      <h4 className={styles.movieTitle}>{movie.name || movie.title}</h4>
                      <div className={styles.metaRow}>
                        <span className={styles.ratingBadge}>
                          <FaStar style={{ fontSize: '0.7rem' }} />
                          <span>{safeRating}</span>
                        </span>
                        <span className={styles.yearText}>{yearText}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
