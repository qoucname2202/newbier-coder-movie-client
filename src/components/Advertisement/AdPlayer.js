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
  const { hideVideoAds, isLoading: isAdContextLoading } = useAdContext();

  useEffect(() => {
    if (hideVideoAds === true) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      onAdComplete();
    }
  }, [hideVideoAds, onAdComplete]);

  useEffect(() => {
    if (hideVideoAds === true) {
      return;
    }

    if (isAdContextLoading) {
      return;
    }

    const fetchAd = async () => {
      try {
        setLoading(true);
        const adData = await adService.getRandomVideoAd();

        if (hideVideoAds === true) {
          onAdComplete();
          return;
        }

        if (adData) {
          setAd(adData);
          setTimeRemaining(adData.duration || 15);
        } else {
          onAdComplete();
        }
      } catch (error) {
        console.error('Error fetching video ad:', error);
        onAdComplete();
      } finally {
        setLoading(false);
      }
    };

    fetchAd();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [hideVideoAds, isAdContextLoading, onAdComplete]);

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
  useEffect(() => {
    if (!ad || !videoRef.current) return;

    const videoElement = videoRef.current;

    const handleCanPlay = () => {
      videoElement.play().catch(err => {
        console.error('Error playing video ad:', err);
        onAdComplete();
      });
    };

    const handleEnded = () => {
      onAdComplete();
    };

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });

      if (allowSkip && skipCountdownRef.current > 0) {
        skipCountdownRef.current -= 1;
        if (skipCountdownRef.current === 0) {
          setCanSkip(true);
        }
      }
    }, 1000);

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('ended', handleEnded);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [ad, onAdComplete, allowSkip, skipDelay]);

  const handleSkip = async () => {
    if (!canSkip || !ad) return;

    try {
      await adService.trackAdSkip(ad._id);
    } catch (error) {
      console.error('Error tracking ad skip:', error);
    }

    onAdComplete();
  };

  const handleAdClick = async () => {
    if (!ad) return;

    try {
      await adService.trackAdClick(ad._id);

      window.open(ad.link, '_blank');

      if (videoRef.current) {
        videoRef.current.pause();
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
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

