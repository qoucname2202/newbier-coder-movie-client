import React, { useState } from 'react';
import styles from '@/styles/AdminMoviesEnhanced.module.css';
import { FaImage, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface ImageUrlInputProps {
  id: string;
  label: string;
  value: string;
  onChange?: (url: string) => void;
  onUrlChange?: (url: string) => void; 
  hint?: string;
  previewUrl?: string;
  placeholder?: string;
}

const ImageUrlInput: React.FC<ImageUrlInputProps> = ({
  id,
  label,
  value,
  onChange,
  onUrlChange,
  hint,
  previewUrl,
  placeholder
}) => {
  const [validationState, setValidationState] = useState<'initial' | 'valid' | 'invalid'>('initial');
  const [previewImage, setPreviewImage] = useState<string>(previewUrl || '');

  const validateImageUrl = async (url: string) => {
    if (!url) {
      setValidationState('initial');
      setPreviewImage('');
      return;
    }

    try {
      // Basic URL validation
      new URL(url);
      
      // Create an image element to check if it loads
      const img = new Image();
      
      img.onload = () => {
        setValidationState('valid');
        setPreviewImage(url);
      };
      
      img.onerror = () => {
        setValidationState('invalid');
        setPreviewImage('');
      };
      
      img.src = url;
    } catch (err) {
      setValidationState('invalid');
      setPreviewImage('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    if (onChange) onChange(newUrl);
    if (onUrlChange) onUrlChange(newUrl);
    validateImageUrl(newUrl);
  };

  return (
    <div className={styles.formControl}>
      <label htmlFor={id} className={styles.formLabel}>
        {label}
      </label>
      
      <div className={styles.imageUrlContainer}>
        <input
          type="text"
          id={id}
          name={id}
          value={value}
          onChange={handleInputChange}
          className={`${styles.formInput} ${validationState === 'valid' ? styles.formInputSuccess : ''} ${validationState === 'invalid' ? styles.formInput + ' ' + styles.isInvalid : ''}`}
          placeholder="Nhập URL hình ảnh (https://example.com/image.jpg)"
        />
        
        {validationState === 'valid' && (
          <div className={styles.validationIcon} style={{ color: '#10b981' }}>
            <FaCheck />
          </div>
        )}
        
        {validationState === 'invalid' && (
          <div className={styles.validationIcon} style={{ color: '#ef4444' }}>
            <FaExclamationTriangle />
          </div>
        )}
      </div>
      
      {hint && <div className={styles.formHint}>{hint}</div>}
      
      {previewImage && (
        <div className={styles.imagePreviewContainer}>
          <img 
            src={previewImage} 
            alt={label}
            className={styles.thumbnailPreview}
            onError={() => {
              setValidationState('invalid');
              setPreviewImage('');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUrlInput;