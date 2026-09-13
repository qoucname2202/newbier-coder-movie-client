import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import styles from '../../styles/RatingStats.module.css';
import UserRatingDetails from './UserRatingDetails';

// Tạo một context để chia sẻ trạng thái giữa các thành phần
export const RatingContext = createContext();

const RatingStats = ({ userRatingsStats, averageRating, ratingCount, movieSlug }) => {
  const [showStats, setShowStats] = useState(false);
  const [activeBar, setActiveBar] = useState(null);
  const dropdownRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const [showUserRatings, setShowUserRatings] = useState(false);
  const [showUserRatingDetails, setShowUserRatingDetails] = useState(false);
  // Xử lý các click bên ngoài dropdown để đóng nó
  useEffect(() => {
    let startY = 0;
    
    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (event) => {
      // Không đóng nếu chỉ là cuộn trang
      const endY = event.changedTouches[0].clientY;
      const deltaY = Math.abs(endY - startY);
      
      if (deltaY < 10 && // Nếu không phải là cuộn đáng kể
          showStats && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          toggleButtonRef.current && 
          !toggleButtonRef.current.contains(event.target)) {
        setShowStats(false);
      }
    };
    
    const handleClickOutside = (event) => {
      if (showStats && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          toggleButtonRef.current && 
          !toggleButtonRef.current.contains(event.target)) {
        setShowStats(false);
      }
    };
    
    // Thêm các sự kiện khi dropdown được hiển thị
    if (showStats) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
    }
    
    // Dọn dẹp
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showStats]);  // Bật/tắt hiển thị thống kê
  const toggleStats = (e) => {
    e.stopPropagation(); // Ngăn sự kiện lan truyền
    setShowStats(!showStats);
    
    // Tự động ẩn chi tiết đánh giá của người dùng khi hiển thị thống kê
    if (!showStats) {
      setShowUserRatingDetails(false);
    }
  };
  // Đảm bảo userRatingsStats là một đối tượng
  const ratingDistribution = userRatingsStats || {};
  
  // Debug dữ liệu phân phối đánh giá
  console.log("Rating distribution data:", ratingDistribution);
  console.log("Rating count:", ratingCount);

  // Tạo phần trăm cho mỗi mức đánh giá sao
  const calculatePercentage = (count) => {
    if (!ratingCount || ratingCount === 0) return 0;
    return Math.round((count / ratingCount) * 100);
  };  return (
    <RatingContext.Provider value={{ showUserRatingDetails, setShowUserRatingDetails, showStats }}>
      <div className={styles.ratingStatsContainer}>
        <div className={styles.ratingButtonsContainer}>
          <button 
            ref={toggleButtonRef}
            className={styles.ratingStatsToggle}
            onClick={toggleStats}
            title="Xem thống kê đánh giá"
            aria-expanded={showStats}
            aria-haspopup="true"
            aria-controls="rating-stats-dropdown"
          >
            Thống kê
            <i className={`bi ${showStats ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1`}></i>
          </button>
          
          {movieSlug && ratingCount > 0 && (
            <div className={styles.userRatingDetailsWrapper}>
              <UserRatingDetails movieSlug={movieSlug} />
            </div>
          )}
      </div>
        {showStats && (
        <div 
          ref={dropdownRef} 
          className={styles.ratingStatsDropdown}
          id="rating-stats-dropdown"
          role="dialog"
          aria-label="Thống kê đánh giá">
          <div className={styles.ratingStatsHeader}>
            <div className={styles.ratingStatsSummary}>
              <div className={styles.averageRating}>
                <span className={styles.ratingNumber}>
                  {ratingCount > 0 ? averageRating.toFixed(1) : '0.0'}
                </span>
                <span className={styles.ratingMax}>/10</span>
              </div>              <div className={styles.ratingStarIcons}>
                {[...Array(10)].map((_, i) => {
                  // Không cần chuyển đổi, sử dụng trực tiếp chỉ số cho thang điểm 10
                  const starValue = i + 1;
                  const filled = averageRating >= starValue;
                  const halfFilled = !filled && averageRating > starValue - 0.5;
                  
                  let starType = '';
                  if (filled) {
                    starType = 'bi-star-fill';
                  } else if (halfFilled) {
                    starType = 'bi-star-half';
                  } else {
                    starType = 'bi-star';
                  }

                  // Tính toán độ trễ cho hiệu ứng dựa trên vị trí
                  const animationDelay = `${i * 0.3}s`;

                  return (
                    <i
                      key={i}
                      className={`bi ${starType} ${styles.starIcon}`}
                      style={{ 
                        animationDelay,
                        '--star-index': i // Đối với trình duyệt hỗ trợ custom properties
                      }}
                      aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                    ></i>
                  );
                })}
              </div><div className={styles.ratingCount}>
                {ratingCount > 0 ? `${ratingCount} đánh giá` : 'Chưa có đánh giá'}
              </div>
            </div>
          </div>
          
          <div className={styles.ratingStatsDetails}>
            {ratingCount > 0 ? (
              <>
                <div className={styles.ratingBars}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                    // Đảm bảo chúng ta có giá trị số cho count
                    const count = parseInt(ratingDistribution[star] || 0, 10);
                    const percentage = calculatePercentage(count);
                      return (
                      <div 
                        key={star} 
                        className={`${styles.ratingBarRow} ${activeBar === star ? styles.activeBarRow : ''}`}
                        onTouchStart={() => setActiveBar(star)}
                        onTouchEnd={() => setTimeout(() => setActiveBar(null), 300)}
                      >
                        <div className={styles.ratingBarLabel}>{star}</div>
                        <div className={styles.ratingBarContainer}>
                          <div 
                            className={styles.ratingBarFill} 
                            style={{ height: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className={styles.ratingBarPercentage}>{percentage}%</div>
                        <div className={styles.ratingBarCount}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={styles.noRatings}>
                Chưa có thống kê đánh giá
              </div>
            )}          </div>
        </div>
      )}
    </div>
    </RatingContext.Provider>
  );
};

export default RatingStats;
