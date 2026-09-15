/**
 * @file index.js
 * @description Centralized Backward-Compatibility Barrel for Movie components.
 * Delegates seamlessly to the new Feature-Driven & Common architecture.
 */

// Common Shared Base Components
export { MovieSection, SectionHeader } from '@/components/common/MovieSection';
export { MovieCardVertical, MovieCardHorizontal } from '@/components/common/MovieCard';

// Home Feature Components & Rails
export {
  HeroBanner,
  FeaturedCarousel3D,
  TopRecommendedSection,
  TrendingTop10Section,
  UpcomingMoviesSection,
  CountryMoviesSection,
  LatestMoviesGridSection
} from '@/features/home';

// Movie Detail & Player Feature Components
export {
  TrailerModal,
  RatingStats,
  MovieRating,
  ReportButton,
  ShareButton,
  UserRatingDetails
} from '@/features/movie-detail';

// Legacy Compatibility components
export { default as MovieCarouselSection } from './MovieCarouselSection';
export { default as MovieGridSection } from './MovieGridSection';
