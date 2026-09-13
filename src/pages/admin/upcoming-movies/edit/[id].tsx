// src/pages/admin/upcoming-movies/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Alert, Spinner } from 'react-bootstrap';
import AdminLayout from '@/components/Layout/AdminLayout';
import UpcomingMovieForm from '@/components/Admin/UpcomingMovies/UpcomingMovieForm';
import { getUpcomingMovieById, updateUpcomingMovie } from '@/services/admin/upcomingMovieService';
import type { UpcomingMovie } from '@/services/admin/upcomingMovieService';

const EditUpcomingMoviePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [movie, setMovie] = useState<UpcomingMovie | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchUpcomingMovieDetails();
    }
  }, [id]);

  const fetchUpcomingMovieDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUpcomingMovieById(id as string);
      
      if (response.data && response.data.upcomingMovie) {
        setMovie(response.data.upcomingMovie);
      } else {
        setError('Không tìm thấy thông tin phim sắp ra mắt');
      }
    } catch (err) {
      console.error('Error fetching upcoming movie details:', err);
      setError('Lỗi khi tải thông tin phim sắp ra mắt');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateUpcomingMovie = async (formData: Partial<UpcomingMovie>) => {
    if (!id) return;
    
    setIsSubmitting(true);
    setError(null);
      try {
      const response = await updateUpcomingMovie(id as string, formData);
      console.log('Updated upcoming movie:', response.data);
      alert('Cập nhật phim sắp ra mắt thành công!');
      router.push(`/admin/upcoming-movies/${id as string}`);
    } catch (err: any) {
      console.error('Error updating upcoming movie:', err);
      
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Có lỗi xảy ra khi cập nhật phim sắp ra mắt');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <h1>Chỉnh sửa Phim Sắp Ra Mắt</h1>
          </div>
        </section>
        
        <section className="content">
          <div className="container-fluid">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}
            
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </Spinner>
                <p className="mt-2">Đang tải thông tin phim...</p>
              </div>
            ) : movie ? (
              <div className="card card-primary">
                <div className="card-header">
                  <h3 className="card-title">Chỉnh sửa thông tin phim sắp ra mắt</h3>
                </div>
                <UpcomingMovieForm 
                  movie={movie}
                  onSubmit={handleUpdateUpcomingMovie} 
                  isSubmitting={isSubmitting}
                  onCancel={() => router.push('/admin/upcoming-movies')}
                />
              </div>
            ) : (
              <Alert variant="warning">
                Không tìm thấy thông tin phim sắp ra mắt hoặc phim đã bị xóa.
              </Alert>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default EditUpcomingMoviePage;
