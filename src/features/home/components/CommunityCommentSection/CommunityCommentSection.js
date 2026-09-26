import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/common/MovieSection/SectionHeader';
import commentService from '@/API/services/commentService';
import { mockLiveBuzzComments } from '@/mock/mockComments';
import { LOCAL_DEFAULT_BACKDROP } from '@/config/movieConfig';
import styles from './CommunityCommentSection.module.css';

/**
 * @file CommunityCommentSection.js
 * @description Unified, space-efficient community discussion section.
 * - Left (col-xl-9): Two horizontal rails for Top Weekly and Top Monthly/All-time comments,
 *   featuring impressive movie backdrop cards with 2-line preview and fixed cadence.
 * - Right (col-xl-3): YouTube-style vertical Live Chat stream with scroll loader and pulsating dot.
 *
 * @param {Object} props
 * @param {boolean} [props.enabled=true] - Switch to toggle the section on/off.
 */
export default function CommunityCommentSection({ enabled = true }) {
  if (!enabled) return null;

  const [weekComments, setWeekComments] = useState([]);
  const [monthComments, setMonthComments] = useState([]);
  const [monthPeriod, setMonthPeriod] = useState('month'); // 'month' or 'all'
  const [liveMessages, setLiveMessages] = useState(mockLiveBuzzComments);
  const [loadingMoreLive, setLoadingMoreLive] = useState(false);
  const [showReturnToLatest, setShowReturnToLatest] = useState(false);
  const [isReloadingLive, setIsReloadingLive] = useState(false);
  const [likedMap, setLikedMap] = useState({});

  const feedRef = useRef(null);

  // Fetch Top Weekly Comments (Rail 1)
  useEffect(() => {
    let isSubscribed = true;
    const fetchWeek = async () => {
      try {
        const data = await commentService.getTopComments({ period: 'week', limit: 10 });
        if (isSubscribed && data?.comments) {
          setWeekComments(data.comments);
        }
      } catch (err) {
        // Fallback handled silently
      }
    };
    fetchWeek();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Fetch Top Monthly or All-time Comments (Rail 2)
  useEffect(() => {
    let isSubscribed = true;
    const fetchMonth = async () => {
      try {
        const data = await commentService.getTopComments({ period: monthPeriod, limit: 10 });
        if (isSubscribed && data?.comments) {
          setMonthComments(data.comments);
        }
      } catch (err) {
        // Fallback handled silently
      }
    };
    fetchMonth();
    return () => {
      isSubscribed = false;
    };
  }, [monthPeriod]);

  // Periodic incoming live chat messages (simulating YouTube Live)
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const incomingPool = [
        {
          _id: `live-${Date.now()}`,
          movie_name: "Dune: Phần Hai",
          movie_slug: "dune-hanh-tinh-cat-phan-hai",
          user_name: "Quốc Anh",
          snippet: "Cảnh cưỡi sâu cát cuốn quá!",
          time_ago: "Vừa xong"
        },
        {
          _id: `live-${Date.now() + 1}`,
          movie_name: "Arcane Season 2",
          movie_slug: "arcane-lien-minh-huyen-thoai",
          user_name: "Thùy Trang",
          snippet: "Jinx tập này tội thực sự 😢",
          time_ago: "Vừa xong"
        },
        {
          _id: `live-${Date.now() + 2}`,
          movie_name: "Khóa Chặt Cửa Nào Suzume",
          movie_slug: "khoa-chat-cua-nao-suzume",
          user_name: "Huy Hoàng",
          snippet: "Nhạc phim nghe mãi không chán.",
          time_ago: "Vừa xong"
        },
        {
          _id: `live-${Date.now() + 3}`,
          movie_name: "Nữ Hoàng Nước Mắt",
          movie_slug: "nu-hoang-nuoc-mat",
          user_name: "Mỹ Duyên",
          snippet: "Tập mới khóc hết nước mắt 😭",
          time_ago: "Vừa xong"
        }
      ];

      const nextMsg = incomingPool[index % incomingPool.length];
      index += 1;

      setLiveMessages((prev) => [nextMsg, ...prev.slice(0, 30)]);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  const [historyPageIndex, setHistoryPageIndex] = useState(0);

  // Pool of realistic historical comments for infinite history loading
  const historyPool = [
    [
      {
        movie_name: "Tên Cậu Là Gì?",
        movie_slug: "ten-cau-la-gi-your-name",
        user_name: "Minh Tuấn",
        snippet: "Xem lại lần thứ n vẫn nguyên cảm xúc ban đầu.",
        time_ago: "25 phút trước"
      },
      {
        movie_name: "Ký Sinh Trùng",
        movie_slug: "ky-sinh-trung-parasite",
        user_name: "Đức Trọng",
        snippet: "Từng khung hình ẩn dụ quá xuất sắc!",
        time_ago: "35 phút trước"
      }
    ],
    [
      {
        movie_name: "Lâu Đài Bay Howl",
        movie_slug: "lau-dai-bay-cua-phap-su-howl",
        user_name: "Thùy Linh",
        snippet: "Âm nhạc Joe Hisaishi nghe mãi không thấy chán.",
        time_ago: "50 phút trước"
      },
      {
        movie_name: "Oppenheimer",
        movie_slug: "oppenheimer",
        user_name: "Hoàng Long",
        snippet: "Phân cảnh thử nghiệm bom Trinity nín thở từng giây.",
        time_ago: "1 giờ trước"
      }
    ],
    [
      {
        movie_name: "Avatar: Dòng Chảy Nước",
        movie_slug: "avatar-dong-chay-cua-nuoc",
        user_name: "Văn Hùng",
        snippet: "Kỹ xảo thế giới đại dương Pandora quá chân thực!",
        time_ago: "2 giờ trước"
      },
      {
        movie_name: "Trò Chơi Vương Quyền",
        movie_slug: "game-of-thrones",
        user_name: "Bảo Trâm",
        snippet: "Cày lại từ mùa 1 vẫn thấy cuốn không dứt ra được.",
        time_ago: "3 giờ trước"
      }
    ]
  ];

  // Handle Scroll in Live Chat: show return-to-latest button and load history when scrolling down
  const handleLiveScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    // Show return-to-latest button when scrolled down away from top (scrollTop > 50)
    if (scrollTop > 50) {
      setShowReturnToLatest(true);
    } else {
      setShowReturnToLatest(false);
    }

    // Load older comments when scrolling down near bottom (find historical comments)
    if (
      scrollTop + clientHeight >= scrollHeight - 20 &&
      !loadingMoreLive
    ) {
      setLoadingMoreLive(true);
      setTimeout(() => {
        setLiveMessages((prev) => {
          const batchToLoad = historyPool[historyPageIndex % historyPool.length].map((item, idx) => ({
            ...item,
            _id: `live-hist-${Date.now()}-${idx}`
          }));
          return [...prev, ...batchToLoad];
        });
        setHistoryPageIndex((prevIndex) => prevIndex + 1);
        setLoadingMoreLive(false);
      }, 600);
    }
  };

  // Scroll to top (where latest comments reside) and reload/refresh the stream
  const handleReturnToLatestAndReload = async () => {
    // 1. Scroll smoothly to top
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    setShowReturnToLatest(false);

    // 2. Reload latest live comments
    setIsReloadingLive(true);
    try {
      const data = await commentService.getLiveBuzzComments({ limit: 8 });
      if (data?.comments) {
        setLiveMessages(data.comments);
        setHistoryPageIndex(0);
      }
    } catch (err) {
      setLiveMessages(mockLiveBuzzComments);
      setHistoryPageIndex(0);
    } finally {
      setTimeout(() => {
        setIsReloadingLive(false);
      }, 400);
    }
  };

  const handleToggleLike = (e, id, baseCount) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedMap((prev) => {
      const isLiked = prev[id]?.liked;
      return {
        ...prev,
        [id]: {
          liked: !isLiked,
          count: !isLiked ? (prev[id]?.count || baseCount) + 1 : (prev[id]?.count || baseCount) - 1
        }
      };
    });
  };

  // Helper renderer for a single movie backdrop comment card
  const renderCommentCard = (comm) => {
    const userLikedState = likedMap[comm._id];
    const currentLikes = userLikedState ? userLikedState.count : comm.likes_count;
    const isLiked = userLikedState ? userLikedState.liked : false;

    const bgImage =
      comm.movie?.thumb_url || comm.movie?.poster_url || 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg';

    return (
      <Link
        key={comm._id}
        href={`/movie/${comm.movie?.slug || ''}`}
        className={styles.backdropCommentCard}
      >
        {/* Movie Backdrop as Card Background */}
        <img
          src={bgImage}
          alt={comm.movie?.name || 'Movie'}
          className={styles.cardBackdropImg}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = LOCAL_DEFAULT_BACKDROP;
          }}
        />

        {/* Ambient Dark Overlay for High Legibility */}
        <div className={styles.cardBackdropOverlay} />

        {/* Foreground Content */}
        <div className={styles.cardForeground}>
          {/* Top Line: Movie Name strictly 1 line */}
          <div className={styles.movieLine}>
            <span className={styles.movieName} title={comm.movie?.name}>
              {comm.movie?.name}
            </span>
            {comm.movie?.rating && (
              <span className={styles.movieRatingBadge}>
                <i className="fas fa-star" />
                {comm.movie.rating}
              </span>
            )}
          </div>

          {/* Author Line: Crisp avatar, name, badge and optional reply */}
          <div className={styles.authorLine}>
            <div className={styles.authorLeft}>
              <div className={styles.userAvatar}>
                {comm.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className={styles.authorName}>{comm.user?.name}</span>

              {/* Safe user badge */}
              {comm.user?.badge && (
                <span className={styles.userBadge}>{comm.user.badge}</span>
              )}

              {/* Integrated compact reply without vertical drift */}
              {comm.parent_comment && (
                <span
                  className={styles.replySnippet}
                  title={`Trả lời @${comm.parent_comment.user_name}`}
                >
                  ↳ @{comm.parent_comment.user_name}
                </span>
              )}
            </div>

            <span className={styles.timeAgo}>{comm.created_at}</span>
          </div>

          {/* Comment Body: Strictly 2 lines restricted */}
          <p className={styles.commentBody} title={comm.content}>
            "{comm.content}"
          </p>

          {/* Footer: Like & Reply count (NO SCORE SHOWN) */}
          <div className={styles.cardFooter}>
            <div className={styles.interactionGroup}>
              <button
                type="button"
                className={`${styles.btnLike} ${isLiked ? styles.btnLikeActive : ''}`}
                onClick={(e) => handleToggleLike(e, comm._id, comm.likes_count)}
                title="Thích bình luận này"
              >
                <i className={`fas fa-heart ${isLiked ? 'text-danger' : ''}`} />
                <span>{currentLikes}</span>
              </button>

              <span className={styles.replyCount} title="Lượt phản hồi">
                <i className="fas fa-comment-dots" />
                <span>{comm.replies_count}</span>
              </span>
            </div>

            <span className="text-secondary" style={{ fontSize: '0.66rem' }}>
              Chi tiết <i className="fas fa-chevron-right ms-1" style={{ fontSize: '0.58rem' }} />
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className={styles.commentSection} id="community-comments">
      {/* Standard Section Header matching all other cinema rails */}
      <SectionHeader
        title="Bình Luận Nổi Bật"
        badge="THẢO LUẬN"
      />

      {/* Main Grid: Left Rails (col-xl-9) + Right YouTube Live Chat (col-xl-3) */}
      <div className="row g-3 g-lg-4">
        {/* Left Column: 2 Horizontal Rails (Top Week & Top Month/All) */}
        <div className="col-12 col-xl-9">
          <div className={styles.railsColumn}>
            {/* Rail 1: Top Comments of the Week */}
            <div className={styles.railWrapper}>
              <div className={styles.railHeader}>
                <h3 className={styles.railTitle}>
                  <i className={`fas fa-fire ${styles.railIcon}`} />
                  Bình Luận Trong Tuần
                </h3>
              </div>

              <div className={styles.cardsTrack}>
                {weekComments.map(renderCommentCard)}
              </div>
            </div>

            {/* Rail 2: Top Monthly with Quick Toggle to All-time */}
            <div className={styles.railWrapper}>
              <div className={styles.railHeader}>
                <h3 className={styles.railTitle}>
                  <i className={`fas fa-trophy ${styles.railIcon}`} />
                  Bình Luận Trong Tháng
                </h3>

                {/* Sub-toggle: Month vs All-Time */}
                <div className={styles.toggleSwitchGroup}>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${monthPeriod === 'month' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setMonthPeriod('month')}
                  >
                    Tháng này
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${monthPeriod === 'all' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setMonthPeriod('all')}
                  >
                    Mọi thời đại
                  </button>
                </div>
              </div>

              <div className={styles.cardsTrack}>
                {monthComments.map(renderCommentCard)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: YouTube-Style Vertical Live Chat Stream */}
        <div className="col-12 col-xl-3">
          <div className={styles.liveChatBox}>
            {/* Live Chat Header with delicate pulsating dot */}
            <div className={styles.liveChatHeader}>
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot} />
                <h4 className={styles.liveChatTitle}>Mới nhất</h4>
              </div>
              <span className={styles.liveChatCount}>164 bình luận</span>
            </div>

            {/* Scrollable Live Feed with Infinite Scroll Loader */}
            <div
              className={styles.liveFeedContainer}
              ref={feedRef}
              onScroll={handleLiveScroll}
            >
              {liveMessages.map((msg, index) => (
                <Link
                  key={`${msg._id}-${index}`}
                  href={`/movie/${msg.movie_slug}`}
                  className={styles.chatMessageItem}
                >
                  <div className={styles.chatAvatar}>
                    {msg.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className={styles.chatBody}>
                    <div className={styles.chatHeaderLine}>
                      <span className={styles.chatUser}>{msg.user_name}</span>
                      <span className={styles.chatMovieTag}>• {msg.movie_name}</span>
                      <span className={styles.chatTimeAgo}>{msg.time_ago}</span>
                    </div>
                    <p className={styles.chatText}>{msg.snippet}</p>
                  </div>
                </Link>
              ))}

              {/* Loading Indicator when scrolling to fetch more history */}
              {loadingMoreLive && (
                <div className={styles.scrollLoader}>
                  <span className={styles.spinnerMini} />
                  <span>Đang tải thêm...</span>
                </div>
              )}
            </div>

            {/* Floating Return to Latest Button (Appears when scrolled down, scrolls up to top and reloads) */}
            {showReturnToLatest && (
              <button
                type="button"
                className={styles.btnReturnToLatest}
                onClick={handleReturnToLatestAndReload}
                title="Chạy về bình luận mới nhất và làm mới"
              >
                <i className={`fas ${isReloadingLive ? 'fa-sync-alt fa-spin' : 'fa-arrow-up'}`} />
                <span>{isReloadingLive ? 'Đang làm mới...' : 'Mới nhất'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
