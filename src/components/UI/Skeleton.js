import React from 'react';

const Skeleton = ({ width = '100%', height = '250px', borderRadius = '0' }) => {
  return (
    <div 
      className="skeleton-loading"
      style={{ 
        width, 
        height, 
        borderRadius,
        background: 'linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite ease-in-out'
      }}
    />
  );
};

export default Skeleton;