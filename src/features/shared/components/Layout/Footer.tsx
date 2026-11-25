import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FaEnvelope,
  FaHeart,
  FaFacebookF,
  FaYoutube,
  FaTiktok,
  FaTelegramPlane,
  FaDiscord,
  FaArrowUp,
  FaTv,
  FaMobileAlt,
  FaCrown,
  FaFilm,
  FaPaperPlane,
  FaCheckCircle,
  FaDesktop,
  FaQuestionCircle,
  FaBookmark,
  FaSearch
} from 'react-icons/fa';
import styles from './Footer.module.css';

/**
 * @file Footer.tsx
 * @description Master Cinema Application Footer.
 * Refined 2-pillar architecture (Brand/Community & Help/Multi-Device),
 * VIP newsletter subscription, high-contrast dark theme, and fully responsive across PC, tablet and mobile.
 */

const Footer: React.FC = () => {
  const currentYear: number = new Date().getFullYear();
  const [emailInput, setEmailInput] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    setIsSubscribed(true);
    setEmailInput('');
    setTimeout(() => {
      setIsSubscribed(false);
    }, 5000);
  };

  const scrollToTop = (): void => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className={styles.footerWrapper} aria-label="Chân trang điện ảnh Phim Cinema">
      {/* Ambient Crimson Top Lighting Beam */}
      <div className={styles.topLightBeam} />

      <div className={styles.footerContainer}>
        {/* ==========================================================================
            1. VIP CINEMA NEWSLETTER ROW
            ========================================================================== */}
        <div className={styles.newsletterCard}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterIconBadge}>
              <FaCrown />
            </div>
            <div>
              <h3 className={styles.newsletterHeading}>Newbie Coder Movie</h3>
              <p className={styles.newsletterSubtext}>
                Nhận thông báo sớm nhất về các suất chiếu bom tấn 4K, phim bộ độc quyền & tập mới mỗi ngày.
              </p>
            </div>
          </div>

          {isSubscribed ? (
            <div className={styles.newsletterToast}>
              <FaCheckCircle />
              <span>Cảm ơn bạn! Đã đăng ký nhận tin điện ảnh thành công.</span>
            </div>
          ) : (
            <form className={styles.newsletterForm} onSubmit={handleSubscribe}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  className={styles.newsletterInput}
                  placeholder="Nhập địa chỉ email của bạn..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  aria-label="Địa chỉ email nhận bản tin"
                />
              </div>
              <button type="submit" className={styles.btnSubscribe}>
                <span>Đăng Ký</span>
                <FaPaperPlane />
              </button>
            </form>
          )}
        </div>

        {/* ==========================================================================
            2. BALANCED 2-PILLAR CORE GRID (BRAND & HELP/DEVICES)
            ========================================================================== */}
        <div className={styles.footerGrid}>
          {/* Pillar 1: Brand & Cinema Experience */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brandLink} aria-label="Trang chủ Phim Cinema">
              <Image
                src="/img/phimlogo-removebg-preview.png"
                alt="Phim Cinema Logo"
                className={styles.brandLogo}
                width={150}
                height={48}
                unoptimized
              />
            </Link>

            <p className={styles.brandDescription}>
              Phát triển bởi <strong>NewbieCoder Team</strong>. Nền tảng xem phim trực tuyến hàng đầu
              với hàng chục ngàn tựa phim bom tấn chiếu rạp, anime và series truyền hình chất lượng 4K Ultra HD.
              Trải nghiệm rạp chiếu phim tại gia với âm thanh sống động và hình ảnh sắc nét.
            </p>

            {/* Technology Badges */}
            <div className={styles.techBadgePills}>
              <span className={`${styles.cinemaPill} ${styles.cinemaPillRed}`}>
                <FaFilm /> 4K Ultra HD
              </span>
              <span className={`${styles.cinemaPill} ${styles.cinemaPillGold}`}>
                <FaCrown /> Dolby Atmos 7.1
              </span>
              <span className={`${styles.cinemaPill} ${styles.cinemaPillBlue}`}>
                <FaTv /> Vietsub + Thuyết Minh
              </span>
              <span className={`${styles.cinemaPill} ${styles.cinemaPillGreen}`}>
                <FaCheckCircle /> 100% Miễn Phí
              </span>
            </div>

            {/* Social Channels */}
            <div className={styles.communityBox}>
              <p className={styles.communityTitle}>Cộng Đồng Điện Ảnh</p>
              <div className={styles.socialRow} aria-label="Mạng xã hội">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  title="Theo dõi chúng tôi trên Facebook"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  title="Kênh YouTube Phim Cinema"
                  aria-label="YouTube"
                >
                  <FaYoutube />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  title="TikTok Official"
                  aria-label="TikTok"
                >
                  <FaTiktok />
                </a>
                <a
                  href="https://telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  title="Cộng đồng Telegram"
                  aria-label="Telegram"
                >
                  <FaTelegramPlane />
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialBtn}
                  title="Máy chủ Discord"
                  aria-label="Discord"
                >
                  <FaDiscord />
                </a>
              </div>
            </div>
          </div>

          {/* Pillar 2: Help, Utilities & Multi-Device */}
          <div className={styles.supportColumn}>
            <h4 className={styles.columnHeader}>
              <span className={styles.columnHeaderIcon}>💡</span>
              <span>Trợ Giúp & Tiện Ích</span>
            </h4>

            {/* Quick Navigation Chips */}
            <div className={styles.quickLinksGrid}>
              <Link href="/faq" className={styles.quickChip}>
                <FaQuestionCircle className={styles.quickChipIcon} />
                <span>Trung Tâm Trợ Giúp & FAQ</span>
              </Link>
              <Link href="/user/favorites" className={styles.quickChip}>
                <FaHeart className={styles.quickChipIcon} />
                <span>Danh Sách Phim Yêu Thích</span>
              </Link>
              <Link href="/user/watch-later" className={styles.quickChip}>
                <FaBookmark className={styles.quickChipIcon} />
                <span>Danh Sách Xem Sau</span>
              </Link>
              <Link href="/search" className={styles.quickChip}>
                <FaSearch className={styles.quickChipIcon} />
                <span>Tìm Kiếm Phim Nâng Cao</span>
              </Link>
            </div>

            {/* Multi-Device Support Card */}
            <div className={styles.deviceCard}>
              <div className={styles.deviceTitleRow}>
                <p className={styles.deviceTitle}>Tối Ưu Cho Mọi Thiết Bị</p>
                <span className={styles.deviceStatusDot}>Sẵn Sàng</span>
              </div>
              <div className={styles.deviceGrid}>
                <div className={styles.deviceItem}>
                  <FaTv />
                  <span>Smart TV & Android Box</span>
                </div>
                <div className={styles.deviceItem}>
                  <FaMobileAlt />
                  <span>Điện Thoại & Tablet</span>
                </div>
                <div className={styles.deviceItem}>
                  <FaDesktop />
                  <span>Máy Tính & Laptop 4K</span>
                </div>
                <div className={styles.deviceItem}>
                  <FaFilm />
                  <span>Chromecast & AirPlay</span>
                </div>
              </div>
            </div>

            {/* Direct Support Contact */}
            <div className={styles.contactBox}>
              <span className={styles.contactLabel}>Hỗ trợ kỹ thuật 24/7:</span>
              <a href="mailto:duongquocnam224400@gmail.com" className={styles.contactEmailLink}>
                <FaEnvelope className="text-danger" />
                <span>duongquocnam224400@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.footerDivider} />

        {/* ==========================================================================
            3. BOTTOM SECTION: LEGAL, DISCLAIMER & COPYRIGHT
            ========================================================================== */}
        <div className={styles.footerBottomSection}>
          <p className={styles.disclaimerText}>
            <strong>Tuyên bố miễn trừ trách nhiệm:</strong> NewbieCoder Cinema là nền tảng chia sẻ và
            trải nghiệm phim trực tuyến phi thương mại phục vụ học tập và nghiên cứu công nghệ. Toàn bộ
            nội dung video được thu thập và tổng hợp tự động từ các nguồn công khai trên mạng internet.
          </p>

          <div className={styles.bottomBarRow}>
            <p className={styles.copyrightWrap}>
              &copy; {currentYear} <strong>NewbieCoder Team</strong>. All rights reserved.
              Thực hiện với <FaHeart className={styles.pulsingHeart} /> tại Việt Nam.
            </p>

            <div className={styles.legalLinksGroup}>
              <Link href="/privacy-policy" className={styles.legalLink}>Chính sách bảo mật</Link>
              <span className={styles.dotSep}>•</span>
              <Link href="/terms-of-service" className={styles.legalLink}>Điều khoản dịch vụ</Link>
              <span className={styles.dotSep}>•</span>
              <Link href="/faq" className={styles.legalLink}>Bản quyền DMCA</Link>
            </div>

            <button
              type="button"
              className={styles.btnBackToTop}
              onClick={scrollToTop}
              title="Cuộn lên đầu trang"
              aria-label="Cuộn lên đầu trang"
            >
              <span>Lên đầu trang</span>
              <FaArrowUp />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
