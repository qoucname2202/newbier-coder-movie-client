// src/components/Layout/AdminLayout.tsx (Hoặc src/components/Admin/Layout/AdminLayout.tsx)
// ĐÃ ĐƯỢC RÚT GỌN

import React, { useEffect } from 'react';
import Head from 'next/head';

// Import các component con vừa tách ra
import AdminHeader from '../Admin/Layout/AdminHeader'; // Điều chỉnh đường dẫn nếu cần
import AdminSidebar from '../Admin/Layout/AdminSidebar';
import AdminFooter from '../Admin/Layout/AdminFooter';
//import AdminNotifications từ '../Admin/AdminNotifications';
import styles from '@/styles/Admin.module.css';
import dynamic from 'next/dynamic';
import { WebSocketProvider } from '@/constants/WebSocketContext';

// Import các thư viện JS của AdminLTE một cách tối ưu
const AdminLTEScript = dynamic(() => import('admin-lte/dist/js/adminlte.min.js'), {
  ssr: false
});

const BootstrapScript = dynamic(() => import('bootstrap/dist/js/bootstrap.bundle.min.js'), {
  ssr: false
});

const JQueryScript = dynamic(() => import('jquery'), {
  ssr: false
});

// Add skipHeader parameter to handle navbar duplication
const AdminLayout = ({ children, skipHeader = false }: { children: React.ReactNode, skipHeader?: boolean }) => {
  useEffect(() => {
    // Khởi tạo các script khi component được mount
    const loadScripts = async () => {
      try {
        await Promise.all([
          AdminLTEScript,
          BootstrapScript,
          JQueryScript
        ]);
      } catch (error) {
        console.error('Error loading admin scripts:', error);
      }
    };

    loadScripts();
  }, []);

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin dashboard for movie streaming platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Đã loại bỏ link CSS trực tiếp vì đã import trong _app.js */}
      </Head>

      <div className={styles.adminContainer}>
        <AdminSidebar />
        <div className={styles.contentWrapper}>
          {!skipHeader && <AdminHeader />}
          <main className="admin-content">{children}</main>
          <AdminFooter />
        </div>
      </div>
    </>
  );
};

export default AdminLayout;