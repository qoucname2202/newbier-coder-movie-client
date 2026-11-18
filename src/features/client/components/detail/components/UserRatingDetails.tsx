import React, { useState, useEffect, useContext } from 'react';
import styles from '@/styles/UserRatingDetails.module.css';
import { RatingContext } from './RatingStats';
import { getApiBaseUrl } from '@/config/apiBase';
import { apiUrl } from '@/config/apiPaths';
import authService from '@/API/services/authService';

/** User rating entry */
export interface UserRating {
  _id?: string;
  rating?: number;
  review?: string;
  createdAt?: string;
  userId?: {
    username?: string;
  };
}

export interface UserRatingDetailsProps {
  movieSlug?: string;
}

const UserRatingDetails: React.FC<UserRatingDetailsProps> = ({ movieSlug }) => {
  const { showUserRatingDetails, setShowUserRatingDetails } = useContext(RatingContext) || {};
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [filteredRatings, setFilteredRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    const fetchUserRatings = async (): Promise<void> => {
      if (!movieSlug || !showDetails) return;

      try {
        setLoading(true);
        setError(null);

        const baseApiUrl = getApiBaseUrl();

        // Both endpoints need the Bearer token, so the header is resolved
        // through the shared auth service.
        const headers = await authService.getAuthHeader();

        const movieResponse = await fetch(apiUrl(`moviesDetail`, movieSlug), { headers });
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie info: ${movieResponse.status}`);
        }

        const movieData = (await movieResponse.json()) as { data?: { _id?: string } };
        if (!movieData.data || !movieData.data._id) {
          throw new Error('Movie ID not found');
        }

        const movieId = movieData.data._id;

        const ratingsResponse = await fetch(apiUrl(`ratingsMovie`, movieId), { headers });
        if (!ratingsResponse.ok) {
          throw new Error(`Failed to fetch ratings: ${ratingsResponse.status}`);
        }

        const ratingsData = (await ratingsResponse.json()) as { success?: boolean; data?: UserRating[] };

        if (ratingsData.success && Array.isArray(ratingsData.data)) {
          setUserRatings(ratingsData.data);
          setFilteredRatings(ratingsData.data);
        } else {
          setUserRatings([]);
          setFilteredRatings([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRatings();
  }, [movieSlug, showDetails]);

  useEffect(() => {
    let result = [...userRatings];

    if (selectedStarFilter > 0) {
      result = result.filter((rating) => rating.rating === selectedStarFilter);
    }

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortOrder === 'highest') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortOrder === 'lowest') {
      result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    setFilteredRatings(result);
  }, [userRatings, selectedStarFilter, sortOrder]);

  const toggleDetails = (): void => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);

    if (setShowUserRatingDetails) {
      setShowUserRatingDetails(newShowDetails);
    }
  };

  const handleStarFilterClick = (stars: number): void => {
    setSelectedStarFilter(selectedStarFilter === stars ? 0 : stars);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.userRatingsContainer}>
      <button
        className={`${styles.userRatingsToggle} ${showDetails ? styles.active : ''}`}
        onClick={toggleDetails}
        title="Xem đánh giá từ người dùng"
        aria-expanded={showDetails}
      >
        <i className="bi bi-chat-square-text me-1"></i>
        <span>Đánh giá</span>
      </button>

      {showDetails && (
        <div className={styles.userRatingsDetails}>
          <div className={styles.userRatingsHeader}>
            <h4 className={styles.userRatingsTitle}>Đánh giá từ người dùng</h4>
            <div className={styles.filterControls}>
              <div className={styles.starFilters}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    className={`${styles.starFilterBtn} ${selectedStarFilter === star ? styles.active : ''}`}
                    onClick={() => handleStarFilterClick(star)}
                    title={`Lọc đánh giá ${star} sao`}
                  >
                    {star} <i className="bi bi-star-fill"></i>
                  </button>
                ))}
              </div>

              <select
                className={styles.sortSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'highest' | 'lowest')}
                aria-label="Sắp xếp đánh giá"
              >
                <option value="newest">Mới nhất</option>
                <option value="highest">Điểm cao nhất</option>
                <option value="lowest">Điểm thấp nhất</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className="spinner-border spinner-border-sm text-danger me-2" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <span>Đang tải đánh giá...</span>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              <span>{error}</span>
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="bi bi-chat-square-dots me-2"></i>
              <span>Chưa có đánh giá nào phù hợp với bộ lọc</span>
            </div>
          ) : (
            <div className={styles.ratingsList}>
              {filteredRatings.map((rating) => (
                <div key={rating._id || Math.random()} className={styles.ratingItem}>
                  <div className={styles.ratingUserHeader}>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{rating.userId?.username || 'Người dùng ẩn danh'}</span>
                      <span className={styles.ratingDate}>{formatDate(rating.createdAt)}</span>
                    </div>
                    <div className={styles.userRatingStars}>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < (rating.rating || 0) ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {rating.review && (
                    <p className={styles.reviewText}>{rating.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRatingDetails;
