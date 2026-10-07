// src/pages/admin/upcoming-movies/new.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/Layout/AdminLayout';
import UpcomingMovieForm from '@/components/Admin/UpcomingMovies/UpcomingMovieForm';
import { createUpcomingMovie, UpcomingMovie } from '@/services/admin/upcomingMovieService';
import { Alert } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import styles from '@/styles/AdminUpcomingMovies.module.css';

const AddUpcomingMoviePage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUpcomingMovie = async (formData: Partial<UpcomingMovie>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createUpcomingMovie(formData);
      alert('Phim sắp ra mắt đã được tạo thành công!');
      router.push('/admin/upcoming-movies');
    } catch (error: any) {
      console.error("Error creating upcoming movie:", error);

      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Có lỗi xảy ra khi tạo phim sắp ra mắt. Vui lòng thử lại sau.');
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
                <h1 className={styles.headerTitle}>Thêm Phim Sắp Ra Mắt</h1>
              </div>
            </div>
          </section>

          {error && (
            <Alert variant="danger" className="mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
              {error}
            </Alert>
          )}

          <UpcomingMovieForm
            onSubmit={handleCreateUpcomingMovie}
            isSubmitting={isSubmitting}
            onCancel={() => router.push('/admin/upcoming-movies')}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddUpcomingMoviePage;
