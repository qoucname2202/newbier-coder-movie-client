
import React, { useEffect } from 'react';
import Head from 'next/head';

import AdminHeader from '../Admin/Layout/AdminHeader';
import AdminSidebar from '../Admin/Layout/AdminSidebar';
import AdminFooter from '../Admin/Layout/AdminFooter';
import styles from '@/styles/Admin.module.css';
import dynamic from 'next/dynamic';
import { WebSocketProvider } from '@/constants/WebSocketContext';

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