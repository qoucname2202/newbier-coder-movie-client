import React, { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPlus, FaChevronDown, FaCheck } from 'react-icons/fa';
import styles from '@/styles/AdminAddMovie.module.css';

interface TagAutocompletePickerProps {
  label: string;
  icon?: React.ReactNode;
  items: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
}

export const TagAutocompletePicker: React.FC<TagAutocompletePickerProps> = ({
  label,
  icon,
  items,
  onAdd,
  onRemove,
  suggestions,
  placeholder = 'Nhập tên hoặc chọn gợi ý...',
  required = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (val?: string) => {
    const text = (val || query).trim();
    if (text) {
      onAdd(text);
      setQuery('');
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    const matchesQuery = s.toLowerCase().includes(query.toLowerCase());
    const notAlreadyAdded = !items.includes(s);
    return matchesQuery && notAlreadyAdded;
  });

  return (
    <div className={styles.formGroup} ref={wrapperRef} style={{ position: 'relative', zIndex: isOpen ? 1070 : 1 }}>
      <label className={styles.formLabel}>
        <span className={styles.labelTitle}>
          {icon} {label}
          {required && <span className={styles.requiredAsterisk}>*</span>}
        </span>
        <span className="text-muted small">
          Đã thêm: <strong className="text-light">{items.length}</strong>
        </span>
      </label>

      {/* Compact Tag Box with Scrollbar (max 68px height) */}
      <div className={styles.compactTagScrollBox}>
        {items.length === 0 ? (
          <span className="text-muted small ps-1" style={{ fontSize: '0.75rem' }}>
            Chưa có mục nào được chọn
          </span>
        ) : (
          items.map(it => (
            <span key={it} className={styles.tagBadge}>
              {it}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => onRemove(it)}
                title={`Xóa ${it}`}
              >
                <FaTimes />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Autocomplete Search & Quick Add Row */}
      <div className={styles.comboboxWrapper}>
        <div className={styles.comboboxInputRow}>
          <input
            type="text"
            className={styles.inputControl}
            style={{ height: 34, fontSize: '0.82rem' }}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button
            type="button"
            className={styles.yearStepBtn}
            style={{ height: 34, minWidth: 34 }}
            onClick={() => handleAdd()}
            title="Thêm mục này"
          >
            <FaPlus size={10} />
          </button>
          <button
            type="button"
            className={styles.yearStepBtn}
            style={{ height: 34, minWidth: 34 }}
            onClick={() => setIsOpen(prev => !prev)}
            title="Xem danh sách gợi ý"
          >
            <FaChevronDown size={9} />
          </button>
        </div>

        {/* Dropdown with filtered suggestions */}
        {isOpen && filteredSuggestions.length > 0 && (
          <div className={styles.comboboxDropdown}>
            {filteredSuggestions.map(s => (
              <button
                key={s}
                type="button"
                className={styles.comboboxItem}
                onClick={() => {
                  onAdd(s);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span>{s}</span>
                <span className="text-danger small">Thêm</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagAutocompletePicker;
