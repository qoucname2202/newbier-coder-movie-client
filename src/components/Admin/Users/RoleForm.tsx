import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import axiosInstance from '@/API/config/axiosConfig';
import { API_URL } from '@/config/API';

// Mở rộng interface RoleForAdmin để bao gồm các quyền
interface RoleForAdmin {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
}

// Các hàm để tạo và cập nhật vai trò
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

// Danh sách các quyền có sẵn được xác định trước
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
    
    // Xóa lỗi khi trường được thay đổi
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
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === 'create' ? 'Thêm vai trò mới' : 'Chỉnh sửa vai trò'}
            </h5>
            <button type="button" className="close" onClick={onClose} disabled={isSubmitting}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger" role="alert">
                  {errors.submit}
                </div>
              )}
              
              <div className="form-group row">
                <label htmlFor="name" className="col-sm-3 col-form-label">Tên vai trò *</label>
                <div className="col-sm-9">
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
              </div>
              
              <div className="form-group row">
                <label htmlFor="description" className="col-sm-3 col-form-label">Mô tả</label>
                <div className="col-sm-9">
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
              </div>
              
              <div className="form-group row">
                <label className="col-sm-3 col-form-label">Quyền hạn</label>
                <div className="col-sm-9">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Quyền hạn đã chọn</h3>
                    </div>
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {formData.permissions.length === 0 ? (
                          <div className="text-muted">Vai trò này không có quyền hạn nào</div>
                        ) : (
                          formData.permissions.map((permission) => (
                            <div key={permission} className="badge bg-primary p-2 m-1" style={{ display: 'inline-flex', alignItems: 'center' }}>
                              {permission}                              <button
                                type="button"
                                className="btn btn-xs btn-link text-white ml-1 p-0"
                                onClick={() => handleRemovePermission(permission)}
                                style={{ fontSize: '10px' }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <hr />
                      <h5>Quyền hạn có sẵn</h5>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {AVAILABLE_PERMISSIONS.map((permission) => (
                          <button
                            key={permission}
                            type="button"
                            onClick={() => handlePermissionToggle(permission)}
                            className={`btn btn-sm ${
                              formData.permissions.includes(permission) ? 'btn-success' : 'btn-outline-secondary'
                            } m-1`}
                          >
                            {permission}
                          </button>
                        ))}
                      </div>

                      <hr />
                      <h5>Thêm quyền hạn tùy chỉnh</h5>
                      <div className="input-group mb-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập quyền hạn tùy chỉnh (ví dụ: reports:read)"
                          value={customPermission}
                          onChange={(e) => setCustomPermission(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <div className="input-group-append">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddCustomPermission}
                            disabled={!customPermission.trim() || isSubmitting}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                <FaTimes className="mr-1" /> Hủy
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-1" /> Lưu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;