/**
 * @file pages/client/browse/series.tsx
 * @description Canonical route redirect from legacy /browse/series to /formats/phim-bo/movies.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SeriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const query = { ...router.query };
    if (!query.page) query.page = '1';
    if (!query.limit) query.limit = '20';

    void router.replace({
      pathname: '/formats/phim-bo/movies',
      query
    });
  }, [router]);

  return null;
}
