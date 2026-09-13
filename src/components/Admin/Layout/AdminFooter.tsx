// src/components/Admin/Layout/AdminFooter.tsx
import React from 'react';

const AdminFooter = () => {
  return (
    <footer className="main-footer" style={{
      backgroundColor: '#000000', 
      color: '#FFFFFF',
      padding: '15px',
      borderTop: '1px solid #333',
      fontSize: '14px'
    }}>
      <div className="float-right d-none d-sm-inline">
        Version 1.0.0
      </div>
      <strong style={{ color: '#FFFFFF' }}>MovieAdmin &copy; {new Date().getFullYear()}</strong> All rights reserved.
    </footer>
  );
};

export default AdminFooter;