/**
 * @file CinemaDatePicker.tsx
 * @description Accessible, luxurious Cinema Dark styled Date Picker.
 * Features inline manual text input, floating calendar popover, quick month/year dropdown selectors,
 * today quick-jump, clear button, and keyboard accessibility.
 */

'use client';

import React, { useState, useRef, useEffect, useMemo} from 'react';
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaTimes,
} from 'react-icons/fa';
import styles from '@/styles/CinemaDatePicker.module.css';

export interface CinemaDatePickerProps {
  value: string; // ISO format: 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  id?: string;
}

const MONTH_NAMES_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const WEEKDAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Pads a number with leading zeros (e.g. 5 -> '05')
 */
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Validates ISO date format YYYY-MM-DD
 */
function isValidIsoDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export default function CinemaDatePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày sinh (YYYY-MM-DD)...',
  disabled = false,
  hasError = false,
  minDate = '1900-01-01',
  maxDate,
  className = '',
  id,
}: CinemaDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse initial view date
  const parsedValueDate = useMemo(() => {
    if (value && isValidIsoDate(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return null;
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(() => {
    if (parsedValueDate) return parsedValueDate.getFullYear();
    // Default to a reasonable birth year (e.g. 1995) or current year
    return 1995;
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (parsedValueDate) return parsedValueDate.getMonth();
    return 0; // January
  });

  // Sync view when value changes from outside
  useEffect(() => {
    if (parsedValueDate) {
      setViewYear(parsedValueDate.getFullYear());
      setViewMonth(parsedValueDate.getMonth());
    }
  }, [parsedValueDate]);

  // Year options for fast dropdown (from currentYear + 1 down to 1920)
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current; y >= 1920; y--) {
      years.push(y);
    }
    return years;
  }, []);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // Monday as 0, Sunday as 6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Leading days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dStr = `${prevY}-${padZero(prevM + 1)}-${padZero(dayNum)}`;
      days.push({
        dateString: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
        isDisabled: Boolean((maxDate && dStr > maxDate) || (minDate && dStr < minDate)),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(d)}`;
      days.push({
        dateString: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
        isDisabled: Boolean((maxDate && dStr > maxDate) || (minDate && dStr < minDate)),
      });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dStr = `${nextY}-${padZero(nextM + 1)}-${padZero(d)}`;
      days.push({
        dateString: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
        isDisabled: Boolean((maxDate && dStr > maxDate) || (minDate && dStr < minDate)),
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  // Select day handler
  const handleSelectDay = (dateString: string) => {
    onChange(dateString);
    setIsOpen(false);
  };

  // Quick Today jump
  const handleSelectToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(todayStr);
    setIsOpen(false);
  };

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`${styles.datePickerWrapper} ${className}`} ref={containerRef}>
      {/* Input Display Bar */}
      <div
        className={`${styles.inputContainer} ${isOpen ? styles.inputFocused : ''} ${
          hasError ? styles.inputError : ''
        } ${disabled ? styles.inputDisabled : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
      >
        <FaCalendarAlt className={styles.calendarIcon} size={13} />

        <input
          ref={inputRef}
          id={id}
          type="text"
          className={styles.dateInput}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            if (isValidIsoDate(val)) {
              const [y, m] = val.split('-').map(Number);
              setViewYear(y);
              setViewMonth(m - 1);
            }
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          autoComplete="off"
        />

        {value && !disabled && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            title="Xóa ngày đã chọn"
            aria-label="Xóa ngày"
          >
            <FaTimes size={10} />
          </button>
        )}

        <button
          type="button"
          className={styles.triggerBtn}
          tabIndex={-1}
          aria-label="Mở lịch chọn ngày"
          disabled={disabled}
        >
          <FaChevronDown
            size={10}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </button>
      </div>

      {/* Floating Popover Calendar */}
      {isOpen && (
        <div className={styles.popover} role="dialog" aria-modal="true">
          {/* Header: Prev, Month Select, Year Select, Next */}
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrevMonth}
              title="Tháng trước"
              aria-label="Tháng trước"
            >
              <FaChevronLeft size={10} />
            </button>

            <div className={styles.selectGroup}>
              {/* Month Selector */}
              <select
                className={styles.headerSelect}
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              >
                {MONTH_NAMES_VI.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                className={styles.headerSelect}
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNextMonth}
              title="Tháng sau"
              aria-label="Tháng sau"
            >
              <FaChevronRight size={10} />
            </button>
          </div>

          {/* Weekday Row */}
          <div className={styles.weekdaysGrid}>
            {WEEKDAYS_VI.map((w, idx) => (
              <span key={idx} className={styles.weekday}>
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {calendarDays.map((cell) => {
              const cellClasses = [
                styles.dayCell,
                !cell.isCurrentMonth ? styles.dayOtherMonth : '',
                cell.isToday ? styles.dayToday : '',
                cell.isSelected ? styles.daySelected : '',
                cell.isDisabled ? styles.dayDisabled : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={cell.dateString}
                  type="button"
                  className={cellClasses}
                  onClick={() => !cell.isDisabled && handleSelectDay(cell.dateString)}
                  disabled={cell.isDisabled}
                  title={cell.dateString}
                >
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              className={`${styles.footerBtn} ${styles.footerTodayBtn}`}
              onClick={handleSelectToday}
            >
              Hôm nay
            </button>

            {value && (
              <button
                type="button"
                className={styles.footerBtn}
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                Xóa
              </button>
            )}

            <button
              type="button"
              className={styles.footerBtn}
              onClick={() => setIsOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

