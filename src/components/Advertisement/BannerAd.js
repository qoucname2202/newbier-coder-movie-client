// Thành phần quảng cáo banner có thể hiển thị ở đầu hoặc cuối trang
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';
import { useAdContext } from '@/context/AdContext';

/**
 * Hiển thị nhiều quảng cáo banner trong bố cục cố định
 * @param {Object} props
 * @param {string} props.position - Vị trí của banner (top hoặc bottom)
 * @param {number} props.maxAds - Số lượng quảng cáo tối đa hiển thị (mặc định: 3)
 */
const BannerAd = ({ position = 'top', maxAds = 3 }) => {
  const [ads, setAds] = useState([]);
  const [closed, setClosed] = useState(false);
  const [adsTracked, setAdsTracked] = useState({});
  const { hideHomepageAds, isLoading } = useAdContext();
  
  // Ghi log khi trạng thái hiển thị quảng cáo thay đổi
  useEffect(() => {
    console.log(`%c[BannerAd ${position}] Ad visibility status:`, 'color: blue; font-weight: bold', { 
      hideHomepageAds, 
      isLoading 
    });
  }, [hideHomepageAds, isLoading, position]);

  // Lấy quảng cáo phù hợp dựa trên vị trí
  useEffect(() => {
    const fetchAds = async () => {
      // Luôn log vị trí hiện tại và trạng thái hiển thị quảng cáo khi bắt đầu
      console.log(`%c[BannerAd ${position}] Starting ad fetch with hideHomepageAds=${hideHomepageAds}`, 'color: purple; font-weight: bold');
      
      // Đầu tiên, đợi nếu AdContext vẫn đang tải các thiết lập
      if (isLoading) {
        console.log(`%c[BannerAd ${position}] AdContext is loading. Waiting to fetch ad...`, 'color: orange; font-weight: bold');
        setAds([]); // Xóa quảng cáo hiện có khi context đang tải
        return;
      }

      // Bây giờ, AdContext đã tải xong, kiểm tra xem có nên ẩn quảng cáo cho BẤT KỲ vị trí nào không
      // Bắt buộc ẩn cả banner top VÀ bottom nếu người dùng là premium
      if (hideHomepageAds) {
        console.log(`%c[BannerAd ${position}] Homepage ads hidden due to premium subscription (position: ${position}).`, 'color: green; font-weight: bold');
        setAds([]); // Đảm bảo xóa quảng cáo nếu trước đó đã hiển thị
        return;
      }

      // Nếu AdContext đã tải và quảng cáo không bị ẩn, tiến hành lấy quảng cáo
      console.log(`%c[BannerAd ${position}] AdContext loaded, fetching ads...`, 'color: blue; font-weight: bold');
      try {
        // Kiểm tra lại một lần nữa trạng thái premium trước khi lấy quảng cáo
        if (hideHomepageAds) {
          console.log(`%c[BannerAd ${position}] Premium user detected, not fetching ads`, 'color: red; font-weight: bold');
          return;  
        }
        
        console.log(`%c[BannerAd ${position}] Getting multiple ${position.toUpperCase()} banner ads...`, 'color: blue;');
        const adsData = await adService.getMultipleBannerAds(position, maxAds);
        
        console.log(`%c[BannerAd ${position}] Ads data received:`, 'color: blue;', adsData ? `${adsData.length} ads exist` : 'No ads available');
        
        if (adsData && adsData.length > 0) {
          console.log(`%c[BannerAd ${position}] Setting ads data`, 'color: green;');
          setAds(adsData);
        } else {
          console.log(`%c[BannerAd ${position}] No ads to set`, 'color: orange;');
        }
      } catch (error) {
        console.error(`Error fetching ${position} banner ads:`, error);
      }
    };    
    fetchAds();
  }, [position, hideHomepageAds, isLoading, maxAds]);

  // Ghi nhận lượt xem khi quảng cáo được hiển thị
  useEffect(() => {
    const trackImpressions = async () => {
      for (const ad of ads) {
        if (!adsTracked[ad._id]) {
          try {
            await adService.trackAdImpression(ad._id);
            setAdsTracked(prev => ({ ...prev, [ad._id]: true }));
          } catch (error) {
            console.error('Error tracking ad impression:', error);
          }
        }
      }
    };

    if (ads.length > 0) {
      trackImpressions();
    }
  }, [ads, adsTracked]);

  // Xử lý khi click vào quảng cáo cụ thể
  const handleAdClick = async (adId) => {
    const ad = ads.find(a => a._id === adId);
    if (!ad) return;
    
    try {
      await adService.trackAdClick(ad._id);
      window.open(ad.link, '_blank');
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Vẫn mở liên kết dù tracking thất bại
      window.open(ad.link, '_blank');
    }
  };

  // Xử lý khi đóng quảng cáo
  const handleClose = () => {
    setClosed(true);
  };
  // Xác định có nên render quảng cáo không
  const shouldRender = ads.length > 0 && !closed;

  // Không render nếu không có quảng cáo hoặc đã bị đóng
  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`${styles.bannerContainer} ${styles[position]} ${styles.fadeIn}`}>
      <div className={styles.bannerContent}>
        <div className={styles.multiAdContainer}>
          {ads.map(ad => (
            <div 
              key={ad._id} 
              className={styles.bannerImage} 
              onClick={() => handleAdClick(ad._id)}
            >
              <img src={ad.content} alt={ad.name} />
              <div className={styles.adOverlay}>
                <span className={styles.adLabel}>Quảng cáo</span>
                <span className={styles.advertiserName}>{ad.advertiser}</span>
              </div>
            </div>
          ))}
        </div>
        <button 
          className={styles.closeButton} 
          onClick={handleClose}
          aria-label="Close advertisement"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default BannerAd;
