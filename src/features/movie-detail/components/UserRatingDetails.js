import React, { useState, useEffect, useContext } from 'react';
import styles from '@/styles/UserRatingDetails.module.css';
import { RatingContext } from './RatingStats';

const UserRatingDetails = ({ movieSlug }) => {
  const { showUserRatingDetails, setShowUserRatingDetails, showStats } = useContext(RatingContext) || {};
  const [userRatings, setUserRatings] = useState([]);
  const [filteredRatings, setFilteredRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState(0);
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const fetchUserRatings = async () => {
      if (!movieSlug || !showDetails) return;

      try {
        setLoading(true);
        setError(null);

        const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const movieResponse = await fetch(`${baseApiUrl}/movies/${movieSlug}`);
        if (!movieResponse.ok) {
          throw new Error(`Failed to fetch movie info: ${movieResponse.status}`);
        }

        const movieData = await movieResponse.json();
        if (!movieData.data || !movieData.data._id) {
          throw new Error('Movie ID not found');
        }

        const movieId = movieData.data._id;

        const ratingsResponse = await fetch(`${baseApiUrl}/ratings/movie/${movieId}`);
        if (!ratingsResponse.ok) {
          throw new Error(`Failed to fetch ratings: ${ratingsResponse.status}`);
        }

        const ratingsData = await ratingsResponse.json();

        if (ratingsData.success && Array.isArray(ratingsData.data)) {
          setUserRatings(ratingsData.data);
          setFilteredRatings(ratingsData.data);
        } else {
          setUserRatings([]);
          setFilteredRatings([]);
        }
      } catch (err) {
        console.error('Error fetching user ratings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRatings();
  }, [movieSlug, showDetails]);

  useEffect(() => {
    let result = [...userRatings];

    if (selectedStarFilter > 0) {
      result = result.filter(rating => rating.rating === selectedStarFilter);
    }

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === 'highest') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOrder === 'lowest') {
      result.sort((a, b) => a.rating - b.rating);
    }

    setFilteredRatings(result);
  }, [userRatings, selectedStarFilter, sortOrder]);

  const toggleDetails = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);

    if (setShowUserRatingDetails) {
      setShowUserRatingDetails(newShowDetails);
    }
  };

  const handleStarFilterClick = (stars) => {
    setSelectedStarFilter(selectedStarFilter === stars ? 0 : stars);
  };

  const formatDate = (dateString) => {
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
                onChange={(e) => setSortOrder(e.target.value)}
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
                          className={`bi ${i < rating.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
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
