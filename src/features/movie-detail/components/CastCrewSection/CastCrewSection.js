import React from 'react';
import Link from 'next/link';
import styles from './CastCrewSection.module.css';

/**
 * @file CastCrewSection.js
 * @description Cast and crew showcase ready to render actors & directors
 * as soon as the API provides them, with elegant fallback when empty.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.actors=[]] - Array of actor objects { name, role, avatar_url, slug }.
 * @param {Array<Object>} [props.directors=[]] - Array of director objects { name, role, avatar_url, slug }.
 */
export default function CastCrewSection({
  actors = [],
  directors = []
}) {
  const combined = [
    ...directors.map((d) => ({ ...d, role: d.role || 'Đạo diễn' })),
    ...actors.map((a) => ({ ...a, role: a.role || 'Diễn viên' }))
  ];

  if (combined.length === 0) {
    return (
      <div className={styles.castCrewContainer}>
        <div className={styles.headerRow}>
          <i className="fas fa-users text-danger" />
          <h3 className={styles.sectionTitle}>Diễn Viên & Đoàn Làm Phim</h3>
        </div>
        <div className={styles.emptyCastPlaceholder}>
          <i className="fas fa-info-circle text-warning" />
          <span>Danh sách diễn viên và đoàn làm phim đang được cập nhật từ hệ thống dữ liệu.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.castCrewContainer}>
      <div className={styles.headerRow}>
        <i className="fas fa-users text-danger" />
        <h3 className={styles.sectionTitle}>Diễn Viên & Đoàn Làm Phim</h3>
      </div>

      <div className={styles.castRail}>
        {combined.map((person, idx) => {
          const name = person.name || 'Nghệ Sĩ';
          const role = person.role || 'Diễn viên';
          const avatar = person.avatar_url || person.image || '';
          const initial = name.charAt(0).toUpperCase();
          const slug = person.slug || '';

          const content = (
            <>
              <div className={styles.avatarWrapper}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className={styles.avatarImg}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className={styles.avatarMonogram}>{initial}</span>
                )}
              </div>
              <h4 className={styles.actorName} title={name}>
                {name}
              </h4>
              <span className={styles.actorRole}>{role}</span>
            </>
          );

          if (slug) {
            return (
              <Link
                key={slug || idx}
                href={`/performer/${encodeURIComponent(slug)}`}
                className={styles.actorCard}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={name || idx} className={styles.actorCard}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
