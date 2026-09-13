// CrawlModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaDownload, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import movieCrawlService from '../../services/admin/movieCrawlService';
import styles from '../../styles/AdminMovies.module.css';

interface CrawlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CrawlModal: React.FC<CrawlModalProps> = ({ isOpen, onClose }) => {
  const [crawlingAllMovies, setCrawlingAllMovies] = useState(false);

  if (!isOpen) return null;

  // Handle crawl all pages
  const handleCrawlAllMovies = async () => {
    try {
      setCrawlingAllMovies(true);
      toast.info("Đang bắt đầu crawl toàn bộ phim...");
      
      const result = await movieCrawlService.crawlAllMovies();
      
      if (result.message) {
        toast.success(`Crawl toàn bộ thành công! ${result.message}`);
        onClose();
      } else {
        toast.error("Crawl toàn bộ thất bại: Không có thông báo từ server");
      }
    } catch (error) {
      console.error("Lỗi khi crawl toàn bộ phim:", error);
      toast.error("Có lỗi xảy ra khi crawl toàn bộ phim");
    } finally {
      setCrawlingAllMovies(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={styles.crawlModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.crawlModalHeader}>
          <div className={styles.crawlModalHeaderContent}>
            <h3 className={styles.crawlModalTitle}>
              <FaDownload className={styles.crawlModalIcon} />
              Crawl Phim
            </h3>
            <button 
              className={styles.closeButtonX} 
              onClick={onClose}
              aria-label="Đóng"
            >×</button>
          </div>
        </div>
          <div className={styles.crawlModalBody}>
          <div className={styles.crawlDescription}>
            <p>Crawl toàn bộ phim từ nguồn bên ngoài:</p>
          </div>
          
          <div className={styles.crawlOptions}>
            <div className={styles.crawlOption}>
              <div className={styles.crawlOptionInfo}>
                <h4>Crawl Toàn Bộ Phim</h4>
                <p>Crawl tất cả phim từ tất cả các trang (có thể mất nhiều thời gian)</p>
              </div>
              <button 
                className={`${styles.crawlOptionButton} ${styles.crawlAllButton}`}
                onClick={handleCrawlAllMovies}
                disabled={crawlingAllMovies}
              >
                {crawlingAllMovies ? (
                  <>
                    <FaSync className={styles.spinningIcon} />
                    <span>Đang crawl...</span>
                  </>
                ) : (
                  <>
                    <FaDownload />
                    <span>Bắt Đầu Crawl</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className={styles.crawlWarning}>
            <FaExclamationTriangle className={styles.warningIcon} />
            <span>Lưu ý: Quá trình crawl có thể mất vài phút. Vui lòng không đóng trang trong quá trình này.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrawlModal;
