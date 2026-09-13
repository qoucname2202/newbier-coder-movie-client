// src/pages/admin/upcoming-movies/new.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import UpcomingMovieForm from '@/components/Admin/UpcomingMovies/UpcomingMovieForm';
import { createUpcomingMovie, UpcomingMovie } from '@/services/admin/upcomingMovieService';
import { Alert } from 'react-bootstrap';

const AddUpcomingMoviePage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateUpcomingMovie = async (formData: Partial<UpcomingMovie>) => {
    setIsSubmitting(true);
    setError(null);
    console.log("Form Data to Submit:", formData);
    
    try {
      const response = await createUpcomingMovie(formData);
      console.log("New upcoming movie created:", response.data);
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
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <h1>Thêm Phim Sắp Ra Mắt</h1>
          </div>
        </section>
        
        <section className="content">
          <div className="container-fluid">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}
            
            <div className="card card-primary">
              <div className="card-header">
                <h3 className="card-title">Nhập thông tin phim sắp ra mắt</h3>
              </div>
              <UpcomingMovieForm 
                onSubmit={handleCreateUpcomingMovie} 
                isSubmitting={isSubmitting} 
                onCancel={() => router.push('/admin/upcoming-movies')}
              />
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AddUpcomingMoviePage;
