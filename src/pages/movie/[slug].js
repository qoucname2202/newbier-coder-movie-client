import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from 'next/link';
import Navbar from "../../components/Layout/Navbar";
import styles from "../../styles/MovieDetail.module.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { RESTRICTED_WORDS, containsRestrictedWords } from "../../constants/inconsiderate";
import { API_URL } from "../../config/API";
import axios from "axios";
import axiosInstance from "../../API/config/axiosConfig";
import historyService from "../../API/services/historyService";
import movieViewService from "../../API/services/movieViewService"; // Import the movie view service
import favoritesService from "../../API/services/favoritesService"; // Import the favorites service
import watchlistService from "../../API/services/watchlistService"; // Import the watchlist service
import AdPlayer from "../../components/Advertisement/AdPlayer"; // Import AdPlayer component
import AdPlayerFixed from "../../components/Advertisement/AdPlayer"; // Import AdPlayerFixed component
import adService from "../../API/services/adService"; // Import ad service
import { useAdContext } from "../../context/AdContext"; // Import AdContext
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RatingStats from '../../components/Movie/RatingStats';

const MAX_COMMENTS_PER_DAY = 4; // Maximum comments allowed per day

const checkCommentLimit = (username) => {
  const today = new Date().toLocaleDateString('vi-VN');
  const commentStats = JSON.parse(localStorage.getItem('commentStats') || '{}');

  if (!commentStats[today]) {
    commentStats[today] = {};
  }

  if (!commentStats[today][username]) {
    commentStats[today][username] = 0;
  }

  return {
    count: commentStats[today][username],
    updateCount: () => {
      commentStats[today][username]++;
      localStorage.setItem('commentStats', JSON.stringify(commentStats));
    },
    hasReachedLimit: commentStats[today][username] >= MAX_COMMENTS_PER_DAY
  };
};

const ActorCard = ({ actorName }) => {
  const [actorImage, setActorImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const imageBaseUrl = process.env.NEXT_PUBLIC_TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p/w500';
  const profilePlaceholder = '/img/user-avatar.png';

  // If actor name is empty, don't render anything
  if (!actorName || actorName.trim() === '') {
    return null;
  }

  // Fetch actor image on component mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchActorImage = async () => {
      try {
        // Check if actor name exists and has at least 2 characters
        if (!actorName || actorName.length < 2) {
          setLoading(false);
          return;
        }

        // Check if we've already tried to fetch this image in this session
        const sessionImageCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
        if (sessionImageCache[actorName.toLowerCase()]) {
          if (sessionImageCache[actorName.toLowerCase()] !== 'notfound') {
            setActorImage(sessionImageCache[actorName.toLowerCase()]);
          }
          setLoading(false);
          return;
        }

        // Check if actor ID is cached first
        const actorCache = JSON.parse(localStorage.getItem('actorCache') || '{}');
        let actorId = actorCache[actorName.toLowerCase()];

        if (!actorId) {
          // Search for actor on TMDB
          const response = await axios.get(`${process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3'}/search/person`, {
            params: {
              query: actorName,
              include_adult: false,
              language: 'vi-VN,en-US',
              page: 1,
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY
            },
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TMDB_AUTH_TOKEN}`,
              'accept': 'application/json'
            },
            signal: controller.signal
          });

          if (isMounted && response.data.results && response.data.results.length > 0) {
            actorId = response.data.results[0].id;

            // Cache the actor ID for future use
            const updatedCache = JSON.parse(localStorage.getItem('actorCache') || '{}');
            updatedCache[actorName.toLowerCase()] = actorId;
            localStorage.setItem('actorCache', JSON.stringify(updatedCache));

            // Get the profile path
            if (response.data.results[0].profile_path) {
              const imagePath = `${imageBaseUrl}${response.data.results[0].profile_path}`;
              setActorImage(imagePath);

              // Cache the image path in session storage
              const imageCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
              imageCache[actorName.toLowerCase()] = imagePath;
              sessionStorage.setItem('actorImageCache', JSON.stringify(imageCache));
            } else {
              // Mark as not found in session cache to avoid repeated lookups
              const imageCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
              imageCache[actorName.toLowerCase()] = 'notfound';
              sessionStorage.setItem('actorImageCache', JSON.stringify(imageCache));
            }
          }
        } else {
          // If we have the actor ID already, get their details directly
          const personResponse = await axios.get(`${process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3'}/person/${actorId}`, {
            params: {
              api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
              language: 'vi-VN,en-US',
            },
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TMDB_AUTH_TOKEN}`,
              'accept': 'application/json'
            },
            signal: controller.signal
          });

          if (isMounted && personResponse.data.profile_path) {
            const imagePath = `${imageBaseUrl}${personResponse.data.profile_path}`;
            setActorImage(imagePath);

            // Cache the image path in session storage
            const imageCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
            imageCache[actorName.toLowerCase()] = imagePath;
            sessionStorage.setItem('actorImageCache', JSON.stringify(imageCache));
          } else if (isMounted) {
            // Mark as not found in session cache to avoid repeated lookups
            const imageCache = JSON.parse(sessionStorage.getItem('actorImageCache') || '{}');
            imageCache[actorName.toLowerCase()] = 'notfound';
            sessionStorage.setItem('actorImageCache', JSON.stringify(imageCache));
          }
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error(`Error fetching actor image for ${actorName}:`, error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActorImage();

    // Cleanup function to prevent memory leaks and state updates on unmounted components
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [actorName, imageBaseUrl]);
    // Use a function to search for actor on TMDB
  const handleActorClick = async (e) => {
    e.preventDefault();

    // Create a unique toast ID so we can update it later
    const toastId = toast.loading(`Đang tìm kiếm thông tin về diễn viên: ${actorName}...`, {
      autoClose: false
    });

    try {
      // Check if we already have the actor ID cached
      const actorCache = JSON.parse(localStorage.getItem('actorCache') || '{}');
      const cachedActorId = actorCache[actorName.toLowerCase()];

      if (cachedActorId) {
        // If we have the ID, navigate directly to the performer page
        toast.update(toastId, {
          render: `Đã tìm thấy thông tin diễn viên: ${actorName}`,
          type: "success",
          isLoading: false,
          autoClose: 1000
        });
        router.push(`/performer/${cachedActorId}`);
        return;
      }

      // Otherwise, search for the actor
      const response = await axios.get(`${process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3'}/search/person`, {
        params: {
          query: actorName,
          include_adult: false,
          language: 'vi-VN,en-US',
          page: 1,
          api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY
        },
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TMDB_AUTH_TOKEN}`,
          'accept': 'application/json'
        }
      });

      if (response.data.results && response.data.results.length > 0) {
        try {
          const existingActors = JSON.parse(localStorage.getItem('actorCache') || '{}');
          existingActors[actorName.toLowerCase()] = response.data.results[0].id;
          localStorage.setItem('actorCache', JSON.stringify(existingActors));
        } catch (e) {
          console.error("Error saving actor to cache:", e);
        }

        // Update toast and navigate
        toast.update(toastId, {
          render: `Đã tìm thấy thông tin diễn viên: ${actorName}`,
          type: "success",
          isLoading: false,
          autoClose: 1000
        });

        // Navigate to performer page with the first matched actor ID
        router.push(`/performer/${response.data.results[0].id}`);
      } else {
        toast.update(toastId, {
          render: `Không tìm thấy thông tin diễn viên: ${actorName}. Đang tìm kiếm phim liên quan...`,
          type: "info",
          isLoading: false,
          autoClose: 2000
        });
        router.push(`/search?query=${encodeURIComponent(actorName)}`);
      }
    } catch (error) {
      console.error('Error searching for actor:', error);
      toast.update(toastId, {
        render: 'Không thể tải thông tin diễn viên.',
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  return (    <div
      className={styles.actorCard}
      onClick={handleActorClick}
      title={`Xem thông tin diễn viên: ${actorName}`}
      role="button"
      tabIndex="0"
      aria-label={`Xem thông tin về diễn viên ${actorName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActorClick(e);
        }
      }}
    ><div className={styles.actorImageContainer}>
        {loading ? (
          <div className={styles.actorImageSkeleton}></div>
        ) : (
          <img
            src={actorImage || profilePlaceholder}
            alt={actorName}
            className={styles.actorImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = profilePlaceholder;
            }}
          />
        )}
      </div>
      <span className={styles.actorName}>{actorName}</span>
    </div>
  );
};

const MovieDetail = ({ slug: slugProp }) => {
  const router = useRouter();
  const { slug: routerSlug } = router.query;
  const slug = slugProp || routerSlug;
    // Verify TMDB API environment variables
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_TMDB_API_KEY || !process.env.NEXT_PUBLIC_TMDB_BASE_URL || !process.env.NEXT_PUBLIC_TMDB_AUTH_TOKEN) {
      console.warn('TMDB API environment variables not properly set. Actor search functionality may not work correctly.');
    }
  }, []);

  // Add a ref to track if we've already recorded a view for this session
  // This prevents double counting of views when both play functions are called
  const viewRecordedRef = useRef(false);
  // Track if this movie was opened from the most-viewed section to prevent double counting
  const fromMostViewedRef = useRef(false);

  const watchSessionRef = useRef(null);
  const positionUpdateTimerRef = useRef(null);
  const lastPositionUpdateRef = useRef(0);

  const reportReasons = [
    "Phim không xem được",
    "Âm thanh không đồng bộ",
    "Phụ đề không hiển thị",
    "Chất lượng phim kém",
    "Nội dung không phù hợp",
    "Lỗi máy chủ",
    "Lý do khác"
  ];
  const [guestName, setGuestName] = useState("");
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServer, setSelectedServer] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('auto');  const [relatedMovies, setRelatedMovies] = useState([]);
  const [similarNameMovies, setSimilarNameMovies] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [showQualitySettings, setShowQualitySettings] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoRef, setVideoRef] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('default');
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([
    { label: 'Tự động', value: 'auto' },
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' }
  ]);

  // Add state variables to track ratings
  const [averageRating, setAverageRating] = useState(0);  const [ratingCount, setRatingCount] = useState(0);  const [userRatingsStats, setUserRatingsStats] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingStatsData, setRatingStatsData] = useState({});
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#000");
  const [videoLoading, setVideoLoading] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [previewMovie, setPreviewMovie] = useState(null);
  const previewTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);  const [trailerUrl, setTrailerUrl] = useState('');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [showAd, setShowAd] = useState(false); // State to show advertisement
  const [currentAd, setCurrentAd] = useState(null); // State to store current ad data

  // Add state for tracking which comment's menu is open
  const [openMenuId, setOpenMenuId] = useState(null);

  // Add a new state for anonymous commenting
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Add a new state for history-based recommendations
  const [historyRecommendations, setHistoryRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [currentMovieId, setCurrentMovieId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentParentId, setCommentParentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [reportType, setReportType] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const toggleCommentMenu = (commentId) => {
    if (openMenuId === commentId) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(commentId);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleDeleteComment = async (commentId) => {
    if (!commentId) {
      console.error("Comment ID is undefined");
      toast.error("Không thể xác định bình luận cần xóa");
      return;
    }

    // Find the comment that's being deleted
    const commentToDelete = comments.find(comment => comment.id === commentId);
    if (!commentToDelete) {
      toast.error("Không tìm thấy bình luận");
      return;
    }

    // Check if the comment was created less than 1 minute ago
    const commentDate = new Date(commentToDelete.createdAt || commentToDelete.date);
    const currentTime = new Date();
    const timeDifferenceInMinutes = (currentTime - commentDate) / (1000 * 60);

    if (timeDifferenceInMinutes < 1) {
      toast.error("Bạn cần đợi ít nhất 1 phút sau khi đăng bình luận mới có thể xóa");
      return;
    }

    if (confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      try {
        const anonymousCommentIds = JSON.parse(localStorage.getItem('anonymousComments') || '[]');
        const isMyAnonymousComment = anonymousCommentIds.includes(commentId);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        let endpoint;
        let options = {};

        if (isMyAnonymousComment) {
          endpoint = `/api/comments/anonymous/${commentId}?secret_key=${commentId}`;

          const url = baseUrl.endsWith('/api')
            ? `${baseUrl.substring(0, baseUrl.length - 4)}${endpoint}`
            : `${baseUrl}${endpoint}`;

          const response = await axios.delete(url);

          if (response.status === 200 || response.status === 204) {
            const updatedComments = comments.filter(comment => comment.id !== commentId);
            setComments(updatedComments);

            const updatedAnonymousComments = anonymousCommentIds.filter(id => id !== commentId);
            localStorage.setItem('anonymousComments', JSON.stringify(updatedAnonymousComments));

            toast.success('Đã xóa bình luận thành công!');
          } else {
            toast.error("Không thể xóa bình luận.");
          }
          return;
        }

        if (!user) {
          toast.error("Bạn không có quyền xóa bình luận này.");
          return;
        }

        const token = localStorage.getItem('auth_token');

        if (!token) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }

        endpoint = `/api/comments/${commentId}`;
        const url = baseUrl.endsWith('/api')
          ? `${baseUrl.substring(0, baseUrl.length - 4)}${endpoint}`
          : `${baseUrl}${endpoint}`;

        const response = await axios.delete(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200 || response.status === 204) {
          // Use the id property to filter comments, as that's what's returned from the backend
          const updatedComments = comments.filter(comment => comment.id !== commentId);
          setComments(updatedComments);
          toast.success('Đã xóa bình luận thành công!');
        } else {
          toast.error("Không thể xóa bình luận.");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        console.error("Error details:", error.response?.data);
        toast.error(error.response?.data?.error || "Có lỗi xảy ra khi xóa bình luận.");
      }
    }
  };

  const handleBeforeChange = () => {
    setIsDragging(true);
  };

  const handleAfterChange = () => {
    setTimeout(() => {
      setIsDragging(false);
    }, 300);
  };

  const handleMouseEnter = async (movie) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    previewTimeoutRef.current = setTimeout(async () => {
      if (!movie.episodes || !movie.episodes.length) {
        try {
          const response = await fetch(`http://localhost:5000/api/movies${movie.slug}`);
          const data = await response.json();

          if (data.status && data.movie && data.episodes && data.episodes.length > 0) {
            const movieWithEpisodes = {
              ...movie,
              episodes: data.episodes
            };
            setPreviewMovie(movieWithEpisodes);
          }
        } catch (error) {
          console.error("Error fetching movie episodes for preview:", error);
        }
      } else {
        setPreviewMovie(movie);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    setTimeout(() => {
      if (!document.querySelector(':hover > .video-preview-overlay')) {
        setPreviewMovie(null);
      }
    }, 300);
  };

  const closePreview = () => {
    setPreviewMovie(null);
  };

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
    <button
      {...props}
      className={`${styles.slickArrow} ${styles.slickPrev}`}
      aria-hidden="true"
      aria-disabled={currentSlide === 0 ? true : false}
      type="button"
    />
  );

  const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
    <button
      {...props}
      className={`${styles.slickArrow} ${styles.slickNext}`}
      aria-hidden="true"
      aria-disabled={currentSlide === slideCount - 1 ? true : false}
      type="button"
    />
  );

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    initialSlide: 0,
    swipeToSlide: true,
    draggable: true,
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    useCSS: true,
    useTransform: true,
    variableWidth: false,
    touchThreshold: 8,
    waitForAnimate: false,
    swipe: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    prevArrow: <SlickArrowLeft />,
    nextArrow: <SlickArrowRight />,
    beforeChange: handleBeforeChange,
    afterChange: handleAfterChange,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      }
    ]
  };

  const handleImageLoaded = () => {
    setImageLoaded(true);

    if (!loading) {
      setContentLoaded(true);
    }
  };

  useEffect(() => {
    if (!loading && !contentLoaded) {
      const timer = setTimeout(() => {
        setContentLoaded(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, contentLoaded]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;

      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;

      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let autoScrollInterval;
    let scrollDirection = 'right';

    const startAutoScroll = () => {
      autoScrollInterval = setInterval(() => {
        if (scrollDirection === 'right') {
          if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 50) {
            scrollDirection = 'left';
            scrollLeft();
          } else {
            scrollRight();
          }
        } else {
          if (container.scrollLeft <= 50) {
            scrollDirection = 'right';
            scrollRight();
          } else {
            scrollLeft();
          }
        }
      }, 5000);
    };

    const stopAutoScroll = () => {
      if (autoScrollInterval) clearInterval(autoScrollInterval);
    };

    if (relatedMovies.length > 0) {
      startAutoScroll();
    }

    container.addEventListener('mouseenter', stopAutoScroll);
    container.addEventListener('mouseleave', startAutoScroll);

    return () => {
      stopAutoScroll();
      if (container) {
        container.removeEventListener('mouseenter', stopAutoScroll);
        container.removeEventListener('mouseleave', startAutoScroll);
      }
    };
  }, [relatedMovies, contentLoaded]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const userData = JSON.parse(loggedInUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!slug) return;

      // Reset view tracking refs for new movie fetch
      viewRecordedRef.current = false;

      // Check if we're coming from the most-viewed section to prevent double counting
      if (router.query.from === 'most-viewed') {
        fromMostViewedRef.current = true;
      }

      try {
        setLoading(true);
        setContentLoaded(false);

        // Fetch movie data from API
        const response = await fetch(`http://localhost:5000/api/movies/${slug}`);

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.data) {
          const movieData = result.data;

          // Set the movie data first
          setMovie(movieData);

          // Set initial rating state from movie data as a fallback
          setAverageRating(movieData.rating || 0);
          setRatingCount(movieData.rating_count || 0);

          // Check if the movie is in the user's favorites list
          if (user) {
            try {
              const isFav = await favoritesService.checkFavoriteStatus(slug);
              setIsFavorite(isFav);
            } catch (err) {
              console.error("Error checking favorite status:", err);
            }
          }

          // Fetch user's personal rating if user is logged in
          if (user) {
            fetchUserRating();
          }          // Fetch movies with similar names and combine with category movies
          let similarNameMovies = [];
          if (movieData.name) {
            try {
              // Extract the main part of the movie name (before season/part numbers)
              const mainMovieName = movieData.name.replace(/ (phần|season|mùa|tập) \d+/gi, '').trim();

              const similarNameResponse = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(mainMovieName)}&size=8`);
              const similarNameResult = await similarNameResponse.json();

              if (similarNameResult.success && similarNameResult.hits) {
                const seenSlugs = new Set([slug]);
                similarNameMovies = similarNameResult.hits
                  .filter(similar => {
                    if (seenSlugs.has(similar.slug)) return false;
                    seenSlugs.add(similar.slug);
                    return true;
                  })
                  .slice(0, 5);
              }
            } catch (similarNameError) {
              console.error("Error fetching movies with similar names:", similarNameError);
            }
          }          // Fetch related movies by category and combine with similar name movies
          if (movieData.category && movieData.category.length > 0) {
            try {
              // Get first category name
              let categoryName;
              if (typeof movieData.category[0] === 'object') {
                categoryName = movieData.category[0].name;
              } else {
                categoryName = movieData.category[0];
              }

              // Fetch related movies by category
              const relatedResponse = await fetch(`http://localhost:5000/api/movies?category=${encodeURIComponent(categoryName)}&limit=20`);
              const relatedResult = await relatedResponse.json();

              if (relatedResult.data && relatedResult.data.movies) {
                // Create a Set of all slugs we've already seen to prevent duplicates
                const seenSlugs = new Set([slug, ...similarNameMovies.map(movie => movie.slug)]);

                // Filter out the current movie, similar name movies, and any duplicates
                const categoryMovies = relatedResult.data.movies
                  .filter(related => {
                    // Skip if we've already seen this slug
                    if (seenSlugs.has(related.slug)) return false;
                    // Add to seen set and keep this movie
                    seenSlugs.add(related.slug);
                    return true;
                  })
                  .slice(0, 12); // Get up to 12 category movies to ensure we have enough content

                // Combine similar name movies (first) with category movies
                const combinedMovies = [...similarNameMovies, ...categoryMovies];

                // Check for any potential duplicates in the final list
                const finalMovies = [];
                const finalSeenSlugs = new Set();

                combinedMovies.forEach(movie => {
                  if (!finalSeenSlugs.has(movie.slug)) {
                    finalSeenSlugs.add(movie.slug);
                    finalMovies.push(movie);
                  }
                });

                // Set both states for backward compatibility
                setSimilarNameMovies(similarNameMovies);
                setRelatedMovies(finalMovies);
              }
            } catch (relatedError) {
              console.error("Error fetching related movies:", relatedError);
            }
          }

          setLoading(false);
        } else {
          setError("Không tìm thấy phim");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Có lỗi xảy ra khi tải phim");
        setLoading(false);
      }
    };

    fetchMovie();
  }, [slug, user]);

  useEffect(() => {
    const checkUserPreferences = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const watchLater = JSON.parse(localStorage.getItem('watchLater') || '[]');

      setIsFavorite(favorites.includes(slug));
      setIsWatchLater(watchLater.includes(slug));
    };

    const fetchRatingsStats = async () => {
      if (!slug) return;

      try {
        // Use fetch to avoid any issues with axiosInstance
        const response = await fetch(`http://localhost:5000/api/ratings/stats/${slug}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch rating stats: ${response.status}`);
        }

        const data = await response.json();

        if (data.data) {
          const ratingData = data.data;

          // Update the rating states with fetched data
          setAverageRating(ratingData.averageRating || 0);
          setRatingCount(ratingData.ratingCount || 0);

          // Store detailed rating statistics if available - backend returns userRatingsStats, not ratingDistribution
          if (ratingData.userRatingsStats) {
            setUserRatingsStats(ratingData.userRatingsStats);
          } else {
            // If the API doesn't return rating distribution, create a placeholder
            const distribution = {};
            for (let i = 1; i <= 10; i++) {
              distribution[i] = 0;
            }
            setUserRatingsStats(distribution);
          }

          // Also update the movie object for consistency
          setMovie(prev => ({
            ...prev,
            rating: ratingData && ratingData.averageRating ? ratingData.averageRating : ((prev && prev.rating) || 0),
            rating_count: ratingData && ratingData.ratingCount ? ratingData.ratingCount : ((prev && prev.rating_count) || 0)
          }));
        } else {
          console.error("Rating stats data not found in response:", data);
        }
      } catch (error) {
        console.error("Error fetching ratings stats:", error);
      }
    };

    checkUserPreferences();
    fetchUserRating();
    fetchRatingsStats();
    fetchHistoryRecommendations();
  }, [slug, user]);

  useEffect(() => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      setVideoRef(iframe);

      window.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'timeupdate') {
            setCurrentTime(data.time);
          }
        } catch (e) {
        }
      });
    }
  }, [selectedServer, selectedEpisode]);

  useEffect(() => {
    if (movie?.poster_url || movie?.thumb_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = movie.poster_url || movie.thumb_url;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setBackgroundColor(`rgb(${r}, ${g}, ${b})`);
        } catch (error) {
          console.error("Lỗi khi lấy màu từ hình ảnh:", error);
          setBackgroundColor("#000");
        }
      };
      img.onerror = () => {
        console.error("Không thể tải hình ảnh.");
        setBackgroundColor("#000");
      };
    }
  }, [movie]);

  useEffect(() => {
    const checkAccountStatus = () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (currentUser && currentUser.isActive === false) {
        router.push('/BlockedAccountAlert');
      }
    };

    checkAccountStatus();
  }, [router]);

  const checkIfAccountBlocked = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    return currentUser && currentUser.isActive === false;
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      if (isFavorite) {
        // If already in favorites, remove it
        if (!movie || !movie._id) {
          toast.error("Không thể xác định ID của phim");
          return;
        }

        const result = await favoritesService.removeFromFavorites(movie._id);

        if (result.success) {
          setIsFavorite(false);
          toast.success(result.message || "Đã xóa khỏi danh sách yêu thích");
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi xóa khỏi danh sách yêu thích");
        }
      } else {
        // If not in favorites, add it
        const result = await favoritesService.addToFavorites({ slug });
          if (result.success) {
          if (result.alreadyExists) {
            setIsFavorite(true);
            toast.info(result.message || "Đã có trong danh sách yêu thích");
          } else {
            setIsFavorite(true);
            toast.success(result.message || "Đã thêm vào danh sách yêu thích");
          }
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi thêm vào danh sách yêu thích");
        }
      }
    } catch (error) {
      console.error("Error handling favorite:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  const handleWatchLater = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      if (isWatchLater) {
        // If movie is already in watchlist, remove it
        if (!movie || !movie._id) {
          toast.error("Không thể xác định ID của phim");
          return;
        }

        const result = await watchlistService.removeFromWatchlist(movie._id);

        if (result.success) {
          setIsWatchLater(false);
          toast.success(result.message || "Đã xóa khỏi danh sách xem sau");
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi xóa khỏi danh sách xem sau");
        }
      } else {
        // If not in watchlist, add it
        // Prepare movie data for watchlist
        const movieData = {
          movieId: movie._id,
          movieSlug: slug,
          movieInfo: {
            name: movie.name,
            origin_name: movie.origin_name || '',
            thumb_url: movie.thumb_url || movie.poster_url || '',
            year: movie.year || '',
            category: movie.category || []
          }
        };

        const result = await watchlistService.addToWatchlist(movieData);

        if (result.success) {
          if (result.alreadyExists) {
            // Already exists in watchlist - not an error
            toast.info("Phim đã có trong danh sách xem sau");
          } else {
            setIsWatchLater(true);
            toast.success(result.message || "Đã thêm vào danh sách xem sau");
          }
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi thêm vào danh sách xem sau");
        }
      }
    } catch (error) {
      console.error("Error handling watchlist:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  // Add a new function to handle social media sharing
  const handleSocialShare = (platform) => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const movieTitle = movie ? `${movie.name} (${movie.origin_name || ''})` : 'Phim hay';
    const description = movie ? `Xem phim ${movie.name} chất lượng cao tại MovieStreaming` : 'Xem phim chất lượng cao tại MovieStreaming';

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(description)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(description)}`;
        break;
      case 'telegram':
        shareUrl = `https://telegram.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(description)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(description + ' ' + currentUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(movieTitle)}&summary=${encodeURIComponent(description)}`;
        break;
      case 'pinterest':
        const imageUrl = movie?.poster_url || movie?.thumb_url || '';
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(description)}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(movieTitle)}`;
        break;
      case 'viber':
        shareUrl = `viber://forward?text=${encodeURIComponent(description + ' ' + currentUrl)}`;
        break;
      case 'zalo':
        shareUrl = `https://zalo.me/share?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(description)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(movieTitle)}&body=${encodeURIComponent(description + '\n\n' + currentUrl)}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }

    // Track sharing analytics
    try {

      // Optional: You could also send this data to your analytics endpoint
      // if you wanted to track sharing metrics
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };

  // Add a function to copy link to clipboard with better user feedback
  const copyLinkToClipboard = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        toast.success('Đã sao chép link vào clipboard!');
      })
      .catch((error) => {
        console.error("Copy failed:", error);
        toast.error('Không thể sao chép link. Vui lòng thử lại.');
      });
  };

  const handleReport = () => {
if (!user) {
      router.push('/auth/login');
      return;
    }
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportType('');
    setReportMessage('');
    setReportSuccess(false);
  };

  const handleSubmitReport = async () => {
    if (!reportType) {
      toast.error('Vui lòng chọn loại lỗi');
      return;
    }

    try {
      setReportLoading(true);

      const reportData = {
        movieId: movie?._id,
        movieSlug: movie?.slug,
        type: reportType,
        message: reportMessage || reportType,
        episode: selectedEpisode + 1
      };

      const response = await axios.post(
        'http://localhost:5000/api/reports/movie',
        reportData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        setReportSuccess(true);
        toast.success('Báo cáo lỗi phim thành công!');
        setTimeout(() => {
          handleCloseReportModal();
        }, 2000);
      } else {
        throw new Error("Có lỗi khi gửi báo cáo");
      }
    } catch (error) {
      console.error('Lỗi khi gửi báo cáo:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setReportLoading(false);
    }
  };

  const handleRating = async (value) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setRatingLoading(true);

    try {

      // Use direct fetch with the full URL to avoid any path issues with axiosInstance
      const response = await fetch('http://localhost:5000/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          movieSlug: slug,
          rating: value,
          userId: user._id
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        // Update local state with response values
        setUserRating(value);

        // Update average rating and rating count from the API response
        const ratingData = result.data;
        setAverageRating(ratingData.averageRating || 0);
        setRatingCount(ratingData.ratingCount || 0);

        // Update the movie rating information in the movie object
        setMovie(prev => ({
          ...prev,
          rating: ratingData.averageRating || prev.rating || 0,
          rating_count: ratingData.ratingCount || prev.rating_count || 0
        }));

        toast.success('Đánh giá của bạn đã được lưu!');

        // Also immediately fetch the user's current ratings to ensure UI stays in sync
        fetchUserRating();
      } else {
        toast.error('Có lỗi xảy ra khi lưu đánh giá');
      }
    } catch (error) {
      console.error("Error saving rating to API:", error);
      toast.error('Có lỗi xảy ra khi lưu đánh giá: ' + error.message);
    } finally {
      setRatingLoading(false);
      setShowRatingModal(false);
    }
  };

  const fetchRatingsStats = async () => {
    if (!slug) return;

    try {
      // Use fetch to avoid any issues with axiosInstance
      const response = await fetch(`http://localhost:5000/api/ratings/stats/${slug}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch rating stats: ${response.status}`);
      }

      const data = await response.json();

      if (data.data) {
        const ratingData = data.data;

        // Update the rating states with fetched data
        setAverageRating(ratingData.averageRating || 0);
        setRatingCount(ratingData.ratingCount || 0);

        // Store detailed rating statistics if available - backend returns userRatingsStats, not ratingDistribution
        if (ratingData.userRatingsStats) {
          setUserRatingsStats(ratingData.userRatingsStats);
        } else {
          // If the API doesn't return rating distribution, create a placeholder
          const distribution = {};
          for (let i = 1; i <= 10; i++) {
            distribution[i] = 0;
          }
          setUserRatingsStats(distribution);
        }

        // Also update the movie object for consistency
        setMovie(prev => ({
          ...prev,
          rating: ratingData && ratingData.averageRating ? ratingData.averageRating : ((prev && prev.rating) || 0),
          rating_count: ratingData && ratingData.ratingCount ? ratingData.ratingCount : ((prev && prev.rating_count) || 0)
        }));
      } else {
        console.error("Rating stats data not found in response:", data);
      }
    } catch (error) {
      console.error("Error fetching ratings stats:", error);
    }
  };

  // Fix fetchUserRating function to better handle token and improve reliability
  const fetchUserRating = async () => {
    if (!slug) return;

    try {

      // Get the user either from state or localStorage to ensure we have the latest
      const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
      if (!currentUser || !currentUser._id) {
        return;
      }

      // Get token from localStorage directly to ensure it's the latest
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const response = await fetch(`http://localhost:5000/api/ratings/user/${currentUser._id}/movie/${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        if (result.data && typeof result.data.rating === 'number') {
          setUserRating(result.data.rating);
          setTempRating(result.data.rating);
        } else if (result.rating && typeof result.rating === 'number') {
          setUserRating(result.rating);
          setTempRating(result.rating);
        } else {
          setUserRating(0);
          setTempRating(0);
        }
      } else {
        console.error("Error fetching user rating:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    }
  };

  const handleShowRating = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setTempRating(userRating);
    setShowRatingModal(true);
  };

  const handleFullscreen = () => {
    const player = document.getElementById("video-player");
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (player.msRequestFullscreen) {
      player.msRequestFullscreen();
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return "N/A";

    if (!isNaN(duration)) {
      const minutes = parseInt(duration);
      if (minutes < 60) return `${minutes} phút`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    }

    if (typeof duration === 'string') {
      if (duration.includes('phút') || duration.includes('h') || duration.includes('m')) {
        return duration;
      }

      if (duration.includes(':')) {
        const parts = duration.split(':');
        if (parts.length === 3) {
          const hours = parseInt(parts[0]);
          const minutes = parseInt(parts[1]);
          return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
        } else if (parts.length === 2) {
          return `${parseInt(parts[0])}h${parseInt(parts[1]) > 0 ? ` ${parseInt(parts[1])}m` : ''}`;
        }
      }

      const numericDuration = parseInt(duration);
      if (!isNaN(numericDuration)) {
        if (numericDuration < 60) return `${numericDuration} phút`;
        const hours = Math.floor(numericDuration / 60);
        const remainingMinutes = numericDuration % 60;
        return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
      }

      return duration;
    }

    return "N/A";
  };

  const handlePlayTrailer = () => {
    try {
      setShowTrailerModal(true);
      setTrailerUrl('');

      const searchQuery = encodeURIComponent(`${movie.name} ${movie.origin_name || ''} ${movie.year || ''} official trailer`);

      fetch(`https://api.dailymotion.com/videos?fields=id,title,thumbnail_url&search=${searchQuery}&limit=1`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.list && data.list.length > 0) {
            const videoId = data.list[0].id;
            const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
            setTimeout(() => {
              setTrailerUrl(embedUrl);
            }, 500);
          } else {
            throw new Error('Không tìm thấy video trên Dailymotion');
          }
        })
        .catch(error => {
          console.error('Lỗi khi tìm kiếm trên Dailymotion:', error);

          const fallbackQuery = encodeURIComponent(`${movie.name} trailer`);

          fetch(`https://api.dailymotion.com/videos?fields=id,title&search=${fallbackQuery}&limit=1`)
            .then(response => response.json())
            .then(data => {
              if (data.list && data.list.length > 0) {
                const videoId = data.list[0].id;
                const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;

                setTimeout(() => {
                  setTrailerUrl(embedUrl);
                }, 500);
              } else {
                throw new Error('Không tìm thấy video với tìm kiếm đơn giản hơn');
              }
            })
            .catch(innerError => {
              console.error('Lỗi với tìm kiếm đơn giản hơn:', innerError);
              window.open(`https://www.dailymotion.com/search/${searchQuery}`, '_blank');
              setShowTrailerModal(false);
            });
        });

    } catch (error) {
      console.error('Lỗi khi tải trailer:', error);
      const fallbackQuery = encodeURIComponent(`${movie.name} trailer`);
      window.open(`https://www.dailymotion.com/search/${fallbackQuery}`, '_blank');
      setShowTrailerModal(false);
    }
  };

  const startWatchSession = async (position = 0) => {
    if (!user || !movie || !movie._id) return;

    try {
      const sessionData = {
        movieId: movie._id,
        movieSlug: slug,
        currentTime: position || 0,
        episode: selectedEpisode + 1
      };

      const response = await historyService.startWatchSession(sessionData);

      watchSessionRef.current = {
        started: true,
        startTime: new Date(),
        lastPosition: position || 0
      };

      startPositionUpdateTimer();
    } catch (error) {
      console.error("Failed to start watch session:", error);
    }
  };

  const endWatchSession = async (position = 0, completed = false) => {
    if (!user || !movie || !movie._id || !watchSessionRef.current?.started) return;

    try {
      const videoDuration =
        typeof movie.time === 'number' ? movie.time * 60 :
        typeof movie.duration === 'number' ? movie.duration :
        0;

      const isCompleted = completed || (videoDuration > 0 && position >= videoDuration * 0.8);

      const sessionData = {
        movieId: movie._id,
        currentTime: position,
        duration: videoDuration,
        completed: isCompleted,
        episode: selectedEpisode + 1
      };

      const response = await historyService.endWatchSession(sessionData);

      watchSessionRef.current = null;

      stopPositionUpdateTimer();
    } catch (error) {
      console.error("Failed to end watch session:", error);
    }
  };

  const updateWatchPosition = async (position) => {
    if (!user || !movie || !movie._id || !watchSessionRef.current?.started) return;

    try {
      const lastPosition = lastPositionUpdateRef.current || 0;
      if (Math.abs(position - lastPosition) < 5) return;

      lastPositionUpdateRef.current = position;

      const updateData = {
        movieId: movie._id,
        currentTime: position,
        episode: selectedEpisode + 1
      };

      await historyService.updateWatchPosition(updateData);
    } catch (error) {
      console.error("Failed to update watch position:", error);
    }
  };

  const startPositionUpdateTimer = () => {
    stopPositionUpdateTimer();

    positionUpdateTimerRef.current = setInterval(() => {
      if (videoRef && watchSessionRef.current?.started) {
        const currentPosition = currentTime || 0;
        updateWatchPosition(currentPosition);
      }
    }, 30000);
  };

  const stopPositionUpdateTimer = () => {
    if (positionUpdateTimerRef.current) {
      clearInterval(positionUpdateTimerRef.current);
      positionUpdateTimerRef.current = null;
    }
  };  const selectEpisode = async (index) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser && currentUser.isActive === false) {
      router.push('/BlockedAccountAlert');
      return;
    }

    if (watchSessionRef.current?.started) {
      await endWatchSession(currentTime);
    }

    setSelectedEpisode(index);
    setVideoLoading(true);

    try {
      // Show advertisement before the main content
      const adData = await adService.getRandomVideoAd();
      if (adData) {
        setCurrentAd(adData);
        setShowAd(true);
        setShowPlayer(false);
      } else {
        // If no ad is available, show the player directly
        setShowPlayer(true);
      }
    } catch (error) {
      console.error("Error loading advertisement:", error);
      // If there's an error loading the ad, just show the player directly
      setShowPlayer(true);
    }
      if (movie && movie._id && !viewRecordedRef.current) {
      try {
        await movieViewService.recordMovieView(movie._id);
        viewRecordedRef.current = true;
      } catch (viewError) {
        console.error("Error recording movie view from episode selection:", viewError);
      }
    }
    if (user && movie) {
      setTimeout(() => {
        startWatchSession(0);
      }, 1000);
    }

    if (user && movie) {
      try {
        const processCategory = (category) => {
          if (!category) return [];
          if (typeof category === 'string') return [category];
          if (Array.isArray(category)) {
            return category.map(cat => typeof cat === 'object' ? cat.name : cat);
          }
          return [];
        };

        let movieType;
        if (movie.type === 'tv' || (!movie.type && (!movie.episodes || movie.episodes.length <= 1))) {
          movieType = 'movie';
        } else {
          movieType = 'series';
        }

        const historyData = {
          movieId: movie._id || null,
          movieSlug: slug,
          movieData: {
            name: movie.name || 'Không có tiêu đề',
            origin_name: movie.origin_name || '',
            thumb_url: movie.thumb_url || movie.poster_url || '',
            year: movie.year || new Date().getFullYear().toString(),
            category: processCategory(movie.category),
            episode: index + 1,
            duration: movie.time || movie.duration || '0',
            quality: movie.quality || 'HD',
            type: movieType
          }
        };

        await historyService.addToHistory(historyData);
      } catch (error) {
        console.error("Failed to add movie to history:", error);
      }    }
  };  const handlePlayMainButton = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser && currentUser.isActive === false) {
      router.push('/BlockedAccountAlert');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/subscription/ad-benefits', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.hideVideoAds === true) {

              if (movie && movie._id) {
                try {
                  await movieViewService.recordMovieView(movie._id);
                  viewRecordedRef.current = true;

                  if (user) {
                    startWatchSession(0);
                  }
                } catch (viewError) {
                  console.error("Error recording movie view for premium user:", viewError);
                }
              }
              setShowPlayer(true);
              return;
            }

            // Ghi log package ID cho debug
            if (data.data && data.data.packageType) {

              if (data.data.packageType === '682f7d849c310399aa715c9d') {

                if (movie && movie._id) {
                  try {
                    await movieViewService.recordMovieView(movie._id);
                    viewRecordedRef.current = true;

                    if (user) {
                      startWatchSession(0);
                    }
                  } catch (viewError) {
                    console.error("Error recording movie view for premium 15K user:", viewError);
                  }
                }
                setShowPlayer(true);
                return;
              }
            }
          }
        } catch (benefitsError) {
          console.error("Error checking ad benefits:", benefitsError);
        }
      }

      const adData = await adService.getRandomVideoAd();
      if (adData) {
        setCurrentAd(adData);
        setShowAd(true);
        setShowPlayer(false);
      } else {
        // If no ad is available, show the player directly
        setShowPlayer(true);
      }
    } catch (error) {
      console.error("Error fetching advertisement:", error);
      // If there's an error, just show the player directly
      setShowPlayer(true);
    }
  };// New function to handle ad completion
  const handleAdComplete = () => {
    // Hide ad and show actual player
    setShowAd(false);
    setCurrentAd(null);
    setShowPlayer(true);

    if (movie && movie._id && !viewRecordedRef.current && !fromMostViewedRef.current) {
      try {
        movieViewService.recordMovieView(movie._id)
          .then(() => {
            viewRecordedRef.current = true;
          })
          .catch((viewError) => {
            console.error("Error recording movie view from main play button:", viewError);
          });
      } catch (viewError) {
        console.error("Error recording movie view from main play button:", viewError);
      }
    }

    if (user && movie) {
      startWatchSession(0);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (watchSessionRef.current?.started) {
        const position = currentTime || 0;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/history/watch-session/end', false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`);
        xhr.send(JSON.stringify({
          movieId: movie._id,
          currentTime: position,
          episode: selectedEpisode + 1
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (watchSessionRef.current?.started) {
        endWatchSession(currentTime);
      }

      stopPositionUpdateTimer();

      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [movie, currentTime, selectedEpisode]);

  const preventClickDuringDrag = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleLike = async (index) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để thích bình luận");
      router.push('/auth/login');
      return;
    }

    try {
      const commentId = comments[index].id;
      if (!commentId) {
        toast.error("Không thể xác định ID bình luận");
        return;
      }

      const response = await fetch('http://localhost:5000/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          commentId,
          type: 'like'
        })
      });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success && responseData.data) {
          const { likeCount, dislikeCount, action } = responseData.data;

          const updatedComments = [...comments];
          updatedComments[index].likes = likeCount;
          updatedComments[index].dislikes = dislikeCount;

          updatedComments[index].liked = action !== 'removed';
          updatedComments[index].disliked = false;

          setComments(updatedComments);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi thích bình luận");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error(error.message || "Có lỗi xảy ra khi thích bình luận");
    }
  };

  const handleDislike = async (index) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để không thích bình luận");
      router.push('/auth/login');
      return;
    }

    try {
      const commentId = comments[index].id;
      if (!commentId) {
        toast.error("Không thể xác định ID bình luận");
        return;
      }

      const response = await fetch('http://localhost:5000/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          commentId,
          type: 'dislike'
        })
      });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success && responseData.data) {
          const { likeCount, dislikeCount, action } = responseData.data;

          const updatedComments = [...comments];
          updatedComments[index].likes = likeCount;
          updatedComments[index].dislikes = dislikeCount;

          updatedComments[index].disliked = action !== 'removed';
          updatedComments[index].liked = false;

          setComments(updatedComments);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi không thích bình luận");
      }
    } catch (error) {
      console.error("Error toggling dislike:", error);
      toast.error(error.message || "Có lỗi xảy ra khi không thích bình luận");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (containsRestrictedWords(newComment)) {
      toast.error("Bình luận của bạn chứa từ ngữ không phù hợp. Vui lòng chỉnh sửa lại.");
      return;
    }

    if (!user && !isAnonymous) {
      toast.error("Bạn cần đăng nhập để bình luận hoặc sử dụng chế độ ẩn danh.");
      router.push('/auth/login');
      return;
    }

    const username = isAnonymous ? "Người ẩn danh" : user ? user.username || user.fullname : "Khách";

    const commentLimit = checkCommentLimit(username);
    if (commentLimit.hasReachedLimit) {
      toast.error(`Bạn đã đạt giới hạn ${MAX_COMMENTS_PER_DAY} bình luận trong ngày hôm nay. Vui lòng thử lại vào ngày mai.`);
      return;
    }

    const commentObj = {
      content: newComment.trim(),
      rating: userRating || 5,
      isAnonymous: isAnonymous
    };

    try {
      // Get token from multiple possible sources to support both regular and Google logins
      const token = localStorage.getItem('auth_token') ||
                   (typeof window !== 'undefined' && window.sessionStorage && window.sessionStorage.getItem('backendToken')) ||
                   (user && user.backendToken);

      // Only require token for non-anonymous comments
      if (!token && !isAnonymous) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        router.push('/auth/login');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const endpoint = isAnonymous ? '/api/comments/anonymous' : '/api/comments';
      const url = baseUrl.endsWith('/api')
        ? `${baseUrl.substring(0, baseUrl.length - 4)}${endpoint}`
        : `${baseUrl}${endpoint}`;

      const commentData = {
        movieSlug: slug,
        comment: commentObj,
      };

      if (user && user._id) {
        commentData.userId = user._id;
      }

      const headers = isAnonymous ? {} : { 'Authorization': `Bearer ${token}` };

      const response = await axios.post(url, commentData, {
        headers: headers
      });

      if (response.status === 200) {
        commentLimit.updateCount();

        const currentAvatar = isAnonymous ? "/img/user-avatar.png" : getAvatarUrl(user?.avatar || response.data.comment.avatar);

        // Format the date in the same format as returned by the backend for consistency
        const now = new Date();
        const formattedDate = now.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const newCommentData = {
          ...response.data.comment,
          avatar: currentAvatar,
          date: formattedDate,
          createdAt: now.toISOString() // Store ISO date for time difference calculations
        };

        if (isAnonymous && response.data.comment.id && user && user._id) {
          const userComments = JSON.parse(localStorage.getItem('userComments') || '{}');
          userComments[response.data.comment.id] = user._id;
          localStorage.setItem('userComments', JSON.stringify(userComments));
        }

        // Add new comment to the beginning of the comments array (top of the list)
        setComments([newCommentData, ...comments]);
        setNewComment("");
        toast.success("Bình luận đã được đăng thành công!");
      } else {
        toast.error("Có lỗi xảy ra khi lưu bình luận. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error saving comment:", error);
      console.error("Response data:", error.response?.data);
      toast.error(error.response?.data?.error || "Có lỗi xảy ra khi lưu bình luận.");
    }
  };
  // Function to get properly formatted avatar URL (same as in Navbar)
  const getAvatarUrl = (avatar) => {
    if (!avatar) return "/img/avatar.png";

    let avatarUrl = avatar;

    // Handle relative paths for local avatars
    if (avatarUrl && avatarUrl.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const baseWithoutApi = baseUrl.endsWith('/api')
        ? baseUrl.substring(0, baseUrl.length - 4)
        : baseUrl;

      avatarUrl = `${baseWithoutApi}${avatarUrl}`;
    }

    // Only add cache-busting for non-external URLs (exclude Google, Cloudinary, etc.)
    if (!avatarUrl.includes('?') &&
        !avatarUrl.includes('googleusercontent.com') &&
        !avatarUrl.includes('cloudinary.com')) {
      avatarUrl = `${avatarUrl}?t=${Date.now()}`;
    }

    return avatarUrl;
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        // Clear any previous comments first
        setComments([]);

        // Fetch the latest comments data
        const response = await axios.get(`${API_URL}/comments?movieSlug=${slug}`);
        if (response.status === 200) {
          // Process comments to apply consistent avatar handling
          const processedComments = response.data.comments.map(comment => {
            return {
              ...comment,
              avatar: getAvatarUrl(comment.avatar)
            };
          });

          setComments(processedComments || []);
        } else {
          console.error("Error fetching comments:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    if (slug) {
      fetchComments();
    }
  }, [slug]);

  // Add a function to fetch movie recommendations based on viewing history
  const fetchHistoryRecommendations = async () => {
    if (!user) return;

    try {
      setLoadingRecommendations(true);

      // Get the user's history data
      const historyData = await historyService.getUserHistory(10, 1);

      if (!historyData || !historyData.histories || historyData.histories.length === 0) {
        setLoadingRecommendations(false);
        return;
      }

      // Extract categories from watch history
      const categories = [];
      historyData.histories.forEach(item => {
        if (item.movieData && item.movieData.category) {
          // Handle both string and array categories
          if (Array.isArray(item.movieData.category)) {
            categories.push(...item.movieData.category);
          } else if (typeof item.movieData.category === 'string') {
            categories.push(item.movieData.category);
          }
        }
      });

      // Count categories to find most watched
      const categoryCounts = {};
      categories.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
        // Sort categories by frequency
      const sortedCategories = Object.keys(categoryCounts).sort(
        (a, b) => categoryCounts[b] - categoryCounts[a]
      );

      if (sortedCategories.length === 0) {
        setLoadingRecommendations(false);
        return;
      }

      // Get watched movie slugs to filter out
      const watchedMovieSlugs = new Set();
      historyData.histories.forEach(item => {
        if (item.movieData && item.movieData.slug) {
          watchedMovieSlugs.add(item.movieData.slug);
        }
      });

      // Use top 2 most watched categories to fetch recommendations
      const topCategories = sortedCategories.slice(0, 2);

      const allRecommendations = [];

      // Fetch movies from each top category
      for (const category of topCategories) {
        try {
          const response = await fetch(`http://localhost:5000/api/movies?category=${encodeURIComponent(category)}&limit=15`);

          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.movies) {
              allRecommendations.push(...result.data.movies);
            }
          }
        } catch (error) {
          console.error(`Error fetching movies for category ${category}:`, error);
        }
      }

      if (allRecommendations.length > 0) {
        // Remove duplicates based on slug
        const uniqueMovies = allRecommendations.filter((movie, index, self) =>
          index === self.findIndex(m => m.slug === movie.slug)
        );

        // Filter out current movie, related movies, and watched movies
        const relatedSlugs = new Set(relatedMovies.map(movie => movie.slug));
        const filteredRecommendations = uniqueMovies.filter(movie =>
          movie.slug !== slug &&
          !relatedSlugs.has(movie.slug) &&
          !watchedMovieSlugs.has(movie.slug)
        );

        // Limit to 20 recommendations and shuffle for variety
        const shuffledRecommendations = filteredRecommendations
          .sort(() => Math.random() - 0.5)
          .slice(0, 20);

        setHistoryRecommendations(shuffledRecommendations);
      } else {
        setHistoryRecommendations([]);
      }
    } catch (error) {
      console.error("Error fetching history-based recommendations:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  if (error || !movie) {
    return (
      <div className="bg-black min-vh-100">
        <Navbar />
        <div className={`container mt-5 text-white text-center ${styles.errorContainer}`}>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {previewMovie && previewMovie.episodes && previewMovie.episodes.length > 0 &&
       previewMovie.episodes[0] && previewMovie.episodes[0].server_data &&
       previewMovie.episodes[0].server_data.length > 0 && (
        <div
          className="video-preview-overlay position-fixed"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1050,
            width: '450px',
            maxWidth: '90vw',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '8px',
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onMouseLeave={closePreview}
        >
          <div className="d-flex justify-content-between align-items-center p-2">
            <h6 className="text-white m-0 text-truncate" style={{ width: '90%' }}>
              {previewMovie.name}
            </h6>
            <button
              className="btn-close btn-close-white p-0"
              style={{ fontSize: '0.8rem' }}
              onClick={closePreview}
            ></button>
          </div>
          <div className="ratio ratio-16x9">
            <iframe
              src={previewMovie.episodes[0].server_data[0].link_embed}
              allowFullScreen
              className="rounded-bottom"
              style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
            ></iframe>
          </div>
        </div>
      )}

      {!contentLoaded && (
        <div className={styles.banner}>
          <div className={styles.bannerBackground}>
            <div className={`${styles.skeleton} ${styles.bannerSkeleton}`}></div>
            <div className={styles.bannerGradient}></div>

            <div className={styles.contentContainer}>
              <div className={styles.bannerContent}>
                <div className={styles.leftSection}>
                  <div className={`${styles.skeleton} ${styles.posterSkeleton}`}></div>
                </div>

                <div className={styles.rightSection}>
                  <div className={`${styles.skeleton} ${styles.titleSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.subtitleSkeleton}`}></div>

                  <div className={`${styles.skeleton} ${styles.ratingSkeleton}`}></div>

                  <div className={styles.metaSkeleton}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`${styles.skeleton} ${styles.metaItemSkeleton}`}></div>
                    ))}
                  </div>

                  <div className={styles.badgesSkeleton}>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`${styles.skeleton} ${styles.badgeSkeleton}`}></div>
                    ))}
                  </div>

                  <div className={styles.badgesSkeleton}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`${styles.skeleton} ${styles.badgeSkeleton}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={contentLoaded ? '' : styles.hiddenContent}>
        <div className={styles.banner}>
          <div className={styles.bannerBackground}>
            {!imageLoaded && (
              <div className={`${styles.skeleton} ${styles.bannerImageSkeleton}`}></div>
            )}

            <img
              src={movie.poster_url || movie.thumb_url}
              alt={movie.name || "Movie Background"}
              className={`${styles.bannerImage} ${contentLoaded ? styles.contentLoaded : styles.contentLoading} ${!imageLoaded ? styles.hidden : ''}`}
              onLoad={handleImageLoaded}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/img/default-banner.jpg";
                handleImageLoaded();
              }}
            />
            <div className={styles.bannerGradient}></div>

            <div className={`${styles.contentContainer} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
              <div className={`${styles.bannerContent} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                <div className={styles.leftSection}>
                  <div className={styles.moviePoster}>
                    <img
                      src={movie.thumb_url || movie.poster_url || "/img/default-poster.jpg"}
                      alt={movie.name}
                      className={`${styles.posterImage} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}
                      onLoad={handleImageLoaded}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/img/default-poster.jpg";
                        handleImageLoaded();
                      }}
                    />

                    <div className={styles.posterControls}>
                      <div
                        className={styles.saveButtonContainer}
                        onMouseEnter={() => setShowSaveOptions(true)}
                        onMouseLeave={() => setShowSaveOptions(false)}
                      >
                        {showSaveOptions && (
                          <div className={styles.saveOptionsDropup}>
                            <div className={styles.saveOptionsRow}>
                              <button
                                className={`${styles.saveOptionButton} ${
                                  isWatchLater ? styles.active : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWatchLater();
                                }}
                              >
                                <i className="bi bi-clock-history"></i>
                                <span>Xem sau</span>
                              </button>
                              <button
                                className={`${styles.saveOptionButton} ${
                                  isFavorite ? styles.active : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFavorite();
                                }}
                              >
                                <i className="bi bi-heart-fill"></i>
                                <span>Yêu thích</span>
                              </button>
                            </div>
                          </div>
                        )}
                        <button
                          className={`${styles.posterControlButton} ${styles.saveButton}`}
                          onClick={() => setShowSaveOptions(!showSaveOptions)}
                        >
                          <i className="bi bi-bookmark-fill"></i>
                          <span>Lưu</span>
                        </button>
                      </div>

                      <button
                        className={`${styles.posterControlButton} ${styles.shareButton}`}
                        onClick={handleShare}
                      >
                        <i className="bi bi-share-fill"></i>
                        <span>Chia sẻ</span>
                      </button>
                        <div className={styles.reportButtonContainer}>
                          <button
                            className={styles.reportButtonTop}
                            onClick={handleReport}
                            title="Báo lỗi phim"
                          >
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <span>Báo lỗi</span>
                          </button>
                        </div>
                    </div>

                    <div className={styles.posterOverlay}>
                      <button
                        className={styles.playButtonOverlay}
                        onClick={handlePlayMainButton}
                      >
                        <div className={styles.playButtonContent}>
                          <img
                            src="/img/play.png"
                            alt="play"
                            className={styles.playIcon}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/img/default-poster.jpg";
                            }}
                          />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className={styles.posterActionButtonsRow}>
                    <button
                      className={`${styles.posterActionButton} ${userRating > 0 ? styles.active : ''}`}
                      onClick={handleShowRating}
                    >
                      <div className={styles.buttonIcon}>
                        <i className="bi bi-star-fill"></i>
                      </div>
                      <div className={styles.buttonText}>
                        <span className={styles.buttonLabel}>
                          {userRating > 0 ? `${userRating}/10` : 'Đánh giá'}
                        </span>

                      </div>
                    </button>

                    <button
                      className={styles.posterActionButton}
                      onClick={handlePlayTrailer}
                    >
                      <div className={styles.buttonIcon}>
                        <i className="bi bi-youtube"></i>
                      </div>
                      <div className={styles.buttonText}>
                        <span className={styles.buttonLabel}>Trailer</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className={`${styles.rightSection} ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                  <h1 className={styles.movieTitle}>{movie.name}</h1>
                  {movie.origin_name && (
                    <h4 className={styles.originalTitle}>{movie.origin_name}</h4>
                  )}

                  <div className={styles.ratingContainer}>
                    <div className={styles.ratingStars}>
                      {[...Array(10)].map((_, i) => {
                        // Only show stars if there are actual ratings
                        const hasRatings = ratingCount > 0;

                        // Calculate star value based on the 10-star scale, but only if there are ratings
                        const starValue = i + 1;
                        const filled = hasRatings && averageRating >= starValue;
                        const halfFilled = hasRatings && !filled && averageRating > starValue - 0.5;

                        let starType = '';
                        if (filled) {
                          starType = 'bi-star-fill';
                        } else if (halfFilled) {
                          starType = 'bi-star-half';
                        } else {
                          starType = 'bi-star';
                        }

                        return (
                          <i
                            key={i}
                            className={`bi ${starType} ${styles.starIcon} ${filled || halfFilled ? styles.starActive : styles.starInactive}`}
                          ></i>
                        );
                      })}
                    </div>
                    <div className={styles.ratingInfo}>
                      <span className={styles.ratingValue}>
                        <strong>{ratingCount > 0 ? averageRating.toFixed(1) : '0.0'}</strong>
                        <span className={styles.ratingMax}>/10</span>
                      </span>
                      <div className={styles.ratingDetails}>
                      </div>
                    </div>
                  </div>

                  <div className={styles.movieMeta}>
                    <span className={styles.metaItem}>
                      <i className="bi bi-calendar-event"></i>
                      {movie.year}
                    </span>
                    <span className={styles.metaItem}>
                      <i className="bi bi-clock"></i>
                      {formatDuration(movie.time || movie.episode_current || movie.duration)}
                    </span>
                    {movie.episode_total && (
                      <span className={styles.metaItem}>
                        <i className="bi bi-collection-play"></i>
                        {movie.episode_current || "1"}/{movie.episode_total} tập
                      </span>
                    )}
                    {movie.lang && (
                      <span className={styles.metaItem}>
                        <i className="bi bi-translate"></i>
                        {movie.lang === 'VietSub' ? 'Vietsub' : movie.lang}
                      </span>
                    )}
                    {movie.quality && (
                      <span className={`${styles.metaItem} ${styles.qualityBadge}`}>
                        <i className="bi bi-badge-hd"></i>
                        {movie.quality}
                      </span>
                    )}

                    {movie.country && Array.isArray(movie.country) ? (
                      movie.country.map((country, index) => (
                        <span key={index} className={styles.genreBadge}>
                          {typeof country === 'object' ? country.name : country}
                        </span>
                      ))
                    ) : movie.country ? (
                      <span className={styles.genreBadge}>
                        {movie.country}
                      </span>
                    ) : (
                      <span className="text-muted">Chưa có thông tin</span>
                    )}

                  </div>                  {movie.actor && Array.isArray(movie.actor) && movie.actor.length > 0 && movie.actor.some(actor => {
                    const name = typeof actor === 'object' ? actor.name : actor;
                    return name && name.trim() !== '';
                  }) && (
                    <>
                      <h3 className={styles.sectionTitle}>Diễn Viên</h3>
                      <div className={styles.actorsContainer}>
                        {movie.actor.map((actor, index) => {
                          const actorName = typeof actor === 'object' ? actor.name : actor;
                          return actorName && actorName.trim() !== '' ? (
                            <ActorCard key={index} actorName={actorName} />
                          ) : null;
                        })}
                      </div>
                    </>
                  )}

                  <h3 className={styles.sectionTitle}>Thể Loại</h3>
                  <div className={styles.genresContainer}>
                    {movie.category?.map((cat, index) => (
                      <span key={index} className={styles.genreBadge}>
                        {typeof cat === 'object' ? cat.name : cat}
                      </span>
                    ))}
                  </div>

                </div>
              </div>

              <div className={styles.headerButtons}>
                <button
                  className={`${styles.actionButton} ${styles.shareButton}`}
                  onClick={handleShare}
                >
                  <i className="fas fa-share-alt"></i>
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {!contentLoaded && (
          <>
            <div className={`${styles.skeleton} ${styles.descriptionSkeleton}`}></div>

            <div className={styles.relatedMoviesSkeleton}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.relatedMovieCardSkeleton}>
                  <div className={`${styles.skeleton} ${styles.relatedMoviePosterSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.relatedMovieTitleSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.relatedMovieSubtitleSkeleton}`}></div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={contentLoaded ? '' : styles.hiddenContent}>
          <div className={`container text-white mt-5 ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
            {showPlayer && (
              <div
                className={styles.videoPlayerOverlay}
                onClick={(e) => {
                  if (e.target.classList.contains(styles.videoPlayerOverlay)) {
                    setShowPlayer(false);
                    setVideoLoading(true);
                  }
                }}
              >
                <div id="video-player" className={styles.videoPlayerContainer}>
                  {videoLoading && (
                    <div className={styles.videoLoading}>
                      <div className={styles.videoLoadingSpinner}></div>
                      <div className={styles.videoLoadingText}>Đang tải phim...</div>
                    </div>
                  )}
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={`${movie.episodes[selectedServer]?.server_data[selectedEpisode]?.link_embed}`}
                      allowFullScreen
                      className="rounded"
                      onLoad={() => setVideoLoading(false)}
                    ></iframe>
                  </div>
                </div>
              </div>            )}            {showAd && currentAd && (
              <div className={styles.videoPlayerOverlay}>
                <div className={styles.videoPlayerContainer}>
                  <AdPlayer
                    onAdComplete={handleAdComplete}
                    allowSkip={true}
                    skipDelay={5}
                  />
                </div>
              </div>
            )}

            {movie.episodes && movie.episodes.length > 0 && (
              <div className={styles.episodeList}>
                <h3 className={styles.episodeTitle}>Danh Sách Tập Phim</h3>
                <div className="d-flex flex-wrap gap-2">
                  {movie.episodes[selectedServer]?.server_data.map((episode, index) => (
                    <button
                      key={index}
                      className={`btn btn-outline-light ${styles.episodeBtn} ${selectedEpisode === index ? styles.episodeBtnActive : ''}`}
                      onClick={() => selectEpisode(index)}
                    >
                      Tập {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}            <div className={styles.describe}>
              <h5>Nội Dung Phim</h5>              <div style={{ position: 'relative' }}>
                <p className={!showFullDescription ? styles.descriptionCollapsed : undefined}>
                  {movie.content || movie.description}
                </p>                {(movie.content || movie.description) &&
                 (movie.content || movie.description).length > 200 &&
                 !showFullDescription && (                  <button
                    className={styles.showMoreBtn}
                    onClick={() => setShowFullDescription(true)}
                  >
                    Xem thêm <i className="bi bi-arrow-down-circle-fill" style={{ color: '#dc3545', marginLeft: '5px' }}></i>
                  </button>
                )}
                {showFullDescription && (                  <button
                    className={styles.showMoreBtn}
                    onClick={() => setShowFullDescription(false)}
                  >
                    Thu gọn <i className="bi bi-arrow-up-circle-fill" style={{ color: '#dc3545', marginLeft: '5px' }}></i>
                  </button>
                )}
              </div>            </div>             {/* Movies of Same Genre Section (includes similar name movies) */}
             {Array.isArray(relatedMovies) && relatedMovies.length > 0 ? (
              <div className={`mt-5 mb-5 ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                <h3 className={styles.relatedMoviesTitle}>
                  Phim Cùng Thể Loại

                </h3>
                  <div className={styles.relatedMoviesContainer} ref={scrollContainerRef}>
                  <Slider {...sliderSettings} className={styles.slickSlider}>
                    {relatedMovies.map((movie) => (
                      <div
                        key={movie.slug}
                        className={styles.slickSlide}
                        onMouseEnter={() => handleMouseEnter(movie)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className={styles.relatedMovieCard}>
                          <Link
                            href={`/movie/${movie.slug}`}
                            className={styles.movieLink}
                            onClick={preventClickDuringDrag}
                            draggable={false}

                          >
                            <div className={styles.relatedMoviePoster} draggable={false}>
                              <img
                                src={movie.thumb_url || movie.poster_url || "/placeholder.jpg"}
                                alt={movie.name}
                                className={styles.relatedMovieImage}
                                draggable={false}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.jpg";
                                }}
                              />
                              <div className={styles.relatedMovieBadges}>
                                <span className={styles.relatedMovieBadge}>
                                  {movie.year || "2023"}
                                </span>

                              </div>
                              <div className={styles.relatedMovieOverlay}>
                                <button className={styles.watchButton}>
                                  <i className="bi bi-play-circle"></i>
                                </button>
                              </div>
                            </div>
                            <div className={styles.relatedMovieInfo}>
                              <h5 className={styles.relatedMovieTitle}>{movie.name}</h5>
                              {movie.origin_name && (
                                <div className={styles.relatedMovieSubtitle}>
                                  {movie.origin_name}
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
            ) : (
              <div className="mt-5 mb-5">
                <h3 className={styles.relatedMoviesTitle}>Phim Cùng Thể Loại</h3>
                <p className="text-muted">Không tìm thấy phim cùng thể loại</p>
              </div>
            )}

            {Array.isArray(historyRecommendations) && historyRecommendations.length > 0 ? (
              <div className={`mt-5 mb-5 ${contentLoaded ? styles.contentLoaded : styles.contentLoading}`}>
                <h3 className={styles.relatedMoviesTitle}>Gợi Ý Dựa Trên Lịch Sử Xem</h3>
                <div className={styles.relatedMoviesContainer} ref={scrollContainerRef}>
                  <Slider {...sliderSettings} className={styles.slickSlider}>
                    {historyRecommendations.map((movie) => (
                      <div
                        key={movie.slug}
                        className={styles.slickSlide}
                        onMouseEnter={() => handleMouseEnter(movie)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className={styles.relatedMovieCard}>
                          <Link
                            href={`/movie/${movie.slug}`}
                            className={styles.movieLink}
                            onClick={preventClickDuringDrag}
                            draggable={false}
                          >
                            <div className={styles.relatedMoviePoster} draggable={false}>
                              <img
                                src={movie.thumb_url || movie.poster_url || "/placeholder.jpg"}
                                alt={movie.name}
                                className={styles.relatedMovieImage}
                                draggable={false}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/placeholder.jpg";
                                }}
                              />
                              <div className={styles.relatedMovieBadges}>
                                <span className={styles.relatedMovieBadge}>
                                  {movie.year || "2023"}
                                </span>
                              </div>
                              <div className={styles.relatedMovieOverlay}>
                                <button className={styles.watchButton}>
                                  <i className="bi bi-play-circle"></i>
                                </button>
                              </div>
                            </div>
                            <div className={styles.relatedMovieInfo}>
                              <h5 className={styles.relatedMovieTitle}>{movie.name}</h5>
                              {movie.origin_name && (
                                <div className={styles.relatedMovieSubtitle}>
                                  {movie.origin_name}
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
              </div>
            ) : (
              <div className="mt-5 mb-5">
                <h3 className={styles.relatedMoviesTitle}>Gợi Ý Dựa Trên Lịch Sử Xem</h3>
                <p className="text-muted">Không tìm thấy gợi ý dựa trên lịch sử xem</p>
              </div>
            )}            <div className={styles.commentsSection}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className={styles.sectionTitle}>
                  Bình luận {comments.length > 0 && <span className={styles.commentCount}>({comments.length})</span>}
                </h5>
                <RatingStats
                  userRatingsStats={userRatingsStats}
                  averageRating={averageRating}
                  ratingCount={ratingCount}
                  movieSlug={slug}
                />
              </div>

              <div className={styles.addCommentForm}>
                <form onSubmit={handleCommentSubmit}>
                  <div className="form-group mb-3 d-flex align-items-center">
                    <textarea
                      className="form-control bg-dark text-white me-2"
                      rows="1"
                      placeholder="Viết bình luận của bạn..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(e);
                        }
                      }}
                      required
                    ></textarea>
                    <button type="submit" className="btn btn-danger">
                      <i className="bi bi-send"></i>
                    </button>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="anonymousToggle"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <label className="form-check-label text-white" htmlFor="anonymousToggle">
                      Bình luận ẩn danh
                    </label>
                  </div>
                </form>
              </div>

              <div className={styles.commentsList}>
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index} className={styles.commentItem}>
                      <div className={styles.commentHeader}>                        <img
                          src={comment.avatar || "/img/avatar.png"}
                          alt={comment.username}
                          className={styles.commentAvatar}
                          onError={(e) => {
                            e.target.src = "/img/avatar.png";
                          }}
                        />
                        <div className={styles.commentDetails}>
                          <span className={styles.commentUsername}>
                            @{comment.isAnonymous ? "Người ẩn danh" : comment.username}
                          </span>
                          <span className={styles.commentDate}>{comment.date}</span>
                        </div>
                        <div className={styles.commentMenu}>
                          <button
                            className={styles.commentMenuButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCommentMenu(comment.id);
                            }}
                          >
                            <i className="bi bi-three-dots"></i>
                          </button>
                          {openMenuId === comment.id && (
                            <div className={styles.commentMenuDropdown}>
                              <button
                                className={styles.commentMenuItem}
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className={styles.commentContent}>{comment.content}</p>
                      <div className={styles.commentActions}>
                        <button
                          className={`${styles.actionButton} ${comment.liked ? styles.liked : ''}`}
                          onClick={() => handleLike(index)}
                        >
                          <i className="bi bi-hand-thumbs-up"></i> {comment.likes || 0}
                        </button>
                        <button
                          className={`${styles.actionButton} ${comment.disliked ? styles.disliked : ''}`}
                          onClick={() => handleDislike(index)}
                        >
                          <i className="bi bi-hand-thumbs-down"></i> {comment.dislikes || 0}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.shareModalContent}`}>
            <div className={styles.modalHeader}>
              <h5>Chia sẻ phim</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowShareModal(false)}
              ></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.movieSharePreview}>
                <div className={styles.sharePreviewImage}>
                  <img
                    src={movie.thumb_url || movie.poster_url || "/img/default-poster.jpg"}
                    alt={movie.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/img/default-poster.jpg";
                    }}
                  />
                </div>
                <div className={styles.sharePreviewInfo}>
                  <h6>{movie.name}</h6>
                  {movie.origin_name && <p className={styles.shareOriginName}>{movie.origin_name}</p>}
                  <p className={styles.shareMovieMeta}>
                    {movie.year} • {formatDuration(movie.time || movie.duration)} • {movie.quality || 'HD'}
                  </p>
                </div>
              </div>

              <div className={styles.shareDivider}><span>Chia sẻ qua mạng xã hội</span></div>

              <div className={styles.shareIconGrid}>
                <button className={styles.shareIconBtn} style={{backgroundColor: '#3b5998'}} onClick={() => handleSocialShare('facebook')} title="Facebook">
                  <img src="/img/social/facebook.png" alt="Facebook" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Facebook</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#1da1f2'}} onClick={() => handleSocialShare('twitter')} title="Twitter">
                  <img src="/img/social/twitter.png" alt="Twitter" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Twitter</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#0088cc'}} onClick={() => handleSocialShare('telegram')} title="Telegram">
                  <img src="/img/social/telegram.png" alt="Telegram" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Telegram</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#25d366'}} onClick={() => handleSocialShare('whatsapp')} title="WhatsApp">
                  <img src="/img/social/whatsapp.png" alt="WhatsApp" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>WhatsApp</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#0077b5'}} onClick={() => handleSocialShare('linkedin')} title="LinkedIn">
                  <img src="/img/social/linkedin.png" alt="LinkedIn" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>LinkedIn</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#bd081c'}} onClick={() => handleSocialShare('pinterest')} title="Pinterest">
                  <img src="/img/social/pinterest.png" alt="Pinterest" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Pinterest</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#ff4500'}} onClick={() => handleSocialShare('reddit')} title="Reddit">
                  <img src="/img/social/reddit.png" alt="Reddit" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Reddit</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#7360f2'}} onClick={() => handleSocialShare('viber')} title="Viber">
                  <img src="/img/social/viber.png" alt="Viber" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Viber</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#0068ff'}} onClick={() => handleSocialShare('zalo')} title="Zalo">
                  <img src="/img/social/zalo.png" alt="Zalo" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Zalo</span>
                </button>

                <button className={styles.shareIconBtn} style={{backgroundColor: '#333333'}} onClick={() => handleSocialShare('email')} title="Email">
                  <img src="/img/social/email.png" alt="Email" className={styles.socialLogo} />
                  <span className={styles.shareIconTooltip}>Email</span>
                </button>
              </div>

              <div className={styles.shareDivider}><span>Hoặc sao chép link</span></div>

              <div className={styles.shareLinkContainer}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    value={window.location.href}
                    readOnly
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    className={`btn btn-outline-light ${styles.copyLinkBtn}`}
                    onClick={copyLinkToClipboard}
                  >
                    <i className="fas fa-copy me-2"></i>
                    Sao chép
                  </button>
                </div>
                <div className={styles.shareQRCode}>
                  <div className={styles.qrCodeContainer}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                      alt="QR Code"
                    />
                  </div>
                  <span>Quét QR code</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Đánh giá</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowRatingModal(false)}
              ></button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn đánh giá phim này bao nhiêu điểm?</p>
              <div className={styles.ratingButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    className={`${styles.ratingButton} ${tempRating === score ? styles.ratingActive : ''}`}
                    onClick={() => setTempRating(score)}
                    disabled={ratingLoading}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className={styles.ratingLabel}>
                {tempRating === 0 && "Chọn điểm"}
                {tempRating === 1 && "Quá tệ"}
                {tempRating === 2 && "Tệ"}
                {tempRating === 3 && "Không hay"}
                {tempRating === 4 && "Không tốt lắm"}
                {tempRating === 5 && "Bình thường"}
                {tempRating === 6 && "Xem được"}
                {tempRating === 7 && "Khá hay"}
                {tempRating === 8 && "Hay"}
                {tempRating === 9 && "Rất hay"}
                {tempRating === 10 && "Tuyệt vời"}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRatingModal(false)}
                disabled={ratingLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleRating(tempRating)}
                disabled={tempRating === 0 || ratingLoading}
              >
                {ratingLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang lưu...
                  </>
                ) : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrailerModal && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target.classList.contains(styles.modalOverlay)) {
            setShowTrailerModal(false);
            setTimeout(() => setTrailerUrl(''), 100);
          }
        }}>
          <div className={styles.trailerModalContent}>
            <div className={styles.modalHeader}>
              <h5>Trailer: {movie.name}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowTrailerModal(false);
                  setTimeout(() => setTrailerUrl(''), 100);
                }}
              ></button>
            </div>
            <div className={styles.trailerContainer}>
              {trailerUrl ? (
                <div className="ratio ratio-16x9">
                  <iframe
                    src={trailerUrl}
                    title={`Trailer phim ${movie.name}`}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="rounded"
                  ></iframe>
                </div>
              ) : (
                <div className={styles.trailerLoading}>
                  <div className={styles.videoLoadingSpinner}></div>
                  <div className={styles.videoLoadingText}>Đang tìm kiếm trailer trên Dailymotion...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h5>Báo lỗi phim {movie?.name}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleCloseReportModal}
              ></button>
            </div>
            <div className={styles.modalBody}>
              {reportSuccess ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle-fill text-success fs-1"></i>
                  <h5 className="mt-3">Báo cáo lỗi đã được gửi thành công!</h5>
                  <p className="text-muted">Cảm ơn bạn đã giúp chúng tôi cải thiện chất lượng phim.</p>
                </div>
              ) : (
                <>
                  <p>Vui lòng cho chúng tôi biết bạn gặp lỗi gì khi xem phim này:</p>
                  <div className="mb-3">
                    <label className="form-label">Loại lỗi:</label>
                    <select
                      className="form-select bg-dark text-white border-secondary"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="">-- Chọn loại lỗi --</option>
                      {reportReasons.map((reason, index) => (
                        <option key={index} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả chi tiết (không bắt buộc):</label>
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
                      rows="4"
                      placeholder="Mô tả chi tiết lỗi bạn gặp phải..."
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                    ></textarea>
                  </div>
                </>
              )}
            </div>
            {!reportSuccess && (
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseReportModal}
                  disabled={reportLoading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleSubmitReport}
                  disabled={!reportType || reportLoading}
                >
                  {reportLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang gửi...
                    </>
                  ) : 'Gửi báo cáo'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .video-preview-overlay {
          animation: fadeIn 0.3s ease-in-out;
        }

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
      `}</style>
      <ToastContainer />
    </div>
  );
};

export async function getServerSideProps(context) {
  const { slug } = context.params;

  return {
    props: {
      slug,
    },
  };
}

export default MovieDetail;