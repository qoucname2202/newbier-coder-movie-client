// src/components/Admin/Users/UserTable.tsx
import React, { useState } from 'react';
import { FaEdit, FaTrash, FaBan, FaUnlock, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaUserCircle } from 'react-icons/fa';
import ConfirmModal from '../Common/ConfirmModal';

interface User {
  _id: string;
  fullname: string;
  email: string;
  role: string | { name: string; _id: string };
  accountType?: string | { name: string; _id: string };
  status?: string;
  createdAt: string;
  isActive?: boolean;
  avatar?: string;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onBanUser: (userId: string, isActive: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users = [], onEdit, onDelete, onBanUser }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [action, setAction] = useState<'ban' | 'unban' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [newActiveState, setNewActiveState] = useState<boolean | null>(null);

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleBanClick = (user: User) => {
    setSelectedUser(user);
    
    // Xác định chính xác hành động dựa trên trạng thái HIỆN TẠI của tài khoản
    const currentUserActive = user.isActive !== false; // True nếu đang hoạt động, false nếu đã bị khóa
    
    // Action là ban/unban (khóa/mở khóa)
    setAction(currentUserActive ? 'ban' : 'unban');
    
    // isActive đại diện cho trạng thái MỚI sau khi thực hiện hành động
    // Nếu hiện tại là active, thì bạn muốn khóa (setIsActive=false)
    // Nếu hiện tại là inactive, thì bạn muốn mở khóa (setIsActive=true)
    const newActiveState = !currentUserActive;
    
    console.log(`Chuẩn bị ${currentUserActive ? 'khóa' : 'mở khóa'} tài khoản: ${user.fullname}`);
    console.log(`Trạng thái hiện tại: ${currentUserActive ? 'Đang hoạt động' : 'Đã bị khóa'}`);
    console.log(`Trạng thái mới sẽ là: ${newActiveState ? 'Hoạt động' : 'Bị khóa'}`);
    
    // Khi hiển thị modal xác nhận, trạng thái mới được lưu
    setNewActiveState(newActiveState);
    setShowBanModal(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser && selectedUser._id) {
      onDelete(selectedUser._id);
      setShowDeleteModal(false);
    }
  };
  const handleBanConfirm = () => {
    if (selectedUser && selectedUser._id) {
      // Truyền newActiveState (đã được lưu trong state) cho hàm onBanUser
      onBanUser(selectedUser._id, newActiveState as boolean);
      setShowBanModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getRoleName = (role: string | { name: string; _id: string } | undefined): string => {
    if (!role) return 'User';
    if (typeof role === 'string') return role;
    return role?.name || 'User';
  };

  const getAccountTypeName = (accountType: string | { name: string; _id: string } | undefined): string => {
    if (!accountType) return 'Normal';
    if (typeof accountType === 'string') {
      // Nếu accountType là string, trả về giá trị của nó
      // Cần xử lý đúng trường hợp "VIP" hoặc "premium"
      return accountType === 'VIP' || accountType === 'vip' ? 'VIP' : 
             accountType === 'premium' || accountType === 'Premium' ? 'Premium' : 
             'Normal';
    }
    // Nếu accountType là object với thuộc tính name, trả về tên
    return accountType?.name || 'Normal';
  };

  const getRoleStyle = (role: string | { name: string; _id: string } | undefined) => {
    if (!role) return 'badge bg-secondary';
    
    const roleName = typeof role === 'string' ? role : role?.name;
    
    switch (roleName?.toLowerCase()) {
      case 'admin':
        return 'badge bg-danger';
      case 'moderator':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  };

  const getAccountTypeStyle = (accountType: string | { name: string; _id: string } | undefined) => {
    if (!accountType) return 'badge bg-secondary';
    
    const typeName = typeof accountType === 'string' 
      ? accountType 
      : accountType?.name || '';
    
    switch (typeName.toLowerCase()) {
      case 'vip':
        return 'badge bg-success';
      case 'premium':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterRole(e.target.value === 'all' ? null : e.target.value);
  };

  // Đảm bảo users là một mảng
  const safeUsers = Array.isArray(users) ? users : [];

  // Apply filtering
  const filteredUsers = safeUsers.filter(user => {
    if (!user) return false;
    
    const fullname = user.fullname || '';
    const email = user.email || '';
    const role = getRoleName(user.role).toLowerCase();
    
    const matchesSearch = searchQuery === '' || 
      fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRoleFilter = !filterRole || role === filterRole.toLowerCase();
    
    return matchesSearch && matchesRoleFilter;
  });

  // Apply sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    
    let compareA: any;
    let compareB: any;
    
    switch (sortField) {
      case 'fullname':
        compareA = a.fullname || '';
        compareB = b.fullname || '';
        break;
      case 'email':
        compareA = a.email || '';
        compareB = b.email || '';
        break;
      case 'role':
        compareA = getRoleName(a.role);
        compareB = getRoleName(b.role);
        break;
      case 'accountType':
        compareA = getAccountTypeName(a.accountType);
        compareB = getAccountTypeName(b.accountType);
        break;
      case 'createdAt':
        compareA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        compareB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      default:
        return 0;
    }
    
    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const getAvatarUrl = (user: User) => {
    if (!user || !user.avatar) return null;
    if (typeof user.avatar === 'string') {
      if (user.avatar.startsWith('http')) return user.avatar;
      return `${baseUrl}${user.avatar}`;
    }
    return null;
  }

  return (
    <>
      <div className="user-filters mb-4 p-3">
        <div className="row align-items-center">
          <div className="col-md-6 mb-3 mb-md-0">
            <div className="input-group search-group">
              <div className="input-group-prepend">
                <span className="input-group-text bg-transparent border-right-0">
                  <FaSearch className="text-muted" />
                </span>
              </div>
              <input
                type="text"
                className="form-control border-left-0 bg-light"
                placeholder="Tìm theo tên hoặc email..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="col-md-3 mb-3 mb-md-0">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text bg-transparent border-right-0">
                  <FaFilter className="text-muted" />
                </span>
              </div>
              <select
                className="form-control border-left-0 bg-light"
                onChange={handleFilterChange}
                defaultValue="all"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
          <div className="col-md-3 text-md-right">
            <span className="badge bg-light text-dark p-2">
              {filteredUsers.length} người dùng
            </span>
          </div>
        </div>
      </div>

      <div className="user-table-container">
        <div className="table-responsive rounded">
          <table className="table table-hover user-table">
            <thead className="thead-light">
              <tr>
                <th onClick={() => handleSort('fullname')} className="sortable-header" style={{width: '25%'}}>
                  Họ Tên
                  {sortField === 'fullname' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('email')} className="sortable-header" style={{width: '25%'}}>
                  Email
                  {sortField === 'email' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('role')} className="sortable-header" style={{width: '10%'}}>
                  Vai trò
                  {sortField === 'role' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('accountType')} className="sortable-header" style={{width: '15%'}}>
                  Loại TK
                  {sortField === 'accountType' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('createdAt')} className="sortable-header" style={{width: '15%'}}>
                  Ngày tạo
                  {sortField === 'createdAt' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />}
                    </span>
                  )}
                </th>
                <th style={{width: '10%'}}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="empty-state">
                      <FaUserCircle size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">Không tìm thấy người dùng nào</h5>
                      <p className="text-muted small">Thử thay đổi bộ lọc tìm kiếm của bạn</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => {
                  if (!user || !user._id) return null;
                  const isUserInactive = user.isActive === false;
                  
                  return (
                    <tr key={user._id} className={isUserInactive ? 'banned-user' : ''}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="user-avatar mr-3">                            
                            {getAvatarUrl(user) ? (
                              <img 
                                src={getAvatarUrl(user) || '/img/avatar.png'} 
                                alt={user.fullname || 'User'} 
                                className="avatar-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/img/avatar.png';
                                }}
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                {user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            {isUserInactive && (
                              <div className="banned-badge" title="Tài khoản đã bị cấm">
                                <FaBan />
                              </div>
                            )}
                          </div>
                          <div>
                            <h6 className="mb-0">{user.fullname || 'Không có tên'}</h6>
                            <small className="text-muted">ID: {user._id.substring(0, 8)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || 'N/A'}</td>
                      <td>
                        <span className={getRoleStyle(user.role)}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={getAccountTypeStyle(user.accountType)}>
                          {getAccountTypeName(user.accountType)}
                        </span>
                      </td>
                      <td>
                        {user.createdAt ? (
                          <div className="d-flex flex-column">
                            <span>{formatDate(user.createdAt).split(',')[0]}</span>
                            <small className="text-muted">{formatDate(user.createdAt).split(',')[1]}</small>
                          </div>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-info" 
                            onClick={() => onEdit(user)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          {getRoleName(user.role).toLowerCase() !== 'admin' && (
                            <>
                              <button 
                                className={`btn btn-sm ${isUserInactive ? 'btn-outline-success' : 'btn-outline-warning'}`}
                                onClick={() => handleBanClick(user)}
                                title={isUserInactive ? "Mở khóa tài khoản này" : "Khóa tài khoản này"}
                                data-toggle="tooltip"
                                data-placement="top"
                              >
                                {isUserInactive ? <FaUnlock /> : <FaBan />}
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDeleteClick(user)}
                                title="Xóa"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa người dùng ${selectedUser?.fullname || ''}?`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />      {/* Ban/Unban Confirmation Modal */}
      <ConfirmModal
        show={showBanModal}
        title={action === 'ban' ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa tài khoản"}
        message={
          action === 'ban' 
            ? `Bạn có chắc chắn muốn khóa tài khoản người dùng "${selectedUser?.fullname || ''}"? Người dùng sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa.`
            : `Bạn có chắc chắn muốn mở khóa tài khoản người dùng "${selectedUser?.fullname || ''}"? Người dùng sẽ có thể đăng nhập và sử dụng hệ thống bình thường.`
        }
        confirmText={action === 'ban' ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        cancelText="Hủy"
        onConfirm={handleBanConfirm}
        onCancel={() => setShowBanModal(false)}
      />

      <style jsx>{`
        .user-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .user-table thead th {
          background-color: #f8f9fa;
          border-top: none;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
          color: #495057;
          padding: 0.85rem;
        }
        
        .sortable-header {
          cursor: pointer;
          user-select: none;
          position: relative;
        }
        
        .sortable-header:hover {
          background-color: #f1f1f1;
        }
        
        .user-table tbody tr {
          transition: all 0.2s;
          position: relative;
        }
        
        .user-table tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.03);
        }
        
        .banned-user {
          background-color: rgba(253, 237, 237, 0.4);
        }
        
        .banned-user:hover {
          background-color: rgba(253, 237, 237, 0.6) !important;
        }
        
        .banned-user td {
          color: #6c757d;
        }
        
        .banned-user::after {
          content: "";
          position: absolute;
          left: 0;
          width: 4px;
          top: 0;
          bottom: 0;
          background-color: #dc3545;
          opacity: 0.7;
        }
        
        .user-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #007bff;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .banned-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #dc3545;
          color: white;
          font-size: 10px;
          border-radius: 50%;
          border: 2px solid white;
        }
        
        .empty-state {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .search-group {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
          border-radius: 4px;
        }
        
        .search-group input, .search-group .input-group-text {
          border-color: #eaeaea;
        }
        
        .btn-group .btn {
          margin-right: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
        }
        
        .user-filters {
          background-color: white;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 0 10px rgba(0,0,0,0.03);
        }
      `}</style>
    </>
  );
};

export default UserTable;