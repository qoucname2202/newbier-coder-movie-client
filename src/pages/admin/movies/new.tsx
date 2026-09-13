
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import MovieForm from '@/components/Admin/Movies/MovieForm'; // Import component form

import { createMovieByAdmin } from '@/services/admin/movieAdminService';

// import axiosInstance from '@/config/axiosAdminConfig';

const AddMoviePage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCreateMovie = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const newMovie = await createMovieByAdmin(formData);
      alert('Phim đã được tạo thành công!');
      router.push('/admin/movies');
    } catch (error: unknown) {
      console.error("Error creating movie:", error);
      let errorMessage = "Lỗi không xác định";

      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as {message: string}).message;
      }

      alert(`Lỗi tạo phim: ${errorMessage}`);
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    // <AdminLayout>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <h1>Thêm Phim Mới</h1>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card card-primary">
              <div className="card-header">
                <h3 className="card-title">Nhập thông tin phim</h3>
              </div>
              <MovieForm
                onSubmit={handleCreateMovie}
                onCancel={() => router.push('/admin/movies')}
              />
            </div>
          </div>
        </section>
      </div>
    // </AdminLayout>
  );
};

export default AddMoviePage;