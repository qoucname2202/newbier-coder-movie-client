import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/Layout/AdminLayout';
import MovieForm from '@/components/Admin/Movies/MovieForm';
import { createMovieByAdmin } from '@/services/admin/movieAdminService';
import { FaFilm, FaArrowLeft } from 'react-icons/fa';
import styles from '@/styles/AdminMoviesEnhanced.module.css';

const AddMoviePage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateMovie = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await createMovieByAdmin(formData);
      alert('Phim đã được tạo thành công!');
      router.push('/admin/movies');
    } catch (error: unknown) {
      console.error("Error creating movie:", error);
      let errorMessage = "Lỗi không xác định";

      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

      alert(`Lỗi tạo phim: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h1 className={styles.pageTitle}>
              <FaFilm className={styles.headerIcon} />
              Thêm Phim Mới
            </h1>
            <Link href="/admin/movies" className={styles.navButtonPrev}>
              <FaArrowLeft className="me-1" /> Quay lại danh sách
            </Link>
          </div>
          <ul className={styles.breadcrumb}>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/movies">Quản lý phim</Link>
            </li>
            <li>Thêm phim mới</li>
          </ul>
        </header>

        <section className={styles.formSection}>
          <div className={styles.formTitle}>
            <span>Nhập thông tin phim</span>
          </div>
          <div className={styles.formContent}>
            <MovieForm
              onSubmit={handleCreateMovie}
              onCancel={() => router.push('/admin/movies')}
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AddMoviePage;