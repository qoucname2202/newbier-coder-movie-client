import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import styles from './CinemaSelect.module.css';

export interface CinemaSelectOption {
  value: string;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}

interface CinemaSelectProps {
  options: CinemaSelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  id?: string;
}

export const CinemaSelect: React.FC<CinemaSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn một tùy chọn...',
  disabled = false,
  hasError = false,
  className = '',
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.selectWrapper} ${isOpen ? styles.isOpen : ''} ${className}`}
      ref={containerRef}
      id={id}
      style={{ position: 'relative', zIndex: isOpen ? 1070 : 1 }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`${styles.triggerBtn} ${isOpen ? styles.isOpen : ''} ${hasError ? styles.hasError : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className={styles.placeholderText}>{placeholder}</span>
          )}
        </div>
        <FaChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.rotated : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.optionItem} ${isSelected ? styles.isSelected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <div className={styles.optionLabel}>
                  <div className="d-flex align-items-center gap-2">
                    {option.icon && <span>{option.icon}</span>}
                    <span className={styles.optionMainText}>{option.label}</span>
                  </div>
                  {option.desc && <span className={styles.optionDesc}>{option.desc}</span>}
                </div>
                {isSelected && <FaCheck className={styles.checkIcon} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CinemaSelect;
