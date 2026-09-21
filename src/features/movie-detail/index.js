/**
 * @file index.js
 * @description Centralized barrel export for the Movie Detail and Player feature module.
 */

export { default as TrailerModal } from './components/TrailerModal';
export { default as RatingStats, RatingContext } from './components/RatingStats';
export { default as UserRatingDetails } from './components/UserRatingDetails';
export { default as MovieRating } from './components/MovieRating';
export { default as ReportButton } from './components/ReportButton';
export { default as ShareButton } from './components/ShareButton';

// Modern Cinema-Grade Movie Detail Components
export { default as MovieHeroHeader } from './components/MovieHeroHeader/MovieHeroHeader';
export { default as MoviePlayerSection } from './components/MoviePlayerSection/MoviePlayerSection';
export { default as EpisodeSelector } from './components/EpisodeSelector/EpisodeSelector';
export { default as CastCrewSection } from './components/CastCrewSection/CastCrewSection';
export { default as MovieMetaBento } from './components/MovieMetaBento/MovieMetaBento';
export { default as MovieCommentsSection } from './components/MovieCommentsSection/MovieCommentsSection';

// Hooks
export { useMovieDetail } from './hooks/useMovieDetail';

