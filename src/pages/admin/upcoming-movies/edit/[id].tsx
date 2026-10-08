// src/pages/admin/upcoming-movies/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';
import UpcomingMovieForm from '@/components/Admin/UpcomingMovies/UpcomingMovieForm';
import { getUpcomingMovieById, updateUpcomingMovie } from '@/services/admin/upcomingMovieService';
import type { UpcomingMovie } from '@/services/admin/upcomingMovieService';
import styles from '@/styles/AdminUpcomingMovies.module.css';

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
      await updateUpcomingMovie(id as string, formData);
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
      <div className={styles.container}>
        <div className="container-fluid p-0">
          <section className={styles.headerSection}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <Link href="/admin/upcoming-movies" className={styles.viewReleasedBtn}>
                  <FaArrowLeft className="me-1" /> Quay lại danh sách
                </Link>
                <h1 className={styles.headerTitle}>Chỉnh sửa Phim Sắp Ra Mắt</h1>
              </div>
            </div>
          </section>

          {error && (
            <Alert variant="danger" className="mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                <span className="visually-hidden">Đang tải...</span>
              </Spinner>
              <p className="mt-3 text-muted" style={{ fontSize: '0.9rem' }}>Đang tải thông tin phim...</p>
            </div>
          ) : movie ? (
            <UpcomingMovieForm
              movie={movie}
              onSubmit={handleUpdateUpcomingMovie}
              isSubmitting={isSubmitting}
              onCancel={() => router.push('/admin/upcoming-movies')}
            />
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyText}>
                Không tìm thấy thông tin phim sắp ra mắt hoặc phim đã bị xóa.
              </div>
              <Link href="/admin/upcoming-movies" className={styles.viewReleasedBtn}>
                <FaArrowLeft className="me-1" /> Quay lại danh sách
              </Link>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditUpcomingMoviePage;
