import React from 'react';

/**
 * AdminRoute bypass component.
 * Allows direct access to admin panel as requested.
 */
const AdminRoute = ({ children }) => {
  return <>{children}</>;
};

export default AdminRoute;

