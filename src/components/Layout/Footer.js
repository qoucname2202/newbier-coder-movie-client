import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-6 mb-4 mb-md-0">
            <div className="footer-brand mb-3">
              <img
                src="/img/phimlogo-removebg-preview.png"
                alt="Logo"
                className="footer-logo"
              />
            </div>
            <p className="footer-description">
              Trang web xem phim trực tuyến với hàng ngàn bộ phim mới và phổ biến từ nhiều quốc gia và nhiều thể loại khác nhau.
              Trải nghiệm xem phim tuyệt vời với chất lượng cao.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><FaFacebook /></a>
              <a href="#" className="social-link"><FaTwitter /></a>
              <a href="#" className="social-link"><FaInstagram /></a>
              <a href="#" className="social-link"><FaYoutube /></a>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 mb-4 mb-md-0">
            <h5 className="footer-heading">Liên kết</h5>
            <ul className="footer-links">
              <li><Link href="/">Trang chủ</Link></li>
              <li><Link href="/movies">Phim lẻ</Link></li>
              <li><Link href="/series">Phim bộ</Link></li>
              <li><Link href="/search">Tìm kiếm</Link></li>
              <li><Link href="/favorites">Yêu thích</Link></li>
              <li><Link href="/watchlater">Xem sau</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 mb-4 mb-md-0">
            <h5 className="footer-heading">Thể loại</h5>
            <ul className="footer-links">
              <li><Link href="/search?category=Hành Động">Hành Động</Link></li>
              <li><Link href="/search?category=Tình Cảm">Tình Cảm</Link></li>
              <li><Link href="/search?category=Hài Hước">Hài Hước</Link></li>
              <li><Link href="/search?category=Kinh Dị">Kinh Dị</Link></li>
              <li><Link href="/search?category=Viễn Tưởng">Viễn Tưởng</Link></li>
              <li><Link href="/search?category=Hoạt Hình">Hoạt Hình</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-6">
            <h5 className="footer-heading">Liên hệ</h5>
            <ul className="contact-info">
              <li>
                <FaMapMarkerAlt className="contact-icon" />
                <span>TỔ 9 Ấp 4 Xã Suối Nho, Huyện Định Quán, Tỉnh Đồng Nai </span>
              </li>
              <li>
                <FaPhoneAlt className="contact-icon" />
                <span>0986585532</span>
              </li>
              <li>
                <FaEnvelope className="contact-icon" />
                <span>quangnguyen31072004@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} Web Made  <FaHeart className="heart-icon" /> in Vietnam
          </p>
          <div className="footer-bottom-links">
            <Link href="/privacy-policy">Chính sách bảo mật</Link>
            <Link href="/terms-of-service">Điều khoản sử dụng</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .footer {
          background-color: #141414;
          color: #FFFFFF;
          padding: 50px 0 20px;
          margin-top: 60px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          position: relative;
          z-index: 10;
        }

        .footer-brand {
          display: flex;
          align-items: center;
        }

        .footer-logo {
          width: 150px;
          height: auto;
        }

        .footer-description {
          color: #AAAAAA;
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.6;
        }

        .social-links {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          color: white;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background-color: #e50914;
          transform: translateY(-3px);
        }

        .footer-heading {
          color: white;
          font-weight: 700;
          margin-bottom: 20px;
          font-size: 18px;
          position: relative;
          padding-bottom: 10px;
        }

        .footer-heading:after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 40px;
          height: 2px;
          background-color: #e50914;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 10px;
        }

        .footer-links a {
          color: #AAAAAA;
          text-decoration: none;
          transition: color 0.3s ease;
          font-size: 14px;
        }

        .footer-links a:hover {
          color: #e50914;
        }

        .contact-info {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
        }

        .contact-info li {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          color: #AAAAAA;
          font-size: 14px;
        }

        .contact-icon {
          color: #e50914;
          margin-right: 10px;
          font-size: 16px;
        }

        .newsletter h6 {
          font-size: 16px;
          margin-bottom: 15px;
          color: white;
        }

        .newsletter-form {
          display: flex;
        }

        .newsletter-form input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px 0 0 4px;
          color: white;
        }

        .newsletter-form button {
          padding: 10px 20px;
          background-color: #e50914;
          border: none;
          color: white;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .newsletter-form button:hover {
          background-color: #b20710;
        }

        .footer-divider {
          margin: 30px 0;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .copyright {
          color: #AAAAAA;
          font-size: 14px;
          margin: 0;
        }

        .heart-icon {
          color: #e50914;
          margin: 0 4px;
          animation: beat 1s infinite alternate;
          display: inline-block;
        }

        @keyframes beat {
          to {
            transform: scale(1.3);
          }
        }

        .footer-bottom-links {
          display: flex;
          gap: 20px;
        }

        .footer-bottom-links a {
          color: #AAAAAA;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-bottom-links a:hover {
          color: #e50914;
        }

        @media (max-width: 768px) {
          .footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }
          
          .footer-bottom-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;