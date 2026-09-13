// Declaration file for adService.js
declare module '@/API/services/adService' {
  export interface Advertisement {
    _id: string;
    name: string;
    type: 'video' | 'banner_top' | 'banner_bottom';
    advertiser: string;
    content: string;
    thumbnail?: string;
    link: string;
    duration?: number;
    active: boolean;
    impressions: number;
    clicks: number;
    skips?: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface AdService {
    getRandomVideoAd(): Promise<Advertisement | null>;
    getTopBannerAd(): Promise<Advertisement | null>;
    getBottomBannerAd(): Promise<Advertisement | null>;
    getAllAds(
      page?: number,
      limit?: number,
      type?: string | null,
      active?: boolean | null
    ): Promise<{
      success: boolean;
      advertisements: Advertisement[];
      totalCount: number;
      totalPages: number;
      error?: string;
    }>;
    createAd(adData: any): Promise<{ success: boolean; advertisement: Advertisement; error?: string }>;
    updateAd(id: string, adData: any): Promise<{ success: boolean; advertisement: Advertisement; error?: string }>;
    deleteAd(id: string): Promise<{ success: boolean; error?: string }>;
  }

  const adService: AdService;
  export default adService;
}
