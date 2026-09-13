import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import { 
  sendMaintenanceNotification, 
  sendCustomNotification, 
  getNotificationHistory 
} from '@/API/services/admin/emailNotificationService';
import { toast } from 'react-hot-toast';
import { Card, Button, Spinner, Modal } from 'react-bootstrap';

// CSS Module
import styles from '@/styles/EmailNotificationCustom.module.css';
import emailStyles from '@/styles/EmailNotification.module.css';

// TypeScript interfaces
interface MaintenanceFormData {
  subject: string;
  message: string;
  maintenanceTime: string;
  expectedDuration: string;
  userGroup: 'all' | 'premium' | 'free';
}

interface CustomFormData {
  subject: string;
  message: string;
  htmlContent: string;
  userGroup: 'all' | 'premium' | 'free';
}

interface ApiResponse {
  success: boolean;
  message?: string;
  count?: number;
  data?: any[];
  pages?: number;
}

interface NotificationHistoryItem {
  _id: string;
  subject: string;
  message: string;
  type: string;
  userGroup: string;
  sentBy: string;
  recipientCount: number;
  status: string;
  createdAt: string;
}

// Component for notification content
function NotificationContent() {
  const router = useRouter();

  // State for maintenance notification
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceFormData>({
    subject: 'Thông báo bảo trì hệ thống Movie Streaming',
    message: '',
    maintenanceTime: '',
    expectedDuration: '',
    userGroup: 'all'
  });

  // State for custom notification
  const [customForm, setCustomForm] = useState<CustomFormData>({
    subject: '',
    message: '',
    htmlContent: '',
    userGroup: 'all'
  });

  // State for loading and tabs
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('maintenance');
  const [historyTab, setHistoryTab] = useState(false);
  
  // State for preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    subject: '',
    content: '',
    recipients: '',
    formType: 'maintenance' as 'maintenance' | 'custom'
  });

  // State for notification history
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  // Trạng thái tải lịch sử thông báo
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Tải lịch sử thông báo khi component được mount hoặc khi trang thay đổi
  useEffect(() => {
    if (historyTab) {
      fetchNotificationHistory();
    }
  }, [currentPage, historyTab]);

  // Hàm để lấy lịch sử thông báo
  const fetchNotificationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await getNotificationHistory({ 
        page: currentPage, 
        limit: 10 
      }) as ApiResponse;
      
      if (response.success) {
        setNotificationHistory(response.data || []);
        setTotalPages(response.pages || 1);
      } else {
        toast.error(response.message || 'Không thể tải lịch sử thông báo');
      }
    } catch (error: any) {
      console.error('Error fetching notification history:', error);
      toast.error('Không thể tải lịch sử thông báo: ' + (error.message || 'Đã xảy ra lỗi'));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle maintenance form change
  const handleMaintenanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMaintenanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle custom form change
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Preview maintenance notification
  const handleMaintenancePreview = () => {
    let recipients = '';
    
    switch(maintenanceForm.userGroup) {
      case 'all':
        recipients = 'Tất cả người dùng';
        break;
      case 'premium':
        recipients = 'Người dùng Premium';
        break;
      case 'free':
        recipients = 'Người dùng miễn phí';
        break;
    }

    // Format maintenance time
    const startTime = maintenanceForm.maintenanceTime ? 
      new Date(maintenanceForm.maintenanceTime).toLocaleString('vi-VN') : '';
    const endTime = maintenanceForm.expectedDuration ? 
      new Date(maintenanceForm.expectedDuration).toLocaleString('vi-VN') : '';

    // Create preview content
    const previewContent = `
Xin chào,

${maintenanceForm.message}

Thời gian bắt đầu bảo trì: ${startTime}
Thời gian dự kiến hoàn thành: ${endTime}

Chúng tôi rất xin lỗi vì sự bất tiện này và cảm ơn sự thông cảm của bạn.

Trân trọng,
Đội ngũ Movie Streaming
    `;

    setPreviewData({
      subject: maintenanceForm.subject,
      content: previewContent,
      recipients,
      formType: 'maintenance'
    });

    setShowPreview(true);
  };

  // Preview custom notification
  const handleCustomPreview = () => {
    let recipients = '';
    
    switch(customForm.userGroup) {
      case 'all':
        recipients = 'Tất cả người dùng';
        break;
      case 'premium':
        recipients = 'Người dùng Premium';
        break;
      case 'free':
        recipients = 'Người dùng miễn phí';
        break;
    }

    // Preview content
    const previewContent = customForm.htmlContent || customForm.message;

    setPreviewData({
      subject: customForm.subject,
      content: previewContent,
      recipients,
      formType: 'custom'
    });

    setShowPreview(true);
  };

  // Send maintenance notification
  const handleMaintenanceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!maintenanceForm.message || !maintenanceForm.maintenanceTime || !maintenanceForm.expectedDuration) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendMaintenanceNotification(maintenanceForm) as ApiResponse;
      
      if (response.success) {
        toast.success(`Đã gửi thông báo bảo trì thành công đến ${response.count || 0} người dùng`);
        
        // Reset form after successful submission
        setMaintenanceForm({
          subject: 'Thông báo bảo trì hệ thống Movie Streaming',
          message: '',
          maintenanceTime: '',
          expectedDuration: '',
          userGroup: 'all'
        });
        
        // Update notification history
        if (historyTab) {
          fetchNotificationHistory();
        }
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi gửi thông báo');
      }
    } catch (error: any) {
      console.error('Error sending maintenance notification:', error);
      toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể gửi thông báo'));
    } finally {
      setIsLoading(false);
    }
  };

  // Send custom notification
  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!customForm.subject || !customForm.message) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendCustomNotification(customForm) as ApiResponse;
      
      if (response.success) {
        toast.success(`Đã gửi thông báo tùy chỉnh thành công đến ${response.count || 0} người dùng`);
        
        // Reset form after successful submission
        setCustomForm({
          subject: '',
          message: '',
          htmlContent: '',
          userGroup: 'all'
        });

        // Update notification history
        if (historyTab) {
          fetchNotificationHistory();
        }
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi gửi thông báo');
      }
    } catch (error: any) {
      console.error('Error sending custom notification:', error);
      toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể gửi thông báo'));
    } finally {
      setIsLoading(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'success':
        return <span className={emailStyles.successBadge}>Thành công</span>;
      case 'failed':
        return <span className={emailStyles.failureBadge}>Thất bại</span>;
      case 'partial':
        return <span className={emailStyles.partialBadge}>Một phần</span>;
      default:
        return <span className={emailStyles.partialBadge}>{status}</span>;
    }
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <li key={i} className={emailStyles.pageItem}>
          <button 
            className={`${emailStyles.pageLink} ${currentPage === i ? emailStyles.activePageLink : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        </li>
      );
    }
    
    return items;
  };

  // Get user group text
  const getUserGroupText = (group: string) => {
    switch(group) {
      case 'all':
        return 'Tất cả';
      case 'premium':
        return 'Premium';
      case 'free':
        return 'Miễn phí';
      default:
        return group;
    }
  };
  return (
    <>
      <Head>
        <title>Quản lý thông báo | Movie Streaming Admin</title>
      </Head>

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Quản lý thông báo qua Email</h1>
        </div>

        <div className={emailStyles.tabsContainer}>
          <div className={emailStyles.tabHeader}>
            <button 
              className={`${emailStyles.tabButton} ${!historyTab && activeTab === 'maintenance' ? emailStyles.activeTab : ''}`}
              onClick={() => { setHistoryTab(false); setActiveTab('maintenance') }}
            >
              Thông báo bảo trì
            </button>
            <button 
              className={`${emailStyles.tabButton} ${!historyTab && activeTab === 'custom' ? emailStyles.activeTab : ''}`}
              onClick={() => { setHistoryTab(false); setActiveTab('custom') }}
            >
              Thông báo tùy chỉnh
            </button>
            <button 
              className={`${emailStyles.tabButton} ${historyTab ? emailStyles.activeTab : ''}`}
              onClick={() => { setHistoryTab(true); fetchNotificationHistory(); }}
            >
              Lịch sử thông báo
            </button>
          </div>

          <Card className={emailStyles.notificationCard}>
            {!historyTab && activeTab === 'maintenance' && (
              <div className={emailStyles.formWrapper}>
                <h2 className={emailStyles.sectionTitle}>Gửi thông báo bảo trì hệ thống</h2>
                <p className={emailStyles.sectionDescription}>
                  Thông báo sẽ được gửi tới nhóm người dùng được chỉ định thông qua email.
                </p>

                <form onSubmit={handleMaintenanceSubmit}>
                  <div className={emailStyles.formGroup}>
                    <label htmlFor="subject" className={emailStyles.formLabel}>
                      Tiêu đề email
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className={emailStyles.formInput}
                      value={maintenanceForm.subject}
                      onChange={handleMaintenanceChange}
                      required
                    />
                  </div>

                  <div className={emailStyles.formGroup}>
                    <label htmlFor="message" className={emailStyles.formLabel}>
                      Nội dung thông báo
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      className={emailStyles.formTextarea}
                      value={maintenanceForm.message}
                      onChange={handleMaintenanceChange}
                      rows={5}
                      placeholder="Nhập nội dung thông báo bảo trì..."
                      required
                    />
                  </div>

                  <div className={emailStyles.formGroup}>
                    <label htmlFor="userGroup" className={emailStyles.formLabel}>
                      Gửi đến nhóm người dùng
                    </label>
                    <select
                      id="userGroup"
                      name="userGroup"
                      className={emailStyles.formInput}
                      value={maintenanceForm.userGroup}
                      onChange={handleMaintenanceChange}
                    >
                      <option value="all">Tất cả người dùng</option>
                      <option value="premium">Chỉ người dùng Premium</option>
                      <option value="free">Chỉ người dùng miễn phí</option>
                    </select>
                  </div>

                  <div className={emailStyles.formRow}>
                    <div className={emailStyles.formGroup}>
                      <label htmlFor="maintenanceTime" className={emailStyles.formLabel}>
                        Thời gian bắt đầu bảo trì
                      </label>
                      <input
                        type="datetime-local"
                        id="maintenanceTime"
                        name="maintenanceTime"
                        className={emailStyles.formInput}
                        value={maintenanceForm.maintenanceTime}
                        onChange={handleMaintenanceChange}
                        required
                      />
                    </div>

                    <div className={emailStyles.formGroup}>
                      <label htmlFor="expectedDuration" className={emailStyles.formLabel}>
                        Thời gian dự kiến hoàn thành
                      </label>
                      <input
                        type="datetime-local"
                        id="expectedDuration"
                        name="expectedDuration"
                        className={emailStyles.formInput}
                        value={maintenanceForm.expectedDuration}
                        onChange={handleMaintenanceChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={emailStyles.buttonGroup}>
                    <button
                      type="button"
                      className={emailStyles.previewButton}
                      onClick={handleMaintenancePreview}
                    >
                      Xem trước
                    </button>
                    <button
                      type="submit"
                      className={emailStyles.submitButton}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" /> Đang gửi...
                        </>
                      ) : (
                        'Gửi thông báo bảo trì'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!historyTab && activeTab === 'custom' && (
              <div className={emailStyles.formWrapper}>
                <h2 className={emailStyles.sectionTitle}>Gửi thông báo tùy chỉnh</h2>
                <p className={emailStyles.sectionDescription}>
                  Tạo và gửi thông báo có nội dung tùy chỉnh tới người dùng hệ thống.
                </p>

                <form onSubmit={handleCustomSubmit}>
                  <div className={emailStyles.formGroup}>
                    <label htmlFor="custom-subject" className={emailStyles.formLabel}>
                      Tiêu đề email
                    </label>
                    <input
                      type="text"
                      id="custom-subject"
                      name="subject"
                      className={emailStyles.formInput}
                      value={customForm.subject}
                      onChange={handleCustomChange}
                      placeholder="Nhập tiêu đề email..."
                      required
                    />
                  </div>

                  <div className={emailStyles.formGroup}>
                    <label htmlFor="custom-message" className={emailStyles.formLabel}>
                      Nội dung thông báo
                    </label>
                    <textarea
                      id="custom-message"
                      name="message"
                      className={emailStyles.formTextarea}
                      value={customForm.message}
                      onChange={handleCustomChange}
                      rows={5}
                      placeholder="Nhập nội dung thông báo..."
                      required
                    />
                  </div>

                  <div className={emailStyles.formGroup}>
                    <label htmlFor="custom-userGroup" className={emailStyles.formLabel}>
                      Gửi đến nhóm người dùng
                    </label>
                    <select
                      id="custom-userGroup"
                      name="userGroup"
                      className={emailStyles.formInput}
                      value={customForm.userGroup}
                      onChange={handleCustomChange}
                    >
                      <option value="all">Tất cả người dùng</option>
                      <option value="premium">Chỉ người dùng Premium</option>
                      <option value="free">Chỉ người dùng miễn phí</option>
                    </select>
                  </div>

                  <div className={emailStyles.formGroup}>
                    <label htmlFor="htmlContent" className={emailStyles.formLabel}>
                      Nội dung HTML (tùy chọn)
                    </label>
                    <textarea
                      id="htmlContent"
                      name="htmlContent"
                      className={emailStyles.formTextarea}
                      value={customForm.htmlContent}
                      onChange={handleCustomChange}
                      rows={8}
                      placeholder="Nhập mã HTML cho email (nếu cần)..."
                    />
                  </div>

                  <div className={emailStyles.buttonGroup}>
                    <button
                      type="button"
                      className={emailStyles.previewButton}
                      onClick={handleCustomPreview}
                    >
                      Xem trước
                    </button>
                    <button
                      type="submit"
                      className={emailStyles.submitButton}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" /> Đang gửi...
                        </>
                      ) : (
                        'Gửi thông báo tùy chỉnh'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {historyTab && (
              <div className={emailStyles.formWrapper}>
                <h2 className={emailStyles.sectionTitle}>Lịch sử thông báo đã gửi</h2>
                
                {isLoadingHistory ? (
                  <div className={emailStyles.loadingContainer}>
                    <Spinner animation="border" />
                    <p>Đang tải dữ liệu...</p>
                  </div>
                ) : notificationHistory.length === 0 ? (
                  <div className={emailStyles.noHistory}>
                    <p>Chưa có thông báo nào được gửi.</p>
                  </div>
                ) : (
                  <>
                    <div className={emailStyles.tableResponsive}>
                      <table className={emailStyles.historyTable}>
                        <thead>
                          <tr>
                            <th>Tiêu đề</th>
                            <th>Loại</th>
                            <th>Nhóm người dùng</th>
                            <th>Số người nhận</th>
                            <th>Trạng thái</th>
                            <th>Thời gian gửi</th>
                          </tr>                        </thead>
                        <tbody>
                          {Array.isArray(notificationHistory) && notificationHistory.map((item) => {
                            if (!item || typeof item !== 'object') return null;
                            return (
                              <tr key={item._id || Math.random().toString()}>
                                <td>{item.subject || 'N/A'}</td>
                                <td>{item.type === 'maintenance' ? 'Bảo trì' : 'Tùy chỉnh'}</td>
                                <td>{getUserGroupText(item.userGroup || 'all')}</td>
                                <td>{item.recipientCount || 0}</td>                                <td>{renderStatusBadge(item.status || 'unknown')}</td>
                                <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <ul className={emailStyles.pagination}>
                        <li className={emailStyles.pageItem}>
                          <button 
                            className={emailStyles.pageLink}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            &laquo;
                          </button>
                        </li>
                        
                        {renderPaginationItems()}
                        
                        <li className={emailStyles.pageItem}>
                          <button 
                            className={emailStyles.pageLink}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            &raquo;
                          </button>
                        </li>
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal xem trước email */}
      <Modal 
        show={showPreview} 
        onHide={() => setShowPreview(false)}
        size="lg"
        centered
        className={emailStyles.previewModal}
      >
        <Modal.Header className={emailStyles.previewModalHeader} closeButton>
          <Modal.Title className={emailStyles.previewModalTitle}>
            Xem trước email
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={emailStyles.previewModalBody}>
          <div className={emailStyles.previewEmailContainer}>
            <div className={emailStyles.previewEmailHeader}>
              <div className={emailStyles.previewSubject}>
                <strong>Tiêu đề:</strong> {previewData.subject}
              </div>
              <div className={emailStyles.previewRecipients}>
                <strong>Gửi đến:</strong> {previewData.recipients}
              </div>
            </div>
            
            <div className={emailStyles.previewContent}>
              {previewData.formType === 'custom' && previewData.content.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: previewData.content }} />
              ) : (
                previewData.content
              )}
            </div>
          </div>
          
          <div className={emailStyles.previewActions}>
            <Button 
              variant="secondary" 
              onClick={() => setShowPreview(false)}
            >
              Đóng
            </Button>          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

// Export the page component
export default function EmailPage() {
  return (
    <AdminLayout>
      <NotificationContent />
    </AdminLayout>
  );
}
