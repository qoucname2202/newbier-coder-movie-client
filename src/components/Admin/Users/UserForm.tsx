// filepath: d:\Workspace\DoAnCoSo\MovieStreaming\frontend\src\components\Admin\Users\UserForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { UserForAdmin, RoleForAdmin, AccountTypeForAdmin, createUserByAdmin, updateUserByAdmin, uploadUserAvatar } from '@/API/services/admin/userAdminService';
import { FaSave, FaTimes, FaUser, FaEnvelope, FaLock, FaIdCard, FaUserTag, FaUserCog, FaEye, FaEyeSlash, FaBan, FaCheckCircle, FaCamera, FaImage } from 'react-icons/fa';

// Default avatar path
const DEFAULT_AVATAR = '/img/avatar.png';

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

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        avatar: "Kích thước file quá lớn. Tối đa 5MB"
      }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        avatar: "Chỉ chấp nhận file hình ảnh"
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData(prev => ({
      ...prev,
      avatarFile: file,
      avatarPreview: previewUrl
    }));

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

      if (formData.avatarFile && mode === 'edit' && user) {
        setIsUploading(true);
        try {
          const response = await uploadUserAvatar(user._id, formData.avatarFile);

          if (response.success) {
            avatarUrl = response.avatarUrl;
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
          <div className="modal-header">
            <h5 className="modal-title">
              {mode === 'create' ? (
                <><FaUser className="me-2 text-danger" /> Thêm người dùng mới</>
              ) : (
                <><FaUserCog className="me-2 text-danger" /> Chỉnh sửa người dùng</>
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
                      <small className="form-text text-light">Mật khẩu phải có ít nhất 6 ký tự</small>
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
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <FaTimes className="me-2" /> Hủy
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={isSubmitting}
              >
                <FaSave className="me-2" /> {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
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
          padding: 16px;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
          background-color: #111723;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          color: #cbd5e1;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: #141b29;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .modal-title {
          margin: 0;
          line-height: 1.5;
          font-size: 1.15rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          color: #ffffff;
        }

        .modal-body {
          position: relative;
          flex: 1 1 auto;
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
          background-color: #111723;
        }

        .form-label {
          color: #cbd5e1;
          font-weight: 500;
          font-size: 0.86rem;
          margin-bottom: 6px;
        }

        .icon-form {
          color: #e50914;
          opacity: 0.9;
        }

        :global(.modal-content .form-control),
        :global(.modal-content .form-select) {
          background-color: #0e131d !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f1f5f9 !important;
          border-radius: 6px !important;
          font-size: 0.88rem !important;
        }

        :global(.modal-content .form-control:focus),
        :global(.modal-content .form-select:focus) {
          border-color: #e50914 !important;
          box-shadow: none !important;
        }

        :global(.modal-content .form-control::placeholder) {
          color: #64748b !important;
        }

        .form-check-label {
          color: #cbd5e1;
          font-size: 0.88rem;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          background-color: #0e131d;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-cancel {
          height: 38px;
          padding: 0 16px;
          border-radius: 6px;
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
        }

        .btn-cancel:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        .btn-save {
          height: 38px;
          padding: 0 18px;
          border-radius: 6px;
          background-color: #e50914;
          border: 1px solid #e50914;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 8px rgba(229, 9, 20, 0.25);
          display: inline-flex;
          align-items: center;
        }

        .btn-save:hover {
          background-color: #c10711;
          border-color: #c10711;
        }

        .avatar-upload-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .avatar-actions :global(.btn) {
          border-radius: 6px !important;
          font-size: 0.8rem !important;
          font-weight: 500 !important;
          padding: 5px 12px !important;
        }

        .avatar-actions :global(.btn-outline-primary) {
          color: #f87171 !important;
          border-color: rgba(229, 9, 20, 0.4) !important;
          background: rgba(229, 9, 20, 0.08) !important;
        }

        .avatar-actions :global(.btn-outline-primary:hover) {
          background-color: #e50914 !important;
          border-color: #e50914 !important;
          color: #ffffff !important;
        }

        .avatar-actions :global(.btn-outline-secondary) {
          color: #94a3b8 !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          background: transparent !important;
        }

        .avatar-actions :global(.btn-outline-secondary:hover) {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }

        .avatar-preview {
          position: relative;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #0e131d;
          border: 3px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default UserForm;
