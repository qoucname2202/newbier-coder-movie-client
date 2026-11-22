/**
 * @file pages/client/browse/movies.tsx
 * @description Single Movies listing page (Phim Lẻ).
 * Delegates to the enterprise FormatPage with slug 'phim-le'.
 */

import React from 'react';
import FormatPage from '@/pages/client/formats/[slug]';

export default function BrowseMoviesPage() {
  return <FormatPage />;
}
