// src/pages/admin/people.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import AdminRoute from '@/features/shared/components/ProtectedRoute/AdminRoute';
import AdminLayout from '@/layouts/AdminLayout';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import { showCinemaAlert } from '@/features/shared/components/UI/CinemaAlert';
import {
  FaUserTie,
  FaUsers,
  FaVideo,
  FaPlus,
  FaSearch,
  FaTimes,
  FaPen,
  FaTrash,
  FaCheckCircle,
  FaTrophy,
  FaFilm
} from 'react-icons/fa';
import styles from '@/styles/AdminPeople.module.css';

import PeopleAwardsDrawer, { PersonItem, AwardItem } from '@/components/Admin/People/PeopleAwardsDrawer';
import PeopleFormModal from '@/components/Admin/People/PeopleFormModal';
import PeopleDeleteModal from '@/components/Admin/People/PeopleDeleteModal';
import CinemaDropdown from '@/features/admin/components/Common/CinemaDropdown';
import AdminPagination from '@/features/admin/components/Common/AdminPagination';
import { ADMIN_PEOPLE_I18N } from '@/config/i18n/admin';
import { INITIAL_ACTORS as MOCK_ACTORS, INITIAL_DIRECTORS as MOCK_DIRECTORS } from '@/mock/admin';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type PeopleTab = 'actors' | 'directors';

const INITIAL_ACTORS: PersonItem[] = MOCK_ACTORS;
const INITIAL_DIRECTORS: PersonItem[] = MOCK_DIRECTORS;

export default function PeopleAdminPage() {
  const [activeTab, setActiveTab] = useState<PeopleTab>('actors');

  // Collections
  const [actors, setActors] = useState<PersonItem[]>(INITIAL_ACTORS);
  const [directors, setDirectors] = useState<PersonItem[]>(INITIAL_DIRECTORS);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [verifyFilter, setVerifyFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Modal & Drawer states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<PersonItem | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPersonForAwards, setSelectedPersonForAwards] = useState<PersonItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<PersonItem | null>(null);

  // Current list
  const currentList = useMemo(() => {
    return activeTab === 'actors' ? actors : directors;
  }, [activeTab, actors, directors]);

  // Filtered list
  const filteredList = useMemo(() => {
    return currentList.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.originalName && p.originalName.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (p.nationality && p.nationality.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? p.isActive :
        !p.isActive;

      const matchVerify =
        verifyFilter === 'all' ? true :
        verifyFilter === 'verified' ? p.isVerified :
        !p.isVerified;

      return matchSearch && matchStatus && matchVerify;
    });
  }, [currentList, searchTerm, statusFilter, verifyFilter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, statusFilter, verifyFilter]);

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const currentTabLabel = activeTab === 'actors' ? 'Diễn Viên' : 'Đạo Diễn';

  // Toggle Verified Badge
  const handleToggleVerify = (person: PersonItem) => {
    const nextVerify = !person.isVerified;
    const updater = (list: PersonItem[]) =>
      list.map(p => p.id === person.id ? { ...p, isVerified: nextVerify } : p);

    if (activeTab === 'actors') setActors(updater);
    else setDirectors(updater);

    showCinemaAlert(
      `Đã ${nextVerify ? 'cấp tích xanh xác minh (Verified)' : 'gỡ huy hiệu xác minh'} cho ${person.name}!`,
      nextVerify ? 'cinema' : 'warning'
    );
  };

  // Toggle Active Status
  const handleToggleStatus = (person: PersonItem) => {
    const nextStatus = !person.isActive;
    const updater = (list: PersonItem[]) =>
      list.map(p => p.id === person.id ? { ...p, isActive: nextStatus } : p);

    if (activeTab === 'actors') setActors(updater);
    else setDirectors(updater);

    showCinemaAlert(
      `Đã ${nextStatus ? 'kích hoạt' : 'tạm ẩn'} hồ sơ ${person.name}!`,
      nextStatus ? 'cinema' : 'warning'
    );
  };

  // Save Person (Create / Update)
  const handleSavePerson = (personData: Partial<PersonItem>) => {
    const isEdit = !!personData.id;

    const updater = (prev: PersonItem[]): PersonItem[] => {
      if (isEdit) {
        return prev.map(p => p.id === personData.id ? { ...p, ...personData } as PersonItem : p);
      } else {
        const newPerson: PersonItem = {
          id: personData.id || `${activeTab.slice(0, 3)}-${Date.now()}`,
          name: personData.name || '',
          originalName: personData.originalName || '',
          birthName: personData.birthName || personData.originalName || personData.name || '',
          slug: personData.slug || '',
          avatarUrl: personData.avatarUrl || '',
          profileImage: personData.avatarUrl || '',
          gender: personData.gender,
          nationality: personData.nationality || '',
          birthYear: personData.birthYear,
          dateOfBirth: personData.dateOfBirth,
          placeOfBirth: personData.placeOfBirth,
          height: personData.height,
          debutYear: personData.debutYear,
          knownFor: personData.knownFor,
          bio: personData.bio || '',
          biography: personData.bio || '',
          socialMedia: personData.socialMedia,
          isVerified: personData.isVerified ?? false,
          isActive: personData.isActive ?? true,
          movieCount: 0,
          awards: []
        };
        return [newPerson, ...prev];
      }
    };

    if (activeTab === 'actors') setActors(updater);
    else setDirectors(updater);

    showCinemaAlert(
      `${isEdit ? 'Cập nhật' : 'Thêm mới'} ${currentTabLabel.toLowerCase()} "${personData.name}" thành công!`,
      'cinema'
    );
  };

  // Update Awards from Drawer
  const handleUpdateAwards = (personId: string, updatedAwards: AwardItem[]) => {
    const updater = (list: PersonItem[]) =>
      list.map(p => p.id === personId ? { ...p, awards: updatedAwards } : p);

    if (activeTab === 'actors') setActors(updater);
    else setDirectors(updater);

    if (selectedPersonForAwards && selectedPersonForAwards.id === personId) {
      setSelectedPersonForAwards({ ...selectedPersonForAwards, awards: updatedAwards });
    }
  };

  // Delete Person
  const handleConfirmDelete = () => {
    if (!personToDelete) return;
    const id = personToDelete.id;

    const remover = (prev: PersonItem[]) => prev.filter(p => p.id !== id);
    if (activeTab === 'actors') setActors(remover);
    else setDirectors(remover);

    showCinemaAlert(`Đã xóa hồ sơ ${currentTabLabel.toLowerCase()} "${personToDelete.name}"`, 'warning');
    setPersonToDelete(null);
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <Head>
          <title>Quản Lý Diễn Viên & Đạo Diễn - Movie Admin Studio</title>
        </Head>

        <div className={styles.pageContainer}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIconBox}>
                <FaUserTie />
              </div>
              <div>
                <h1 className={styles.headerTitle}>Trung Tâm Quản Lý Nhân Sự (People Hub)</h1>
                <p className={styles.headerSubtitle}>
                  Quản lý hồ sơ diễn viên, đạo diễn, cấp tích xanh xác minh và hồ sơ giải thưởng nghệ thuật
                </p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.primaryAddBtn}
                onClick={() => {
                  setFormInitialData(null);
                  setIsFormModalOpen(true);
                }}
              >
                <FaPlus />
                <span>Thêm {currentTabLabel}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={styles.tabsContainer}>
            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'actors' ? styles.tabItemActive : ''}`}
              onClick={() => { setActiveTab('actors'); setSearchTerm(''); }}
            >
              <FaUsers />
              <span>Diễn Viên (Actors)</span>
              <span className={styles.tabBadge}>{actors.length}</span>
            </button>

            <button
              type="button"
              className={`${styles.tabItem} ${activeTab === 'directors' ? styles.tabItemActive : ''}`}
              onClick={() => { setActiveTab('directors'); setSearchTerm(''); }}
            >
              <FaVideo />
              <span>Đạo Diễn (Directors)</span>
              <span className={styles.tabBadge}>{directors.length}</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={`Tìm ${currentTabLabel.toLowerCase()} theo tên, tên gốc hoặc slug...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchTerm('')}
                  aria-label="Xóa tìm kiếm"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className={styles.filterControls} style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
              <CinemaDropdown
                options={[
                  { value: 'all', label: ADMIN_PEOPLE_I18N.filters.allVerified },
                  { value: 'verified', label: ADMIN_PEOPLE_I18N.filters.verifiedOnly },
                  { value: 'unverified', label: ADMIN_PEOPLE_I18N.filters.unverifiedOnly }
                ]}
                value={verifyFilter}
                onChange={(val) => setVerifyFilter(val as any)}
                prefixIcon={<FaCheckCircle />}
                size="filter"
                ariaLabel="Lọc theo xác minh"
              />

              <CinemaDropdown
                options={[
                  { value: 'all', label: ADMIN_PEOPLE_I18N.filters.allStatuses },
                  { value: 'active', label: ADMIN_PEOPLE_I18N.filters.statusActive },
                  { value: 'inactive', label: ADMIN_PEOPLE_I18N.filters.statusInactive }
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                prefixIcon={<FaFilm />}
                size="filter"
                ariaLabel="Lọc theo trạng thái"
              />
            </div>
          </div>

          {/* Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>{currentTabLabel}</th>
                    <th style={{ width: '15%' }}>Quốc Tịch & Tuổi</th>
                    <th style={{ width: '14%' }}>Tác Phẩm</th>
                    <th style={{ width: '18%' }}>Hồ Sơ Giải Thưởng</th>
                    <th style={{ width: '11%' }}>Trạng Thái</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>
                          <div className={styles.emptyIcon}>
                            <FaUserTie />
                          </div>
                          <p className={styles.emptyText}>
                            Không tìm thấy {currentTabLabel.toLowerCase()} nào phù hợp với điều kiện lọc
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((person) => (
                      <tr key={person.id} className={styles.tableRow}>
                        {/* Profile Info */}
                        <td>
                          <div className={styles.personCell}>
                            <div className={styles.avatarWrapper}>
                              {person.avatarUrl ? (
                                <img
                                  src={person.avatarUrl}
                                  alt={person.name}
                                  className={styles.avatarImg}
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className={styles.avatarFallback}>
                                  {person.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className={styles.personMeta}>
                              <div className={styles.personNameRow}>
                                <span className={styles.personName}>{person.name}</span>
                                <button
                                  type="button"
                                  className={styles.verifyBadgeInteractive}
                                  title={person.isVerified ? 'Tài khoản đã xác thực (Bấm để gỡ)' : 'Chưa xác thực (Bấm để cấp tích xanh)'}
                                  onClick={() => handleToggleVerify(person)}
                                >
                                  <FaCheckCircle className={person.isVerified ? styles.verifiedActive : styles.verifiedInactive} />
                                </button>
                              </div>
                              <span className={styles.personSub}>
                                {person.originalName && `${person.originalName} • `}
                                /{person.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Nationality & Age */}
                        <td>
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                            <div>{person.nationality || '—'}</div>
                            <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>
                              {person.birthYear ? `Sinh năm ${person.birthYear}` : ''}
                            </div>
                          </div>
                        </td>

                        {/* Movies Count */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                            color: '#cbd5e1',
                            background: 'rgba(255,255,255,0.06)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px'
                          }}>
                            <FaFilm style={{ color: '#e50914', fontSize: '0.72rem' }} />
                            <span>{person.movieCount ?? 0} phim</span>
                          </span>
                        </td>

                        {/* Awards Trigger */}
                        <td>
                          <button
                            type="button"
                            className={`${styles.awardsBtn} ${person.awards.length > 0 ? styles.awardsBtnActive : ''}`}
                            onClick={() => {
                              setSelectedPersonForAwards(person);
                              setIsDrawerOpen(true);
                            }}
                          >
                            <FaTrophy style={{ color: person.awards.length > 0 ? '#f59e0b' : '#9ca3af' }} />
                            <span>{person.awards.length} giải thưởng</span>
                          </button>
                        </td>

                        {/* Status Toggle */}
                        <td>
                          <div className={styles.statusCell}>
                            <label className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                checked={person.isActive}
                                onChange={() => handleToggleStatus(person)}
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                            <span className={`${styles.statusText} ${person.isActive ? styles.statusActive : styles.statusInactive}`}>
                              {person.isActive ? 'Bật' : 'Ẩn'}
                            </span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div className={styles.rowActions} style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className={styles.editBtn}
                              title={`Chỉnh sửa ${person.name}`}
                              onClick={() => {
                                setFormInitialData(person);
                                setIsFormModalOpen(true);
                              }}
                            >
                              <FaPen />
                            </button>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              title={`Xóa ${person.name}`}
                              onClick={() => {
                                setPersonToDelete(person);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Unified Cinema Dark Pagination */}
              {totalItems > 0 && (
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  itemName={currentTabLabel.toLowerCase()}
                />
              )}
            </div>
          </div>
        </div>

        {/* Awards Drawer */}
        <PeopleAwardsDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedPersonForAwards(null);
          }}
          person={selectedPersonForAwards}
          onUpdateAwards={handleUpdateAwards}
        />

        {/* Form Modal */}
        <PeopleFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSavePerson}
          initialData={formInitialData}
          type={activeTab}
        />

        {/* Delete Modal */}
        <PeopleDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          personName={personToDelete?.name || ''}
          type={activeTab}
        />

        <ToastContainer position="top-right" autoClose={3500} theme="dark" />
        <BackToTop />
      </AdminLayout>
    </AdminRoute>
  );
}
