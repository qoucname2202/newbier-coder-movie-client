/**
 * @file CountryBreadcrumb.tsx
 * @description Accessible Breadcrumb navigation with JSON-LD Schema.org BreadcrumbList for SEO.
 */

import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import styles from '@/styles/CountryPage.module.css';

export interface CountryBreadcrumbProps {
  countryName: string;
  countrySlug: string;
}

export const CountryBreadcrumb: React.FC<CountryBreadcrumbProps> = ({
  countryName,
  countrySlug,
}) => {
  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://xomphim-mocha.vercel.app/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Quốc gia',
        item: 'https://xomphim-mocha.vercel.app/quoc-gia',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: countryName,
        item: `https://xomphim-mocha.vercel.app/quoc-gia/${countrySlug}`,
      },
    ],
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }}
        />
      </Head>

      <nav aria-label="Đường dẫn điều hướng" className={styles.breadcrumbNav}>
        <Link href="/" className={styles.breadcrumbItem} title="Quay lại trang chủ">
          <FaHome aria-hidden="true" />
          <span>Trang chủ</span>
        </Link>

        <FaChevronRight className={styles.breadcrumbSeparator} aria-hidden="true" />

        <span className={styles.breadcrumbItem}>Quốc gia</span>

        <FaChevronRight className={styles.breadcrumbSeparator} aria-hidden="true" />

        <span className={styles.breadcrumbActive} aria-current="page">
          {countryName}
        </span>
      </nav>
    </>
  );
};

export default CountryBreadcrumb;
