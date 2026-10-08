import React, { useState, useRef, useMemo, useEffect } from 'react';
import { groupServersByTrack } from '@/features/movie-detail/utils/serverTrackHelper';
import styles from './ServerVersionSelector.module.css';

/**
 * @file ServerVersionSelector.js
 * @description Sleek audio version selector (Vietsub, Thuyết Minh, Lồng Tiếng).
 * Eliminates duplicate buttons and provides an elegant hover dropdown for multiple sources (Nguồn 1, Nguồn 2).
 *
 * @param {Object} props
 * @param {Array<Object>} [props.servers=[]] - Raw server list from movie data.
 * @param {number} [props.currentServerIndex=0] - Active server index.
 * @param {Function} props.onSelectServer - Callback when server is switched.
 * @param {string} [props.label] - Optional header label (e.g. "Bản chiếu:").
 */
export default function ServerVersionSelector({
  servers = [],
  currentServerIndex = 0,
  onSelectServer,
  label
}) {
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const leaveTimerRef = useRef(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Group raw servers by audio type (Vietsub, Thuyết Minh, Lồng Tiếng)
  const groups = useMemo(() => groupServersByTrack(servers), [servers]);

  // If there is only 1 server total across all groups, don't show selector (zero clutter)
  if (!servers || servers.length <= 1) {
    return null;
  }

  const handleMouseEnter = (key, hasMultiple) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (hasMultiple) {
      setOpenDropdownKey(key);
    }
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setOpenDropdownKey(null);
    }, 280);
  };

  const handleButtonClick = (group) => {
    const hasMultiple = group.sources.length > 1;
    const isCurrentlyActiveGroup = group.sources.some(
      (s) => s.originalIndex === currentServerIndex
    );

    if (!hasMultiple) {
      // Single source: direct select
      onSelectServer(group.sources[0].originalIndex);
      setOpenDropdownKey(null);
    } else {
      if (isCurrentlyActiveGroup) {
        // Toggle dropdown on click
        setOpenDropdownKey((prev) => (prev === group.key ? null : group.key));
      } else {
        // Switch to the first source of this group and open dropdown
        onSelectServer(group.sources[0].originalIndex);
        setOpenDropdownKey(group.key);
      }
    }
  };

  const handleSelectSource = (index) => {
    onSelectServer(index);
    setOpenDropdownKey(null);
  };

  return (
    <div className={styles.wrapper} aria-label="Chọn phiên bản và nguồn phát">
      {label && (
        <span className={styles.selectorLabel}>
          <i className={`fas fa-closed-captioning ${styles.labelIcon}`} />
          {label}
        </span>
      )}

      <div className={styles.btnGroup}>
        {groups.map((group) => {
          const hasMultiple = group.sources.length > 1;
          const isActive = group.sources.some(
            (s) => s.originalIndex === currentServerIndex
          );
          const isOpen = openDropdownKey === group.key;

          return (
            <div
              key={group.key}
              className={styles.versionPillWrapper}
              onMouseEnter={() => handleMouseEnter(group.key, hasMultiple)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`${styles.versionBtn} ${isActive ? styles.versionBtnActive : ''}`}
                onClick={() => handleButtonClick(group)}
                aria-expanded={isOpen}
                title={
                  hasMultiple
                    ? `${group.label} (${group.sources.length} nguồn - Rê chuột để chọn)`
                    : `Bản ${group.label}`
                }
              >
                <i className={`${group.icon} ${styles.trackIcon}`} />
                <span>{group.label}</span>
                {hasMultiple && (
                  <i
                    className={`fas fa-chevron-down ${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                )}
              </button>

              {/* Hover Dropdown for multiple sources */}
              {hasMultiple && isOpen && (
                <div
                  className={styles.dropdownPopover}
                  role="menu"
                  onMouseEnter={() => {
                    if (leaveTimerRef.current) {
                      clearTimeout(leaveTimerRef.current);
                      leaveTimerRef.current = null;
                    }
                  }}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={styles.dropdownTitle}>Nguồn {group.label}:</div>
                  {group.sources.map((source) => {
                    const isSourceActive = source.originalIndex === currentServerIndex;
                    return (
                      <button
                        key={source.originalIndex}
                        type="button"
                        role="menuitem"
                        className={`${styles.sourceOptionBtn} ${isSourceActive ? styles.sourceOptionBtnActive : ''}`}
                        onClick={() => handleSelectSource(source.originalIndex)}
                      >
                        <span>{source.sourceLabel}</span>
                        {isSourceActive && (
                          <i className={`fas fa-check ${styles.sourceCheckIcon}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
