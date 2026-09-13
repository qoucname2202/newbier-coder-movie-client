import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import styles from '@/styles/AdminMoviesEnhanced.module.css';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  required = false,
  children,
  hint
}) => {
  return (
    <div className={styles.formControl}>
      <label htmlFor={id} className={styles.formLabel}>
        {label}
        {required && <span className={styles.requiredMark}>*</span>}
      </label>
      {children}
      {hint && <div className={styles.formHint}>{hint}</div>}
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationCircle className={styles.errorIcon} />
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
