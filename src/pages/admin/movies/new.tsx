// src/pages/admin/movies/new.tsx - ĐÃ SỬA LẠI

import React, { useState } from 'react'; // *** THÊM import useState ***
import { useRouter } from 'next/router';
// import AdminLayout from '@/components/Layout/AdminLayout'; // Bỏ comment nếu bạn đã có AdminLayout
import MovieForm from '@/components/Admin/Movies/MovieForm'; // Import component form

// *** Bỏ comment và đảm bảo bạn đã tạo file service này và hàm createMovieByAdmin ***
import { createMovieByAdmin } from '@/services/admin/movieAdminService'; // Đường dẫn ví dụ

// *** Bỏ import axiosInstance nếu bạn gọi qua service ***
// import axiosInstance from '@/config/axiosAdminConfig'; 

const AddMoviePage: React.FC = () => {
  const router = useRouter();
  // *** Chỉ khai báo state một lần ***
  const [isSubmitting, setIsSubmitting] = useState(false); 
  // *** Chỉ định nghĩa hàm một lần ***
  const handleCreateMovie = async (formData: Record<string, any>) => { // Sử dụng Record<string, any> thay vì any
    setIsSubmitting(true); // Bắt đầu submit
    console.log("Form Data to Submit:", formData);
    try {
      // *** Gọi API tạo phim qua service ***
      const newMovie = await createMovieByAdmin(formData); 
      console.log("New movie created:", newMovie);
      alert('Phim đã được tạo thành công!'); // Thông báo thành công
      router.push('/admin/movies'); // Điều hướng về trang danh sách
    } catch (error: unknown) {
      console.error("Error creating movie:", error);
      let errorMessage = "Lỗi không xác định";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as {message: string}).message;
      }
      
      alert(`Lỗi tạo phim: ${errorMessage}`); // Hiển thị lỗi
    } finally {
       setIsSubmitting(false); // Kết thúc submit
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
              </div>              {/* Truyền đúng hàm và prop vào MovieForm */}
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