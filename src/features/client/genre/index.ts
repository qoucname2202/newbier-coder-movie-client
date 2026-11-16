/**
 * @file index.ts
 * @description Public exports for the Genre client feature module.
 */

export * from './types/genre.types';
export * from './schemas/genreSchemas';
export * from './constants/genreThemeConstants';
export * from './services/genreService';
export * from './hooks/useGenreMovies';

export { default as GenreHeroBanner } from './components/GenreHeroBanner/GenreHeroBanner';
export { default as GenreFilterBar } from './components/GenreFilterBar/GenreFilterBar';
export { default as GenreMovieGrid } from './components/GenreMovieGrid/GenreMovieGrid';
export { GenreGridSkeleton, GenreScrollLoader } from './components/GenreSkeleton/GenreSkeleton';
export { default as GenreEmptyState } from './components/GenreEmptyState/GenreEmptyState';
