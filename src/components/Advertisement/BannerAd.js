import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import adService from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';
import { useAdContext } from '@/context/AdContext';

const BannerAd = ({ position = 'top', maxAds = 3 }) => {
  const [ads, setAds] = useState([]);
  const [closed, setClosed] = useState(false);
  const [adsTracked, setAdsTracked] = useState({});
  const { hideHomepageAds, isLoading } = useAdContext();

  useEffect(() => {
  }, [hideHomepageAds, isLoading, position]);

  useEffect(() => {
    const fetchAds = async () => {

      if (isLoading) {
        setAds([]);
        return;
      }

      if (hideHomepageAds) {
        setAds([]);
        return;
      }

      try {
        if (hideHomepageAds) {
          return;
        }

        const adsData = await adService.getMultipleBannerAds(position, maxAds);

        if (adsData && adsData.length > 0) {
          setAds(adsData);
        } else {
        }
      } catch (error) {
        console.error(`Error fetching ${position} banner ads:`, error);
      }
    };
    fetchAds();
  }, [position, hideHomepageAds, isLoading, maxAds]);

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

  const handleAdClick = async (adId) => {
    const ad = ads.find(a => a._id === adId);
    if (!ad) return;

    try {
      await adService.trackAdClick(ad._id);
      window.open(ad.link, '_blank');
    } catch (error) {
      console.error('Error tracking ad click:', error);
      window.open(ad.link, '_blank');
    }
  };

  const handleClose = () => {
    setClosed(true);
  };
  const shouldRender = ads.length > 0 && !closed;

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
