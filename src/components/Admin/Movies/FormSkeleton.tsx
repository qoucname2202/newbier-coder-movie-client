import React from 'react';
import styles from '@/styles/AdminMoviesEnhanced.module.css';

const FormSkeleton: React.FC = () => {
  return (
    <div className={styles.formSkeleton}>
      {/* Form header skeleton */}
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonBreadcrumb}></div>
      </div>

      {/* Form sections skeleton */}
      <div className={styles.formSection}>
        <div className={styles.skeletonFormTitle}></div>
        <div className={styles.formContent}>
          <div className={styles.skeletonFormRow}>
            <div className={styles.skeletonFormControl}></div>
            <div className={styles.skeletonFormControl}></div>
          </div>
          <div className={styles.skeletonFormRow}>
            <div className={styles.skeletonFormControl}></div>
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.skeletonFormTitle}></div>
        <div className={styles.formContent}>
          <div className={styles.skeletonFormRow}>
            <div className={styles.skeletonFormControl}></div>
            <div className={styles.skeletonFormControl}></div>
          </div>
          <div className={styles.skeletonFormRow}>
            <div className={styles.skeletonFormControl}></div>
          </div>
        </div>
      </div>

      {/* Button skeleton */}
      <div className={styles.skeletonFormAction}></div>
    </div>
  );
};

export default FormSkeleton;
