import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaVideo, 
  FaImage, 
  FaUndo 
} from 'react-icons/fa';
import adService from '@/API/services/adService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Advertisement {
  _id: string;
  name: string;
  type: 'video' | 'banner_top' | 'banner_bottom';
  advertiser: string;
  content: string;
  thumbnail?: string;
  link: string;
  duration?: number;
  active: boolean;
  impressions: number;
  clicks: number;
  skips?: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AdFormData {
  name: string;
  type: 'video' | 'banner_top' | 'banner_bottom';
  advertiser: string;
  content: string;
  thumbnail?: string;
  link: string;
  duration?: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

const AdvertisementPage = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdFormData>({
    name: '',
    type: 'video',
    advertiser: '',
    content: '',
    thumbnail: '',
    link: '',
    duration: 15,
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const router = useRouter();
    useEffect(() => {
    fetchAdvertisements();
  }, [currentPage, filterType, filterActive, searchQuery]);
  
  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      
      // Use a try-catch with a simpler approach to handle backend connectivity
      try {
        // Test API connectivity with a simple check
        const connectionTest = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/health-check`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000) // 3 second timeout for the connectivity test
        });
        
        if (!connectionTest.ok) throw new Error('API server connection failed');
      } catch (connectionError) {
        console.warn('API server may be down:', connectionError);
        // Continue with the request anyway, but we've logged the potential issue
      }
      
      const result = await adService.getAllAds(
        currentPage,
        10,
        filterType || null,
        filterActive !== '' ? filterActive === 'true' : null
      );

      if (result && result.success) {
        const filtered = searchQuery 
          ? result.advertisements.filter((ad: Advertisement) => 
              ad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ad.advertiser.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : result.advertisements;
          
        setAdvertisements(filtered);
        setTotalPages(result.totalPages || 1);
      } else {
        // Handle case where result exists but success is false
        console.error('Error in API response:', result);
        toast.error('Có lỗi khi tải dữ liệu quảng cáo');
        // Try to provide more helpful error message
        if (result && result.error) {
          console.error('Error details:', result.error);
        }
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      toast.error('Có lỗi khi tải dữ liệu quảng cáo');
      setAdvertisements([]); // Set empty array to avoid undefined errors
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenModal = (ad?: Advertisement) => {
    if (ad) {
      // Edit mode
      setSelectedAd(ad);
      setFormData({
        name: ad.name,
        type: ad.type,
        advertiser: ad.advertiser,
        content: ad.content,
        thumbnail: ad.thumbnail || '',
        link: ad.link,
        duration: ad.duration || 15,
        active: ad.active,
        startDate: new Date(ad.startDate).toISOString().split('T')[0],
        endDate: new Date(ad.endDate).toISOString().split('T')[0]
      });
    } else {
      // Create mode
      setSelectedAd(null);
      setFormData({
        name: '',
        type: 'video',
        advertiser: '',
        content: '',
        thumbnail: '',
        link: '',
        duration: 15,
        active: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));      } else if (name === 'type') {
        // Handle changing ad types correctly
        const adType = value as 'video' | 'banner_top' | 'banner_bottom';
        // When changing from video to banner, no need for duration
        if (formData.type === 'video' && adType !== 'video') {
          setFormData(prev => ({
            ...prev,
            [name]: adType,
            duration: undefined
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [name]: adType,
            // Restore default duration for video ads if needed
            ...(adType === 'video' && !formData.duration ? { duration: 15 } : {})
          }));
        }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure proper date formatting
      const dataToSubmit = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate,
        active: Boolean(formData.active)
      };
      
      console.log('Submitting advertisement data:', dataToSubmit);
      
      if (selectedAd) {
        // Update existing ad
        const result = await adService.updateAd(selectedAd._id, dataToSubmit);
        if (result && result.success) {
          toast.success('Quảng cáo đã được cập nhật thành công');
          setModalOpen(false);
          fetchAdvertisements();
        } else {
          toast.error('Có lỗi khi cập nhật quảng cáo');
          console.error('Error in update response:', result);
        }
      } else {
        // Create new ad
        const result = await adService.createAd(dataToSubmit);
        if (result && result.success) {
          toast.success('Quảng cáo mới đã được tạo thành công');
          setModalOpen(false);
          fetchAdvertisements();
        } else {
          toast.error('Có lỗi khi tạo quảng cáo mới');
          console.error('Error in create response:', result?.error || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast.error('Có lỗi khi lưu quảng cáo');
    }
  };
  
  const handleConfirmDelete = (ad: Advertisement) => {
    setSelectedAd(ad);
    setDeleteModalOpen(true);
  };
    const handleDelete = async () => {
    if (!selectedAd) return;
    
    try {
      const result = await adService.deleteAd(selectedAd._id);
      if (result && result.success) {
        toast.success('Quảng cáo đã được xóa thành công');
        setDeleteModalOpen(false);
        fetchAdvertisements();
      } else {
        console.error('Error in delete response:', result);
        toast.error('Có lỗi khi xóa quảng cáo');
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast.error('Có lỗi khi xóa quảng cáo');
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdvertisements();
  };
  
  const resetFilters = () => {
    setFilterType('');
    setFilterActive('');
    setSearchQuery('');
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <FaVideo className="text-blue-500" />;
      case 'banner_top':
        return <FaImage className="text-green-500" />;
      case 'banner_bottom':
        return <FaImage className="text-purple-500" />;
      default:
        return <FaImage className="text-gray-500" />;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video quảng cáo';
      case 'banner_top':
        return 'Banner đầu trang';
      case 'banner_bottom':
        return 'Banner cuối trang';
      default:
        return 'Không xác định';
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-4">
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
          <h1 className="h3 mb-0 text-black fw-bold">Quản lý Quảng Cáo</h1>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
          >
            <FaPlus className="me-1" /> Thêm quảng cáo mới
          </button>
        </div>

        {/* Filter and Search */}
        <div className="card shadow mb-4">
          <div className="card-header py-3 d-flex justify-content-between align-items-center">
            <h6 className="m-0 font-weight-bold text-primary">Danh sách quảng cáo</h6>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={resetFilters}
              disabled={!filterType && !filterActive && !searchQuery}
            >
              <FaUndo className="me-1" /> Đặt lại bộ lọc
            </button>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-3">
                <label htmlFor="typeFilter" className="form-label">Loại quảng cáo</label>
                <select
                  id="typeFilter"
                  className="form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="video">Video quảng cáo</option>
                  <option value="banner_top">Banner đầu trang</option>
                  <option value="banner_bottom">Banner cuối trang</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="activeFilter" className="form-label">Trạng thái</label>
                <select
                  id="activeFilter"
                  className="form-select"
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Đã tắt</option>
                </select>
              </div>
              <div className="col-md-6">
                <form onSubmit={handleSearch}>
                  <label htmlFor="searchQuery" className="form-label">Tìm kiếm</label>
                  <div className="input-group">
                    <input
                      type="text"
                      id="searchQuery"
                      className="form-control"
                      placeholder="Tìm theo tên, nhà quảng cáo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      Tìm kiếm
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Advertisements Table */}
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Tên</th>
                    <th>Loại</th>
                    <th>Nhà quảng cáo</th>
                    <th>Trạng thái</th>
                    <th>Thống kê</th>
                    <th>Thời hạn</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Đang tải...</span>
                        </div>
                      </td>
                    </tr>
                  ) : advertisements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        Không có quảng cáo nào được tìm thấy
                      </td>
                    </tr>
                  ) : (
                    advertisements.map((ad) => (
                      <tr key={ad._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {ad.thumbnail ? (
                              <img
                                src={ad.thumbnail}
                                alt={ad.name}
                                className="me-2"
                                style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                              />
                            ) : (
                              <div className="bg-light d-flex align-items-center justify-content-center me-2" 
                                style={{ width: "40px", height: "40px", borderRadius: "4px" }}>
                                {getTypeIcon(ad.type)}
                              </div>
                            )}
                            <div>
                              <div className="fw-bold">{ad.name}</div>
                              <div className="small text-muted" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {ad.content}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{getTypeLabel(ad.type)}</td>
                        <td>{ad.advertiser}</td>
                        <td>
                          {ad.active ? (
                            <span className="badge bg-success">Đang hoạt động</span>
                          ) : (
                            <span className="badge bg-secondary">Đã tắt</span>
                          )}
                        </td>
                        <td>
                          <div className="small">
                            <div><strong>Hiển thị:</strong> {ad.impressions}</div>
                            <div><strong>Clicks:</strong> {ad.clicks}</div>
                            {ad.type === 'video' && (
                              <div><strong>Bỏ qua:</strong> {ad.skips}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div><strong>Từ:</strong> {formatDate(ad.startDate)}</div>
                            <div><strong>Đến:</strong> {formatDate(ad.endDate)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleOpenModal(ad)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleConfirmDelete(ad)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <nav>
                <ul className="pagination justify-content-center mt-4">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Tiếp
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedAd ? 'Chỉnh sửa quảng cáo' : 'Thêm quảng cáo mới'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label">Tên quảng cáo <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="advertiser" className="form-label">Nhà quảng cáo <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        id="advertiser"
                        name="advertiser"
                        value={formData.advertiser}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="type" className="form-label">Loại quảng cáo <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="video">Video quảng cáo</option>
                        <option value="banner_top">Banner đầu trang</option>
                        <option value="banner_bottom">Banner cuối trang</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="link" className="form-label">Liên kết <span className="text-danger">*</span></label>
                      <input
                        type="url"
                        className="form-control"
                        id="link"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">Nội dung (URL) <span className="text-danger">*</span></label>
                    <input
                      type="url"
                      className="form-control"
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder={formData.type === 'video' ? 'URL video quảng cáo' : 'URL hình ảnh quảng cáo'}
                      required
                    />
                    <div className="form-text">
                      {formData.type === 'video' 
                        ? 'URL video quảng cáo (ví dụ: link từ Youtube, Google Drive hoặc storage khác)' 
                        : 'URL hình ảnh quảng cáo (ví dụ: link từ imgbb, Google Drive, hoặc storage khác)'}
                    </div>
                  </div>
                  
                  {formData.type === 'video' && (
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="duration" className="form-label">Thời lượng (giây)</label>
                        <input
                          type="number"
                          className="form-control"
                          id="duration"
                          name="duration"
                          value={formData.duration}
                          onChange={handleChange}
                          min="1"
                          max="60"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="thumbnail" className="form-label">Thumbnail (URL)</label>
                        <input
                          type="url"
                          className="form-control"
                          id="thumbnail"
                          name="thumbnail"
                          value={formData.thumbnail}
                          onChange={handleChange}
                          placeholder="URL hình thumbnail cho quảng cáo video"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="startDate" className="form-label">Ngày bắt đầu <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="endDate" className="form-label">Ngày kết thúc <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="active"
                      name="active"
                      checked={formData.active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="active">
                      Kích hoạt quảng cáo
                    </label>
                  </div>
                  
                  {formData.content && (
                    <div className="mb-3">
                      <label className="form-label">Xem trước:</label>
                      <div className="preview-container border rounded p-3">
                        {formData.type === 'video' ? (
                          <div className="ratio ratio-16x9 mb-2">
                            <video src={formData.content} controls className="rounded" />
                          </div>
                        ) : (
                          <img 
                            src={formData.content} 
                            alt="Banner preview" 
                            className="img-fluid rounded" 
                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedAd ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedAd && (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận xóa</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xóa quảng cáo <strong>{selectedAd.name}</strong>?</p>
                <p className="text-danger">Hành động này không thể hoàn tác!</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </AdminLayout>
  );
};

export default AdvertisementPage; 