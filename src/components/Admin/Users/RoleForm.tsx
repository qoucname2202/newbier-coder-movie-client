import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import axiosInstance from '@/API/config/axiosConfig';
import { API_URL } from '@/config/API';

interface RoleForAdmin {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

const createRoleByAdmin = async (roleData: { name: string; description: string; permissions: string[] }) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/admin/roles`, roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

const updateRoleByAdmin = async (id: string, roleData: { name: string; description: string; permissions: string[] }) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/admin/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

interface RoleFormProps {
  show: boolean;
  role: RoleForAdmin | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: () => void;
}

const AVAILABLE_PERMISSIONS = [
  'users:read',
  'users:write',
  'users:delete',
  'movies:read',
  'movies:write',
  'movies:delete',
  'comments:read',
  'comments:write',
  'comments:delete',
  'history:read',
  'settings:read',
  'settings:write',
];

const RoleForm: React.FC<RoleFormProps> = ({
  show,
  role,
  mode,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customPermission, setCustomPermission] = useState('');

  useEffect(() => {
    if (role && mode === 'edit') {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions || [],
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
  }, [role, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const index = permissions.indexOf(permission);

      if (index === -1) {
        permissions.push(permission);
      } else {
        permissions.splice(index, 1);
      }

      return {
        ...prev,
        permissions,
      };
    });
  };

  const handleAddCustomPermission = () => {
    if (!customPermission.trim()) return;

    setFormData(prev => ({
      ...prev,
      permissions: [...prev.permissions, customPermission.trim()]
    }));
    setCustomPermission('');
  };

  const handleRemovePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(p => p !== permission)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên vai trò là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createRoleByAdmin({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
      } else if (mode === 'edit' && role) {
        await updateRoleByAdmin(role._id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
      }

      onSave();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Có lỗi xảy ra khi lưu vai trò' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="role-modal-backdrop" onClick={onClose} tabIndex={-1}>
      <div className="role-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="role-modal-header">
          <h5 className="role-modal-title">
            {mode === 'create' ? 'Thêm vai trò mới' : 'Chỉnh sửa vai trò'}
          </h5>
          <button type="button" className="role-modal-close" onClick={onClose} disabled={isSubmitting} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="role-modal-body">
            {errors.submit && (
              <div className="alert alert-danger" role="alert">
                {errors.submit}
              </div>
            )}

            <div className="form-group mb-3">
              <label htmlFor="name" className="role-label">Tên vai trò <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting || (mode === 'edit' && formData.name.toLowerCase() === 'admin')}
                placeholder="Nhập tên vai trò (ví dụ: Biên tập viên, Người kiểm duyệt)"
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name}</div>
              )}
            </div>

            <div className="form-group mb-3">
              <label htmlFor="description" className="role-label">Mô tả</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                disabled={isSubmitting}
                placeholder="Mô tả vai trò này (tùy chọn)"
              ></textarea>
            </div>

            <div className="form-group mb-3">
              <label className="role-label">Quyền hạn</label>
              <div className="role-perm-card">
                <div className="role-perm-header">
                  <h6 className="role-perm-title">Quyền hạn đã chọn ({formData.permissions.length})</h6>
                </div>
                <div className="role-perm-body">
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {formData.permissions.length === 0 ? (
                      <div className="text-muted small">Vai trò này chưa có quyền hạn nào</div>
                    ) : (
                      formData.permissions.map((permission) => (
                        <div key={permission} className="selected-perm-tag">
                          <span>{permission}</span>
                          <button
                            type="button"
                            className="remove-perm-btn"
                            onClick={() => handleRemovePermission(permission)}
                            title="Xóa quyền này"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="perm-divider" />
                  <h6 className="role-perm-subtitle">Quyền hạn có sẵn</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {AVAILABLE_PERMISSIONS.map((permission) => {
                      const isSelected = formData.permissions.includes(permission);
                      return (
                        <button
                          key={permission}
                          type="button"
                          onClick={() => handlePermissionToggle(permission)}
                          className={`perm-pill-btn ${isSelected ? 'active' : ''}`}
                        >
                          {isSelected ? '✓ ' : '+ '}{permission}
                        </button>
                      );
                    })}
                  </div>

                  <div className="perm-divider" />
                  <h6 className="role-perm-subtitle">Thêm quyền hạn tùy chỉnh</h6>
                  <div className="custom-perm-row">
                    <input
                      type="text"
                      className="form-control custom-perm-input"
                      placeholder="Nhập quyền hạn (ví dụ: reports:read)"
                      value={customPermission}
                      onChange={(e) => setCustomPermission(e.target.value)}
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomPermission();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="custom-perm-add-btn"
                      onClick={handleAddCustomPermission}
                      disabled={!customPermission.trim() || isSubmitting}
                    >
                      <FaPlus /> Thêm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="role-modal-footer">
            <button
              type="button"
              className="role-btn role-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <FaTimes className="me-2" /> Hủy
            </button>
            <button
              type="submit"
              className="role-btn role-btn-save"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FaSave className="me-2" /> Lưu vai trò
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .role-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 16px;
          animation: fadeIn 0.15s ease-out;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .role-modal-card {
          background-color: #111723;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          width: 100%;
          max-width: 680px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          animation: scaleIn 0.2s ease-out;
          color: #cbd5e1;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .role-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: #141b29;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .role-modal-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .role-modal-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1rem;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s ease;
        }

        .role-modal-close:hover {
          color: #ffffff;
        }

        .role-modal-body {
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
          background-color: #111723;
        }

        .role-label {
          color: #cbd5e1;
          font-weight: 500;
          font-size: 0.86rem;
          margin-bottom: 6px;
          display: block;
        }

        :global(.role-modal-card .form-control) {
          background-color: #0e131d !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f1f5f9 !important;
          border-radius: 6px !important;
          font-size: 0.88rem !important;
        }

        :global(.role-modal-card .form-control:focus) {
          border-color: #e50914 !important;
          box-shadow: none !important;
        }

        :global(.role-modal-card .form-control::placeholder) {
          color: #64748b !important;
        }

        .role-perm-card {
          background-color: #0e131d;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 8px;
          overflow: hidden;
        }

        .role-perm-header {
          padding: 12px 16px;
          background-color: #141b29;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .role-perm-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .role-perm-body {
          padding: 16px;
        }

        .selected-perm-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: rgba(229, 9, 20, 0.12);
          border: 1px solid rgba(229, 9, 20, 0.3);
          color: #f87171;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 500;
        }

        .remove-perm-btn {
          background: none;
          border: none;
          color: #f87171;
          cursor: pointer;
          font-size: 0.72rem;
          padding: 0;
          display: inline-flex;
          align-items: center;
          opacity: 0.8;
          transition: opacity 0.15s ease;
        }

        .remove-perm-btn:hover {
          opacity: 1;
        }

        .perm-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.06);
          margin: 14px 0;
        }

        .role-perm-subtitle {
          font-size: 0.82rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .perm-pill-btn {
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }

        .perm-pill-btn:hover {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .perm-pill-btn.active {
          background-color: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
          font-weight: 600;
        }

        .custom-perm-row {
          display: flex;
          gap: 8px;
        }

        .custom-perm-input {
          flex: 1;
        }

        .custom-perm-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          height: 38px;
          border-radius: 6px;
          background-color: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.3);
          color: #f87171;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .custom-perm-add-btn:hover:not(:disabled) {
          background-color: #e50914;
          border-color: #e50914;
          color: #ffffff;
        }

        .custom-perm-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .role-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          background-color: #0e131d;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .role-btn {
          height: 38px;
          padding: 0 18px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .role-btn-cancel {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
        }

        .role-btn-cancel:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .role-btn-save {
          background-color: #e50914;
          border: 1px solid #e50914;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(229, 9, 20, 0.25);
        }

        .role-btn-save:hover {
          background-color: #c10711;
          border-color: #c10711;
        }
      `}</style>
    </div>
  );
};

export default RoleForm;