/**
 * @file BannerAd.tsx
 * @description Fetches and renders banner ads from adService.
 */

import React, { useState, useEffect} from 'react';
import { FaTimes } from 'react-icons/fa';
import adService, { Advertisement } from '@/API/services/adService';
import styles from '@/styles/Advertisement.module.css';
import { useAdContext } from '@/context/AdContext';

export interface BannerAdProps {
  position?: string;
  maxAds?: number;
}

type TrackedMap = Record<string, boolean>;

type AdServiceWithTracking = {
  getTopBannerAd: () => Promise<Advertisement | null>;
  getBottomBannerAd: () => Promise<Advertisement | null>;
  trackAdImpression: (id: string) => Promise<unknown>;
  trackAdClick: (id: string) => Promise<unknown>;
};

const trackingService = adService as unknown as AdServiceWithTracking;

const BannerAd: React.FC<BannerAdProps> = ({ position = 'top', maxAds = 3 }) => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [closed, setClosed] = useState<boolean>(false);
  const [adsTracked, setAdsTracked] = useState<TrackedMap>({});
  const { hideHomepageAds, isLoading } = useAdContext();

  useEffect(() => {
    const fetchAds = async (): Promise<void> => {
      if (isLoading || hideHomepageAds) {
        setAds([]);
        return;
      }
      try {
        // adService exposes getTopBannerAd/getBottomBannerAd; maxAds is clamped to 1 here.
        const fetchOne = position === 'bottom'
          ? trackingService.getBottomBannerAd()
          : trackingService.getTopBannerAd();
        const ad = await fetchOne;
        if (ad) setAds([ad]);
      } catch (error) {

      }
    };
    fetchAds();
  }, [position, hideHomepageAds, isLoading, maxAds]);

  useEffect(() => {
    const trackImpressions = async (): Promise<void> => {
      for (const ad of ads) {
        if (!adsTracked[ad._id]) {
          try {
            await trackingService.trackAdImpression(ad._id);
            setAdsTracked((prev) => ({ ...prev, [ad._id]: true }));
          } catch (error) {

          }
        }
      }
    };
    if (ads.length > 0) trackImpressions();
  }, [ads, adsTracked]);

  const handleAdClick = async (adId: string): Promise<void> => {
    const ad = ads.find((a) => a._id === adId);
    if (!ad) return;
    try {
      await trackingService.trackAdClick(ad._id);
      window.open(ad.link, '_blank');
    } catch (error) {

      window.open(ad.link, '_blank');
    }
  };

  const handleClose = (): void => {
    setClosed(true);
  };

  const shouldRender = ads.length > 0 && !closed;
  if (!shouldRender) return null;

  return (
    <div className={`${styles.bannerContainer} ${styles[position]} ${styles.fadeIn}`}>
      <div className={styles.bannerContent}>
        <div className={styles.multiAdContainer}>
          {ads.map((ad) => (
            <div
              key={ad._id}
              className={styles.bannerImage}
              onClick={() => handleAdClick(ad._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') handleAdClick(ad._id);
              }}
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
          type="button"
          aria-label="Close advertisement"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default BannerAd;
