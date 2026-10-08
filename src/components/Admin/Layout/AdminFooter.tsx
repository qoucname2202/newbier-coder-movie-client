// src/components/Admin/Layout/AdminFooter.tsx
import React from 'react';

const AdminFooter = () => {
  return (
    <footer className="main-footer" style={{
      backgroundColor: '#0e131d', 
      color: '#64748b',
      padding: '14px 24px',
      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
      fontSize: '13px'
    }}>
      <div className="float-right d-none d-sm-inline" style={{ color: '#475569' }}>
        Version 1.0.0
      </div>
      <strong style={{ color: '#94a3b8' }}>MovieAdmin &copy; {new Date().getFullYear()}</strong> <span style={{ color: '#475569' }}>All rights reserved.</span>
    </footer>
  );
};

export default AdminFooter;