// src/pages/admin/roles.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { NextPageWithLayout } from '@/types/next';
import AdminRoute from '../../components/ProtectedRoute/AdminRoute';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { getRolesForAdmin } from '@/API/services/admin/userAdminService';
import RoleForm from '@/components/Admin/Users/RoleForm';
import ConfirmModal from '@/components/Admin/Common/ConfirmModal';
import axiosInstance from '@/API/config/axiosConfig';
import { API_URL } from '@/config/API';

// Extended RoleForAdmin interface to include permissions
interface RoleForAdmin {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

// Function to delete role
const deleteRoleByAdmin = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/admin/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

const AdminRolesPage: NextPageWithLayout = () => {
  const [roles, setRoles] = useState<RoleForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleForAdmin | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rolesData = await getRolesForAdmin();
      // Ensure each role has permissions array (empty if not provided)
      const rolesWithPermissions = rolesData.map((role: any) => ({
        ...role,
        permissions: role.permissions || []
      }));
      setRoles(rolesWithPermissions);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách vai trò');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleAddRole = () => {
    setSelectedRole(null);
    setFormMode('create');
    setShowRoleForm(true);
  };

  const handleEditRole = (role: RoleForAdmin) => {
    setSelectedRole(role);
    setFormMode('edit');
    setShowRoleForm(true);
  };

  const handleDeleteClick = (role: RoleForAdmin) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      await deleteRoleByAdmin(selectedRole._id);
      await fetchRoles();
      setShowDeleteModal(false);
    } catch (err: any) {
      setError(err.message || 'Không thể xóa vai trò');
      console.error('Error deleting role:', err);
    }
  };

  const handleRoleFormClose = () => {
    setShowRoleForm(false);
  };

  const handleRoleFormSave = () => {
    fetchRoles();
    setShowRoleForm(false);
  };

  return (
    <>
      <Head>
        <title>Quản lý vai trò - Admin Dashboard</title>
      </Head>

      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Quản lý vai trò</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Danh sách vai trò</h3>
              <div className="card-tools">
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={handleAddRole}
                >
                  <FaPlus className="mr-1" /> Thêm vai trò mới
                </button>
              </div>
            </div>

            <div className="card-body">
              {loading && <p>Đang tải danh sách vai trò...</p>}
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th style={{width: '50px'}}>#</th>
                        <th>Tên vai trò</th>
                        <th>Mô tả</th>
                        <th>Quyền hạn</th>
                        <th style={{width: '120px'}}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center">
                            Chưa có vai trò nào được định nghĩa
                          </td>
                        </tr>
                      ) : (
                        roles.map((role, index) => (
                          <tr key={role._id}>
                            <td>{index + 1}</td>
                            <td>{role.name}</td>
                            <td>{role.description || 'Không có mô tả'}</td>
                            <td>
                              {role.permissions && role.permissions.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {role.permissions.map((permission, idx) => (
                                    <span key={idx} className="badge bg-info mr-1 mb-1">
                                      {permission}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                'Không có quyền hạn'
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-info mr-1"
                                onClick={() => handleEditRole(role)}
                                title="Chỉnh sửa"
                              >
                                <FaEdit />
                              </button>
                              {role.name.toLowerCase() !== 'admin' && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteClick(role)}
                                  title="Xóa"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Role Form Modal */}
      {showRoleForm && (
        <RoleForm
          show={showRoleForm}
          role={selectedRole}
          mode={formMode}
          onClose={handleRoleFormClose}
          onSave={handleRoleFormSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Xác nhận xóa vai trò"
        message={`Bạn có chắc chắn muốn xóa vai trò "${selectedRole?.name || ''}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteRole}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>  );
};

// Thêm getLayout để sử dụng AdminLayout với bảo vệ admin
AdminRolesPage.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AdminRolesPage;