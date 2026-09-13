// filepath: d:\Workspace\DoAnCoSo\MovieStreaming\frontend\src\components\Admin\Users\UserForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { UserForAdmin, RoleForAdmin, AccountTypeForAdmin, createUserByAdmin, updateUserByAdmin, uploadUserAvatar } from '@/API/services/admin/userAdminService';
import { FaSave, FaTimes, FaUser, FaEnvelope, FaLock, FaIdCard, FaUserTag, FaUserCog, FaEye, FaEyeSlash, FaBan, FaCheckCircle, FaCamera, FaImage } from 'react-icons/fa';

// Default avatar path
const DEFAULT_AVATAR = '/img/avatar.png';

// Mở rộng interface UserForAdmin để hỗ trợ avatar
interface ExtendedUserForAdmin extends Omit<UserForAdmin, 'role' | 'accountType'> {
  avatar?: string;
  role: string | { _id: string; name: string };
  accountType: string | { _id: string; name: string };
}

interface UserFormProps {
  show: boolean;
  user: ExtendedUserForAdmin | null;
  mode: 'create' | 'edit';
  roles: RoleForAdmin[];
  accountTypes: AccountTypeForAdmin[];
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  accountType: string;
  isActive: boolean;
  avatarFile: File | null;
  avatarPreview: string | null;
}

const UserForm: React.FC<UserFormProps> = ({ 
  show, 
  user, 
  mode, 
  roles, 
  accountTypes,
  onClose, 
  onSave 
}) => {
  const initialFormData: FormData = {
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    accountType: '',
    isActive: true,
    avatarFile: null,
    avatarPreview: DEFAULT_AVATAR
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState<{[key: string]: boolean}>({
    password: false,
    confirmPassword: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && mode === 'edit') {
      // When editing an existing user, prefill the form
      const roleId = typeof user.role === 'string' ? user.role : user.role?._id || '';
      const accountTypeId = typeof user.accountType === 'string' ? user.accountType : user.accountType?._id || '';
      
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: roleId,
        accountType: accountTypeId,
        isActive: user.isActive !== undefined ? user.isActive : true,
        avatarFile: null,
        avatarPreview: user.avatar || DEFAULT_AVATAR
      });
    } else {
      // Reset form for new user
      setFormData(initialFormData);
    }
  }, [user, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const togglePasswordVisibility = (field: string) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    
    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        avatar: "Kích thước file quá lớn. Tối đa 5MB"
      }));
      return;
    }
    
    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        avatar: "Chỉ chấp nhận file hình ảnh"
      }));
      return;
    }
    
    // Tạo URL xem trước
    const previewUrl = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      avatarFile: file,
      avatarPreview: previewUrl
    }));
    
    // Xóa lỗi avatar nếu có
    if (errors.avatar) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.avatar;
        return newErrors;
      });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const useDefaultAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatarFile: null,
      avatarPreview: DEFAULT_AVATAR
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Họ tên là bắt buộc';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Password only required for new users
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (!formData.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }
    
    if (!formData.accountType) {
      newErrors.accountType = 'Loại tài khoản là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      let avatarUrl: string | undefined = undefined;
      
      // Upload avatar nếu có file mới
      if (formData.avatarFile && mode === 'edit' && user) {
        setIsUploading(true);
        try {
          console.log('Uploading avatar for user:', user._id);
          // Nếu đang chỉnh sửa người dùng, gọi API admin để upload avatar
          const response = await uploadUserAvatar(user._id, formData.avatarFile);
          
          console.log('Upload avatar response:', response);
          if (response.success) {
            avatarUrl = response.avatarUrl;
            console.log('Avatar uploaded successfully, URL:', avatarUrl);
          }
        } catch (error) {
          console.error('Upload avatar error:', error);
          setErrors(prev => ({
            ...prev,
            avatar: 'Không thể tải lên avatar. Vui lòng thử lại.'
          }));
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }      if (mode === 'create') {
        // Base user data
        // Use a more specific type compatible with the UserForAdmin interface but only include necessary fields for creation
        interface UserCreateData {
          fullname: string;
          email: string;
          password: string;
          role: string;
          accountType: string;
          isActive: boolean;
        }
        
        const userData: UserCreateData = {
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          accountType: formData.accountType,
          isActive: formData.isActive
        };
        // If there's a new avatar file, we'll need to handle it after user creation
        // For now, just create the user
        await createUserByAdmin(userData as unknown as UserForAdmin);
      } else if (mode === 'edit' && user) {
        // Base update data
        const updateData: Record<string, any> = {
          fullname: formData.fullname,
          email: formData.email,
          role: formData.role,
          accountType: formData.accountType,
          isActive: formData.isActive
        };
        
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        // Only include avatar if it was uploaded successfully
        if (avatarUrl) {
          updateData.avatar = avatarUrl;
        }
        
        // If using default avatar
        if (formData.avatarPreview === DEFAULT_AVATAR && !avatarUrl) {
          updateData.avatar = DEFAULT_AVATAR;
        }
        
        await updateUserByAdmin(user._id, updateData);
      }
      
      onSave();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi lưu người dùng' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className={`modal-header ${mode === 'create' ? 'bg-primary' : 'bg-info'}`}>
            <h5 className="modal-title">
              {mode === 'create' ? (
                <><FaUser className="me-2" /> Thêm người dùng mới</>
              ) : (
                <><FaUserCog className="me-2" /> Chỉnh sửa người dùng</>
              )}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose} 
              disabled={isSubmitting}
              aria-label="Close"
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger" role="alert">
                  {errors.submit}
                </div>
              )}
              
              {/* Avatar upload section */}
              <div className="row mb-4 justify-content-center">
                <div className="col-12 text-center">
                  <div className="avatar-upload-container">
                    <div className="avatar-preview">
                      <img 
                        src={formData.avatarPreview || DEFAULT_AVATAR} 
                        alt="User Avatar" 
                        className="avatar-image"
                        onError={(e) => { 
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_AVATAR; 
                        }}
                      />
                      {isUploading && (
                        <div className="avatar-uploading">
                          <div className="spinner-border text-light" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="avatar-actions mt-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={triggerFileInput}
                        disabled={isSubmitting || isUploading}
                      >
                        <FaCamera className="me-1" /> Chọn ảnh
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={useDefaultAvatar}
                        disabled={isSubmitting || isUploading}
                      >
                        <FaImage className="me-1" /> Mặc định
                      </button>
                      
                      <input 
                        type="file" 
                        id="avatar" 
                        name="avatar"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarChange}
                        title="Chọn ảnh đại diện"
                        aria-label="Chọn ảnh đại diện"
                        className="d-none"
                      />
                    </div>
                    
                    {errors.avatar && (
                      <div className="text-danger mt-1 small">
                        {errors.avatar}
                      </div>
                    )}
                  </div>
                </div>
              </div>              
              {/* User Information Fields */}
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="form-group">
                    <label htmlFor="fullname" className="form-label">
                      <FaUser className="icon-form me-2" /> Họ tên <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.fullname ? 'is-invalid' : ''}`}
                      id="fullname"
                      name="fullname"
                      placeholder="Nhập họ tên đầy đủ"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {errors.fullname && (
                      <div className="invalid-feedback">{errors.fullname}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <FaEnvelope className="icon-form me-2" /> Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      placeholder="Nhập địa chỉ email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      <FaLock className="icon-form me-2" />
                      {mode === 'create' ? 'Mật khẩu' : 'Mật khẩu (để trống nếu không đổi)'} 
                      {mode === 'create' && <span className="text-danger">*</span>}
                    </label>
                    <div className="input-group">
                      <input
                        type={passwordVisible.password ? "text" : "password"}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        placeholder={mode === 'create' ? "Nhập mật khẩu (ít nhất 6 ký tự)" : "Để trống nếu không thay đổi"}
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                      >
                        {passwordVisible.password ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>
                    {mode === 'create' && (
                      <small className="form-text text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      <FaLock className="icon-form me-2" /> Xác nhận mật khẩu
                      {mode === 'create' && <span className="text-danger">*</span>}
                    </label>
                    <div className="input-group">
                      <input
                        type={passwordVisible.confirmPassword ? "text" : "password"}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Xác nhận mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                      >
                        {passwordVisible.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="form-group">
                    <label htmlFor="role" className="form-label">
                      <FaUserTag className="icon-form me-2" /> Vai trò <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {roles.map(role => (
                        <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                    {errors.role && (
                      <div className="invalid-feedback">{errors.role}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="accountType" className="form-label">
                      <FaIdCard className="icon-form me-2" /> Loại tài khoản <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.accountType ? 'is-invalid' : ''}`}
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Chọn loại tài khoản --</option>
                      {accountTypes.map(type => (
                        <option key={type._id} value={type._id}>{type.name}</option>
                      ))}
                    </select>
                    {errors.accountType && (
                      <div className="invalid-feedback">{errors.accountType}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleCheckboxChange}
                      disabled={isSubmitting}
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      {formData.isActive ? (
                        <><FaCheckCircle className="text-success me-2" /> Tài khoản đang hoạt động</>
                      ) : (
                        <><FaBan className="text-danger me-2" /> Tài khoản bị vô hiệu hóa</>
                      )}
                    </label>
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
                <FaTimes className="me-2" /> Hủy
              </button>
              <button
                type="submit"
                className={`btn btn-${mode === 'create' ? 'primary' : 'info'}`}
                disabled={isSubmitting}
              >
                <FaSave className="me-2" /> {isSubmitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </div>      <style jsx>{`
        .modal-backdrop {
          background-color: rgba(0, 0, 0, 0.5);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-x: hidden;
          overflow-y: auto;
        }
        
        .modal-dialog {
          width: 100%;
          max-width: 600px;
          margin: 1.75rem auto;
        }
        
        .modal-content {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: #fff;
          border-radius: 0.3rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #dee2e6;
          border-top-left-radius: 0.3rem;
          border-top-right-radius: 0.3rem;
          color: white;
        }
        
        .modal-title {
          margin: 0;
          line-height: 1.5;
          font-size: 1.25rem;
          font-weight: 500;
        }
        
        .modal-body {
          position: relative;
          flex: 1 1 auto;
          padding: 1rem;
          max-height: 70vh;
          overflow-y: auto;
        }
        
        /* Add styles for labels */
        .form-label {
          color: #212529;
          font-weight: 500;
        }
        
        .icon-form {
          color: #0d6efd;
        }
        
        .form-check-label {
          color: #212529;
        }
        
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 1rem;
          border-top: 1px solid #dee2e6;
          border-bottom-right-radius: 0.3rem;
          border-bottom-left-radius: 0.3rem;
        }
        
        .avatar-upload-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .avatar-preview {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #f0f0f0;
          border: 3px solid #fff;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
        }
        
        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        
        .avatar-uploading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .icon-form {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default UserForm;
