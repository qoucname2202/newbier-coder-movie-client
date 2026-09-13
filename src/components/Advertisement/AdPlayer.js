import React, { useState, useEffect, useRef } from 'react';
import { FaForward } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '../../styles/AdPlayer.module.css';
import { useAdContext } from '@/context/AdContext'; // Import AdContext

const AdPlayer = ({ onAdComplete, allowSkip = true, skipDelay = 5 }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [adTracked, setAdTracked] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const skipCountdownRef = useRef(skipDelay);
  const { hideVideoAds, isLoading: isAdContextLoading } = useAdContext(); // Sử dụng AdContext

  // Kiểm tra người dùng Premium để bỏ qua quảng cáo
  useEffect(() => {
    // Nếu người dùng là Premium và có quyền ẩn quảng cáo
    if (hideVideoAds === true) {
      console.log('%c[AdPlayer] PREMIUM USER DETECTED - SKIPPING AD!', 'color: #00FF00; font-weight: bold; font-size: 14px');
      // Dừng video nếu đang chạy
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ""; // Xóa nguồn video
      }
      
      // Xóa timer nếu có
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Gọi onComplete để bỏ qua quảng cáo
      onAdComplete();
    }
  }, [hideVideoAds, onAdComplete]);

  // Lấy ngẫu nhiên một quảng cáo video - chỉ khi người dùng không phải Premium
  useEffect(() => {
    // Nếu là người dùng Premium, bỏ qua việc tải quảng cáo
    if (hideVideoAds === true) {
      return;
    }

    // Nếu AdContext đang tải, đợi
    if (isAdContextLoading) {
      console.log('%c[AdPlayer] AdContext đang tải, đợi...', 'color: #FFA500; font-weight: bold');
      return;
    }

    const fetchAd = async () => {
      try {
        setLoading(true);
        const adData = await adService.getRandomVideoAd();
        
        // Kiểm tra lại nếu hideVideoAds đã thay đổi trong quá trình tải
        if (hideVideoAds === true) {
          console.log('%c[AdPlayer] Trạng thái Premium thay đổi trong quá trình tải - bỏ qua quảng cáo', 'color: #00FF00;');
          onAdComplete();
          return;
        }
        
        if (adData) {
          setAd(adData);
          setTimeRemaining(adData.duration || 15);
        } else {
          // Nếu không có quảng cáo, hoàn thành ngay lập tức
          onAdComplete();
        }
      } catch (error) {
        console.error('Error fetching video ad:', error);
        onAdComplete(); // Bỏ qua nếu có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchAd();

    // Dọn dẹp timer khi unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [hideVideoAds, isAdContextLoading, onAdComplete]);

  // Ghi nhận lượt xem khi quảng cáo được hiển thị
  useEffect(() => {
    const trackImpression = async () => {
      if (ad && !adTracked) {
        try {
          await adService.trackAdImpression(ad._id);
          setAdTracked(true);
        } catch (error) {
          console.error('Error tracking ad impression:', error);
        }
      }
    };

    trackImpression();
  }, [ad, adTracked]);
  // Thiết lập sự kiện video và bộ đếm thời gian
  useEffect(() => {
    if (!ad || !videoRef.current) return;

    const videoElement = videoRef.current;
    
    // Phát video khi đã sẵn sàng
    const handleCanPlay = () => {
      videoElement.play().catch(err => {
        console.error('Error playing video ad:', err);
        onAdComplete(); // Bỏ qua nếu có lỗi
      });
    };

    // Xử lý khi video kết thúc
    const handleEnded = () => {
      onAdComplete();
    };

    // Thiết lập bộ đếm thời gian
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });

      // Cập nhật bộ đếm bỏ qua
      if (allowSkip && skipCountdownRef.current > 0) {
        skipCountdownRef.current -= 1;
        if (skipCountdownRef.current === 0) {
          setCanSkip(true);
        }
      }
    }, 1000);

    // Thêm sự kiện cho video
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('ended', handleEnded);

    // Dọn dẹp
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('ended', handleEnded);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [ad, onAdComplete, allowSkip, skipDelay]);

  // Xử lý khi bấm bỏ qua quảng cáo
  const handleSkip = async () => {
    if (!canSkip || !ad) return;
    
    try {
      // Ghi nhận lượt bỏ qua
      await adService.trackAdSkip(ad._id);
    } catch (error) {
      console.error('Error tracking ad skip:', error);
    }
    
    // Hoàn thành và chuyển sang nội dung
    onAdComplete();
  };

  // Xử lý khi bấm vào quảng cáo
  const handleAdClick = async () => {
    if (!ad) return;
    
    try {
      // Ghi nhận lượt click
      await adService.trackAdClick(ad._id);
      
      // Mở liên kết trong tab mới
      window.open(ad.link, '_blank');
      
      // Tạm dừng video khi click
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Vẫn mở liên kết dù tracking thất bại
      window.open(ad.link, '_blank');
    }
  };



  if (!ad) {
    return null;
  }  return (
    <div className={styles.adPlayerContainer}>
      <div className={styles.videoWrapper}>
        <div className={styles.adClickArea} onClick={handleAdClick}>
          <video 
            ref={videoRef}
            className={styles.adVideo}
            src={ad.content}
            muted={false}
            playsInline
            preload="auto"
            aria-label={`Advertisement from ${ad.advertiser}`}
          />
        </div>
        
        <div className={styles.adOverlay}>
          <div className={styles.adInfo}>
            <span className={styles.adLabel}>Quảng cáo</span>
          </div>
            <div className={styles.adDetails}>
            <p className={styles.adTitle}>{ad.name}</p>
            <p className={styles.adAdvertiser}>{ad.advertiser}</p>
          </div>  
          
          {allowSkip && (
            <button 
              className={`${styles.skipButton} ${canSkip ? styles.canSkip : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              disabled={!canSkip}
              aria-label="Skip advertisement"
            >
              <FaForward className={styles.skipIcon} />
              <span>{canSkip ? 'Bỏ qua' : `Bỏ qua sau ${skipCountdownRef.current}s`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdPlayer;

