import React from 'react';
import { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

interface BackToListButtonProps {
  listPath?: string;
  className?: string;
  variant?: string;
}

const BackToListButton: React.FC<BackToListButtonProps> = ({
  listPath,
  className = '',
  variant = 'secondary'
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (listPath) {
      router.push(listPath);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      className={`d-flex align-items-center ${className}`}
      onClick={handleClick}
    >
      <FaArrowLeft className="me-2" /> Quay lại danh sách
    </Button>
  );
};

export default BackToListButton;