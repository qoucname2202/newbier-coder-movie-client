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
    <div
      className="mt-3 mb-3 p-3 rounded"
      style={{
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        color: '#34d399',
      }}
    >
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Phim này đã được phát hành chính thức trong hệ thống!
        </span>
        <Link href={`/admin/movies/edit/${releasedMovieId}`} passHref>
          <Button
            size="sm"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '0.82rem',
            }}
          >
            <FaExternalLinkAlt className="me-1" /> Xem phim đã phát hành
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ReleasedMovieLink;
