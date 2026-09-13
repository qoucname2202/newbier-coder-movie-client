import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaSearch, FaComment, FaBars, FaTimes, FaHome, FaFilm, FaTv, FaHeart, FaBookmark, FaHistory, FaSignOutAlt,FaBell, FaUserCircle, FaPlay, FaEye, FaTrash, FaTimesCircle, FaLightbulb } from "react-icons/fa";
import { useRouter } from "next/router";
import { useAuth } from "../../utils/auth";
import searchHistoryService from "../../API/services/searchHistoryService"; // Import dịch vụ lịch sử tìm kiếm
import searchSuggestionService from "../../API/services/searchSuggestionService"; // Import dịch vụ gợi ý tìm kiếm
import FeedbackForm from "../Feedback/FeedbackForm";

const getAvatarUrl = (user) => {
  if (!user) return "/img/avatar.png";
  
  let avatarUrl = user.avatar || user.image || "/img/avatar.png";
  
  // Xử lý đường dẫn tương đối cho avatar nội bộ
  if (avatarUrl && avatarUrl.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const baseWithoutApi = baseUrl.endsWith('/api') 
      ? baseUrl.substring(0, baseUrl.length - 4) 
      : baseUrl;
    
    avatarUrl = `${baseWithoutApi}${avatarUrl}`;
  }
  
  // Chỉ thêm cache-busting cho URL không phải bên ngoài (loại trừ Google, Cloudinary, v.v.)
  if (!avatarUrl.includes('?') && 
      !avatarUrl.includes('googleusercontent.com') && 
      !avatarUrl.includes('cloudinary.com')) {
    avatarUrl = `${avatarUrl}?t=${Date.now()}`;
  }
  
  return avatarUrl;
};

const Navbar = () => {  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
    const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const feedbackRef = useRef(null);
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0
  });

  // Kiểm tra đường dẫn hiện tại để áp dụng hiệu ứng active
  const isActive = (path) => {
    if (path === '/' && router.pathname === '/') {
      return true;
    }
    
    // So sánh các đường dẫn khác (không phải trang chủ)
    if (path !== '/' && router.pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Cập nhật chỉ báo vị trí menu
    const updateIndicator = () => {
      if (navRef.current && window.innerWidth >= 992) { // Chỉ hiển thị trên desktop
        const navItems = navRef.current.querySelectorAll('.nav-link');
        let activeItem = null;

        navItems.forEach(item => {
          if (item.classList.contains('active')) {
            activeItem = item;
          }
        });

        if (activeItem) {
          const { left, width } = activeItem.getBoundingClientRect();
          const navLeft = navRef.current.getBoundingClientRect().left;
          
          // Cập nhật vị trí và kích thước của indicator
          setIndicatorStyle({
            left: left - navLeft,
            width: width,
            opacity: 1
          });
        } else {
          setIndicatorStyle({
            opacity: 0
          });
        }
      }
    };

    // Cập nhật vị trí khi route thay đổi
    updateIndicator();

    // Cập nhật vị trí khi cửa sổ thay đổi kích thước
    window.addEventListener('resize', updateIndicator);
    
    return () => window.removeEventListener('resize', updateIndicator);
  }, [router.pathname]); // Chạy lại khi route thay đổi

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isAuthenticated) {
        // Lưu lịch sử tìm kiếm và cập nhật state ngay lập tức
        saveToSearchHistory(searchQuery);
      }
      
      localStorage.setItem('lastSearchQuery', searchQuery.trim());
      
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchInput(false);
      setShowSearchHistory(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    // Hiển thị lịch sử tìm kiếm nếu không có query, nếu không thì lấy gợi ý
    if (newQuery.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      
      // Hiển thị lịch sử tìm kiếm nếu input trống và người dùng đã xác thực
      if (newQuery.trim() === '' && isAuthenticated) {
        toggleSearchHistory(true);
      }
    } else {
      // Ẩn lịch sử tìm kiếm khi đang nhập
      setShowSearchHistory(false);
      
      // Lấy gợi ý tìm kiếm
      fetchSearchSuggestions(newQuery);
    }
  };
  
  const fetchSearchSuggestions = async (query) => {
    if (query.trim().length < 2) return;
    
    try {
      setLoadingSuggestions(true);
      setShowSuggestions(true);
      
      const response = await searchSuggestionService.getSuggestions(query);
      
      if (response.success && Array.isArray(response.suggestions)) {
        setSearchSuggestions(response.suggestions);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      setSearchSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    
    // Lưu vào lịch sử tìm kiếm
    if (isAuthenticated) {
      saveToSearchHistory(suggestion);
    }
    
    localStorage.setItem('lastSearchQuery', suggestion.trim());
    
    // Điều hướng đến trang tìm kiếm
    router.push(`/search?q=${encodeURIComponent(suggestion.trim())}`);
    setShowSearchInput(false);
    setShowSuggestions(false);
  };

  const toggleSearchInput = () => {
    setShowSearchInput(!showSearchInput);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      const navbarCollapse = document.getElementById("navbarNav");
      const navbarToggler = document.querySelector(".navbar-toggler");
      const userMenu = document.getElementById("userMenu");
      const userAvatar = document.querySelector(".profile-avatar");
      const feedbackButton = document.querySelector(".feedback-button, .feedback-button-mobile");
      
      if (
        isMenuOpen && 
        navbarCollapse && 
        !navbarCollapse.contains(event.target) &&
        !navbarToggler.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }

      if (
        showUserMenu &&
        userMenu &&
        !userMenu.contains(event.target) &&
        !userAvatar.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        showSuggestions &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
        if (
        showFeedbackForm &&
        feedbackRef.current &&
        !feedbackRef.current.contains(event.target) &&
        ((feedbackButton && !feedbackButton.contains(event.target)) ||
        (!feedbackButton))
      ) {
        setShowFeedbackForm(false);
      }
    };

    if (isMenuOpen || showUserMenu || showSuggestions || showFeedbackForm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, showUserMenu, showSuggestions, showFeedbackForm]);

  const formatTimeAgo = (timestamp) => {
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

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      toggleUserMenu();
    } else {
      router.push('/auth/login');
    }
  };

  const goToProfile = () => {
    setShowUserMenu(false);
    router.push('/profile');
  };

  const handleProfileClick = () => {
    goToProfile();
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
  };

  const toggleSearchHistory = (show) => {
    if (isAuthenticated && show && searchHistory.length === 0) {
      fetchSearchHistory();
    }
    setShowSearchHistory(show);
  };

  const fetchSearchHistory = async () => {
    if (!isAuthenticated) return;
    
    try {
      setSearchHistoryLoading(true);
      const response = await searchHistoryService.getSearchHistory(8);
      
      if (response.success && Array.isArray(response.searchHistory)) {
        setSearchHistory(response.searchHistory);
      } else {
        setSearchHistory([]);
      }
    } catch (error) {
      console.error("Error fetching search history:", error);
      setSearchHistory([]);
    } finally {
      setSearchHistoryLoading(false);
    }
  };

  const deleteSearchHistoryItem = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      const response = await searchHistoryService.deleteSearchHistoryItem(id);
      
      if (response && (response.success || response.statusCode === 200)) {
        setSearchHistory(prevHistory => 
          prevHistory.filter(item => item._id !== id)
        );
      } else {
        console.error('Failed to delete item:', response);
      }
    } catch (error) {
      console.error("Error deleting search history item:", error);
    }
  };

  const clearAllSearchHistory = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const response = await searchHistoryService.clearSearchHistory();
      
      if (response && (response.success || response.statusCode === 200)) {
        setSearchHistory([]);
      } else {
        console.error('Failed to clear all history:', response);
      }
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  };

  const handleSearchHistoryItemClick = (query, filters = {}) => {
    setSearchQuery(query);
    const queryParams = { q: query };
    if (filters.category) queryParams.category = filters.category;
    if (filters.country) queryParams.country = filters.country;
    if (filters.year) queryParams.year = filters.year;
    
    router.push({
      pathname: '/search',
      query: queryParams
    });
    
    setShowSearchHistory(false);
    setShowSearchInput(false);
  };

  const saveToSearchHistory = async (query, filters = {}) => {
    if (!isAuthenticated || !query || typeof query !== 'string' || !query.trim()) return;
    
    try {
      const response = await searchHistoryService.saveSearchHistory(query.trim(), filters);
      
      // Cập nhật state lịch sử tìm kiếm ngay lập tức
      if (response && response.success) {
        // Thêm mục mới vào đầu danh sách lịch sử
        setSearchHistory(prevHistory => {
          // Kiểm tra nếu đã có mục tìm kiếm với cùng query
          const existingItemIndex = prevHistory.findIndex(item => 
            item.query.toLowerCase() === query.trim().toLowerCase()
          );
          
          // Tạo danh sách mới
          let newHistory = [...prevHistory];
          
          if (existingItemIndex !== -1) {
            // Xóa mục cũ nếu đã tồn tại
            newHistory.splice(existingItemIndex, 1);
          }
          
          // Thêm mục mới vào đầu danh sách
          const newItem = response.savedItem || {
            _id: Date.now().toString(),
            query: query.trim(),
            filters: filters,
            createdAt: new Date().toISOString(),
            userId: user?._id
          };
          
          newHistory = [newItem, ...newHistory];
          
          // Giới hạn số lượng tối đa 8 mục
          if (newHistory.length > 8) {
            newHistory = newHistory.slice(0, 8);
          }
          
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? "bg-dark shadow-lg" : "bg-transparent"}`}>
      {isMenuOpen && (
        <div 
          className="menu-overlay d-lg-none" 
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <div className="container-fluid px-3 px-lg-5">
        <div className="d-flex align-items-center">
          <button 
            className="navbar-toggler border-0 d-lg-none" 
            type="button" 
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <FaBars className="text-white" />
          </button>
          
          <Link href="/" className="navbar-brand text-danger fw-bold ms-1 me-lg-4 mx-lg-0">
            <img
              src="/img/phimlogo-removebg-preview.png"
              alt="Logo"
              className="navbar-logo"
              style={{ width: "120px", height: "32px" }}
            />
          </Link>
        </div>
        
        <div className="d-flex d-lg-none align-items-center ms-auto">
          {showSearchInput ? (
            <form onSubmit={handleSearch} className="d-flex position-relative mobile-search-form">
              <div className="search-container">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="form-control form-control-sm bg-dark text-white border-secondary mobile-search-input"
                  placeholder="Tìm..."
                  autoFocus
                  ref={searchInputRef}
                  onFocus={() => isAuthenticated && toggleSearchHistory(true)}
                  onBlur={() => setTimeout(() => toggleSearchHistory(false), 200)}
                />
                <button type="submit" className="btn btn-sm btn-outline-danger search-btn">
                  <FaSearch />
                
                </button>
              </div>
            </form>
          ) : (
            <FaSearch className="text-white fs-5 cursor-pointer" onClick={toggleSearchInput} />          )}          
            <div className="profile-avatar ms-2" onClick={handleAvatarClick}>
            <img 
              src={getAvatarUrl(user)} 
              alt="User Avatar" 
              className="rounded-circle" 
              style={{ width: '32px', height: '32px', objectFit: 'cover' }} 
              onError={(e) => { 
                console.log("Avatar load error, using default"); 
                e.target.src = "/img/avatar.png"; 
              }}
            />
          </div>
        </div>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <div className="d-lg-none position-absolute top-0 end-0 p-3">
            <button 
              className="btn btn-link text-white p-0 border-0" 
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <FaTimes style={{ fontSize: '24px' }} />
            </button>
          </div>
          
          <ul className="navbar-nav flex-column flex-lg-row mx-auto" ref={navRef}>
            <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
              <Link href="/" className={`nav-link text-white px-3 ${isActive('/') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaHome /></span>
                Trang chủ
              </Link>
            </li>
            <li className={`nav-item ${isActive('/search') ? 'active' : ''}`}>
              <Link href="/search" className={`nav-link text-white px-3 ${isActive('/search') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaSearch /></span>
                Tìm kiếm
              </Link>
            </li>
            <li className={`nav-item ${isActive('/movies') ? 'active' : ''}`}>
              <Link href="/movies" className={`nav-link text-white px-3 ${isActive('/movies') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaFilm /></span>
                Phim Lẻ
              </Link>
            </li>
            <li className={`nav-item ${isActive('/series') ? 'active' : ''}`}>
              <Link href="/series" className={`nav-link text-white px-3 ${isActive('/series') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaTv /></span>
                Phim Bộ
              </Link>
            </li>
            <li className={`nav-item ${isActive('/favorites') ? 'active' : ''}`}>
              <Link href="/favorites" className={`nav-link text-white px-3 ${isActive('/favorites') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaHeart /></span>
                Yêu Thích
              </Link>
            </li>
            <li className={`nav-item ${isActive('/watchlater') ? 'active' : ''}`}>
              <Link href="/watchlater" className={`nav-link text-white px-3 ${isActive('/watchlater') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaBookmark /></span>
                Xem sau
              </Link>
            </li>            <li className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
              <Link href="/history" className={`nav-link text-white px-3 ${isActive('/history') ? 'active' : ''}`}>
                <span className="d-inline-block d-lg-none me-2"><FaHistory /></span>
                Đã Xem
              </Link>
            </li>
            <li className="nav-item d-lg-none">              <button 
                onClick={() => {
                  setShowFeedbackForm(!showFeedbackForm);
                  setIsMenuOpen(false); // Đóng menu sau khi mở form góp ý
                }} 
                className="nav-link text-white px-3 bg-transparent border-0 w-100 text-start"
              >
                <span className="d-inline-block me-2"><FaComment /></span>
                Góp ý
              </button>
            </li>
            {!isAuthenticated && (
              <li className="nav-item d-lg-none">
                <Link href="/auth/login" className="nav-link text-white px-3">
                  <span className="d-inline-block d-lg-none me-2"><FaUserCircle /></span>
                  Đăng nhập
                </Link>
              </li>
            )}
            {isAuthenticated && (
              <li className="nav-item d-lg-none">
                <button onClick={handleLogout} className="nav-link text-white px-3 bg-transparent border-0 w-100 text-start">
                  <span className="d-inline-block d-lg-none me-2"><FaSignOutAlt /></span>
                  Đăng xuất
                </button>
              </li>
            )}
            <div className="nav-indicator d-none d-lg-block" style={indicatorStyle}></div>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-3">
            {showSearchInput ? (
              <form onSubmit={handleSearch} className="d-flex position-relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  placeholder="Tìm kiếm..."
                  autoFocus
                  ref={searchInputRef}
                  onFocus={() => isAuthenticated && toggleSearchHistory(true)}
                  onBlur={() => setTimeout(() => toggleSearchHistory(false), 200)}
                />
                <button type="submit" className="btn btn-sm btn-outline-danger ms-2">
                  Tìm
                </button>
              </form>            ) : (
              <FaSearch className="text-white fs-5 cursor-pointer" onClick={toggleSearchInput} />
            )}            
            <FaComment 
              className="text-white fs-5 cursor-pointer feedback-button" 
              onClick={(e) => {
                e.stopPropagation();
                setShowFeedbackForm(!showFeedbackForm);
              }}            />
              <div className="profile-avatar position-relative" onClick={handleAvatarClick}>
              <img 
                src={getAvatarUrl(user)} 
                alt="User Avatar" 
                className="rounded-circle" 
                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                onError={(e) => { 
                  console.log("Avatar load error, using default"); 
                  e.target.src = "/img/avatar.png"; 
                }}  
              />
              {isAuthenticated && (
                <div className="user-status-indicator"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUserMenu && (
        <div id="userMenu" className="user-menu">
          {isAuthenticated ? (
            <>
              <div className="user-info">
                <img 
                  src={getAvatarUrl(user)} 
                  alt="User Avatar" 
                  className="rounded-circle me-2" 
                  style={{ width: '32px', height: '32px' }} 
                  onError={(e) => { e.target.src = "/img/avatar.png"; }}
                />
                <div className="user-details">
                  <p className="user-name">{user?.fullname || user?.name || 'User'}</p>
                  <p className="user-email">{user?.email}</p>
                </div>
              </div>
              <hr className="dropdown-divider my-2" />
              <button className="dropdown-item" onClick={handleProfileClick}>
                <FaUserCircle className="me-2" /> Hồ sơ của tôi
              </button>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <FaSignOutAlt className="me-2" /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="auth-links">
              <Link href="/auth/login" className="dropdown-item">
                Đăng nhập
              </Link>
              <Link href="/auth/signup" className="dropdown-item">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}

      {showSearchHistory && isAuthenticated && (
        <div className="search-history-dropdown">
          <div className="search-history-header">
            <h6 className="m-0">Lịch sử tìm kiếm</h6>
            {searchHistory.length > 0 && (
              <button 
                className="btn-clear-all" 
                onClick={(e) => {
                  e.preventDefault();
                  clearAllSearchHistory(e);
                }}
              >
                Xóa tất cả
              </button>
            )}
          </div>
          
          <div className="search-history-content">
            {searchHistoryLoading ? (
              <div className="search-history-loading">
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Đang tải...</span>
              </div>
            ) : searchHistory.length > 0 ? (
              <div className="search-history-items">
                {searchHistory.map((item) => (
                  <div 
                    key={item._id} 
                    className="search-history-item"
                    onClick={() => handleSearchHistoryItemClick(item.query, item.filters)}
                  >
                    <div className="d-flex align-items-center">
                      <FaHistory className="search-history-icon" style={{marginRight: '3px'}} />
                      <div className="search-history-query">
                        {item.query}
                        {(item.filters?.category || item.filters?.country || item.filters?.year) && (
                          <div className="search-filters">
                            {item.filters.category && (
                              <span className="filter-badge">
                                {item.filters.category}
                              </span>
                            )}
                            {item.filters.country && (
                              <span className="filter-badge">
                                {item.filters.country}
                              </span>
                            )}
                            {item.filters.year && (
                              <span className="filter-badge">
                                {item.filters.year}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      className="btn-remove-history"
                      onClick={(e) => deleteSearchHistoryItem(item._id, e)}
                      title="Xóa khỏi lịch sử"
                    >
                      <FaTimesCircle />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="search-history-empty">
                <FaSearch className="empty-icon" />
                <p>Chưa có lịch sử tìm kiếm</p>
              </div>
            )}
          </div>
        </div>
      )}      {showSuggestions && (
        <div className="search-suggestions-dropdown" ref={suggestionsRef}>
          <div className="search-suggestions-content">
            {loadingSuggestions ? (
              <div className="search-suggestions-loading">
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Đang tải...</span>
              </div>
            ) : searchSuggestions.length > 0 ? (
              <div className="search-suggestions-items">
                {searchSuggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="search-suggestions-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            ) : (
              <div className="search-suggestions-empty">
                <FaSearch className="empty-icon" />
                <p>Không có gợi ý</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {showFeedbackForm && <FeedbackForm ref={feedbackRef} isOpen={showFeedbackForm} onClose={() => setShowFeedbackForm(false)} />}

      <style jsx>{`
        .navbar {
          transition: background 0.3s ease-in-out, box-shadow 0.3s;
          z-index: 1000;
        }
        .nav-link {
          font-size: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          padding: 0.75rem 1.2rem;
          position: relative;
          border-radius: 4px;
          margin: 0 0.15rem;
        }
        .nav-link:hover {
          color: #e50914 !important;
        }
        
        /* Cải thiện hiệu ứng active với hiệu ứng chỉ báo di chuyển mượt mà */
        .navbar-nav {
          position: relative;
        }
        
        .nav-indicator {
          position: absolute;
          bottom: 0;
          height: 3px;
          background: linear-gradient(90deg,rgb(228, 214, 214),rgb(241, 231, 231),rgb(215, 210, 210));
          border-radius: 3px;
          transition: all 0.4s cubic-bezier(0.65, 0, 0.35, 1);
          box-shadow: 0 0 10px rgba(68, 91, 22, 0.7);
          z-index: 1;
        }
        
        .nav-link.active {
          color: #ffffff !important;
          font-weight: 600;
        }
        
        .nav-link.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, rgba(229, 9, 20, 0.2) 100%);
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        
        .nav-link.active:hover::before {
          opacity: 1;
        }
        
        @media (max-width: 992px) {
          .nav-link.active {
            background: rgba(229, 9, 20, 0.1);
          }
          
          .nav-item.active {
            background-color: rgba(229, 9, 20, 0.05);
            border-radius: 4px;
            box-shadow: 0 0 15px rgba(229, 9, 20, 0.1) inset;
          }
          
          .nav-indicator {
            display: none;
          }
        }
        
        .profile-avatar {
          position: relative;
          cursor: pointer;
        }
        .profile-avatar img {
          object-fit: cover;
          border: 2px solid transparent;
          transition: border-color 0.3s ease;
          background-color: #333;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        .profile-avatar:hover img {
          border-color: #e50914;
        }
        .navbar-logo {
          max-width: 150px;
          height: auto;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .navbar-toggler:focus {
          box-shadow: none;
        }
        
        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(47, 46, 46, 0.5);
          z-index: 998;
          cursor: pointer;
        }
        
        .user-menu {
          position: absolute;
          top: 70px;
          right: 20px;
          width: 240px;
          background-color: #212529;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          z-index: 1001;
          padding: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .user-menu:before {
          content: '';
          position: absolute;
          top: -8px;
          right: 25px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #212529;
        }
        
        @media (max-width: 992px) {
          .user-menu {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 280px;
            margin-top: 0;
            right: auto;
          }
          
          .user-menu:before {
            display: none;
          }
        }
        
        .user-info {
          display: flex;
          align-items: center;
          padding: 8px 4px;
        }
        
        .user-details {
          overflow: hidden;
        }
        
        .user-name {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-email {
          margin: 0;
          font-size: 12px;
          color: #aaa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 10px;
          color: #fff;
          font-size: 14px;
          border-radius: 4px;
          transition: background-color 0.2s;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }
        
        .dropdown-item:hover {
          background-color: rgba(255,255,255,0.1);
        }
        
        .dropdown-divider {
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 8px 0;
        }
        
        .user-status-indicator {
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: #4CD964;
          border-radius: 50%;
          bottom: 0;
          right: 0;
          border: 1px solid #212529;
        }
        
        .auth-links {
          display: flex;
          flex-direction: column;
        }
        
        @media (max-width: 992px) {
          .navbar-collapse {
            position: fixed;
            top: 0;
            left: -280px;
            width: 280px;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.95);
            padding: 70px 1rem 1rem;
            z-index: 999;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            transition: left 0.3s ease;
            overflow-y: auto;
          }
          
          .navbar-collapse.show {
            left: 0;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
          }
          
          .nav-item {
            margin: 12px 0;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 8px;
          }
          
          .nav-item:last-child {
            border-bottom: none;
          }
        }
        
        .search-history-dropdown {
          position: absolute;
          top: 55px;
          right: 100px;
          width: 320px;
          background-color: #212529;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          z-index: 1001;
          padding: 0;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          max-height: 300px;
          display: flex;
          flex-direction: column;
        }
        
        .search-history-dropdown:before {
          content: '';
          position: absolute;
          top: -8px;
          right: 25px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #212529;
        }        @media (max-width: 992px) {
          .search-history-dropdown {
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 320px;
            right: auto;
          }
          
          .search-history-dropdown:before {
            display: none;
          }
        }
        
        .search-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background-color: rgba(0,0,0,0.2);
        }
        
        .search-history-header h6 {
          font-weight: 600;
          color: #fff;
        }
        
        .btn-clear-all {
          font-size: 12px;
          color: #e50914;
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .btn-clear-all:hover {
          text-decoration: underline;
        }
        
        .search-history-content {
          padding: 0;
          max-height: 250px;
          overflow-y: auto;
          overflow-x: auto;
          white-space: nowrap;
          flex: 1;
        }
        
        .search-history-items {
          min-width: 100%;
          display: inline-block;
        }
        
        .search-history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background-color 0.2s;
          cursor: pointer;
          position: relative;
        }
        
        .search-history-icon {
          font-size: 16px;
          color: #aaa;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .search-history-query {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 230px;
          display: inline-block;
        }
        
        .btn-remove-history {
          background: none;
          border: none;
          color: #aaa;
          cursor: pointer;
          font-size: 16px;
          flex-shrink: 0;
          margin-left: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
        }
        
        .search-history-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 0;
          color: #aaa;
          font-size: 14px;
        }
        
        .search-history-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 15px;
          color: #aaa;
          text-align: center;
        }
        
        .search-history-empty .empty-icon {
          font-size: 28px;
          margin-bottom: 10px;
          opacity: 0.5;
        }
        
        .search-history-empty p {
          margin-bottom: 10px;
          font-size: 14px;
        }

        @media (max-width: 480px) {
          .mobile-search-form {
            width: auto;
            max-width: 130px; 
          }
          
          .mobile-search-input {
            width: 100px;
            padding-left: 8px;
            padding-right: 8px;
            font-size: 14px;
          }
          
          .mobile-search-form .btn {
            padding: 0.25rem 0.5rem;
            font-size: 12px;
          }
        }

        @media (max-width: 360px) {
          .mobile-search-form {
            max-width: 100px;
          }
          
          .mobile-search-input {
            width: 70px;
          }
          
          .mobile-search-form .btn {
            padding: 0.25rem 0.4rem;
          }
        }
        
        @media (max-width: 576px) {
          .navbar .container-fluid {
            padding-left: 8px;
            padding-right: 8px;
          }
          
          .d-flex.d-lg-none.align-items-center {
            gap: 8px;
          }
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 140px;
          transition: max-width 0.3s ease-in-out;
        }
        
        .mobile-search-form {
          width: auto;
          transition: width 0.3s ease-in-out;
        }
        
        .mobile-search-input {
          width: 100%;
          height: 32px;
          padding: 4px 8px;
          font-size: 13px;
          border-radius: 4px 0 0 4px;
          border-right: none;
          transition: width 0.3s ease-in-out;
        }
        
        .search-btn {
          height: 32px;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0 4px 4px 0;
          margin-left: 0 !important;
        }
        
        @media (max-width: 576px) {
          .search-container {
            max-width: 130px;
          }
        }
        
        @media (max-width: 480px) {
          .search-container {
            max-width: 120px;
          }
        }
        
        @media (max-width: 400px) {
          .search-container {
            max-width: 100px;
          }
        }
        
        @media (max-width: 360px) {
          .search-container {
            max-width: 80px;
          }
          
          .navbar-logo {
            width: 100px !important;
            height: 28px !important;
          }
        }
        
        @media (max-width: 320px) {
          .search-container {
            max-width: 70px;
          }
        }

        .search-suggestions-dropdown {
          position: absolute;
          top: 55px;
          right: 100px;
          width: 320px;
          background-color: #212529;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          z-index: 1001;
          padding: 0;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          max-height: 300px;
          display: flex;
          flex-direction: column;
        }
        
        .search-suggestions-dropdown:before {
          content: '';
          position: absolute;
          top: -8px;
          right: 25px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid #212529;
        }          @media (max-width: 992px) {
          .search-suggestions-dropdown {
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 320px;
            right: auto;
          }
          
          .search-suggestions-dropdown:before {
            display: none;
          }
        }
        
        .search-suggestions-content {
          padding: 0;
          max-height: 250px;
          overflow-y: auto;
          overflow-x: auto;
          white-space: nowrap;
          flex: 1;
        }
        
        .search-suggestions-items {
          min-width: 100%;
          display: inline-block;
        }
        
        .search-suggestions-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background-color 0.2s;
          cursor: pointer;
          position: relative;
        }
        
        .search-suggestions-item:hover {
          background-color: rgba(255,255,255,0.1);
        }
        
        .search-suggestions-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 0;
          color: #aaa;
          font-size: 14px;
        }
        
        .search-suggestions-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 15px;
          color: #aaa;
          text-align: center;
        }
        
        .search-suggestions-empty .empty-icon {
          font-size: 28px;
          margin-bottom: 10px;
          opacity: 0.5;
        }
        
        .search-suggestions-empty p {
          margin-bottom: 10px;
          font-size: 14px;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
