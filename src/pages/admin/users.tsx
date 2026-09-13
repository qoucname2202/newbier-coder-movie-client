// src/pages/admin/users.tsx
'use client'; // Cần cho hooks

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import UserTable from '@/components/Admin/Users/UserTable';
import UserForm from '@/components/Admin/Users/UserForm';
import PaginationComponent from '@/components/Admin/Common/Pagination';
import { 
  getUsersForAdmin, 
  deleteUserByAdmin, 
  toggleUserActiveStatus, 
  getRolesForAdmin, 
  getAccountTypesForAdmin
} from '@/API/services/admin/userAdminService';
import { FaUserPlus, FaUsers, FaUserShield, FaUserAlt, FaUserCog } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';

// Basic type definitions for this component
interface UserForAdmin {
  _id: string;
  fullname: string;
  email: string;
  username?: string;
  role: any;
  accountType?: any;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
  password?: string;
  avatar?: string;
  [key: string]: any;
}

interface RoleForAdmin {
  _id: string;
  name: string;
  description: string;
  permissions?: string[];
}

interface AccountTypeForAdmin {
  _id: string;
  name: string;
  description: string;
}

// Type for UserTable component
interface UserTableUser {
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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
}

// Add interface for user statistics
interface UserStats {
  totalUsers: number;
  adminCount: number;
  moderatorCount: number;
  userCount: number;
  bannedCount: number;
}

// Convert UserForAdmin to User type for UserTable component
interface UserTableUser {
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

// Extended UserForAdmin interface for UserForm component compatibility
interface ExtendedUserForAdmin {
  _id: string;
  fullname: string;
  email: string;
  avatar?: string;
  role: string | { _id: string; name: string };
  accountType: string | { _id: string; name: string };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [roles, setRoles] = useState<RoleForAdmin[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountTypeForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });
  
  // Add state for user statistics
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    adminCount: 0,
    moderatorCount: 0,
    userCount: 0,
    bannedCount: 0,
  });

  // WebSocket connection for real-time updates
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch users with pagination
  const fetchUsers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Đang tải lại danh sách người dùng...");
      
      // Thêm timestamp để tránh cache
      const params = { 
        page, 
        limit, 
        _t: Date.now() 
      };
        // Gọi API để lấy danh sách người dùng mới nhất
      const responseData = await getUsersForAdmin(params) as any;
      
      console.log("Nhận được dữ liệu người dùng mới:", responseData);
        if (responseData && Array.isArray(responseData.users)) {
        // Cập nhật state với dữ liệu mới
        setUsers(responseData.users);
        setPagination({
          currentPage: responseData.page || page,
          totalPages: responseData.totalPages || 1,
          totalUsers: responseData.total || 0,
          limit: responseData.limit || limit,
        });
      } else {
        // Fallback nếu API không trả về dữ liệu đúng định dạng
        setUsers([]);
        console.error('Invalid data format from API:', responseData);
      }
    } catch (err) {
      let errorMessage = 'Failed to fetch users';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user statistics (all users to count by role)
  const fetchUserStats = useCallback(async () => {
    try {
      // Fetch all users without pagination to get accurate stats
      const allUsersData = await getUsersForAdmin({ page: 1, limit: 1000 }) as any; // Get a large number to cover all users
      
      if (allUsersData && Array.isArray(allUsersData.users)) {
        const allUsers = allUsersData.users;
          const stats = {
          totalUsers: allUsersData.total || allUsers.length,
          adminCount: allUsers.filter((user: any) => {
            const userRole = typeof user.role === 'string' ? user.role : ((user.role as any)?.name || '');
            return userRole.toLowerCase() === 'admin';
          }).length,
          moderatorCount: allUsers.filter((user: any) => {
            const userRole = typeof user.role === 'string' ? user.role : ((user.role as any)?.name || '');
            return userRole.toLowerCase() === 'moderator';
          }).length,
          userCount: allUsers.filter((user: any) => {
            const userRole = typeof user.role === 'string' ? user.role : ((user.role as any)?.name || '');
            return userRole.toLowerCase() === 'user';
          }).length,
          bannedCount: allUsers.filter((user: any) => user && user.isActive === false).length,
        };
        
        setUserStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  }, []);
  const fetchRolesAndAccountTypes = useCallback(async () => {
    try {
      const [rolesData, accountTypesData] = await Promise.all([
        getRolesForAdmin(),
        getAccountTypesForAdmin()
      ]);
      
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        setRoles([]);
        console.error('Invalid roles data format:', rolesData);
      }
      
      if (Array.isArray(accountTypesData)) {
        setAccountTypes(accountTypesData);
      } else {
        setAccountTypes([]);
        console.error('Invalid account types data format:', accountTypesData);
      }
    } catch (err) {
      console.error('Failed to fetch roles or account types:', err);
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    // Initialize WebSocket connection
    const setupWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      const ws = new WebSocket('ws://localhost:5000');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Authenticate WebSocket connection
        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
        if (token) {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle user_updated notifications - for Premium subscription approvals
          if (data.type === 'user_updated' && data.userId && data.changes) {
            console.log('Cập nhật thông tin người dùng:', data.userId, data.changes);
              // Update the specific user in the local state
            setUsers(prevUsers => {
              return prevUsers.map(user => {
                if (user._id === data.userId) {
                  const updatedUser = {
                    ...user,
                    ...data.changes
                  };
                    // If we're changing accountType to VIP, also update role name in UI
                  if (data.changes.accountType === 'VIP') {
                    const currentRole = user.role;
                    if (typeof currentRole === 'object' && currentRole && 'name' in currentRole) {
                      updatedUser.role = {
                        ...currentRole,
                        name: data.changes.role || (currentRole as any).name || 'VIP'
                      };
                    } else {
                      updatedUser.role = data.changes.role || 'VIP';
                    }
                  }
                  
                  return updatedUser;
                }
                return user;
              });
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after a delay
        setTimeout(() => {
          if (document.visibilityState !== 'hidden') {
            setupWebSocket();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount
  useEffect(() => {
    fetchUsers(pagination.currentPage, pagination.limit);
    fetchRolesAndAccountTypes();
    fetchUserStats(); // Add this to fetch stats on component mount
  }, [pagination.currentPage, pagination.limit, fetchUsers, fetchRolesAndAccountTypes, fetchUserStats]);
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };  // Convert UserForAdmin to UserTableUser type for UserTable
  const convertToUserTableType = (users: UserForAdmin[]): UserTableUser[] => {
    return users.map(user => ({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role as string | { name: string; _id: string },
      accountType: user.accountType as string | { name: string; _id: string } | undefined,
      createdAt: user.createdAt instanceof Date 
        ? user.createdAt.toISOString() 
        : (user.createdAt as string || new Date().toISOString()),
      isActive: user.isActive,
      avatar: (user as any).avatar
    }));
  };  const handleEditUserTable = (user: UserTableUser) => {
    // Find the full user data from our users array
    const fullUser = users.find(u => u._id === user._id);
    if (fullUser) {
      // Convert to format expected by UserForm
      const userForForm = {
        ...fullUser,
        role: fullUser.role,
        accountType: fullUser.accountType,
        avatar: fullUser.avatar
      };
      setSelectedUser(userForForm);
      setFormMode('edit');
      setShowUserForm(true);
    }
  };
  const handleDeleteUser = async (userId: string) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      await deleteUserByAdmin(userId);
      // Refresh user list and stats after successful deletion
      fetchUsers(pagination.currentPage, pagination.limit);
      fetchUserStats(); // Refresh stats
    } catch (err) {
      let errorMessage = 'Failed to delete user';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleBanUser = async (userId: string, isActive: boolean) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      console.log(`Đang ${isActive ? 'mở khóa' : 'khóa'} tài khoản người dùng ${userId}`);
      
      // Gọi API để thay đổi trạng thái người dùng
      const result = await toggleUserActiveStatus(userId, isActive);
      console.log('Kết quả cập nhật:', result);
      
      // Force update UI bất kể kết quả từ API như thế nào
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, isActive: isActive } : user
        )
      );
      
      // Hiển thị thông báo thành công
      alert(`Đã ${isActive ? 'mở khóa' : 'khóa'} tài khoản người dùng thành công!`);
        // Để đồng bộ hóa dữ liệu, tải lại danh sách người dùng và stats
      setTimeout(() => {
        fetchUsers(pagination.currentPage, pagination.limit);
        fetchUserStats(); // Refresh stats after ban/unban
      }, 500);
    } catch (err) {
      let errorMessage = `Không thể ${isActive ? 'mở khóa' : 'khóa'} tài khoản người dùng`;
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      alert(errorMessage);
      console.error('Error toggling user status:', err);
    }
  };

  const handleAddNewUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setShowUserForm(true);
  };

  const handleUserFormClose = () => {
    setShowUserForm(false);
    setSelectedUser(null);
  };
  const handleUserFormSave = () => {
    // Refresh user list and stats after form save
    fetchUsers(pagination.currentPage, pagination.limit);
    fetchUserStats(); // Refresh stats after user creation/update
    handleUserFormClose();
  };// Count users by role - now uses userStats instead of current page users
  const getUserCountByRole = (roleName: any) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return userStats.adminCount;
      case 'moderator':
        return userStats.moderatorCount;
      case 'user':
        return userStats.userCount;
      default:
        return 0;
    }
  };

  // Count banned users - now uses userStats
  const getBannedUserCount = () => {
    return userStats.bannedCount;
  };

  return (
    <>
      <Head>
        <title>Quản lý người dùng - Admin Dashboard</title>
      </Head>

      <div className="user-admin-dashboard">
        <section className="content-header">      <div className="container-fluid">
            <div className="row mb-4">
              <div className="col-sm-6">
                <h1 className="page-title">Quản lý Người dùng</h1>
                <p className="text-muted">Quản lý tài khoản người dùng, phân quyền và trạng thái</p>
              </div>
              <div className="col-sm-6 d-flex justify-content-end align-items-center">
                <button 
                  type="button" 
                  className="btn btn-primary d-flex align-items-center"
                  onClick={handleAddNewUser}
                >
                  <FaUserPlus style={{ marginRight: '8px' }} /> Thêm người dùng
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">            {/* User Statistics Cards */}
            <div className="row mb-4">
              <div className="col-lg-3 col-md-6 col-sm-6 col-12 mb-3">
                <div className="info-box d-flex align-items-center">
                  <span className="info-box-icon bg-info">
                    <FaUsers />
                  </span>                  <div className="info-box-content">
                    <span className="info-box-text">Tổng người dùng</span>
                    <span className="info-box-number">{userStats.totalUsers || 0}</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6 col-12 mb-3">
                <div className="info-box d-flex align-items-center">
                  <span className="info-box-icon bg-danger">
                    <FaUserShield />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Admin</span>
                    <span className="info-box-number">{getUserCountByRole('admin')}</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6 col-12 mb-3">
                <div className="info-box d-flex align-items-center">
                  <span className="info-box-icon bg-warning">
                    <FaUserCog />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Moderator</span>
                    <span className="info-box-number">{getUserCountByRole('moderator')}</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6 col-12 mb-3">
                <div className="info-box d-flex align-items-center">
                  <span className="info-box-icon bg-secondary">
                    <FaUserAlt />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Bị cấm</span>
                    <span className="info-box-number">{getBannedUserCount()}</span>
                  </div>
                </div>
              </div>
            </div>            {/* User Table Card */}
            <div className="card">              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-bold">Danh sách người dùng</h5>
              </div>
              <div className="card-body p-0">
                {loading && (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Đang tải...</span>
                    </div>
                    <p className="mt-3 text-muted">Đang tải danh sách người dùng...</p>
                  </div>
                )}
                
                {error && (
                  <div className="alert alert-danger m-3 rounded-3" role="alert">
                    <strong>Lỗi!</strong> {error}
                  </div>
                )}
                
                {!loading && !error && (
                  <>
                    {Array.isArray(users) && users.length > 0 ? (
                      <div className="table-responsive">                        <UserTable
                          users={convertToUserTableType(users)}
                          onEdit={handleEditUserTable}
                          onDelete={handleDeleteUser}
                          onBanUser={handleBanUser}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <div className="mb-3">
                          <FaUsers size={40} className="text-muted" />
                        </div>
                        <p className="text-muted">Không có người dùng nào.</p>
                      </div>
                    )}
                  </>
                )}
              </div>              <div className="card-footer d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Hiển thị {Array.isArray(users) ? users.length : 0} trên tổng số {userStats.totalUsers} người dùng
                </small>
                <PaginationComponent
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm 
          show={showUserForm}
          user={selectedUser}
          mode={formMode}
          roles={roles}
          accountTypes={accountTypes}
          onClose={handleUserFormClose}
          onSave={handleUserFormSave}
        />
      )}      <style jsx>{`
        .user-admin-dashboard {
          animation: fadeIn 0.5s ease-in-out;
          padding: 0 1.5rem;
          background-color: #f9fafb;
          min-height: calc(100vh - 60px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .content-header {
          position: relative;
          margin-bottom: 1.5rem;
          padding-top: 1.5rem;
        }
        
        .page-title {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          color: #111827;
          letter-spacing: -0.75px;
          position: relative;
          display: inline-block;
          background: linear-gradient(to right, #111827, #374151);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-title:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          height: 5px;
          width: 60px;
          background: linear-gradient(90deg, #0ea5e9, #38bdf8);
          border-radius: 10px;
          animation: expandWidth 0.8s ease-out forwards;
        }
        
        @keyframes expandWidth {
          from { width: 0; }
          to { width: 60px; }
        }
        
        .text-muted {
          color: #64748b !important;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.6;
          opacity: 0.9;
        }
        
        .info-box {
          border-radius: 1.25rem;
          min-height: 120px;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          background-color: #fff;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04), 0 6px 15px rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.8);
          position: relative;
          padding: 0.5rem;
          backdrop-filter: blur(10px);
          isolation: isolate;
        }
        
        .info-box::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: rgba(255, 255, 255, 0.7);
          border-radius: inherit;
        }
        
        .info-box:hover {
          transform: translateY(-7px);
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.08), 0 15px 20px rgba(0, 0, 0, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.9);
        }
        
        .info-box-icon {
          height: 80px;
          width: 80px;
          font-size: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          color: white;
          margin: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
          position: relative;
          overflow: hidden;
        }
        
        .info-box-icon::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.2);
          mask: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%);
          -webkit-mask: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%);
        }
        
        .bg-info {
          background: linear-gradient(135deg, #0284c7, #38bdf8);
        }
        
        .bg-danger {
          background: linear-gradient(135deg, #dc2626, #f87171);
        }
        
        .bg-warning {
          background: linear-gradient(135deg, #d97706, #fbbf24);
        }
        
        .bg-secondary {
          background: linear-gradient(135deg, #4b5563, #9ca3af);
        }
        
        .info-box-content {
          padding: 18px 18px 18px 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .info-box-text {
          display: block;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        
        .info-box-number {
          display: block;
          font-weight: 800;
          font-size: 2.25rem;
          color: #111827;
          line-height: 1.1;
          letter-spacing: -0.5px;
          background: linear-gradient(to right, #111827, #374151);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .card {
          margin-bottom: 2rem;
          border: none;
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 6px 20px rgba(0, 0, 0, 0.03);
          background-color: #fff;
          transition: all 0.3s ease;
          position: relative;
          backdrop-filter: blur(10px);
        }
        
        .card:hover {
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06), 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        
        .card-header {
          background-color: #fff;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 1.5rem 1.75rem;
          position: relative;
        }
        
        .card-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, #e5e7eb 0%, rgba(229, 231, 235, 0.3) 100%);
        }
        
        .card-header h5 {
          font-size: 1.35rem;
          color: #111827;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .card-body {
          padding: 0;
        }
        
        .card-footer {
          padding: 1.25rem 1.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          background: linear-gradient(to bottom, rgba(248,250,252,0.8) 0%, rgba(248,250,252,1) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .spinner-border {
          width: 3.5rem;
          height: 3.5rem;
          border-width: 0.3em;
          border-color: #e0f2fe;
          border-right-color: #0ea5e9;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Buttons styling */
        .btn {
          border-radius: 12px;
          padding: 0.7rem 1.75rem;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%);
          z-index: -1;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          border: none;
          color: white;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(13, 110, 253, 0.25);
        }
        
        .btn-primary:active {
          transform: translateY(-1px);
          box-shadow: 0 5px 10px rgba(13, 110, 253, 0.2);
        }
        
        /* Table styling improvements */
        .table-responsive {
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.03);
        }
        
        table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
          margin-bottom: 0;
        }
        
        th {
          font-weight: 600;
          color: #4b5563;
          border-bottom: 2px solid #e5e7eb;
          padding: 16px 24px;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.6px;
          background-color: #f9fafb;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        td {
          padding: 18px 24px;
          border-bottom: 1px solid #f1f5f9;
          color: #1f2937;
          vertical-align: middle;
          font-size: 0.925rem;
          transition: background 0.15s ease;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tr:hover td {
          background-color: rgba(241, 245, 249, 0.7);
        }
        
        /* Status badge styling */
        .badge {
          padding: 0.4em 0.85em;
          border-radius: 50rem;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1.2;
          box-shadow: 0 2px 5px rgba(0,0,0,0.06);
        }
        
        .badge-success {
          background-color: rgba(16, 185, 129, 0.12);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        
        .badge-danger {
          background-color: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        
        /* Empty state styling */
        .empty-state {
          padding: 5rem 2rem;
          text-align: center;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          border-radius: 1rem;
        }
        
        .empty-state-icon {
          font-size: 4rem;
          color: #cbd5e1;
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }
        
        /* Loading state styling */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          border-radius: 1rem;
        }

        .loading-message {
          margin-top: 1.5rem;
          font-weight: 500;
          color: #64748b;
          font-size: 1.1rem;
        }

        /* Alert styling */
        .alert {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }

        .alert-danger {
          background-color: #fef2f2;
          color: #b91c1c;
          border-left: 4px solid #ef4444;
        }

        .alert-danger strong {
          font-weight: 600;
        }
        
        /* Responsive adjustments */
        @media (max-width: 991px) {
          .info-box {
            margin-bottom: 1.5rem;
          }
          
          .info-box-number {
            font-size: 1.75rem;
          }
          
          .page-title {
            font-size: 1.75rem;
          }
        }
        
        @media (max-width: 768px) {
          .card-header {
            padding: 1.25rem;
          }
          
          th, td {
            padding: 14px 16px;
            font-size: 0.875rem;
          }
          
          .info-box-icon {
            height: 65px;
            width: 65px;
            font-size: 1.5rem;
          }
        }
        
        @media (max-width: 576px) {
          .user-admin-dashboard {
            padding: 0 1rem;
          }
          
          .card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .card-footer > :last-child {
            width: 100%;
            display: flex;
            justify-content: center;
          }
          
          .page-title {
            font-size: 1.5rem;
          }
          
          .btn {
            padding: 0.6rem 1.25rem;
            font-size: 0.9rem;
          }
          
          .info-box {
            min-height: 100px;
          }
          
          .info-box-icon {
            height: 55px;
            width: 55px;
            font-size: 1.25rem;
            margin: 10px;
          }
          
          .info-box-text {
            font-size: 0.75rem;
          }
          
          .info-box-number {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout với bảo vệ admin
AdminUsersPage.getLayout = (page: React.ReactNode) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AdminUsersPage;