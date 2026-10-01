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

      <div className="roles-container">
        <section className="content-header mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="page-title mb-1">Quản lý vai trò</h1>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Định nghĩa các nhóm quyền và vai trò quản trị hệ thống
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary d-flex align-items-center"
              style={{
                backgroundColor: '#e50914',
                borderColor: '#e50914',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 500,
                fontSize: '0.88rem'
              }}
              onClick={handleAddRole}
            >
              <FaPlus className="mr-2" style={{ marginRight: '8px' }} /> Thêm vai trò mới
            </button>
          </div>
        </section>

        <section className="content">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">Danh sách vai trò</h3>
              <span className="badge" style={{ backgroundColor: '#141b29', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 10px' }}>
                {roles.length} vai trò
              </span>
            </div>

            <div className="card-body p-0">
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="sr-only">Đang tải...</span>
                  </div>
                  <p className="mt-3 text-muted" style={{ color: '#94a3b8' }}>Đang tải danh sách vai trò...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger m-3" role="alert" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{width: '60px'}}>#</th>
                        <th style={{width: '180px'}}>Tên vai trò</th>
                        <th style={{width: '260px'}}>Mô tả</th>
                        <th>Quyền hạn</th>
                        <th style={{width: '110px'}}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-5" style={{ color: '#94a3b8' }}>
                            Chưa có vai trò nào được định nghĩa
                          </td>
                        </tr>
                      ) : (
                        roles.map((role, index) => (
                          <tr key={role._id}>
                            <td style={{ color: '#64748b' }}>{index + 1}</td>
                            <td>
                              <strong style={{ color: '#ffffff' }}>{role.name}</strong>
                            </td>
                            <td style={{ color: '#94a3b8' }}>{role.description || 'Không có mô tả'}</td>
                            <td>
                              {role.permissions && role.permissions.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {role.permissions.map((permission, idx) => (
                                    <span
                                      key={idx}
                                      className="badge mr-1 mb-1"
                                      style={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                        color: '#60a5fa',
                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                        borderRadius: '4px',
                                        padding: '3px 8px',
                                        fontSize: '0.78rem',
                                        fontWeight: 500,
                                        marginRight: '4px',
                                        marginBottom: '4px'
                                      }}
                                    >
                                      {permission}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Không có quyền hạn</span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm mr-1"
                                  style={{
                                    backgroundColor: '#0e131d',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#60a5fa',
                                    width: '30px',
                                    height: '30px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '6px',
                                    marginRight: '6px'
                                  }}
                                  onClick={() => handleEditRole(role)}
                                  title="Chỉnh sửa"
                                >
                                  <FaEdit />
                                </button>
                                {role.name.toLowerCase() !== 'admin' && (
                                  <button
                                    className="btn btn-sm"
                                    style={{
                                      backgroundColor: '#0e131d',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      color: '#f87171',
                                      width: '30px',
                                      height: '30px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '6px'
                                    }}
                                    onClick={() => handleDeleteClick(role)}
                                    title="Xóa"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
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
        </section>
      </div>

      <style jsx>{`
        .roles-container {
          padding: 20px 24px;
          background: #0b0f17;
          min-height: calc(100vh - 60px);
          color: #f1f5f9;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .card {
          background: #111723;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          overflow: hidden;
        }

        .card-header {
          background: #141b29;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          padding: 14px 20px;
        }

        .card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .table {
          color: #cbd5e1;
          margin: 0;
        }

        .table thead th {
          background: #141b29;
          color: #94a3b8;
          font-size: 0.82rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 12px 16px;
          border-top: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .table tbody td {
          padding: 12px 16px;
          border-top: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          vertical-align: middle;
        }

        .table tbody tr:hover td {
          background-color: #151c2a;
        }
      `}</style>

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

AdminRolesPage.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AdminRolesPage;