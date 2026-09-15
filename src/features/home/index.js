/**
 * @file index.js
 * @description Centralized barrel export for the Home feature module.
 * Provides access to all homepage spotlights, rails, and data management hooks.
 */

export { default as HeroBanner } from './components/HeroBanner';
export { default as FeaturedCarousel3D } from './components/FeaturedCarousel3D';

export {
  TopRecommendedSection,
  TrendingTop10Section,
  UpcomingMoviesSection,
  CountryMoviesSection,
  LatestMoviesGridSection
} from './components/HomeRails';

export { useHomeData, default as useHomeDataDefault } from './hooks/useHomeData';
