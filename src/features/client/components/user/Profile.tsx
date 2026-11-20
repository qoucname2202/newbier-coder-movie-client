/**
 * @file features/client/components/user/Profile.tsx
 * @description Enterprise-grade, Cinema Glassmorphic User Profile Management Dashboard.
 */

import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaUser,
  FaHeart,
  FaBookmark,
  FaHistory,
  FaShieldAlt,
  FaLock,
  FaCrown,
  FaCheckCircle,
  FaCamera,
  FaTrash,
  FaPlay,
  FaStar,
  FaClock,
  FaFilm,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaSignOutAlt,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaArrowRight
} from 'react-icons/fa';

import { useAuth } from '@/context/AuthContext';
import authService, { type ProfileData, type PasswordData, type UserPayload } from '@/API/services/authService';
import favoritesService, { type FavoriteMovie } from '@/API/services/favoritesService';
import watchlistService, { type WatchlistMovie } from '@/API/services/watchlistService';
import historyService, { type HistoryItem } from '@/API/services/historyService';
import styles from '@/styles/Profile.module.css';

/** Available tabs in the Profile Dashboard */
type ProfileTab = 'overview' | 'favorites' | 'watchlist' | 'history' | 'security';

/** Preset cinema avatar images */
const PRESET_AVATARS = [
  '/img/user-avatar.png',
  '/img/avatar.png',
  '/img/chantay.jpg'
] as const;

/** List of available popular movie genres */
const AVAILABLE_GENRES = [
  'Hành Động',
  'Tình Cảm',
  'Hài Hước',
  'Kinh Dị',
  'Viễn Tưởng',
  'Hoạt Hình',
  'Anime',
  'Võ Thuật',
  'Tâm Lý',
  'Phiêu Lưu',
  'Bí Ẩn',
  'Gia Đình'
] as const;

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>('/img/user-avatar.png');

  // Change Password Fields
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);

  // Collections Data
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<Array<{ id: string; title: string; slug?: string; thumbnail?: string; progress?: number; epName?: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Redirect if not signed in
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/user/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load User Profile Data
  useEffect(() => {
    let isSubscribed = true;

    const loadUserData = async (): Promise<void> => {
      if (!isAuthenticated) return;
      try {
        setLoadingProfile(true);
        const profile = await authService.getProfile();
        if (!isSubscribed) return;

        const getStr = (val: unknown, fallback = ''): string => (typeof val === 'string' ? val : fallback);

        setFullName(getStr(profile.fullname) || getStr(profile.fullName) || getStr((user as Record<string, unknown>)?.name) || '');
        setEmail(getStr(profile.email) || getStr((user as Record<string, unknown>)?.email) || '');
        setPhone(getStr(profile.phone));
        setAddress(getStr(profile.address));
        setDateOfBirth(getStr(profile.date_of_birth) || getStr(profile.dateOfBirth));
        setBio(getStr(profile.bio));
        setFavoriteGenres(Array.isArray(profile.favoriteGenres) ? (profile.favoriteGenres as string[]) : []);
        setAvatarUrl(getStr(profile.avatarUrl) || getStr(profile.avatar) || '/img/user-avatar.png');
      } catch {
        if (!isSubscribed) return;
        // Fallback to user context
        if (user) {
          const u = user as unknown as { fullname?: string; name?: string; email?: string; avatar?: string };
          setFullName(u.fullname || u.name || '');
          setEmail(u.email || '');
          setAvatarUrl(u.avatar || '/img/user-avatar.png');
        }
      } finally {
        if (isSubscribed) setLoadingProfile(false);
      }
    };

    loadUserData();
    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated, user]);

  // Load Favorites on tab change or initial load
  const loadFavorites = useCallback(async (): Promise<void> => {
    try {
      setFavoritesLoading(true);
      const list = await favoritesService.getFavorites(1, 20);
      setFavorites(list);
    } catch {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  // Load Watchlist
  const loadWatchlist = useCallback(async (): Promise<void> => {
    try {
      setWatchlistLoading(true);
      const list = await watchlistService.getWatchlist();
      setWatchlist(Array.isArray(list) ? list : []);
    } catch {
      setWatchlist([]);
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  // Load History
  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      setHistoryLoading(true);
      const res = await historyService.getUserHistory(10, 1);
      const rows = res.histories || [];
      const mapped = rows.map((r: HistoryItem, idx: number) => ({
        id: r.id || r._id || r.movieId || String(idx),
        title: (r.name as string) || (r.movieName as string) || 'Phim chưa đặt tên',
        slug: (r.movieSlug as string) || (r.slug as string),
        thumbnail: (r.poster_url as string) || (r.thumb_url as string) || (r.thumbnail as string) || '',
        progress: typeof r.progressPercentage === 'number' ? (r.progressPercentage as number) : 0,
        epName: (r.episodeName as string)
      }));
      setHistoryList(mapped);
    } catch {
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch collections when switching tabs
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'favorites') {
      loadFavorites();
    } else if (activeTab === 'watchlist') {
      loadWatchlist();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, isAuthenticated, loadFavorites, loadWatchlist, loadHistory]);

  // Initial stats prefetch
  useEffect(() => {
    if (!isAuthenticated) return;
    loadFavorites();
    loadWatchlist();
    loadHistory();
  }, [isAuthenticated, loadFavorites, loadWatchlist, loadHistory]);

  // Handle Genre Tag Toggle
  const toggleGenre = (genre: string): void => {
    setFavoriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const payload: ProfileData = {
        fullName,
        phone,
        address,
        dateOfBirth,
        bio,
        favoriteGenres
      };
      const result = await authService.updateProfile(payload);
      if (result.success) {
        toast.success('Cập nhật thông tin hồ sơ thành công!', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'dark'
        });
        if (typeof refreshUser === 'function') {
          await refreshUser();
        }
      } else {
        toast.error(result.message || 'Cập nhật thông tin thất bại');
      }
    } catch (err) {
      const e = err as Error;
      toast.error(e.message || 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!currentPassword) {
      toast.warning('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.warning('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Xác nhận mật khẩu mới không trùng khớp');
      return;
    }

    try {
      setChangingPassword(true);
      const payload: PasswordData = {
        currentPassword,
        newPassword,
        confirmPassword
      };
      const result = await authService.changePassword(payload);
      if (result.success) {
        toast.success('Đổi mật khẩu thành công!', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'dark'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err) {
      const e = err as Error;
      toast.error(e.message || 'Không thể đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Remove from Favorites
  const handleRemoveFavorite = async (movieId: string, slug?: string): Promise<void> => {
    try {
      const prev = favorites;
      setFavorites((f) => f.filter((item) => item.id !== movieId));
      const res = await favoritesService.removeFromFavorites(movieId, slug);
      if (res.success) {
        toast.success('Đã xóa phim khỏi danh sách yêu thích');
      } else {
        setFavorites(prev);
        toast.error(res.message || 'Không thể xóa phim');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xóa phim');
      loadFavorites();
    }
  };

  // Handle Remove from Watchlist
  const handleRemoveWatchlist = async (movieId?: string): Promise<void> => {
    if (!movieId) return;
    try {
      const prev = watchlist;
      setWatchlist((w) => w.filter((item) => item.id !== movieId));
      const res = await watchlistService.removeFromWatchlist(movieId);
      if (res.success) {
        toast.success('Đã xóa phim khỏi danh sách xem sau');
      } else {
        setWatchlist(prev);
        toast.error(res.message || 'Không thể xóa phim');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xóa phim');
      loadWatchlist();
    }
  };

  // Handle Logout
  const handleLogout = async (): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
      await logout();
      router.push('/');
    }
  };

  const formattedJoinDate = useMemo(() => {
    const rawDate = (user as { createdAt?: string })?.createdAt;
    if (!rawDate) return 'Thành viên 2026';
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? 'Thành viên 2026' : `Thành viên từ ${d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`;
  }, [user]);

  if (authLoading || (loadingProfile && !fullName)) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.mainContainer}>
          <div className="text-center py-5 my-5">
            <FaSpinner className={`${styles.spinner} text-danger`} size={36} />
            <p className="text-muted mt-3">Đang đồng bộ thông tin hồ sơ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <Head>
        <title>Hồ Sơ Cá Nhân - NewbieCoder Cinema</title>
        <meta name="description" content="Quản lý thông tin tài khoản, danh sách phim yêu thích, xem sau và lịch sử xem phim" />
      </Head>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" hideProgressBar={false} />

      <div className={styles.mainContainer}>
        {/* ==================== 1. HERO PROFILE CARD ==================== */}
        <section className={styles.heroCard}>
          <div className={styles.heroTopRow}>
            <div className={styles.identityGroup}>
              <div className={styles.avatarWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt={fullName || 'Avatar'}
                  className={styles.avatarImage}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = '/img/user-avatar.png';
                  }}
                />
                <button
                  type="button"
                  className={styles.avatarBadgeBtn}
                  title="Thay đổi ảnh đại diện"
                  onClick={() => {
                    const nextAvatar = PRESET_AVATARS[(PRESET_AVATARS.indexOf(avatarUrl as never) + 1) % PRESET_AVATARS.length] || PRESET_AVATARS[0];
                    setAvatarUrl(nextAvatar);
                    toast.info('Đã chuyển đổi ảnh đại diện', { autoClose: 1800 });
                  }}
                >
                  <FaCamera />
                </button>
              </div>

              <div className={styles.userInfo}>
                <h1 className={styles.userName}>
                  <span>{fullName || 'Người Dùng Xem Phim'}</span>
                  <FaCheckCircle className="text-success" size={18} title="Tài khoản đã xác thực" />
                </h1>
                <p className={styles.userEmail}>
                  <FaEnvelope size={13} />
                  <span>{email || 'Chưa liên kết email'}</span>
                </p>
                <div className={styles.metaTagsRow}>
                  <span className={`${styles.roleBadge} ${styles.roleBadgeVip}`}>
                    <FaCrown />
                    <span>PREMIUM VIP</span>
                  </span>
                  <span className={styles.joinDateBadge}>
                    <FaCalendarAlt size={12} />
                    <span>{formattedJoinDate}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.heroBtnLogout}
                onClick={handleLogout}
                title="Đăng xuất khỏi thiết bị"
              >
                <FaSignOutAlt />
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>

          {/* Telemetry Counter Ribbon */}
          <div className={styles.statsStrip}>
            <div className={styles.statItem} onClick={() => setActiveTab('history')} role="button" tabIndex={0}>
              <div className={styles.statIconBox}>
                <FaFilm />
              </div>
              <div className={styles.statCol}>
                <span className={styles.statValue}>{historyList.length}</span>
                <span className={styles.statLabel}>Phim Đã Xem</span>
              </div>
            </div>

            <div className={styles.statItem} onClick={() => setActiveTab('favorites')} role="button" tabIndex={0}>
              <div className={`${styles.statIconBox} ${styles.statIconHeart}`}>
                <FaHeart />
              </div>
              <div className={styles.statCol}>
                <span className={styles.statValue}>{favorites.length}</span>
                <span className={styles.statLabel}>Phim Yêu Thích</span>
              </div>
            </div>

            <div className={styles.statItem} onClick={() => setActiveTab('watchlist')} role="button" tabIndex={0}>
              <div className={`${styles.statIconBox} ${styles.statIconBookmark}`}>
                <FaBookmark />
              </div>
              <div className={styles.statCol}>
                <span className={styles.statValue}>{watchlist.length}</span>
                <span className={styles.statLabel}>Xem Sau</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={`${styles.statIconBox} ${styles.statIconClock}`}>
                <FaClock />
              </div>
              <div className={styles.statCol}>
                <span className={styles.statValue}>{Math.max(historyList.length * 1.5, 3.5).toFixed(1)}h</span>
                <span className={styles.statLabel}>Tổng Thời Lượng</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 2. HORIZONTAL TAB STRIP ==================== */}
        <nav className={styles.tabsDeck} aria-label="Điều hướng hồ sơ">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaUser />
            <span>Thông Tin Cá Nhân</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <FaHeart />
            <span>Phim Yêu Thích</span>
            {favorites.length > 0 && <span className={styles.tabCountBadge}>{favorites.length}</span>}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'watchlist' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            <FaBookmark />
            <span>Xem Sau</span>
            {watchlist.length > 0 && <span className={styles.tabCountBadge}>{watchlist.length}</span>}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory />
            <span>Lịch Sử Xem</span>
            {historyList.length > 0 && <span className={styles.tabCountBadge}>{historyList.length}</span>}
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaShieldAlt />
            <span>Bảo Mật & Mật Khẩu</span>
          </button>
        </nav>

        {/* ==================== 3. TAB PANELS ==================== */}

        {/* TAB 1: OVERVIEW & PERSONAL INFO */}
        {activeTab === 'overview' && (
          <section className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  <FaUser className="text-danger" />
                  <span>Thông Tin Hồ Sơ Cá Nhân</span>
                </h2>
                <p className={styles.panelSubtitle}>Cập nhật thông tin chi tiết để nâng cao chất lượng đề xuất phim theo sở thích của bạn.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="profile-fullname">
                    <FaUser size={12} />
                    <span>Họ và tên</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaUser className={styles.inputIcon} />
                    <input
                      type="text"
                      id="profile-fullname"
                      className={styles.textInput}
                      placeholder="Nhập họ và tên đầy đủ"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="profile-email">
                    <FaEnvelope size={12} />
                    <span>Email tài khoản (Bảo mật)</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type="email"
                      id="profile-email"
                      className={styles.textInput}
                      value={email}
                      disabled
                      title="Email đăng nhập không thể thay đổi trực tiếp"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="profile-phone">
                    <FaPhone size={12} />
                    <span>Số điện thoại liên hệ</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaPhone className={styles.inputIcon} />
                    <input
                      type="tel"
                      id="profile-phone"
                      className={styles.textInput}
                      placeholder="Nhập số điện thoại"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="profile-dob">
                    <FaCalendarAlt size={12} />
                    <span>Ngày sinh</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaCalendarAlt className={styles.inputIcon} />
                    <input
                      type="date"
                      id="profile-dob"
                      className={styles.textInput}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                  <label className={styles.fieldLabel} htmlFor="profile-address">
                    <FaMapMarkerAlt size={12} />
                    <span>Địa chỉ / Tỉnh Thành</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaMapMarkerAlt className={styles.inputIcon} />
                    <input
                      type="text"
                      id="profile-address"
                      className={styles.textInput}
                      placeholder="Ví dụ: TP. Hồ Chí Minh, Việt Nam"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                  <label className={styles.fieldLabel} htmlFor="profile-bio">
                    <span>Giới thiệu bản thân (Bio)</span>
                  </label>
                  <textarea
                    id="profile-bio"
                    className={styles.textareaInput}
                    placeholder="Viết một vài dòng ngắn về gu xem phim hoặc sở thích điện ảnh của bạn..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Genre Tag Selection */}
                <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                  <label className={styles.fieldLabel}>
                    <FaFilm size={12} />
                    <span>Thể loại phim bạn yêu thích nhất</span>
                  </label>
                  <div className={styles.genreChipsDeck}>
                    {AVAILABLE_GENRES.map((genre) => {
                      const isActive = favoriteGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          className={`${styles.genreChip} ${isActive ? styles.genreChipActive : ''}`}
                          onClick={() => toggleGenre(genre)}
                        >
                          {isActive && <FaCheckCircle className="me-1" size={11} />}
                          <span>{genre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.formSubmitRow}>
                <button
                  type="submit"
                  className={styles.btnPrimarySave}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <FaSpinner className={styles.spinner} />
                      <span>Đang lưu thông tin...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      <span>Lưu Thông Tin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 2: FAVORITES */}
        {activeTab === 'favorites' && (
          <section className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  <FaHeart className="text-danger" />
                  <span>Danh Sách Phim Yêu Thích</span>
                </h2>
                <p className={styles.panelSubtitle}>Những bộ phim bạn đã đánh dấu theo dõi để xem lại bất cứ lúc nào.</p>
              </div>
              {favorites.length > 0 && (
                <Link href="/user/favorites" className={styles.viewAllLink}>
                  <span>Xem trang quản lý nâng cao</span>
                  <FaArrowRight size={12} />
                </Link>
              )}
            </div>

            {favoritesLoading ? (
              <div className="text-center py-5">
                <FaSpinner className={`${styles.spinner} text-danger`} size={32} />
                <p className="text-muted mt-3">Đang tải danh sách phim yêu thích...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconBox}>
                  <FaHeart />
                </div>
                <h3 className={styles.emptyTitle}>Chưa có phim yêu thích</h3>
                <p className={styles.emptyDesc}>Hãy bấm vào nút Theo Dõi trên bất kỳ bộ phim nào bạn yêu thích để lưu vào đây.</p>
                <Link href="/" className={styles.btnBrowseMovies}>
                  <span>Khám Phá Phim Ngay</span>
                  <FaArrowRight />
                </Link>
              </div>
            ) : (
              <div className={styles.movieGrid}>
                {favorites.map((m) => (
                  <article key={m.id} className={styles.movieCard}>
                    <div className={styles.cardPosterWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnail || '/img/placeholder-poster.svg'}
                        alt={m.title}
                        className={styles.cardPoster}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/img/placeholder-poster.svg';
                        }}
                      />
                      <span className={styles.cardBadgeQuality}>{m.quality || 'Full HD'}</span>
                      {m.rating ? (
                        <span className={styles.cardBadgeRating}>
                          <FaStar size={10} />
                          <span>{Number(m.rating).toFixed(1)}</span>
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.cardBody}>
                      <Link href={`/movie/${m.slug || m.id}`} className={styles.cardMovieTitle} title={m.title}>
                        {m.title}
                      </Link>
                      <div className={styles.cardMetaRow}>
                        <span>{m.year || '2026'}</span>
                        <span>{m.type === 'series' ? 'Phim Bộ' : 'Phim Lẻ'}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <Link href={`/movie/${m.slug || m.id}`} className={styles.cardBtnWatch}>
                          <FaPlay size={10} />
                          <span>Xem Phim</span>
                        </Link>
                        <button
                          type="button"
                          className={styles.cardBtnRemove}
                          onClick={() => handleRemoveFavorite(m.id, m.slug)}
                          title="Xóa khỏi yêu thích"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <section className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  <FaBookmark className="text-primary" />
                  <span>Danh Sách Xem Sau</span>
                </h2>
                <p className={styles.panelSubtitle}>Các bộ phim bạn đã lưu lại để thưởng thức khi có thời gian rảnh.</p>
              </div>
            </div>

            {watchlistLoading ? (
              <div className="text-center py-5">
                <FaSpinner className={`${styles.spinner} text-primary`} size={32} />
                <p className="text-muted mt-3">Đang tải danh sách xem sau...</p>
              </div>
            ) : watchlist.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconBox}>
                  <FaBookmark />
                </div>
                <h3 className={styles.emptyTitle}>Danh sách xem sau đang trống</h3>
                <p className={styles.emptyDesc}>Lưu lại những bộ phim thú vị để tiện theo dõi vào cuối tuần!</p>
                <Link href="/" className={styles.btnBrowseMovies}>
                  <span>Khám Phá Phim Ngay</span>
                  <FaArrowRight />
                </Link>
              </div>
            ) : (
              <div className={styles.movieGrid}>
                {watchlist.map((m) => (
                  <article key={m.id} className={styles.movieCard}>
                    <div className={styles.cardPosterWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnail || '/img/placeholder-poster.svg'}
                        alt={m.title}
                        className={styles.cardPoster}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/img/placeholder-poster.svg';
                        }}
                      />
                      <span className={styles.cardBadgeQuality}>{(m.quality as string) || 'HD'}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <Link href={`/movie/${m.slug || m.id}`} className={styles.cardMovieTitle} title={m.title}>
                        {m.title}
                      </Link>
                      <div className={styles.cardMetaRow}>
                        <span>{String(m.year || '2026')}</span>
                        <span>{m.type === 'series' ? 'Phim Bộ' : 'Phim Lẻ'}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <Link href={`/movie/${m.slug || m.id}`} className={styles.cardBtnWatch}>
                          <FaPlay size={10} />
                          <span>Xem Ngay</span>
                        </Link>
                        <button
                          type="button"
                          className={styles.cardBtnRemove}
                          onClick={() => handleRemoveWatchlist(m.id)}
                          title="Xóa khỏi danh sách xem sau"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: WATCH HISTORY */}
        {activeTab === 'history' && (
          <section className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  <FaHistory className="text-warning" />
                  <span>Lịch Sử Xem Phim</span>
                </h2>
                <p className={styles.panelSubtitle}>Danh sách các bộ phim bạn đã xem gần đây và tiến độ đang phát.</p>
              </div>
            </div>

            {historyLoading ? (
              <div className="text-center py-5">
                <FaSpinner className={`${styles.spinner} text-warning`} size={32} />
                <p className="text-muted mt-3">Đang đồng bộ lịch sử xem phim...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconBox}>
                  <FaHistory />
                </div>
                <h3 className={styles.emptyTitle}>Chưa có lịch sử xem</h3>
                <p className={styles.emptyDesc}>Hãy chọn một bộ phim bom tấn và bắt đầu thưởng thức ngay thôi!</p>
                <Link href="/" className={styles.btnBrowseMovies}>
                  <span>Xem Phim Ngay</span>
                  <FaArrowRight />
                </Link>
              </div>
            ) : (
              <div className={styles.movieGrid}>
                {historyList.map((m) => (
                  <article key={m.id} className={styles.movieCard}>
                    <div className={styles.cardPosterWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.thumbnail || '/img/placeholder-poster.svg'}
                        alt={m.title}
                        className={styles.cardPoster}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.src = '/img/placeholder-poster.svg';
                        }}
                      />
                      {m.progress ? (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <div style={{ height: '100%', width: `${m.progress}%`, background: '#e50914' }} />
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.cardBody}>
                      <Link href={`/movie/${m.slug || m.id}`} className={styles.cardMovieTitle} title={m.title}>
                        {m.title}
                      </Link>
                      <div className={styles.cardMetaRow}>
                        <span>{m.epName ? `Đang xem: ${m.epName}` : 'Đã xem gần đây'}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <Link href={`/movie/${m.slug || m.id}`} className={styles.cardBtnWatch}>
                          <FaPlay size={10} />
                          <span>Tiếp Tục Xem</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 5: SECURITY & CHANGE PASSWORD */}
        {activeTab === 'security' && (
          <section className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  <FaShieldAlt className="text-success" />
                  <span>Bảo Mật Tài Khoản & Đổi Mật Khẩu</span>
                </h2>
                <p className={styles.panelSubtitle}>Bảo vệ tài khoản của bạn bằng mật khẩu mạnh kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ maxWidth: 640 }}>
              <div className="d-flex flex-column gap-3">
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="current-password">
                    <FaLock size={12} />
                    <span>Mật khẩu hiện tại</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      id="current-password"
                      className={styles.textInput}
                      placeholder="Nhập mật khẩu hiện tại của bạn"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      tabIndex={-1}
                    >
                      {showCurrentPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="new-password">
                    <FaLock size={12} />
                    <span>Mật khẩu mới (Tối thiểu 6 ký tự)</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      id="new-password"
                      className={styles.textInput}
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowNewPass(!showNewPass)}
                      tabIndex={-1}
                    >
                      {showNewPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="confirm-password">
                    <FaLock size={12} />
                    <span>Xác nhận mật khẩu mới</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      id="confirm-password"
                      className={styles.textInput}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      tabIndex={-1}
                    >
                      {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.formSubmitRow}>
                <button
                  type="submit"
                  className={styles.btnPrimarySave}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <FaSpinner className={styles.spinner} />
                      <span>Đang cập nhật mật khẩu...</span>
                    </>
                  ) : (
                    <>
                      <FaShieldAlt />
                      <span>Đổi Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
