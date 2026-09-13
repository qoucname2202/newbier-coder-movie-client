import React, { useEffect, useState } from 'react';
import { FaBars } from 'react-icons/fa';

interface SidebarToggleProps {
  className?: string;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ className = "" }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    const body = document.querySelector('body');
    if (body) {
      body.classList.toggle('sidebar-collapse');
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <button 
      type="button"
      onClick={toggleSidebar}
      className={`btn ${className}`} 
      title={isCollapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
      style={{
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '1.25rem',
        padding: '0.5rem',
        cursor: 'pointer',
        transition: 'color 0.3s ease'
      }}
    >
      <FaBars />
    </button>
  );
};

export default SidebarToggle;