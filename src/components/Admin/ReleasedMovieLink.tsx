// src/components/Admin/UpcomingMovies/ReleasedMovieLink.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Alert } from 'react-bootstrap';
import { FaExternalLinkAlt } from 'react-icons/fa';
import axiosInstance from '@/config/axiosAdminConfig';

interface ReleasedMovieLinkProps {
  upcomingMovieId: string;
}

const ReleasedMovieLink: React.FC<ReleasedMovieLinkProps> = ({ upcomingMovieId }) => {
  const [releasedMovieId, setReleasedMovieId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkIfMovieReleased();
  }, [upcomingMovieId]);

  const checkIfMovieReleased = async () => {
    if (!upcomingMovieId) return;

    setLoading(true);
    try {
      // Fetch the upcoming movie first
      const response = await axiosInstance.get(`/upcoming-movies/${upcomingMovieId}`);
      
      if (response.data?.upcomingMovie?.is_released) {
        // If released, search for the movie with same name or slug in the movies collection
        const searchResponse = await axiosInstance.get('/movies', {
          params: { 
            search: response.data.upcomingMovie.name,
            limit: 5 
          }
        });
        
        if (searchResponse.data?.movies?.length > 0) {
          // Find the movie that best matches the name or slug
          const matchingMovie = searchResponse.data.movies.find(
            (m: any) => m.name === response.data.upcomingMovie.name || 
                        m.slug === response.data.upcomingMovie.slug
          );
          
          if (matchingMovie) {
            setReleasedMovieId(matchingMovie._id);
          }
        }
      }
    } catch (err) {
      console.error('Error checking released movie:', err);
      setError('Không thể kiểm tra trạng thái phim đã phát hành');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !releasedMovieId) return null;

  return (
    <Alert variant="success" className="mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <span>Phim này đã được phát hành chính thức!</span>
        <Link href={`/admin/movies/edit/${releasedMovieId}`} passHref>
          <Button variant="outline-success" size="sm">
            <FaExternalLinkAlt className="me-1" /> Xem phim đã phát hành
          </Button>
        </Link>
      </div>
    </Alert>
  );
};

export default ReleasedMovieLink;
