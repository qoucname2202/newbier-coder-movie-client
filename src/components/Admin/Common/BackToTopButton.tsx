import React from 'react';
import { Button } from 'react-bootstrap';
import { FaArrowUp } from 'react-icons/fa';

interface BackToTopButtonProps {
  className?: string;
  variant?: string;
  onClick?: () => void;
}

/**
 * Nút cuộn trở lại đầu trang
 */
const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  className = '',
  variant = 'primary',
  onClick
}) => {
  const handleClick = () => {
    // Cuộn lên đầu trang
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Gọi trình xử lý onClick bổ sung nếu được cung cấp
    if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={variant}
      className={`d-flex align-items-center ${className}`}
      onClick={handleClick}
    >
      <FaArrowUp className="me-2" /> Về đầu trang
    </Button>
  );
};

export default BackToTopButton;