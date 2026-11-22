/**
 * @file FormatBreadcrumb.tsx
 * @description Accessible Breadcrumb navigation with Schema.org JSON-LD for movie formats.
 */

import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import styles from '@/styles/FormatPage.module.css';

export interface FormatBreadcrumbProps {
  formatTitle: string;
  formatSlug: string;
}

export const FormatBreadcrumb: React.FC<FormatBreadcrumbProps> = ({
  formatTitle,
  formatSlug
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://xomphim-mocha.vercel.app'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: formatTitle,
        item: `https://xomphim-mocha.vercel.app/formats/${formatSlug}/movies`
      }
    ]
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <nav aria-label="Đường dẫn trang" className={styles.breadcrumbNav}>
        <Link href="/" className={styles.breadcrumbItem} title="Về trang chủ">
          <FaHome aria-hidden="true" />
          <span>Trang chủ</span>
        </Link>
        <FaChevronRight className={styles.breadcrumbSeparator} aria-hidden="true" />
        <span className={styles.breadcrumbActive} aria-current="page">
          {formatTitle}
        </span>
      </nav>
    </>
  );
};
