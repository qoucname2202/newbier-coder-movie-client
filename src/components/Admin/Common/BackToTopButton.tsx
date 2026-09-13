import React from 'react';
import { Button } from 'react-bootstrap';
import { FaArrowUp } from 'react-icons/fa';

interface BackToTopButtonProps {
  className?: string;
  variant?: string;
  onClick?: () => void;
}

const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  className = '',
  variant = 'primary',
  onClick
}) => {
  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

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