import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUser, FaHistory, FaHeart, FaBookmark, FaChartLine, FaEdit, FaTimes, FaSave, 
  FaCamera, FaSignInAlt, FaCheck, FaCalendarAlt, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaLock, FaShieldAlt, FaCrown, FaEllipsisH, FaTv, FaClock, FaStar, FaEye, FaFilm,
  FaBars, FaSync, FaPlay, FaSignOutAlt, FaTrash, FaThumbsUp, FaThumbsDown, FaComment, 
  FaCheckCircle, FaCalendarCheck, FaArrowLeft
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Profile.module.css';
import authService from '../API/services/authService';
import historyService from '../API/services/historyService';
import favoritesService from '../API/services/favoritesService';
import watchlistService from '../API/services/watchlistService';
import subscriptionService from '../API/services/subscriptionService';
import { HistoryContent } from '../pages/history';
import WatchLater from '../pages/watchlater';
import Favorites from '../pages/favorites';

// Đường dẫn avatar mặc định
const DEFAULT_AVATAR = '/img/avatar.png';

export default function ProfilePage() {
  const { user, status, refreshUser } = useAuth();
  const router = useRouter();
  
  // State management
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bio: '',
    favoriteGenres: [],
  });
  
  const [originalData, setOriginalData] = useState({});
  const [activityData, setActivityData] = useState([]);
  const [favoritesData, setFavoritesData] = useState([]);
  const [watchLaterData, setWatchLaterData] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({
    moviesWatched: 0,
    seriesWatched: 0,
    totalWatchTime: 0,
    favoriteGenre: '',
    totalRatings: 0,
  });
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const fileInputRef = useRef(null);
  const bioRef = useRef(null);

  // Thêm state để kiểm soát mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State for password change functionality
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // State to track which tab data has been loaded
  const [tabDataLoaded, setTabDataLoaded] = useState({
    profile: false,
    activity: false,
    favorites: false,
    watchlater: false,
    stats: false,
  });

  // State for current subscription
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Tabs configuration
  const tabs = useMemo(() => [
    { id: 'profile', label: 'Hồ sơ', icon: <FaUser /> },
    { id: 'activity', label: 'Hoạt động', icon: <FaHistory /> },
    { id: 'favorites', label: 'Yêu thích', icon: <FaHeart /> },
    { id: 'watchlater', label: 'Xem sau', icon: <FaBookmark /> },
    { id: 'stats', label: 'Thống kê', icon: <FaChartLine /> },
  ], []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.2 } }
  };

  // Fetch stats data
  const fetchStatsData = useCallback(async () => {
    try {
      console.log('🔍 Bắt đầu lấy dữ liệu thống kê người dùng...');
      
      // 1. Lấy thống kê về phim đã xem
      const watchStats = await authService.getUserWatchStats();
      console.log("✓ Dữ liệu xem phim:", watchStats);
      
      // 2. Lấy hoạt động trong tuần
      const weeklyActivity = await authService.getUserWeeklyActivity();
      console.log("✓ Hoạt động theo tuần:", weeklyActivity);
      
      // 3. Lấy phân bố thể loại
      const genreDistribution = await authService.getUserGenreDistribution();
      console.log("✓ Phân bố thể loại:", genreDistribution);
      
      // 4. Lấy thành tựu và thông tin tổng hợp
      const achievementsData = await authService.getUserAchievements();
      console.log("✓ Thành tựu người dùng:", achievementsData);
      
      const combinedStats = {
        // Process watchStats correctly
        moviesWatched: watchStats?.totalWatchedMovies || 0,
        seriesWatched: watchStats?.totalWatchedSeries || 0,
        totalWatchTime: watchStats?.totalWatchTime?.hours || 0,
        totalWatchTimeMinutes: watchStats?.totalWatchTimeMinutes || 0,
        totalWatchTimeDisplay: watchStats?.totalWatchTime?.displayText || '0 giờ 0 phút',
        favoriteGenre: watchStats?.favoriteGenres?.length > 0 
          ? watchStats.favoriteGenres[0]?.name 
          : 'Chưa có dữ liệu',
        
        // Use weekly activity data
        weeklyActivity: weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
        
        // Use genre distribution data
        genreDistribution: genreDistribution || [],
        
        // Process achievements data correctly
        achievements: achievementsData?.achievements || [],
        userLevel: achievementsData?.stats?.userLevel || 'Người mới',
        levelProgress: achievementsData?.stats?.levelProgress || 0,
        
        // Extract additional stats
        categoriesExplored: achievementsData?.stats?.categoriesExplored || 0,
        completedMovies: achievementsData?.stats?.completedMovies || 0,
        completedSeries: achievementsData?.stats?.completedSeries || 0,
        completedAchievements: achievementsData?.stats?.completedAchievements || 0,
        totalAchievements: achievementsData?.stats?.totalAchievements || 0,
        totalLikes: achievementsData?.stats?.totalLikes || 0,
        totalDislikes: achievementsData?.stats?.totalDislikes || 0,
        totalComments: achievementsData?.stats?.totalComments || 0,
        viewCount: achievementsData?.stats?.viewCount || 0,
        completedWatchCount: achievementsData?.stats?.completedWatchCount || 0,
        totalRatings: achievementsData?.stats?.totalRatings || 0,
      };
      
      console.log("📊 Dữ liệu thống kê tổng hợp:", combinedStats);
      setStats(combinedStats);
      setTabDataLoaded(prev => ({ ...prev, stats: true }));
    } catch (statsError) {
      console.error("Lỗi khi lấy dữ liệu thống kê:", statsError);
      toast.error("Không thể lấy dữ liệu thống kê. Vui lòng thử lại sau.");
    }
  }, []);

  // Fetch user data including profile, history, favorites, watchlist, and stats
  const fetchUserData = useCallback(async () => {
    setLoadingProfile(true);
    try {
      // Lấy dữ liệu người dùng từ context
      const userData = user || {};
      
      // Cập nhật thông tin cơ bản từ context auth
      setProfileData({
        fullName: userData.fullname || userData.fullname || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || userData.date_of_birth || '',
        bio: userData.bio || '',
        favoriteGenres: userData.favoriteGenres || [],
      });
      
      setOriginalData({
        fullName: userData.fullName || userData.fullname || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || userData.date_of_birth || '',
        bio: userData.bio || '',
        favoriteGenres: userData.favoriteGenres || [],
      });

      // Đặt avatar từ user context
      if (userData.image || userData.avatar) {
        setAvatar(userData.image || userData.avatar);
      }
      
      // Load basic data for tabs in parallel to improve performance
      const promises = [];
      
      try {
        // Fetch watch history - lấy tất cả lịch sử (limit=100)
        const historyData = await historyService.getUserHistory(100, 1);
        console.log("Dữ liệu lịch sử từ API:", historyData);
        
        // Đảm bảo dữ liệu là một mảng, bất kể định dạng trả về
        let histories = [];
        if (historyData && Array.isArray(historyData)) {
          histories = historyData;
        } else if (historyData && historyData.histories && Array.isArray(historyData.histories)) {
          histories = historyData.histories;
        } else if (historyData && typeof historyData === 'object') {
          histories = historyData.data || [];
        }
        
        setActivityData(histories);
        setTabDataLoaded(prev => ({ ...prev, activity: true }));
        
        // 2. Fetch favorites - for favorites tab
        promises.push(
          favoritesService.getFavorites()
            .then(favoriteData => {
              console.log("Loaded favorites data:", favoriteData);
              setFavoritesData(favoriteData || []);
              setTabDataLoaded(prev => ({ ...prev, favorites: true }));
            })
            .catch(error => {
              console.error("Error loading favorites data:", error);
              setFavoritesData([]);
            })
        );
        
        // 3. Fetch watchlist - for watchlater tab
        promises.push(
          watchlistService.getWatchlist()
            .then(watchlistData => {
              console.log("Loaded watchlist data:", watchlistData);
              console.log("Watchlist data length:", watchlistData ? watchlistData.length : 0);
              setWatchLaterData(watchlistData || []);
              setTabDataLoaded(prev => ({ ...prev, watchlater: true }));
            })
            .catch(error => {
              console.error("Error loading watchlist data:", error);
              setWatchLaterData([]);
            })
        );
        
        // Execute all promises in parallel
        await Promise.all(promises);
        
        // Không tải thống kê ngay khi load trang, chỉ tải khi người dùng chọn tab thống kê
        // await fetchStatsData();
        
        // Mark profile tab as loaded
        setTabDataLoaded(prev => ({ ...prev, profile: true }));
        
      } catch (apiError) {
        console.error("Lỗi khi gọi API:", apiError);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      toast.error("Không thể lấy thông tin cá nhân. Vui lòng thử lại sau.");
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  // Initial data loading
  useEffect(() => {
    if (user) {
      fetchUserData();
      
      // Set avatar URL properly with absolute path
      if (user.avatar) {
        console.log("Raw avatar from user data:", user.avatar);
        
        let avatarUrl = user.avatar;
        // Process avatar URL properly based on its format
        if (avatarUrl && avatarUrl.startsWith('/')) {
          // For relative paths (local uploads), prepend the base URL
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          // Loại bỏ phần /api nếu đã có trong baseUrl
          const baseWithoutApi = baseUrl.endsWith('/api') 
            ? baseUrl.substring(0, baseUrl.length - 4) 
            : baseUrl;
          
          console.log("Base URL after processing:", baseWithoutApi);
          avatarUrl = `${baseWithoutApi}${avatarUrl}`;
        }
        
        // Thêm timestamp để tránh cache (but only for non-Google URLs)
        if (!avatarUrl.includes('googleusercontent.com')) {
          avatarUrl = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        }
        
        console.log("Final avatar URL being displayed:", avatarUrl);
        setAvatar(avatarUrl);
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [user, status, router, fetchUserData]);

  // Fetch premium subscription status
  const fetchPremiumStatus = useCallback(async () => {
    if (user) {
      try {
        const subscriptionData = await subscriptionService.getCurrentSubscription();
        setCurrentSubscription(subscriptionData);
      } catch (error) {
        console.error("Failed to fetch premium status:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchPremiumStatus();
  }, [fetchPremiumStatus]);

  // Navigate to premium page
  const handleNavigateToPremium = () => {
    router.push('/premium');
  };

  // Kiểm tra thay đổi trong dữ liệu biểu mẫu
  useEffect(() => {
    if (isEditing) {
      const hasChanged = Object.keys(profileData).some(key => 
        JSON.stringify(profileData[key]) !== JSON.stringify(originalData[key])
      );
      setHasChanges(hasChanged);
    }
  }, [profileData, originalData, isEditing]);
  
  // Tự động điều chỉnh chiều cao textarea khi nhập bio
  useEffect(() => {
    if (bioRef.current && isEditing) {
      bioRef.current.style.height = 'auto';
      bioRef.current.style.height = `${bioRef.current.scrollHeight}px`;
    }
  }, [profileData.bio, isEditing]);

  // Track changes in form fields
  useEffect(() => {
    if (Object.keys(originalData).length > 0) {
      const changed = 
        originalData.fullName !== profileData.fullName ||
        originalData.phone !== profileData.phone ||
        originalData.address !== profileData.address ||
        originalData.dateOfBirth !== profileData.dateOfBirth ||
        originalData.bio !== profileData.bio ||
        JSON.stringify(originalData.favoriteGenres) !== JSON.stringify(profileData.favoriteGenres);
      
      setHasChanges(changed);
    }
  }, [profileData, originalData]);

  // Fetch featured content based on user preferences
  const fetchFeaturedContent = async () => {
    try {
      // Reemplazar los datos simulados con una llamada API real
      const featured = await authService.getFeaturedContent();
      setFeaturedContent(featured || []);
    } catch (error) {
      console.error("Error fetching featured content:", error);
      setFeaturedContent([]);
    }
  };

  // Properly format date for date input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle different date formats
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DD for input type="date"
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error formatting date for input:", e);
      return '';
    }
  };

  // Các hàm xử lý
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    console.log(`Selected file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file quá lớn. Tối đa 5MB");
      return;
    }
    
    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      toast.error("Chỉ chấp nhận file hình ảnh");
      return;
    }
    
    setIsUploading(true);
    try {
      console.log("Starting avatar upload to Cloudinary...");
      
      // Truyền trực tiếp file vào uploadAvatar
      const response = await authService.uploadAvatar(file);
      console.log("Upload response:", response);
      
      if (response.success) {
        // Lấy URL avatar từ response - đây là URL Cloudinary trả về
        const cloudinaryUrl = response.avatarUrl || response.user?.avatar;
        console.log("Cloudinary avatar URL from response:", cloudinaryUrl);
        
        // Sử dụng URL Cloudinary trực tiếp, không cần thêm baseUrl
        setAvatar(cloudinaryUrl);
        
        // Cập nhật user context với avatar URL mới
        refreshUser({
          ...user,
          avatar: cloudinaryUrl
        });
        
        // Đóng dropdown tùy chọn avatar sau khi tải lên thành công
        setShowAvatarOptions(false);
        
        toast.success("Avatar đã được cập nhật thành công!");
      } else {
        console.error("Upload succeeded but response indicates failure:", response);
        toast.error("Không thể tải lên avatar. Vui lòng thử lại sau!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Không thể tải lên avatar. Vui lòng thử lại sau!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Xử lý trường hợp field từ form password
    if (['currentPassword', 'newPassword', 'confirmPassword'].includes(name)) {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // Trường hợp field từ form thông tin cá nhân
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
        favoriteGenres: prev.favoriteGenres || [], // Đảm bảo favoriteGenres luôn là mảng
      }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    
    setIsSaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success("Mật khẩu đã được cập nhật thành công!");
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng thử lại sau!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/auth/login');
    }
  };

  const handleGenreChange = (genre) => {
    setProfileData(prev => {
      const updatedGenres = prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre];
      
      return {
        ...prev,
        favoriteGenres: updatedGenres
      };
    });
  };

  const toggleEdit = () => {
    if (isEditing && hasChanges) {
      setShowConfirmation(true);
    } else {
      setIsEditing(!isEditing);
      if (isEditing) {
        // Reset form nếu hủy chỉnh sửa
        setProfileData((prev) => ({
          ...originalData,
          favoriteGenres: originalData.favoriteGenres || [], // Đảm bảo là mảng
        }));
      }
    }
  };
  
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleConfirmCancel = () => {
    setShowConfirmation(false);
    setIsEditing(false);
    setProfileData(originalData);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      const payload = {
        fullName: profileData.fullName,
        phone: profileData.phone,
        address: profileData.address,
        dateOfBirth: profileData.dateOfBirth,
        bio: profileData.bio,
        favoriteGenres: profileData.favoriteGenres
      };
      
      const response = await authService.updateProfile(payload);
      
      if (response.success) {
        toast.success('Thông tin cá nhân đã được cập nhật!');
        setOriginalData({...profileData});
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin! Vui lòng thử lại sau.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await authService.updateProfile(userInfo);
      setUser({
        ...user,
        ...userInfo
      });
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Cập nhật thông tin thất bại. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      return dateString;
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} ngày trước`;
    
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} tháng trước`;
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'stats' && !tabDataLoaded.stats) {
      fetchStatsData();
    }
  };
  
  const handleRemoveFavorite = async (movieId) => {
    try {
      // Call API to remove from favorites
      await authService.removeFavorite(movieId);
      
      // Update state to remove item from UI
      setFavoritesData(prev => prev.filter(movie => movie.id !== movieId));
      toast.success("Phim đã được xóa khỏi danh sách yêu thích!");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Không thể xóa phim khỏi danh sách yêu thích. Vui lòng thử lại sau!");
    }
  };
  
  const handleRemoveWatchLater = async (movieId) => {
    try {
      // Call API to remove from watchlist using watchlistService directly
      const result = await watchlistService.removeFromWatchlist(movieId);
      
      if (result.success) {
        // Update state to remove item from UI
        setWatchLaterData(prev => prev.filter(movie => movie.id !== movieId));
        toast.success("Phim đã được xóa khỏi danh sách xem sau!");
      } else {
        toast.error(result.message || "Không thể xóa phim khỏi danh sách xem sau.");
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Không thể xóa phim khỏi danh sách xem sau. Vui lòng thử lại sau!");
    }
  };

  const handleRemoveHistory = async (historyId) => {
    try {
      // Call API to remove from history
      await historyService.deleteHistory(historyId);
      
      // Update state to remove item from UI
      setActivityData(prev => prev.filter(history => (history._id || history.id) !== historyId));
      toast.success("Phim đã được xóa khỏi lịch sử xem!");
    } catch (error) {
      console.error("Error removing history:", error);
      toast.error("Không thể xóa lịch sử xem phim. Vui lòng thử lại sau!");
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem phim không?")) {
      try {
        // Call API to clear history
        await historyService.clearAllHistory();
        
        // Update state to clear history from UI
        setActivityData([]);
        toast.success("Đã xóa toàn bộ lịch sử xem phim!");
      } catch (error) {
        console.error("Error clearing history:", error);
        toast.error("Không thể xóa toàn bộ lịch sử xem phim. Vui lòng thử lại sau!");
      }
    }
  };

  // Thêm vào function component sau các state hiện có
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Add this function to render the "Watch Later" tab
  const renderWatchLaterTab = () => {
    return (
      <motion.div 
        className="profile-content-area"
        key="watchlater"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Sử dụng component WatchLater đã được import từ pages/watchlater.js */}
        <WatchLater inProfilePage={true} />
      </motion.div>
    );
  };
  const renderProfileTab = () => {
    return (
      <motion.div 
        className="profile-content-area"
        key="profile"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={styles.premiumSection}>
          {currentSubscription && currentSubscription.hasActiveSubscription ? (
            <div className={styles.premiumActiveBanner}>
              <div className={styles.premiumContent}>
                <div className={styles.premiumInfo}>
                  <h3 className={styles.premiumTitle}> 
                    <FaCrown className={styles.crownIconLarge} />
                    Thành viên Premium
                  </h3>
                  <p className={styles.premiumDescription}>
                    Bạn đang sở hữu gói <strong>{currentSubscription.subscription?.packageId?.name || 'Premium'}</strong>
                  </p>
                  <div className={styles.premiumMeta}>
                    <div className={styles.premiumFeature}>
                      <FaCalendarCheck className={styles.checkIcon} /> 
                      Còn lại: <span className={styles.daysRemaining}>{currentSubscription.daysLeft || 0} ngày</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div 
                        className={styles.progressBar} 
                        style={{ 
                          width: `${Math.min(100, (currentSubscription.daysLeft / (currentSubscription.subscription?.durationDays || 30)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>                <div className={styles.premiumAction}>
                  <Link href="/premium" className={styles.memberBadge}>
                    <FaCrown className={styles.memberBadgeIcon} /> 
                    Chi tiết gói
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.premiumBanner}>
              <div className={styles.premiumContent}>
                <div className={styles.premiumInfo}>
                  <h3 className={styles.premiumTitle}> <FaCrown className={styles.crownIconLarge} />Tài khoản Premium</h3>
                  <p className={styles.premiumDescription}>
                    Nâng cấp lên Premium để xem không giới hạn, không quảng cáo và truy cập sớm vào các nội dung mới nhất.
                  </p>
                  <div className={styles.premiumMeta}>
                    <div className={styles.premiumFeature}>
                      <FaCheck className={styles.checkIcon} /> Không quảng cáo trên nền tảng
                    </div>
                    <div className={styles.premiumFeature}>
                      <FaCheck className={styles.checkIcon} /> Xem nội dung độc quyền
                    </div>
                  </div>
                </div>
                <div className={styles.premiumAction}>
                  <button className={styles.premiumButton} onClick={handleNavigateToPremium}>
                    <FaCrown className={styles.upgradeIcon} /> 
                    Nâng cấp Ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <motion.div
          variants={itemVariants}
          className={styles.profileFormSection}
        >
          <div className={styles.sectionHeaderWithEdit}>
            <h3 className={styles.heading3}>Thông tin cơ bản</h3>
            <div className={styles.editButtons}>
              {isEditing && hasChanges && (
                <button 
                  className={styles.button}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className={styles.spinnerSmall}></div> Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaSave className={styles.icon} /> Lưu thay đổi
                    </>
                  )}
                </button>
              )}
              <button 
                className={`${styles.actionButton} ${isEditing ? styles.buttonLight : styles.button}`}
                onClick={toggleEdit}
                disabled={isSaving}
                style={{marginLeft: '10px'}}
              >
                {isEditing ? (
                  <>
                    <FaTimes className={styles.icon} /> Hủy
                  </>
                ) : (
                  <>
                    <FaEdit className={styles.icon} /> Chỉnh sửa
                  </>
                )}
              </button>
            </div>
          </div>
          <div className={styles.gridContainer}>
            <div className={styles.formGroup}>
              <div className={styles.formField}>
                <div className={styles.labelRow}>
                  <FaUser className={styles.formIcon} /> 
                  <label className={styles.formLabel}>Họ và tên</label>
                </div>
                <div className={styles.formContent}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <p className={styles.formValue}>{profileData.fullName || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.formField}>
                <div className={styles.labelRow}>
                  <FaEnvelope className={styles.formIcon} />
                  <label className={styles.formLabel}>Email</label>
                </div>
                <div className={styles.formContent}>
                  <p className={styles.formValue}>
                    {profileData.email || 'Chưa cập nhật'}
                    {profileData.email && profileData.email.includes('@gmail.com') && (
                      <span className={styles.gmailBadge}>Gmail</span>
                    )}
                    {profileData.email && (
                      <span className={styles.verifiedBadge}>
                        <FaCheck /> Đã xác thực
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.formField}>
                <div className={styles.labelRow}>
                  <FaPhone className={styles.formIcon} />
                  <label className={styles.formLabel}>Số điện thoại</label>
                </div>
                <div className={styles.formContent}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <p className={styles.formValue}>{profileData.phone || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.formField}>
                <div className={styles.labelRow}>
                  <FaMapMarkerAlt className={styles.formIcon} />
                  <label className={styles.formLabel}>Địa chỉ</label>
                </div>
                <div className={styles.formContent}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <p className={styles.formValue}>{profileData.address || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.formField}>
                <div className={styles.labelRow}>
                  <FaCalendarAlt className={styles.formIcon} />
                  <label className={styles.formLabel}>Ngày sinh</label>
                </div>
                <div className={styles.formContent}>
                  {isEditing ? (
                    <input 
                      type="date" 
                      name="dateOfBirth"
                      value={formatDateForInput(profileData.dateOfBirth)}
                      onChange={handleInputChange}
                      className={styles.input}
                    />
                  ) : (
                    <p className={styles.formValue}>{formatDate(profileData.dateOfBirth) || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={styles.profileFormSection}
        >
          <h3 className={styles.heading3}>Thông tin khác</h3>
          <div className={styles.formGroup}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Giới thiệu</label>
              {isEditing ? (
                <textarea 
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  placeholder="Giới thiệu về bản thân"
                  ref={bioRef}
                  rows={3}
                />
              ) : (
                <p className={styles.formValue} style={{padding: '10px'}}>
                  {profileData.bio || 'Chưa cập nhật'}
                </p>
              )}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Thể loại yêu thích</label>
              {isEditing ? (
                <div className={styles.genreTags}>
                  {['Hành động', 'Phiêu lưu', 'Hoạt hình', 'Hài hước', 'Tội phạm', 'Tài liệu', 'Chính kịch', 'Gia đình', 'Giả tưởng', 'Lịch sử', 'Kinh dị', 'Âm nhạc', 'Bí ẩn', 'Lãng mạn', 'Khoa học viễn tưởng', 'Kinh điển', 'Truyền hình', 'Hồi hộp', 'Chiến tranh', 'Cao bồi'].map(genre => (
                    <button
                      key={genre}
                      type="button"
                      className={`${styles.genreTag} ${profileData.favoriteGenres?.includes(genre) ? styles.genreTagActive : ''}`}
                      onClick={() => handleGenreChange(genre)}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.genreTags}>
                  {profileData.favoriteGenres?.length > 0 ? 
                    profileData.favoriteGenres.map(genre => (
                      <span key={genre} className={`${styles.genreTag} ${styles.genreTagActive}`}>
                        {genre}
                      </span>
                    )) : 
                    <span>Chưa cập nhật</span>
                  }
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={styles.passwordSection}
        >
          <div className={styles.passwordContainer}>
            <div className={styles.passwordHeader}>
              <div className={styles.passwordIcon}>
                <FaLock />
              </div>
              <div className={styles.passwordContent}>
                <h3 className={styles.passwordTitle}>Bảo mật tài khoản</h3>
                <p className={styles.passwordDescription}>
                  Thay đổi mật khẩu và cập nhật thiết lập bảo mật
                </p>
              </div>
              <button 
                className={styles.changePasswordButton}
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Đóng' : 'Đổi mật khẩu'}
              </button>
            </div>
            
            {showPasswordForm && (
              <div className={styles.passwordForm}>
                <div className={styles.passwordField}>
                  <label className={styles.passwordLabel}>Mật khẩu hiện tại</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handleInputChange}
                      className={styles.passwordInput}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button className={styles.passwordToggle}>
                      <FaEye />
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className={styles.errorText}>{passwordErrors.currentPassword}</p>
                  )}
                </div>
                
                <div className={styles.passwordField}>
                  <label className={styles.passwordLabel}>Mật khẩu mới</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handleInputChange}
                      className={styles.passwordInput}
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button className={styles.passwordToggle}>
                      <FaEye />
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className={styles.errorText}>{passwordErrors.newPassword}</p>
                  )}
                </div>
                
                <div className={styles.passwordField}>
                  <label className={styles.passwordLabel}>Xác nhận mật khẩu mới</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handleInputChange}
                      className={styles.passwordInput}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button className={styles.passwordToggle}>
                      <FaEye />
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className={styles.errorText}>{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                
                <div className={styles.passwordActions}>
                  <button 
                    className={styles.buttonLight}
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Hủy
                  </button>
                  <button 
                    className={styles.button}
                    onClick={handlePasswordChange}
                  >
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={styles.featuredSection}
        >
          <h3 className={styles.heading3}>Nội dung đề xuất cho bạn</h3>
          <div className="featured-grid">
            {featuredContent.map(item => (
              <div key={item.id} className="featured-item">
                <div className="featured-image">
                  <img src={item.image} alt={item.title} />
                  <div className="featured-overlay">
                    <span className="featured-match">{item.match}% phù hợp</span>
                    <span className="featured-type">
                      {item.type === 'movie' ? 'Phim lẻ' : 'Phim bộ'}
                      {item.season && ` • ${item.season}`}
                    </span>
                    <Link href={`/movie/${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <button className="featured-button">
                        <FaPlay /> Xem ngay
                      </button>
                    </Link>
                  </div>
                </div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
        
        <style jsx>{`
          .featured-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 15px;
          }
          
          .featured-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          
          .featured-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          }
          
          .featured-image {
            position: relative;
            height: 180px;
            overflow: hidden;
          }
          
          .featured-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          
          .featured-item:hover .featured-image img {
            transform: scale(1.05);
          }
          
          .featured-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
            padding: 20px 15px 15px;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
          }
          
          .featured-item:hover .featured-overlay {
            opacity: 1;
            transform: translateY(0);
          }
          
          .featured-match {
            color: #4CD964;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .featured-type {
            color: #bbb;
            font-size: 12px;
            margin-bottom: 10px;
          }
          
          .featured-button {
            background: #e50914;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            width: fit-content;
          }
          
          .featured-button:hover {
            background: #b80710;
          }
          
          .featured-item h4 {
            padding: 15px 15px 5px;
            margin: 0;
            font-size: 16px;
          }
          
          .featured-item p {
            padding: 0 15px 15px;
            margin: 5px 0 0;
            font-size: 14px;
            color: #bbb;
            line-height: 1.4;
          }
          
          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s linear infinite;
            margin-right: 10px;
          }
          
          @media (max-width: 768px) {
            .featured-grid {
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            }
          }
          
          @media (max-width: 576px) {
            .featured-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </motion.div>
    );
  };

  const renderActivityTab = () => {
    return (
      <motion.div 
        className="profile-content-area"
        key="activity"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <HistoryContent inProfilePage={true} />
      </motion.div>
    );
  };

  const renderFavoritesTab = () => {
    return (
      <motion.div 
        className="profile-content-area"
        key="favorites"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Sử dụng component Favorites đã được import từ pages/favorites.js */}
        <Favorites inProfilePage={true} />
      </motion.div>
    );
  };

  const renderStatsTab = () => {
    // Show loading indicator when stats data is not yet loaded
    if (!tabDataLoaded.stats) {
      return (
        <motion.div 
          className="profile-content-area"
          key="stats-loading"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="stats-loading-container">
            <div className="stats-loading-spinner"></div>
            <h3>Đang tính toán, vui lòng chờ</h3>
            <p>Hệ thống đang xử lý dữ liệu thống kê của bạn...</p>
          </div>
          
          <style jsx>{`
            .stats-loading-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 400px;
              text-align: center;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              padding: 40px 20px;
              margin-top: 20px;
            }
            
            .stats-loading-spinner {
              width: 50px;
              height: 50px;
              border: 3px solid rgba(255, 255, 255, 0.1);
              border-radius: 50%;
              border-top-color: #e50914;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            
            .stats-loading-container h3 {
              font-size: 20px;
              margin: 0 0 10px;
              color: #ffffff;
            }
            
            .stats-loading-container p {
              font-size: 14px;
              color: #aaaaaa;
              margin: 0;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      );
    }

    // Create default values for stats if any properties are missing
    const statsData = {
      moviesWatched: stats.moviesWatched || 0,
      seriesWatched: stats.seriesWatched || 0,
      totalWatchTime: stats.totalWatchTime || 0,
      totalWatchTimeMinutes: stats.totalWatchTimeMinutes || 0,
      totalWatchTimeDisplay: stats.totalWatchTimeDisplay || '0 giờ 0 phút',
      favoriteGenre: stats.favoriteGenre || 'Chưa có dữ liệu',
      weeklyActivity: stats.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
      genreDistribution: stats.genreDistribution || [],
      userLevel: stats.userLevel || 'Người hâm mộ',
      levelProgress: stats.levelProgress || 0,
      completedAchievements: stats.completedAchievements || 0,
      totalAchievements: stats.totalAchievements || 10,
      // Lấy dữ liệu từ API thay vì sử dụng giá trị tĩnh cố định
      totalLikes: stats.totalLikes || 0,
      totalDislikes: stats.totalDislikes || 0,
      totalComments: stats.totalComments || 0,
      viewCount: stats.viewCount || 0,
      completedWatchCount: stats.completedWatchCount || 0,
      totalWatched: stats.moviesWatched + stats.seriesWatched || 0,
      totalRatings: stats.totalRatings || 0,
    };

    return (
      <motion.div 
        className="profile-content-area"
        key="stats"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="section-header">
          <h2>Thống kê xem phim</h2>
          <button 
            className="refresh-button"
            onClick={() => fetchUserData()}
          >
            <FaSync /> Làm mới
          </button>
        </div>

        {/* User level card */}
        <motion.div variants={itemVariants} className="user-level-section">
          <div className="user-level-card">
            <div className="user-level-info">
              <h3>{statsData.userLevel}</h3>
              <p>Bạn đã hoàn thành {statsData.completedAchievements}/{statsData.totalAchievements} thành tựu</p>
            </div>
            <div className="level-progress-container">
              <div 
                className="level-progress-bar" 
                style={{ 
                  width: `${Math.min(100, Math.max(0, (statsData.completedAchievements / statsData.totalAchievements) * 100))}%`,
                  transition: "width 0.5s ease-in-out" 
                }}
              ></div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="stats-overview">
          <div className="stats-grid">
            <div className="stats-card">
              <FaFilm className="stats-icon" />
              <div className="stats-value">
                {statsData.totalWatched !== undefined ? statsData.totalWatched : (statsData.moviesWatched + statsData.seriesWatched)}
              </div>
              <div className="stats-label">Tổng phim đã xem</div>
              <div className="stats-subtitle">Phim lẻ và phim bộ</div>
            </div>
            
            <div className="stats-card">
              <FaClock className="stats-icon" />
              <div className="stats-value">
                {statsData.totalWatchTime || 0}
              </div>
              <div className="stats-label">Giờ xem phim</div>
              <div className="stats-subtitle">
                {statsData.totalWatchTimeDisplay || 
                 `${statsData.totalWatchTime || 0} giờ ${statsData.totalWatchTimeMinutes || 0} phút`}
              </div>
            </div>
            
            <div className="stats-card">
              <FaStar className="stats-icon" />
              <div className="stats-value">{statsData.favoriteGenre}</div>
              <div className="stats-label">Thể loại yêu thích</div>
              <div className="stats-subtitle">Xem nhiều nhất</div>
            </div>

            {/* Đảm bảo hiển thị số phim đã đánh giá */}
            <div className="stats-card" style={{ background: 'rgba(20, 20, 30, 0.4)' }}>
              <FaStar className="stats-icon" style={{ color: '#ffd700' }} />
              <div className="stats-value">{statsData.totalRatings || 0}</div>
              <div className="stats-label">Phim đã đánh giá</div>
              <div className="stats-subtitle">Số lượng phim đã gửi đánh giá</div>
            </div>
          </div>
          
          {/* Hàng thống kê phụ */}
          <div className="stats-grid stats-grid-secondary">
            <div className="stats-card stats-card-secondary">
              <div className="reaction-stats-container">
                <div className="reaction-stat">
                  <FaThumbsUp className="stats-icon secondary-icon" />
                  <div className="stats-value">{statsData.totalLikes || 0}</div>
                  <div className="stats-label">Lượt thích</div>
                </div>
                <div className="reaction-divider"></div>
                <div className="reaction-stat">
                  <FaThumbsDown className="stats-icon secondary-icon dislike-icon" />
                  <div className="stats-value">{statsData.totalDislikes || 0}</div>
                  <div className="stats-label">không thích</div>
                </div>
              </div>
              <div className="stats-subtitle mt-2">Lượt tương tác trên bình luận</div>
            </div>
            
            <div className="stats-card stats-card-secondary">
              <FaComment className="stats-icon secondary-icon" />
              <div className="stats-value">{statsData.totalComments}</div>
              <div className="stats-label">Bình luận</div>
              <div className="stats-subtitle">Đã đăng tải</div>
            </div>
            
            <div className="stats-card stats-card-secondary">
              <FaHeart className="stats-icon secondary-icon" />
              <div className="stats-value">{favoritesData.length || 0}</div>
              <div className="stats-label">Phim yêu thích</div>
              <div className="stats-subtitle">Phim đã thêm vào danh sách</div>
            </div>
            
            <div className="stats-card stats-card-secondary">
              <FaBookmark className="stats-icon secondary-icon" />
              <div className="stats-value">{watchLaterData.length || 0}</div>
              <div className="stats-label">Phim xem sau</div>
              <div className="stats-subtitle">Phim đã lưu để xem sau</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="stats-section">
          <h3 className="stats-title">Hoạt động trong tuần</h3>
          <div className="weekly-stats">
            <div className="weekly-chart">
              {statsData.weeklyActivity.map((hours, index) => (
                <div key={index} className="chart-bar-container">                  
                <div 
                    className="chart-bar" 
                    style={{ 
                      height: `${Math.min(hours * 15, 150)}px`,
                      background: hours > 5 
                        ? 'linear-gradient(to top, #e50914, #ff5757)' 
                        : 'linear-gradient(to top, #666, #999)'
                    }}
                  >                    
                  <span className="hours-label">                      
                    {(() => {
                        // Vì dữ liệu từ server đã được chuyển thành giờ (hours)
                        // nên cần hiển thị đúng định dạng
                        const h = Math.floor(hours);
                        const m = Math.round((hours - h) * 60);
                        
                        // Format giờ phút cho nhãn hiển thị
                        if (h === 0) {
                          // Nếu chưa đến 1 giờ, hiển thị theo phút
                          return `${m} phút`;
                        } else {
                          // Nếu >= 1 giờ, hiển thị cả giờ và phút
                          return `${h} giờ${m > 0 ? ` ${m} phút` : ''}`;
                        }
                      })()}
                    </span>
                  </div>
                  <div className="day-label">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][index]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>        
        <motion.div variants={itemVariants} className="stats-section">
          <h3 className="stats-title">Phân bố thể loại</h3>          
          {statsData.genreDistribution && statsData.genreDistribution.length > 0 ? (
            <div className="genre-distribution-vertical">
              {statsData.genreDistribution.slice(0, 8).map((genre, index) => (                
                <div key={index} className="genre-stat-vertical">
                  <div className="genre-column-container">
                    <div 
                      className="genre-column" 
                      style={{ 
                        height: `${genre.value}%`,
                        background: index === 0
                          ? 'linear-gradient(to top, #e50914, #ff5757)'
                          : `rgba(${180 - index * 20}, ${70 + index * 20}, ${90 + index * 10}, 0.8)`,
                        '--column-height': `${genre.value}%`
                      }}
                    >
                      <span className="genre-value-vertical">{genre.value}%</span>
                    </div>
                  </div>
                  <div className="genre-name-vertical">{genre.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-stats">
              <div className="empty-stats-message">
                <FaChartLine className="empty-icon" />
                <p>Chưa có dữ liệu phân bố thể loại</p>
                <small>Dữ liệu sẽ xuất hiện khi bạn xem nhiều phim hơn</small>
              </div>
            </div>
          )}
        </motion.div>


        {/* Achievements section */}
        {stats.achievements && stats.achievements.length > 0 && (
          <motion.div variants={itemVariants} className="stats-section">
            <h3 className="stats-title">Thành tựu</h3>
            <div className="achievements-grid">
              {stats.achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.completed ? 'achievement-completed' : ''}`}
                >
                  <div className="achievement-icon">
                    {achievement.completed ? 
                      <FaCheck className="check-icon" /> : 
                      <span className="progress-text">{achievement.currentValue}/{achievement.requiredValue}</span>
                    }
                  </div>
                  <div className="achievement-info">
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    <div className="achievement-progress">
                      <div 
                        className="achievement-progress-bar"
                        style={{
                          width: `${Math.min(100, Math.max(0, (achievement.currentValue / achievement.requiredValue) * 100))}%`,
                          transition: "width 0.5s ease-in-out"
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <style jsx>{`
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            margin-top: 30px;
          }
          
          .section-header h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .refresh-button {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px 15px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .refresh-button:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          
          /* User level section */
          .user-level-section {
            margin-bottom: 30px;
          }
          
          .user-level-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .user-level-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .user-level-info h3 {
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            color: #e50914;
          }
          
          .user-level-info p {
            font-size: 14px;
            color: #bbb;
            margin: 0;
          }
          
          .level-progress-container {
            height: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .level-progress-bar {
            height: 100%;
            background: linear-gradient(to right, #e50914, #ff5757);
            transition: width 0.5s ease-in-out;
          }
          
          .stats-overview {
            margin-bottom: 30px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
          
          .stats-grid-secondary {
            margin-top: 20px;
          }
          
          .stats-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }
          
          .stats-card-secondary {
            background: rgba(20, 20, 30, 0.4);
          }
          
          .reaction-stats-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          
          .reaction-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .reaction-divider {
            width: 1px;
            height: 30px;
            background: rgba(255, 255, 255, 0.2);
          }
          
          .stats-icon {
            font-size: 24px;
            color: #e50914;
            margin-bottom: 12px;
          }
          
          .secondary-icon {
            color: #3498db;
          }
          
          .dislike-icon {
            color: #e74c3c;
          }
          
          .stats-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
          }
          
          .stats-label {
            font-size: 14px;
            color: #bbb;
          }
          
          .stats-subtitle {
            font-size: 12px;
            color: #999;
            margin-top: 2px;
          }
          
          .stats-section {
            margin-bottom: 30px;
          }
          
          .stats-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
          }
          
          .weekly-stats {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
          }
          
          .weekly-chart {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            height: 180px;
          }
          
          .chart-bar-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 12%;
          }
          
          .chart-bar {
            width: 100%;
            border-radius: 6px 6px 0 0;
            position: relative;
            max-height: 150px;
            min-height: 20px;
            transition: all 0.3s ease;
          }
          
          .chart-bar:hover {
            transform: scaleY(1.05);
            filter: brightness(1.2);
          }
          
          .hours-label {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          
          .chart-bar:hover .hours-label {
            opacity: 1;
          }
          
          .day-label {
            margin-top: 10px;
            font-size: 14px;
            color: #aaa;
          }            .genre-distribution-vertical {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px 20px 40px 20px;
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
            height: 280px;
            position: relative;
          }
          
          .genre-stat-vertical {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 12%;
            height: 100%;
            position: relative;
          }
          
          .genre-column-container {
            width: 100%;
            max-width: 60px;
            position: relative;
            display: flex;
            align-items: flex-end;
            height: 200px;
          }
          
          .genre-column {
            width: 100%;
            border-radius: 8px 8px 0 0;
            transition: all 0.3s ease;
            position: absolute;
            bottom: 0;
            min-height: 20px;
            max-width: 60px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            animation: columnGrow 1s ease-out forwards;
          }
          
          @keyframes columnGrow {
            from { height: 0%; }
            to { height: var(--column-height); }
          }
          
          .genre-column:hover {
            filter: brightness(1.2);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          }
          
          .genre-name-vertical {
            font-size: 12px;
            margin-top: 8px;
            color: #ffffff;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            position: absolute;
            bottom: -30px;
            left: 0;
            width: 100%;
          }
            .genre-value-vertical {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 1;
            font-weight: bold;
            white-space: nowrap;
          }
          
          .genre-column:hover .genre-value-vertical {
            background: rgba(0, 0, 0, 0.9);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
          }
            /* This section was consolidated with the other media queries */
          
          .empty-stats {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            height: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .empty-stats-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .empty-icon {
            font-size: 40px;
            color: rgba(255, 255, 255, 0.2);
            margin-bottom: 15px;
          }
          
          /* Responsive styling for genre distribution */
          @media (max-width: 768px) {
            .genre-distribution-vertical {
              height: 220px;
              padding: 15px 10px 35px 10px;
            }
            
            .genre-column-container {
              height: 160px;
            }
            
            .genre-stat-vertical {
              width: 14%;
            }
            
            .genre-name-vertical {
              font-size: 10px;
              margin-top: 6px;
            }
            
            .empty-stats {
              height: 220px;
            }
          }
          
          @media (max-width: 576px) {
            .genre-distribution-vertical {
              height: 180px;
              padding: 15px 5px 35px 5px;
            }
            
            .genre-column-container {
              height: 130px;
            }
            
            .genre-stat-vertical {
              width: 16%;
            }
            
            .genre-name-vertical {
              font-size: 9px;
              margin-top: 4px;
            }
            
            .empty-stats {
              height: 180px;
            }
          }
          
          .empty-stats-message p {
            font-size: 16px;
            color: #fff;
            margin: 0 0 5px;
          }
          
          .empty-stats-message small {
            font-size: 14px;
            color: #aaa;
          }
          
          /* Thống kê thời lượng xem */
          .watch-time-stat-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
          }
          
          .watch-time-summary {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 15px;
          }
          
          .time-summary-item {
            text-align: center;
            padding: 0 15px;
          }
          
          .time-summary-value {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #e50914;
          }
          
          .time-summary-label {
            font-size: 13px;
            color: #bbb;
          }
          
          .watch-time-visualization {
            margin-top: 10px;
          }
          
          .heatmap-placeholder {
            width: 100%;
          }
          
          .heatmap-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
          }
          
          .heatmap-month {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            width: calc(8.33% - 2px);
          }
          
          .heatmap-day {
            width: 100%;
            height: 10px;
            border-radius: 2px;
            transition: transform 0.2s;
          }
          
          .heatmap-day:hover {
            transform: scale(1.2);
          }
          
          .heatmap-level-0 {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          .heatmap-level-1 {
            background-color: rgba(229, 9, 20, 0.2);
          }
          
          .heatmap-level-2 {
            background-color: rgba(229, 9, 20, 0.4);
          }
          
          .heatmap-level-3 {
            background-color: rgba(229, 9, 20, 0.6);
          }
          
          .heatmap-level-4 {
            background-color: rgba(229, 9, 20, 0.8);
          }
          
          .heatmap-legend {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 15px;
          }
          
          .legend-label {
            font-size: 12px;
            color: #bbb;
          }
          
          .legend-steps {
            display: flex;
            margin: 0 10px;
          }
          
          .legend-step {
            width: 12px;
            height: 12px;
            margin: 0 2px;
            border-radius: 2px;
          }
          
          /* Achievements section */
          .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
          }
          
          .achievement-card {
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 10px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .achievement-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
          }
          
          .achievement-completed {
            border: 1px solid rgba(229, 9, 20, 0.3);
            background: rgba(229, 9, 20, 0.1);
          }
          
          .achievement-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .achievement-completed .achievement-icon {
            background: rgba(229, 9, 20, 0.8);
          }
          
          .check-icon {
            color: white;
            font-size: 22px;
          }
          
          .progress-text {
            font-size: 12px;
            font-weight: 600;
          }
          
          .achievement-info {
            flex: 1;
          }
          
          .achievement-info h4 {
            margin: 0 0 5px;
            font-size: 16px;
          }
          
          .achievement-info p {
            margin: 0 0 10px;
            font-size: 13px;
            color: #bbb;
          }
          
          .achievement-progress {
            height: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
          }
          
          .achievement-progress-bar {
            height: 100%;
            background: linear-gradient(to right, #666, #999);
            transition: width 0.5s ease-in-out;
          }
          
          .achievement-completed .achievement-progress-bar {
            background: linear-gradient(to right, #e50914, #ff5757);
          }
          
          @media (max-width: 992px) {
            .stats-grid, .stats-grid-secondary {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .achievements-grid {
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            }
            
            .watch-time-summary {
              flex-direction: column;
              gap: 15px;
              align-items: center;
            }
          }
          
          @media (max-width: 768px) {
            .weekly-chart {
              height: 150px;
            }
            
            .chart-bar-container {
              width: 10%;
            }
            
            .hours-label {
              font-size: 10px;
              padding: 2px 4px;
            }
            
            .day-label {
              font-size: 12px;
            }
            
            .achievements-grid {
              grid-template-columns: 1fr;
              padding: 15px;
            }
            
            .heatmap-month {
              width: calc(16.67% - 2px);
            }
          }
          
          @media (max-width: 576px) {
            .stats-grid, .stats-grid-secondary {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            
            .stats-grid-secondary {
              margin-top: 15px;
            }
            
            .weekly-chart {
              height: 120px;
            }
            
            .chart-bar-container {
              width: 12%;
            }
            
            .genre-name {
              font-size: 13px;
            }
            
            .section-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
            
            .section-header button {
              align-self: flex-end;
            }
            
            .user-level-info {
              flex-direction: column;
              align-items: flex-start;
              gap: 5px;
            }
            
            .heatmap-month {
              width: calc(25% - 2px);
            }
          }
        `}</style>
      </motion.div>
    );
  };

  // Helper functions for the loading skeleton
  const renderLoadingSkeleton = () => {
    return (
      <div className="profile-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Đang tải thông tin...</h2>
        </div>
        
        <style jsx>{`
          .profile-loading {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #0f0f16 0%, #191927 100%);
            color: #f5f5f7;
          }
          
          .loading-container {
            text-align: center;
          }
          
          .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            border-top-color: #e50914;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  };

  // Render main component
  if (loadingProfile) {
    return renderLoadingSkeleton();
  }

  return (
    <div className="profile-container">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
        {/* Header cho mobile */}
      <header className="mobile-header">
        <div className="mobile-header-wrapper">
          <button 
            className="mobile-back-button"
            onClick={() => router.back()}
            aria-label="Quay lại"
          >
            <FaArrowLeft />
          </button>
          <div className="mobile-user-info">
            <img 
              src={avatar} 
              alt="User Avatar" 
              className="mobile-avatar"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className="mobile-user-text">
              <h1 className="mobile-user-name">{profileData.fullName || 'Người dùng'}</h1>
              <p className="mobile-user-email">{profileData.email || 'Chưa có email'}</p>
            </div>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      
      {/* Menu dropdown cho mobile */}
      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={toggleMobileMenu}></div>
      )}
      
      {mobileMenuOpen && (
        <div className="mobile-menu-dropdown">
          <div className="mobile-menu-header">
            <h2>Menu</h2>
            <button 
              className="mobile-menu-close" 
              onClick={toggleMobileMenu}
              aria-label="Close Menu"
            >
              <FaTimes />
            </button>
          </div>
          <nav className="mobile-menu-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`mobile-menu-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  handleTabChange(tab.id);
                  toggleMobileMenu();
                }}
              >
                <span className="menu-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <button 
              className="mobile-menu-item logout-item"
              onClick={handleLogout}
            >
              <span className="menu-icon"><FaSignOutAlt /></span>
              <span>Đăng xuất</span>
            </button>
          </nav>
        </div>
      )}
      
      {showConfirmation && (
        <div className="modal-overlay">
          <div className={styles.confirmationModal}>
            <h3 className={styles.heading3}>Hủy thay đổi?</h3>
            <p>Các thay đổi của bạn sẽ không được lưu.</p>
            <div className={styles.confirmationButtons}>
              <button 
                className={styles.buttonLight} 
                onClick={handleCancelConfirmation}
              >
                Tiếp tục chỉnh sửa
              </button>
              <button 
                className={styles.button} 
                onClick={handleConfirmCancel}
              >
                Hủy thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="avatar-container">
            <div className="avatar-wrapper">
              <img 
                src={avatar} 
                alt="User Avatar" 
                className="profile-avatar"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              
              {isUploading ? (
                <div className="upload-overlay">
                  <div className="upload-spinner"></div>
                </div>
              ) : (
                <button 
                  className="avatar-change-button" 
                  onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                  aria-label="Change avatar"
                >
                  <FaCamera />
                </button>
              )}
              
              {showAvatarOptions && (
                <div className="avatar-options">
                  <button 
                    className="avatar-option"
                    onClick={triggerFileInput}
                  >
                    <FaCamera /> Tải hình lên
                  </button>
                  <button 
                    className="avatar-option"
                    onClick={() => {
                      setAvatar(DEFAULT_AVATAR);
                      setShowAvatarOptions(false);
                      toast.success('Đã đặt lại ảnh mặc định!');
                    }}
                  >
                    <FaUser /> Dùng ảnh mặc định
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                id="avatar-upload" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={(e) => handleAvatarChange(e)} 
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="user-info">
              <h2 className="user-name">{profileData.fullName || 'Người dùng'}</h2>
              <p className="user-email">{profileData.email || 'Chưa có email'}</p>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                aria-selected={activeTab === tab.id}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-text">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    className="active-indicator" 
                    layoutId="activeTab"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
              </button>
            ))}
          </nav>
          
          <div className="sidebar-footer">
            <button className="logout-button" onClick={handleLogout}>
              <FaSignOutAlt className="logout-icon" /> Đăng xuất
            </button>
            <p className="version-info">Phiên bản 2.5.3</p>
          </div>
        </aside>
        
        <main className="profile-main">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'activity' && renderActivityTab()}
            {activeTab === 'favorites' && renderFavoritesTab()}
            {activeTab === 'watchlater' && renderWatchLaterTab()}
            {activeTab === 'stats' && renderStatsTab()}
          </AnimatePresence>
        </main>
      </div>
      
      <style jsx>{`
        /* Base styles */
        .profile-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f16 0%, #191927 100%);
          color: #f5f5f7;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0;
          margin: 0;
          position: relative;
        }
        
        .profile-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 100vh;
        }
        
        /* Mobile Header */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(20, 20, 30, 0.95);
          padding: 12px;
          z-index: 1000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
          .mobile-header-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .mobile-back-button {
          background: transparent;
          border: none;
          color: white;
          font-size: 20px;
          padding: 5px 10px;
          cursor: pointer;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .mobile-back-button:hover {
          color: #e50914;
        }
        
        .mobile-user-info {
          display: flex;
          align-items: center;
          flex: 1;
        }
        
        .mobile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.15);
          margin-right: 10px;
        }
        
        .mobile-user-text {
          overflow: hidden;
        }
        
        .mobile-user-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        
        .mobile-user-email {
          font-size: 12px;
          color: #bbb;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        
        /* Loading skeleton */
        .profile-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f16 0%, #191927 100%);
        }
        
        .loading-container {
          text-align: center;
        }
        
        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #e50914;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Sidebar styles */
        .profile-sidebar {
          background: rgba(20, 20, 30, 0.9);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          padding: 30px 0;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        .profile-sidebar::-webkit-scrollbar {
          width: 6px;
        }
        
        .profile-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .avatar-container {
          padding: 25px 25px 25px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 20px;
        }
        
        .avatar-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 15px;
        }
        
        .profile-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          background-color: #1e1e2d;
        }
        
        .avatar-change-button {
          position: absolute;
          bottom: 5px;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgb(229, 68, 9);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
        }
        
        .avatar-change-button:hover {
          transform: scale(1.1);
          box-shadow: 0 5px 15px rgba(229, 9, 20, 0.5);
        }
        
        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .upload-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s linear infinite;
        }
        
        .avatar-options {
          position: absolute;
          bottom: -5px;
          right: -10px;
          background: #1e1e2d;
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          z-index: 100;
          min-width: 170px;
          transform: translateX(20%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: fadeIn 0.2s ease-out;
        }
        
        .avatar-option {
          display: flex;
          align-items: center;
          background: transparent;
          border: none;
          color: #f5f5f7;
          padding: 10px 15px;
          width: 100%;
          text-align: left;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .avatar-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .avatar-option svg {
          margin-right: 10px;
          font-size: 16px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20%) translateY(10px); }
          to { opacity: 1; transform: translateX(20%) translateY(0); }
        }
        
        .user-info {
          margin-top: 15px;
        }
        
        .user-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 5px;
          color: #fff;
        }
        
        .user-email {
          font-size: 14px;
          color: #bbb;
          margin: 0;
        }
        
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 0 25px;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          background: transparent;
          border: none;
          color: #bbb;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .nav-item.active {
          background: rgba(229, 9, 20, 0.1);
          color: #fff;
        }
        
        .nav-icon {
          font-size: 16px;
        }
        
        .nav-text {
          flex: 1;
        }
        
        .active-indicator {
          position: absolute;
          top: 50%;
          right: 0;
          width: 4px;
          height: 24px;
          background: #e50914;
          border-radius: 2px;
          transform: translateY(-50%);
        }
        
        .sidebar-footer {
          padding: 25px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .logout-button {
          background: rgba(229, 9, 20, 0.9);
          border: none;
          color: #fff;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-bottom: 12px;
        }
        
        .logout-button:hover {
          background: #e50914;
        }
        
        .version-info {
          font-size: 12px;
          color: #bbb;
          margin-top: 10px;
        }
        
        /* Main content styles */
        .profile-main {
          padding: 30px;
          background: rgba(20, 20, 30, 0.9);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        .profile-main::-webkit-scrollbar {
          width: 6px;
        }
        
        .profile-main::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .profile-content-area {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        
        /* Mobile menu toggle button */
        .mobile-menu-toggle {
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 0;
        }
        
        .mobile-menu-toggle span {
          display: block;
          width: 20px;
          height: 2px;
          background-color: white;
          transition: all 0.3s ease;
        }
        
        /* Mobile menu dropdown */
        .mobile-menu-dropdown {
          position: fixed;
          top: 0;
          right: 0;
          width: 80%;
          max-width: 320px;
          height: 100%;
          background: #14141e;
          overflow-y: auto;
          z-index: 1100;
          box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.3s ease-out forwards;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        .mobile-menu-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mobile-menu-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .mobile-menu-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 8px;
        }
        
        .mobile-menu-nav {
          padding: 10px 0;
        }
        
        .mobile-menu-item {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
          text-align: left;
          width: 100%;
          transition: background 0.2s ease;
          font-size: 16px;
        }
        
        .mobile-menu-item:last-child {
          border-bottom: none;
        }
        
        .mobile-menu-item.active {
          background: rgba(229, 9, 20, 0.1);
          color: #e50914;
          border-left: 4px solid #e50914;
        }
        
        .menu-icon {
          margin-right: 15px;
          font-size: 18px;
        }
        
        .logout-item {
          margin-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #ff6b6b !important;
        }
        
        .mobile-menu-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1090;
          animation: fadeBackdrop 0.3s ease-out;
        }
        
        @keyframes fadeBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Media queries */
        @media (max-width: 992px) {
          .profile-layout {
            grid-template-columns: 240px 1fr;
          }
          
          .profile-sidebar {
            padding: 20px 0;
          }
          
          .avatar-wrapper {
            width: 100px;
            height: 100px;
          }
        }
        
        @media (max-width: 768px) {
          .profile-layout {
            grid-template-columns: 1fr;
          }
          
          .profile-sidebar {
            display: none;
          }
            .mobile-header {
            display: block;
          }
          
          .mobile-user-text {
            max-width: calc(100% - 120px); /* Space for avatar and button */
            overflow: hidden;
          }
          
          .mobile-user-name, 
          .mobile-user-email {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .profile-main {
            padding: 70px 15px 30px; /* Giảm padding dưới vì đã bỏ menu */
          }
          
          /* Điều chỉnh style cho phần Premium trên mobile */
          .profile-main :global(.${styles.premiumSection}) {
            margin-bottom: 20px;
          }
          
          .profile-main :global(.${styles.premiumBanner}) {
            padding: 12px;
          }
          
          .profile-main :global(.${styles.premiumContent}) {
            flex-direction: column;
          }
          
          .profile-main :global(.${styles.crownIconLarge}) {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .profile-main :global(.${styles.premiumTitle}) {
            font-size: 16px;
            margin-bottom: 6px;
          }
          
          .profile-main :global(.${styles.premiumDescription}) {
            font-size: 13px;
            margin-bottom: 8px;
            line-height: 1.4;
          }
          
          .profile-main :global(.${styles.premiumFeature}) {
            font-size: 13px;
            margin-bottom: 4px;
          }
          
          .profile-main :global(.${styles.premiumButton}) {
            padding: 8px 15px;
            font-size: 14px;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-menu-toggle,
          .mobile-menu-dropdown,
          .mobile-menu-backdrop,
          .mobile-header {
            display: none !important;
          }
        }
        
        @media (max-width: 576px) {
          .profile-main {
            padding: 70px 12px 30px;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .section-header h2 {
            font-size: 18px;
          }
          
          /* Thêm các style điều chỉnh khác cho phần Premium trên màn hình nhỏ */
          .profile-main :global(.${styles.premiumSection}) {
            margin-bottom: 15px;
          }
          
          .profile-main :global(.${styles.premiumBanner}) {
            padding: 10px;
            border-radius: 8px;
          }
          
          .profile-main :global(.${styles.premiumInfo}) {
            padding: 8px 0;
          }
          
          .profile-main :global(.${styles.premiumTitle}) {
            font-size: 15px;
          }
          
          .profile-main :global(.${styles.premiumDescription}) {
            font-size: 12px;
            margin: 4px 0;
          }
          
          .profile-main :global(.${styles.premiumMeta}) {
            margin-top: 6px;
          }
          
          .profile-main :global(.${styles.premiumFeature}) {
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .profile-main :global(.${styles.premiumButton}) {
            padding: 6px 12px;
            font-size: 13px;
          }
          
          .profile-main :global(.${styles.upgradeIcon}) {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
