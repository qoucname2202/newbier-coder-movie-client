// src/pages/admin/movies.tsx
'use client';

// Khai báo kiểu cho đối tượng window toàn cục
declare global {
  interface Window {
    searchTimeout?: NodeJS.Timeout;
  }
}

import React, { useState, useCallback, useEffect, useRef } from 'react';
import AdminRoute from '../../components/ProtectedRoute/AdminRoute';
import { 
  FaPlus, 
  FaSearch, 
  FaPen,   
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaCalendarAlt,
  FaSync,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaArrowUp,
  FaInfoCircle,
  FaFilm,
  FaAlignLeft,
  FaServer,
  FaCode,
  FaStream,
  FaCopy,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaSave,
  FaBolt,
  FaUser,
  FaDownload
} from 'react-icons/fa';
import styles from '../../styles/AdminMovies.module.css';
import darkStyles from '../../styles/AdminMoviesDark.module.css';
import ratingStyles from '../../styles/AdminRatings.module.css';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/router';  
import { toast } from 'react-toastify';
import AdminLayout from '../../components/Layout/AdminLayout';
import CrawlModal from '../../components/Admin/CrawlModal';
import axiosInstance from '../../API/config/axiosConfig';

import { 
  getMoviesForAdmin, 
  deleteMovieByAdmin, 
  toggleMovieVisibility,
  searchMoviesWithElasticsearch,
  checkElasticsearchStatus,
  ElasticsearchStatus
} from '../../services/admin/movieAdminService';

import {
  getMovieRatings,
  syncMovieRatings,
  syncAllMovieRatings,
  RatingStats
} from '../../services/admin/ratingAdminService';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Movie {
  _id: string;
  name: string;
  origin_name: string;
  year: number;
  type: 'series' | 'single';
  status: 'active' | 'inactive';
  thumb_url: string;
  category: Category[] | string[];
  views: number;
  view?: number;
  quality: string;
  lang: string;
  content?: string;
  director?: string[] | string;
  actor?: string[] | string;
  country?: { id: string; name: string }[] | string;
  time?: string;
  showtimes?: string;
  episode_current?: string | number;
  episode_total?: string | number;
  is_copyright?: boolean;
  sub_docquyen?: boolean;
  chieurap?: boolean;
  source?: string;
  file_size?: string;
  tags?: string[];
  episodes?: {
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }>;
  }[];
  createdAt: string;
  updatedAt: string;  
  expiryDate?: string;
  rating: number;
  vote_count: number;
  slug: string;
  isHidden?: boolean;
  userRating?: number;
}

interface DeleteModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, movie, onClose, onConfirm }) => {
  if (!isOpen || !movie) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteModalHeader}>
          <FaExclamationTriangle className={styles.deleteWarningIcon} />
          <h3 className={styles.deleteModalTitle}>Xác nhận xóa</h3>
        </div>
        <div className={styles.deleteModalBody}>
          <p className={styles.deleteQuestion}>
            Bạn có chắc chắn muốn xóa phim <strong>&quot;{movie.name}&quot;</strong>?
          </p>
          <p className={styles.deleteWarningText}>
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            Thao tác này không thể hoàn tác.
          </p>
        </div>
        <div className={styles.deleteModalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            <FaChevronLeft style={{ fontSize: '14px' }} /> Hủy
          </button>
          <button 
            className={styles.confirmDeleteButton} 
            onClick={() => {
              console.log("Xác nhận xóa phim:", movie.name);
              onConfirm();
            }}
          >
            Xác nhận xóa <FaTrash style={{ fontSize: '14px', marginLeft: '5px' }} />
          </button>
        </div>
      </div>
    </div>  );
}

interface MovieDetailModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
}

const renderStars = (rating: number, styles: Record<string, string>) => {
  const stars = [];
  // Use the rating directly for 10-star scale
  const normalizedRating = rating; // Không cần chuyển đổi nữa
  
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className={`${styles.starIcon} ${styles.filled}`} />);
  }
  
  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half" className={`${styles.starIcon} ${styles.half}`} />);
  }
  
  const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className={styles.starIcon} />);
  }
  
  return stars;
};

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ isOpen, movie, onClose }) => {
  // Move all hooks to the top, before any early returns
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [fullMovieData, setFullMovieData] = useState<Movie | null>(null);
  
  // Rating states
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [syncingRatings, setSyncingRatings] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);

  const [episodes, setEpisodes] = useState<{
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }>;
  }[]>([]);  const [isEditing, setIsEditing] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Move all useEffect hooks before early return
  useEffect(() => {
    if (isOpen && movie) {
      const fetchFullMovieData = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/admin/movies/${movie._id}`);
          
          console.log("API response:", response.data);
          
          if (response.data && response.data.message === 'Movie retrieved successfully' && response.data.movie) {
            console.log("Tải chi tiết phim thành công từ cấu trúc message/movie:", response.data.movie);
            setFullMovieData(response.data.movie);
            
            if (response.data.movie.episodes) {
              console.log("Đường dẫn phim từ API:", response.data.movie.episodes);
              setEpisodes(response.data.movie.episodes || []);
            } else {
              console.log("Phim không có đường dẫn");
              setEpisodes([]);
            }
            setLoading(false);
            return;
          }
          
          let movieData = null;
          
          if (response.data && response.data.movie) {
            movieData = response.data.movie;
          } 
          else if (response.data && response.data._id) {
            movieData = response.data;
          }
          else if (response.data && response.data.id) {
            movieData = response.data;
            movieData._id = movieData.id;
          }
          
          if (movieData) {
            console.log("Tải chi tiết phim thành công:", movieData);
            setFullMovieData(movieData);
            
            if (movieData.episodes) {
              console.log("Đường dẫn phim từ API:", movieData.episodes);
              setEpisodes(movieData.episodes || []);
            } else {
              console.log("Phim không có đường dẫn");
              setEpisodes([]);
            }
          } else {
            console.error("Không nhận được dữ liệu phim hợp lệ:", response.data);
            if (response.data) {
              console.log("Thử sử dụng response.data trực tiếp");
              setFullMovieData(response.data);
            } else {
              toast.error("Không thể tải chi tiết phim - Dữ liệu không hợp lệ");
            }
          }
        } catch (error) {
          console.error("Lỗi khi tải chi tiết phim:", error);
          toast.error("Không thể tải chi tiết phim - Có lỗi xảy ra");
        } finally {
          setLoading(false);
        }
      };
      
      fetchFullMovieData();
    } else {
      setFullMovieData(null);
      setEpisodes([]);
      setRatingStats(null);
    }
  }, [isOpen, movie]);
  
  // Add a new useEffect to load ratings when the ratings tab is selected
  useEffect(() => {
    if (!movie || activeTab !== 'ratings') return;
    
    const fetchRatingsData = async () => {
      try {
        setLoadingRatings(true);
        const data = await getMovieRatings(movie._id);
        setRatingStats(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu đánh giá:", error);
        toast.error("Không thể tải dữ liệu đánh giá - Có lỗi xảy ra");
      } finally {
        setLoadingRatings(false);
      }
    };
    
    fetchRatingsData();
  }, [movie, activeTab]);
  
  // Fetch ratings when active tab changes to 'ratings' or when movie changes
  useEffect(() => {
    const fetchRatings = async () => {
      if (isOpen && movie && activeTab === 'ratings') {
        try {
          setLoadingRatings(true);
          const ratings = await getMovieRatings(movie._id);
          setRatingStats(ratings);
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu đánh giá:", error);
          toast.error("Không thể tải dữ liệu đánh giá");
        } finally {
          setLoadingRatings(false);
        }
      }
    };
    
    fetchRatings();
  }, [isOpen, movie, activeTab]);
    // Early return check after all hooks are declared
  if (!isOpen || !movie) return null;
  
  // Handle sync ratings for current movie
  const handleSyncRatings = async () => {
    if (!movie) return;
    
    try {
      setSyncingRatings(true);
      await syncMovieRatings(movie._id);
      
      // After syncing, refresh rating data
      const updatedRatings = await getMovieRatings(movie._id);
      setRatingStats(updatedRatings);
      
      // Also update the full movie data to show updated rating on info tab
      if (fullMovieData) {
        setFullMovieData({
          ...fullMovieData,
          rating: updatedRatings.averageRating,
          vote_count: updatedRatings.ratingCount
        });
      }
      
      toast.success("Đồng bộ đánh giá thành công!");
    } catch (error) {
      console.error("Lỗi khi đồng bộ đánh giá:", error);
      toast.error("Không thể đồng bộ đánh giá");
    } finally {
      setSyncingRatings(false);
    }
  };
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Không xác định';
      
      const date = new Date(dateString);
      
      // Định dạng ngày và giờ riêng biệt để rõ ràng hơn
      const timeString = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const formattedDateString = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });      return `${timeString} ${formattedDateString}`;
    } catch {
      return 'Không xác định';
    }
  };

  const displayMovie = fullMovieData || movie;

  const formatArray = (arr: string[] | string | undefined): string => {
    if (!arr) return 'Chưa có thông tin';
    if (Array.isArray(arr)) return arr.join(', ');
    return arr;
  };

  // const formatCategory = (category: any[] | any | undefined): string => {
  //   if (!category) return 'Chưa phân loại';
    
  //   if (Array.isArray(category)) {
  //     return category.map(cat => {
  //       if (typeof cat === 'object' && cat !== null && cat.name) {
  //         return cat.name;
  //       }
  //       return cat.toString();
  //     }).join(', ');
  //   }
    
  //   return category.toString();
  // };
    const handleCopyLink = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(`Đã sao chép ${type}`);
        setTimeout(() => setCopySuccess(null), 2000);
      })
      .catch(err => {
        console.error('Không thể sao chép: ', err);
      });
  };

  const handleAddServer = () => {
    if (!newServerName.trim()) {
      setErrorMessage('Vui lòng nhập tên server');
      return;
    }

    const serverExists = episodes.some(
      server => server.server_name.toLowerCase() === newServerName.trim().toLowerCase()
    );

    if (serverExists) {
      setErrorMessage('Server này đã tồn tại');
      return;
    }

    const newServer = {
      server_name: newServerName.trim(),
      server_data: []
    };

    setEpisodes([...episodes, newServer]);
    setNewServerName('');
    setErrorMessage('');
  };

  // Xử lý lưu danh sách tập phim
  const handleSaveEpisodes = async () => {
    if (!movie || !movie._id) return;
    
    try {
      setSaving(true);
      
      // Gọi API để cập nhật episodes
      const response = await axiosInstance.put(`/admin/movies/${movie._id}/episodes`, {
        episodes: episodes
      });
      
      if (response.data && response.data.success) {
        toast.success('Lưu đường dẫn phim thành công!');
        
        // Cập nhật dữ liệu phim với episodes mới
        if (fullMovieData) {
          setFullMovieData({
            ...fullMovieData,
            episodes: episodes
          });
        }
        
        // Tắt chế độ chỉnh sửa
        setIsEditing(false);
      } else {
        toast.error('Không thể lưu đường dẫn phim: ' + (response.data?.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Lỗi khi lưu đường dẫn phim:', error);
      toast.error('Không thể lưu đường dẫn phim');
    } finally {
      setSaving(false);
    }
  };
  
  // Xử lý thêm tập phim mới vào server
  const handleAddEpisode = (serverIndex: number) => {
    const updatedEpisodes = [...episodes];
    const newEpisode = {
      name: `Tập ${updatedEpisodes[serverIndex].server_data.length + 1}`,
      slug: `tap-${updatedEpisodes[serverIndex].server_data.length + 1}`,
      filename: '',
      link_embed: '',
      link_m3u8: ''
    };
    
    updatedEpisodes[serverIndex].server_data.push(newEpisode);
    setEpisodes(updatedEpisodes);
  };
  
  // Xử lý xóa tập phim
  const handleDeleteEpisode = (serverIndex: number, episodeIndex: number) => {
    const updatedEpisodes = [...episodes];
    updatedEpisodes[serverIndex].server_data.splice(episodeIndex, 1);
    setEpisodes(updatedEpisodes);
  };
    // Xử lý thay đổi thông tin tập phim
  const handleEpisodeChange = (serverIndex: number, episodeIndex: number, field: 'name' | 'slug' | 'filename' | 'link_embed' | 'link_m3u8', value: string) => {
    const updatedEpisodes = [...episodes];
    updatedEpisodes[serverIndex].server_data[episodeIndex][field] = value;
    setEpisodes(updatedEpisodes);
  };
  
  // Xử lý xóa server
  const handleDeleteServer = (serverIndex: number) => {
    const updatedEpisodes = [...episodes];
    updatedEpisodes.splice(serverIndex, 1);
    setEpisodes(updatedEpisodes);
  };
  
  const combinedStyles = {
    ...styles,
    ...ratingStyles,
    ...(theme === 'dark' ? darkStyles : {})
  };

  return (
    <div className={combinedStyles.modalOverlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={`${combinedStyles.modalContent} ${combinedStyles.modalContentLarge}`} onClick={(e) => e.stopPropagation()}>
        <div className={combinedStyles.modalHeader}>
          <div className={combinedStyles.modalHeaderContent}>            
            <div className={combinedStyles.modalTitleWrapper}>
              <h2 className={combinedStyles.modalTitle}>Chi tiết phim</h2>
              <div className={combinedStyles.modalSubtitle}>
                <FaCode size={14} /> 
                <span 
                  className={combinedStyles.modalId} 
                  onClick={() => handleCopyLink(displayMovie._id, 'ID phim')}
                  title="Nhấp để sao chép ID phim"
                >
                  {displayMovie._id}
                </span>
                {copySuccess === 'Đã sao chép ID phim' && (
                  <span className={combinedStyles.copySuccess}>
                    <FaCheckCircle size={12} /> {copySuccess}
                  </span>
                )}
              </div>
            </div>
            <button 
              className={combinedStyles.closeButtonX} 
              onClick={onClose}
              aria-label="Đóng"
            >×</button>
          </div>
        </div>
        
        <div className={combinedStyles.tabNavigation}>
          <button 
            className={`${combinedStyles.tabButton} ${activeTab === 'info' ? combinedStyles.activeTab : ''}`}
            onClick={() => setActiveTab('info')}
            title="Thông tin cơ bản về phim"
          >
            <FaInfoCircle /> <span className={combinedStyles.tabText}>Thông tin cơ bản</span>
          </button>
          <button 
            className={`${combinedStyles.tabButton} ${activeTab === 'content' ? combinedStyles.activeTab : ''}`}
            onClick={() => setActiveTab('content')}
            title="Nội dung và mô tả phim"
          >
            <FaAlignLeft /> <span className={combinedStyles.tabText}>Nội dung phim</span>
          </button>
          <button 
            className={`${combinedStyles.tabButton} ${activeTab === 'technical' ? combinedStyles.activeTab : ''}`}
            onClick={() => setActiveTab('technical')}
            title="Thông tin kỹ thuật của phim"
          >
            <FaCode /> <span className={combinedStyles.tabText}>Thông tin kỹ thuật</span>
          </button>          <button 
            className={`${combinedStyles.tabButton} ${activeTab === 'episodes' ? combinedStyles.activeTab : ''}`}
            onClick={() => setActiveTab('episodes')}
            title="Danh sách các tập phim và đường dẫn"
          >
            <FaStream /> <span className={combinedStyles.tabText}>Danh sách tập phim</span>
          </button>          <button 
            className={`${combinedStyles.tabButton} ${activeTab === 'ratings' ? combinedStyles.activeTab : ''}`}
            onClick={() => setActiveTab('ratings')}
            title="Quản lý đánh giá người dùng"
          >
            <FaStar /> <span className={combinedStyles.tabText}>Đánh giá</span>
          </button>
        </div>
        
        <div className={combinedStyles.modalBody}>
          {loading ? (
            <div className={combinedStyles.loadingSpinnerContainer}>
              <div className={combinedStyles.loadingSpinner}>
                <div className={combinedStyles.spinner}></div>
                <p>Đang tải thông tin chi tiết...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'info' && (
                <div className={combinedStyles.infoTab}>
                  <div className={combinedStyles.infoGrid}>
                    <div className={combinedStyles.posterCol}>
                      <div className={combinedStyles.posterWrapper}>
                        <img 
                          src={displayMovie.thumb_url} 
                          alt={displayMovie.name}
                          className={combinedStyles.moviePoster}
                          onError={(e) => {
                            e.currentTarget.src = '/img/default-poster.jpg';
                          }}
                        />
                      </div>
                        <div className={combinedStyles.ratingCard}>
                        <div className={combinedStyles.ratingStars}>
                          {renderStars(displayMovie.rating || 0, combinedStyles)}
                        </div>
                        <div className={combinedStyles.ratingValues}>
                          <span className={combinedStyles.ratingNumber}>{(displayMovie.rating || 0).toFixed(1)}</span>
                          <span className={combinedStyles.ratingScale}>/10</span>
                          <span className={combinedStyles.voteCount}>({displayMovie.vote_count || 0} đánh giá)</span>
                        </div>
                      </div>
                      
                      <div className={combinedStyles.movieFlags}>
                        {displayMovie.is_copyright && (
                          <span className={combinedStyles.copyright}>Bản quyền</span>
                        )}
                        {displayMovie.sub_docquyen && (
                          <span className={combinedStyles.exclusive}>Sub Độc Quyền</span>
                        )}
                        {displayMovie.chieurap && (
                          <span className={combinedStyles.theater}>Chiếu Rạp</span>
                        )}
                      </div>

                      <div className={combinedStyles.quickActions}>
                        <a 
                          href={`/movie/${displayMovie.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={combinedStyles.viewOnSiteButton}
                        >
                          <FaExternalLinkAlt /> <span>Xem trên website</span>
                        </a>                        <button 
                          onClick={() => router.push(`/admin/movies/edit/${displayMovie._id}`)}
                          className={combinedStyles.editIconButton}
                          title="Chỉnh sửa phim"
                        >
                          <div className={combinedStyles.editIconContainer}>
                            <FaPen className={combinedStyles.editIconPen} />
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div className={combinedStyles.infoCol}>
                      <div className={combinedStyles.movieTitleContainer}>
                        <h2 className={combinedStyles.movieName}>{displayMovie.name}</h2>
                        <div className={combinedStyles.movieOriginalName}>({displayMovie.origin_name})</div>
                      </div>                      <div className={combinedStyles.statusBadge} data-status={displayMovie.isHidden ? 'inactive' : 'active'}>
                        {displayMovie.isHidden ? 'Đang ẩn phim' : 'Đang hiển thị'}
                      </div>
                      
                      <div className={combinedStyles.infoGrid}>                        <div className={`${combinedStyles.infoCard} ${combinedStyles.basicInfoCard} ${combinedStyles.infoCardHalf}`}>
                          <h3 className={combinedStyles.infoCardTitle}>Thông tin cơ bản</h3>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Loại phim:</div>
                            <div className={combinedStyles.infoValue}>
                              {displayMovie.type === 'series' ? 'Phim bộ' : 'Phim lẻ'}
                            </div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Chất lượng:</div>
                            <div className={combinedStyles.infoValue}>{displayMovie.quality || 'HD'}</div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Ngôn ngữ:</div>
                            <div className={combinedStyles.infoValue}>{displayMovie.lang || 'Vietsub'}</div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Thời lượng:</div>
                            <div className={combinedStyles.infoValue}>{displayMovie.time || 'Không xác định'}</div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Lượt xem:</div>
                            <div className={combinedStyles.infoValue}>{displayMovie.views || displayMovie.view || 0}</div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Quốc gia:</div>
                            <div className={combinedStyles.infoValue}>
                              {displayMovie.country && Array.isArray(displayMovie.country) 
                                ? displayMovie.country.map(c => typeof c === 'object' ? c.name : c).join(', ')
                                : (displayMovie.country || 'Chưa xác định')}
                            </div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Năm sản xuất:</div>
                            <div className={combinedStyles.infoValue}>{displayMovie.year || 'Chưa xác định'}</div>
                          </div>
                        </div>
                          <div className={`${combinedStyles.infoCard} ${combinedStyles.additionalInfoCard} ${combinedStyles.infoCardHalf}`}>
                          <h3 className={combinedStyles.infoCardTitle}>Thông tin bổ sung</h3>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Thể loại:</div>
                            <div className={combinedStyles.infoValue}>
                              <div className={combinedStyles.categoryTags}>
                                {Array.isArray(displayMovie.category) && displayMovie.category.map((cat, idx) => (
                                  <span key={idx} className={combinedStyles.categoryTag}>
                                    {typeof cat === 'object' ? cat.name : cat}
                                  </span>
                                ))}
                                {!Array.isArray(displayMovie.category) && (
                                  <span className={combinedStyles.categoryTag}>{displayMovie.category || 'Chưa phân loại'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Đạo diễn:</div>
                            <div className={combinedStyles.infoValue}>{formatArray(displayMovie.director)}</div>
                          </div>
                          
                          <div className={combinedStyles.infoRow}>
                            <div className={combinedStyles.infoLabel}>Diễn viên:</div>
                            <div className={combinedStyles.infoValue}>{formatArray(displayMovie.actor)}</div>
                          </div>
                          
                          {displayMovie.showtimes && (
                            <div className={combinedStyles.infoRow}>
                              <div className={combinedStyles.infoLabel}>Lịch chiếu:</div>
                              <div className={combinedStyles.infoValue}>{displayMovie.showtimes}</div>
                            </div>
                          )}
                          
                          {displayMovie.type === 'series' && (
                            <>
                              <div className={combinedStyles.infoRow}>
                                <div className={combinedStyles.infoLabel}>Số tập hiện tại:</div>
                                <div className={combinedStyles.infoValue}>
                                  <span className={combinedStyles.episodeBadge}>
                                    {displayMovie.episode_current || 'Đang cập nhật'}
                                  </span>
                                </div>
                              </div>
                              <div className={combinedStyles.infoRow}>
                                <div className={combinedStyles.infoLabel}>Tổng số tập:</div>
                                <div className={combinedStyles.infoValue}>
                                  <span className={combinedStyles.episodeTotalBadge}>
                                    {displayMovie.episode_total || 'Đang cập nhật'}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                          <div className={`${combinedStyles.infoCard} ${combinedStyles.timeInfoCard}`}>
                          <h3 className={combinedStyles.infoCardTitle}>Thông tin thời gian</h3>
                          <div className={combinedStyles.dateInfoGrid}>
                            <div className={combinedStyles.infoRow}>
                              <div className={combinedStyles.infoLabel}>Ngày tạo:</div>
                              <div className={combinedStyles.infoValue}>
                                <span className={combinedStyles.dateInfo}>
                                  <FaCalendarAlt className={combinedStyles.dateIcon} />
                                  {formatDate(displayMovie.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className={combinedStyles.infoRow}>
                              <div className={combinedStyles.infoLabel}>Cập nhật:</div>
                              <div className={combinedStyles.infoValue}>
                                <span className={combinedStyles.dateInfo}>
                                  <FaSync className={combinedStyles.dateIcon} />
                                  {formatDate(displayMovie.updatedAt)}
                                </span>
                              </div>
                            </div>
                            {displayMovie.expiryDate && (
                              <div className={combinedStyles.infoRow}>
                                <div className={combinedStyles.infoLabel}>Ngày hết hạn:</div>
                                <div className={combinedStyles.infoValue}>
                                  <span className={`${combinedStyles.dateInfo} ${combinedStyles.expiryInfo}`}>
                                    <FaCalendarAlt className={combinedStyles.dateIcon} />
                                    {formatDate(displayMovie.expiryDate)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'content' && (
                <div className={combinedStyles.contentTab}>
                  <div className={combinedStyles.contentCard}>
                    <h3 className={combinedStyles.contentHeading}>Nội dung phim</h3>
                    {displayMovie.content ? (
                      <div className={combinedStyles.movieContent}>
                        {displayMovie.content}
                      </div>
                    ) : (
                      <div className={combinedStyles.noContent}>
                        <FaInfoCircle className={combinedStyles.noContentIcon} />
                        <p>Chưa có nội dung phim</p>
                      </div>
                    )}
                  </div>
                  
                  {displayMovie.tags && displayMovie.tags.length > 0 && (
                    <div className={combinedStyles.tagsCard}>
                      <h4 className={combinedStyles.tagsHeading}>Từ khóa:</h4>
                      <div className={combinedStyles.tagsList}>
                        {displayMovie.tags.map((tag: string, idx: number) => (
                          <span key={idx} className={combinedStyles.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
                {activeTab === 'technical' && (
                <div className={combinedStyles.technicalTab}>
                  <div className={combinedStyles.technicalContent}>
                    <h3 className={combinedStyles.tabHeading}>Thông tin kỹ thuật</h3>
                    
                    <div className={combinedStyles.technicalInfoCard}>
                      <div className={combinedStyles.technicalSection}>
                        <h4 className={combinedStyles.sectionTitle}>Thông tin định danh</h4>
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>ID phim:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.modalId}>
                              {displayMovie._id}
                            </span>
                            <button 
                              className={combinedStyles.copyButton}
                              onClick={() => handleCopyLink(displayMovie._id, 'ID')}
                              title="Sao chép ID"
                              aria-label="Sao chép ID"
                            >
                              <FaCopy />
                            </button>
                          </div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Slug:</div>
                          <div className={combinedStyles.techValue}>
                            {displayMovie.slug}
                            <button 
                              className={combinedStyles.copyButton}
                              onClick={() => handleCopyLink(displayMovie.slug, 'Slug')}
                              title="Sao chép slug"
                              aria-label="Sao chép slug"
                            >
                              <FaCopy />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className={combinedStyles.technicalSection}>
                        <h4 className={combinedStyles.sectionTitle}>URLs & Đường dẫn</h4>
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>URL hình ảnh:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.urlText}>{displayMovie.thumb_url}</span>
                            <button 
                              className={combinedStyles.copyButton}
                              onClick={() => handleCopyLink(displayMovie.thumb_url, 'URL hình ảnh')}
                              title="Sao chép URL"
                              aria-label="Sao chép URL hình ảnh"
                            >
                              <FaCopy />
                            </button>
                          </div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Đường dẫn trên website:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.urlText}>{`/phim/${displayMovie.slug}`}</span>
                            <div className={combinedStyles.urlActions}>
                              <button 
                                className={combinedStyles.copyButton}
                                onClick={() => handleCopyLink(`/phim/${displayMovie.slug}`, 'đường dẫn')}
                                title="Sao chép đường dẫn"
                                aria-label="Sao chép đường dẫn phim"
                              >
                                <FaCopy />
                              </button>
                              <a 
                                href={`/phim/${displayMovie.slug}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={combinedStyles.openLinkButton}
                                title="Mở liên kết"
                                aria-label="Mở liên kết phim"
                              >
                                <FaExternalLinkAlt />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={combinedStyles.technicalSection}>
                        <h4 className={combinedStyles.sectionTitle}>Thông tin phân loại</h4>
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>ID thể loại:</div>
                          <div className={combinedStyles.techValue}>
                            {Array.isArray(displayMovie.category) ? (
                              <div className={combinedStyles.categoryIdsList}>
                                {displayMovie.category.map((cat, idx) => (
                                  <span key={idx} className={combinedStyles.categoryId}>
                                    {typeof cat === 'string' ? cat : cat.id}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'Không có'
                            )}
                          </div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Loại phim:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.movieTypeTag}>
                              {displayMovie.type === 'series' ? 'Phim bộ (series)' : 'Phim lẻ (single)'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={combinedStyles.technicalSection}>
                        <h4 className={combinedStyles.sectionTitle}>Thông số kỹ thuật</h4>
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Độ phân giải:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.qualityBadge}>{displayMovie.quality || 'HD'}</span>
                          </div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Nguồn phim:</div>
                          <div className={combinedStyles.techValue}>{displayMovie.source || 'Không xác định'}</div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Kích thước file:</div>
                          <div className={combinedStyles.techValue}>{displayMovie.file_size || 'Không xác định'}</div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Số tập phim:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.episodeCountBadge}>
                              {episodes.length > 0 ? episodes.reduce((total: number, server) => total + server.server_data.length, 0) : 0}
                            </span>
                          </div>
                        </div>
                        
                        <div className={combinedStyles.techInfoRow}>
                          <div className={combinedStyles.techLabel}>Số server:</div>
                          <div className={combinedStyles.techValue}>
                            <span className={combinedStyles.serverCountBadge}>
                              {episodes.length} server
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {copySuccess && (
                      <div className={combinedStyles.copySuccessMessage}>
                        <FaCheckCircle className={combinedStyles.successIcon} /> {copySuccess}
                      </div>
                    )}
                  </div>                </div>
              )}
              
              {activeTab === 'ratings' && (
                <div className={combinedStyles.ratingsTab}>
                  <div className={combinedStyles.ratingsHeader}>
                    <h3 className={combinedStyles.tabHeading}>Đánh giá người dùng</h3>
                    
                    <button 
                      className={combinedStyles.syncRatingsButton}
                      onClick={handleSyncRatings}
                      disabled={syncingRatings}
                    >
                      <FaSync className={syncingRatings ? combinedStyles.spinningIcon : ''} /> 
                      {syncingRatings ? 'Đang đồng bộ...' : 'Đồng bộ đánh giá'}
                    </button>
                  </div>
                  
                  {loadingRatings ? (
                    <div className={combinedStyles.loadingSpinnerContainer}>
                      <div className={combinedStyles.loadingSpinner}>
                        <div className={combinedStyles.spinner}></div>
                        <p>Đang tải dữ liệu đánh giá...</p>
                      </div>
                    </div>
                  ) : ratingStats ? (
                    <div className={combinedStyles.ratingsContent}>
                      <div className={combinedStyles.ratingSummary}>
                        <div className={combinedStyles.ratingOverview}>                          
                          <h4 className={combinedStyles.ratingTitle}>Tổng quan đánh giá</h4>                          <div className={combinedStyles.ratingDetails}>
                            <div className={combinedStyles.averageRatingBig}>                              
                              {ratingStats.averageRating.toFixed(1)}
                              <span className={combinedStyles.outOf}>/10</span>
                            </div>
                            <div className={combinedStyles.ratingStarsBig}>
                              {renderStars(ratingStats.averageRating, combinedStyles)}
                            </div>
                            <div className={combinedStyles.ratingCount}>
                              Tổng số đánh giá: <strong>{ratingStats.ratingCount}</strong>
                            </div>
                            
                            {displayMovie.userRating !== undefined && displayMovie.userRating > 0 && (
                              <div className={combinedStyles.userRatingDetail}>
                                <h5 className={combinedStyles.userRatingTitle}>
                                  <FaUser className={combinedStyles.userRatingIconMd} /> Đánh giá của người dùng
                                </h5>
                                <div className={combinedStyles.userRatingDisplay}>
                                  <span className={combinedStyles.userRatingValueLarge}>{displayMovie.userRating.toFixed(1)}</span>
                                  <div className={combinedStyles.userRatingStars}>
                                    {renderStars(displayMovie.userRating, combinedStyles)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                          <div className={combinedStyles.ratingDistribution}>
                          <h4 className={combinedStyles.distributionTitle}>Phân bố đánh giá</h4>
                          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(stars => {
                            const count = ratingStats.userRatingsStats[stars] || 0;
                            const percentage = ratingStats.ratingCount > 0 
                              ? (count / ratingStats.ratingCount) * 100 
                              : 0;
                              
                            return (
                              <div key={stars} className={combinedStyles.ratingBar}>
                                <div className={combinedStyles.starCount}>{stars} điểm</div>
                                <div className={combinedStyles.barContainer}>
                                  <div 
                                    className={combinedStyles.barFill}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className={combinedStyles.ratingPercentage}>{count} ({percentage.toFixed(1)}%)</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className={combinedStyles.userRatingsList}>
                        <h4 className={combinedStyles.userRatingsTitle}>Danh sách đánh giá từ người dùng</h4>
                        {ratingStats.ratings.length > 0 ? (
                          <div className={combinedStyles.ratingList}>
                            <table className={combinedStyles.ratingTable}>
                              <thead>
                                <tr>
                                  <th>Người dùng</th>
                                  <th>Đánh giá</th>
                                  <th>Thời gian</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ratingStats.ratings.map((rating) => {
                                  const user = typeof rating.userId === 'object' 
                                    ? rating.userId 
                                    : { _id: 'unknown', username: 'Unknown', email: 'unknown' };
                                    
                                  return (
                                    <tr key={rating._id} className={combinedStyles.ratingRow}>
                                      <td className={combinedStyles.userCell}>
                                        <div className={combinedStyles.userData}>
                                          <div className={combinedStyles.userAvatar}>
                                            {typeof user === 'object' && user.avatar ? (
                                              <img 
                                                src={user.avatar} 
                                                alt={user.username} 
                                                className={combinedStyles.avatar}
                                              />
                                            ) : (
                                              <div className={combinedStyles.defaultAvatar}>
                                                {typeof user === 'object' && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                              </div>
                                            )}
                                          </div>
                                          <div className={combinedStyles.userInfo}>
                                            <div className={combinedStyles.username}>{typeof user === 'object' ? user.username || 'Unknown' : 'Unknown'}</div>
                                            <div className={combinedStyles.userEmail}>{typeof user === 'object' ? user.email || 'No email' : 'No email'}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className={combinedStyles.ratingCell}>                                        <div className={combinedStyles.ratingValue}>
                                          <div className={combinedStyles.ratingBadge}>
                                            {rating.rating.toFixed(1)}
                                            <span className={combinedStyles.ratingScale}>/10</span>
                                          </div>
                                          <div className={combinedStyles.ratingStarsSmall}>
                                            {renderStars(rating.rating, combinedStyles)}
                                          </div>
                                        </div>
                                      </td>
                                      <td className={combinedStyles.ratingDate}>
                                        {formatDate(rating.createdAt)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className={combinedStyles.noRatings}>
                            <p>Chưa có đánh giá nào cho phim này</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={combinedStyles.noRatings}>
                      <p>Không có dữ liệu đánh giá</p>
                      <button 
                        className={combinedStyles.syncRatingsButtonCenter}
                        onClick={() => {
                          if (!movie) return;
                          const fetchRatings = async () => {
                            try {
                              setLoadingRatings(true);
                              const data = await getMovieRatings(movie._id);
                              setRatingStats(data);
                            } catch (error) {
                              console.error("Lỗi khi tải dữ liệu đánh giá:", error);
                              toast.error("Không thể tải dữ liệu đánh giá - Có lỗi xảy ra");
                            } finally {
                              setLoadingRatings(false);
                            }
                          };
                          fetchRatings();
                        }}
                      >
                        <FaSync /> Tải dữ liệu đánh giá
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'episodes' && (
                <div className={combinedStyles.episodesTab}>
                  <div className={combinedStyles.episodesHeader}>
                    <h3 className={combinedStyles.tabHeading}>Danh sách tập phim</h3>
                    
                    {!isEditing ? (
                      <button 
                        className={combinedStyles.editEpisodesButton}
                        onClick={() => setIsEditing(true)}
                      >
                        <FaPen /> Chỉnh sửa đường dẫn phim
                      </button>
                    ) : (
                      <div className={combinedStyles.editingActions}>
                        <button 
                          className={combinedStyles.saveButton}
                          onClick={handleSaveEpisodes}
                          disabled={saving}
                        >
                          {saving ? 'Đang lưu...' : <><FaSave /> Lưu đường dẫn phim</>}
                        </button>
                        <button 
                          className={combinedStyles.cancelButton}
                          onClick={() => setIsEditing(false)}
                          disabled={saving}
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {episodes.length === 0 ? (
                    <div className={combinedStyles.noEpisodes}>
                      <div className={combinedStyles.noEpisodesMessage}>
                        <FaInfoCircle className={combinedStyles.noEpisodesIcon} />
                        <p>Chưa có đường dẫn tập phim nào.</p>
                      </div>
                      {!isEditing && (
                        <button 
                          className={combinedStyles.addEpisodesButton}
                          onClick={() => setIsEditing(true)}
                        >
                          <FaPlus /> Thêm đường dẫn phim
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={combinedStyles.episodesList}>
                      {episodes.map((server, serverIndex) => (
                        <div key={serverIndex} className={combinedStyles.serverSection}>
                          <div className={combinedStyles.serverHeader}>
                            <h4 className={combinedStyles.serverName}>
                              <FaServer className={combinedStyles.serverIcon} /> 
                              <span>{server.server_name}</span>
                              <span className={combinedStyles.episodeCount}>({server.server_data.length} tập)</span>
                            </h4>
                            {isEditing && (
                              <button 
                                className={combinedStyles.deleteServerButton}
                                onClick={() => handleDeleteServer(serverIndex)}
                                title="Xóa server"
                                aria-label="Xóa server"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                          
                          <div className={combinedStyles.episodesTable}>
                            <table className={combinedStyles.episodesDataTable}>
                              <thead>
                                <tr>
                                  <th>Tên tập</th>
                                  <th>Slug</th>
                                  {isEditing && <th>Filename</th>}
                                  <th>Link embed</th>
                                  <th>Link m3u8</th>
                                  {isEditing && <th>Thao tác</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {server.server_data.map((episode, episodeIndex) => (
                                  <tr key={episodeIndex} className={combinedStyles.episodeRow}>
                                    <td>
                                      {isEditing ? (
                                        <input 
                                          type="text"
                                          value={episode.name}
                                          onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'name', e.target.value)}
                                          className={combinedStyles.episodeInput}
                                          placeholder="Nhập tên tập phim"
                                        />
                                      ) : (
                                        <span className={combinedStyles.episodeName}>{episode.name}</span>
                                      )}
                                    </td>
                                    <td>
                                      {isEditing ? (
                                        <input 
                                          type="text"
                                          value={episode.slug}
                                          onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'slug', e.target.value)}
                                          className={combinedStyles.episodeInput}
                                          placeholder="Nhập slug"
                                        />
                                      ) : (
                                        <span className={combinedStyles.episodeSlug}>{episode.slug}</span>
                                      )}
                                    </td>
                                    {isEditing && (
                                      <td>
                                        <input 
                                          type="text"
                                          value={episode.filename || ''}
                                          onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'filename', e.target.value)}
                                          className={combinedStyles.episodeInput}
                                          placeholder="Tên file (nếu có)"
                                        />
                                      </td>
                                    )}
                                    <td className={combinedStyles.linkCell}>
                                      {isEditing ? (
                                        <input 
                                          type="text"
                                          value={episode.link_embed || ''}
                                          onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'link_embed', e.target.value)}
                                          className={combinedStyles.episodeInput}
                                          placeholder="Nhập link embed"
                                        />
                                      ) : (
                                        <div className={combinedStyles.linkDisplay}>
                                          <span className={combinedStyles.linkTruncated} title={episode.link_embed}>
                                            {episode.link_embed ? episode.link_embed : 'Chưa có'}
                                          </span>
                                          {episode.link_embed && (
                                            <div className={combinedStyles.linkActions}>
                                              <button 
                                                className={combinedStyles.copyLinkButton}
                                                onClick={() => handleCopyLink(episode.link_embed, 'link embed')}
                                                title="Sao chép link embed"
                                                aria-label="Sao chép link embed"
                                              >
                                                <FaCopy />
                                              </button>
                                              <a 
                                                href={episode.link_embed} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={combinedStyles.viewLinkButton}
                                                title="Xem link"
                                                aria-label="Xem link embed"
                                              >
                                                <FaExternalLinkAlt />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className={combinedStyles.linkCell}>
                                      {isEditing ? (
                                        <input 
                                          type="text"
                                          value={episode.link_m3u8 || ''}
                                          onChange={(e) => handleEpisodeChange(serverIndex, episodeIndex, 'link_m3u8', e.target.value)}
                                          className={combinedStyles.episodeInput}
                                          placeholder="Nhập link m3u8"
                                        />
                                      ) : (
                                        <div className={combinedStyles.linkDisplay}>
                                          <span className={combinedStyles.linkTruncated} title={episode.link_m3u8}>
                                            {episode.link_m3u8 ? episode.link_m3u8 : 'Chưa có'}
                                          </span>
                                          {episode.link_m3u8 && (
                                            <div className={combinedStyles.linkActions}>
                                              <button 
                                                className={combinedStyles.copyLinkButton}
                                                onClick={() => handleCopyLink(episode.link_m3u8, 'link m3u8')}
                                                title="Sao chép link m3u8"
                                                aria-label="Sao chép link m3u8"
                                              >
                                                <FaCopy />
                                              </button>
                                              <a 
                                                href={episode.link_m3u8} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={combinedStyles.viewLinkButton}
                                                title="Xem link"
                                                aria-label="Xem link m3u8"
                                              >
                                                <FaExternalLinkAlt />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    {isEditing && (
                                      <td>
                                        <button 
                                          className={combinedStyles.deleteEpisodeButton}
                                          onClick={() => handleDeleteEpisode(serverIndex, episodeIndex)}
                                          title="Xóa tập phim"
                                          aria-label="Xóa tập phim"
                                        >
                                          <FaTrash />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {isEditing && (
                            <div className={combinedStyles.addEpisodeContainer}>
                              <button 
                                className={combinedStyles.addEpisodeButton}
                                onClick={() => handleAddEpisode(serverIndex)}
                              >
                                <FaPlus /> Thêm tập phim mới
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className={combinedStyles.addServerForm}>
                      <h4 className={combinedStyles.addServerTitle}>Thêm server mới</h4>
                      <div className={combinedStyles.addServerInputGroup}>
                        <input 
                          type="text"
                          value={newServerName}
                          onChange={(e) => setNewServerName(e.target.value)}
                          placeholder="Tên server (VD: Vietsub, Thuyết minh...)"
                          className={combinedStyles.addServerInput}
                        />
                        <button 
                          className={combinedStyles.addServerButton}
                          onClick={handleAddServer}
                        >
                          <FaPlus /> Thêm server
                        </button>
                      </div>
                      {errorMessage && <p className={combinedStyles.errorMessage}>{errorMessage}</p>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className={combinedStyles.modalFooter}>
          <button className={combinedStyles.closeButton} onClick={onClose}>
            Đóng
          </button>
          <button 
            className={combinedStyles.editFullButton} 
            onClick={() => router.push(`/admin/movies/edit/${displayMovie._id}`)}
          >
            <FaPen /> Chỉnh sửa đầy đủ
          </button>
        </div>
      </div>
    </div>
  );
};

const MoviesAdmin = () => {
  const topRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const [loading, setLoading] = useState(true);  const [movies, setMovies] = useState<Movie[]>([]);
  const [syncingAllRatings, setSyncingAllRatings] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; movie: Movie | null }>({
    isOpen: false,
    movie: null
  });  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; movie: Movie | null }>({
    isOpen: false,
    movie: null
  });
  const [crawlModalOpen, setCrawlModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [moviesPerPage, setMoviesPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
  const [filterType, setFilterType] = useState<string>('');

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [elasticsearchStatus, setElasticsearchStatus] = useState<ElasticsearchStatus | null>(null);
  const [esStatusChecked, setEsStatusChecked] = useState<boolean>(false);

  useEffect(() => {
    const checkESStatus = async () => {
      try {
        const status = await checkElasticsearchStatus();
        console.log('Elasticsearch status:', status);
        setElasticsearchStatus(status);
        setEsStatusChecked(true);
      } catch (error) {
        console.error('Error checking Elasticsearch status:', error);
        setElasticsearchStatus({
          status: 'error',
          message: 'Không thể kết nối tới Elasticsearch'
        });
        setEsStatusChecked(true);
      }
    };
    
    checkESStatus();
  }, []);

  const searchMovies = async (query: string, page: number) => {
    try {
      setLoading(true);
      
      // Ensure current page is set
      const currentPageToUse = page || currentPage;
      
      let response;
      
      // Check Elasticsearch status and search content
      if (query && query.trim() !== '' && elasticsearchStatus?.status === 'active') {
        // Has search content and Elasticsearch is working well -> use Elasticsearch
        console.log('Searching with Elasticsearch:', query);
        
        // Automatically enable Elasticsearch for searches with content
        if (!isSearching) {
          console.log('Automatically enabling Elasticsearch for search');
          setIsSearching(true);
        }
        
        response = await searchMoviesWithElasticsearch(
          currentPageToUse,
          moviesPerPage,
          query,
          selectedCategory || undefined,
          filterStatus !== 'all' ? filterStatus : undefined,
          filterYear,
          filterType || undefined
        );
      } else {
        // Empty search content or Elasticsearch not available -> use MongoDB
        console.log('Searching with MongoDB:', query || 'empty query');
        
        // If no search content, ensure UI shows correct state
        if (!query || query.trim() === '') {
          setIsSearching(false);
        }
        
        response = await getMoviesForAdmin(
          currentPageToUse, 
          moviesPerPage, 
          sortField, 
          sortDirection,
          selectedCategory || undefined,
          filterStatus !== 'all' ? filterStatus : undefined,
          query, // Pass query to MongoDB (will be ignored if empty)
          filterYear,
          filterType || undefined
        );
      }
      
      console.log('Search API response:', response);
      
      // Process response data from service
      if (response && response.movies && Array.isArray(response.movies)) {
        console.log(`Retrieved ${response.movies.length} movies from search`);
        setMovies(response.movies);
        
        // Get pagination info
        const pagination = response.pagination || {};
        setTotalMovies(pagination.totalItems || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.warn('No movies array in search response:', response);
        setMovies([]);
        setTotalMovies(0);
        setTotalPages(1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching movies:', error);
      toast.error('Không thể tìm kiếm phim');
      setLoading(false);
      setMovies([]);
      setTotalMovies(0);
      setTotalPages(1);
    }
  };

  const fetchMovies = useCallback(async (page: number) => {
    try {
      console.log('Fetching movies for page:', page);
      
      if (searchQuery && searchQuery.trim() !== '') {
        await searchMovies(searchQuery, page);
        return;
      }
      
      setLoading(true);
      
      const response = await getMoviesForAdmin(
        page, 
        moviesPerPage, 
        sortField, 
        sortDirection,
        selectedCategory || undefined,
        filterStatus !== 'all' ? filterStatus : undefined,
        '', 
        filterYear,
        filterType || undefined
      );
      
      console.log('Movies list response:', response);
      
      if (response && response.movies && Array.isArray(response.movies)) {
        console.log(`Retrieved ${response.movies.length} movies`);
        setMovies(response.movies);
        
        const pagination = response.pagination || {};
        setTotalMovies(pagination.totalItems || 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        console.warn('No movies array in response:', response);
        setMovies([]);
        setTotalMovies(0);
        setTotalPages(1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Không thể tải danh sách phim');
      setLoading(false);
      setMovies([]);
      setTotalMovies(0);
      setTotalPages(1);
    }
  }, [searchQuery, moviesPerPage, sortField, sortDirection, selectedCategory, 
      filterStatus, filterYear, filterType, elasticsearchStatus]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('Search query changed to:', newValue);
    
    // Set the new search query value
    setSearchQuery(newValue);
    
    // Reset to page 1 when search query changes
    setCurrentPage(1);
    
    // Clear any existing search timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    if (!newValue || newValue.trim() === '') {
      console.log('Search query cleared, switching to MongoDB and loading all movies');
      setIsSearching(false);
      
      // Directly call getMoviesForAdmin instead of fetchMovies to avoid circular dependency issues
      setLoading(true);
      getMoviesForAdmin(
        1, 
        moviesPerPage, 
        sortField, 
        sortDirection,
        selectedCategory || undefined,
        filterStatus !== 'all' ? filterStatus : undefined,
        '', 
        filterYear,
        filterType || undefined
      ).then(response => {
        console.log('Movies list response after clearing search:', response);
        
        if (response && response.movies && Array.isArray(response.movies)) {
          console.log(`Retrieved ${response.movies.length} movies after clearing search`);
          setMovies(response.movies);
          
          const pagination = response.pagination || {};
          setTotalMovies(pagination.totalItems || 0);
          setTotalPages(pagination.totalPages || 1);
        } else {
          console.warn('No movies array in response after clearing search:', response);
          setMovies([]);
          setTotalMovies(0);
          setTotalPages(1);
        }
        
        setLoading(false);
      }).catch(error => {
        console.error('Error fetching movies after clearing search:', error);
        toast.error('Không thể tải danh sách phim');
        setLoading(false);
        setMovies([]);
        setTotalMovies(0);
        setTotalPages(1);
      });
    } else {
      // Set a timeout for search to avoid too many API calls while typing
      window.searchTimeout = setTimeout(() => {
        searchMovies(newValue, 1);
      }, 300);
    }
  }, [moviesPerPage, sortField, sortDirection, selectedCategory, filterStatus, filterYear, filterType]);


  
  useEffect(() => {
    if (searchQuery === '') {
      fetchMovies(currentPage);
    }
  }, [currentPage, moviesPerPage, sortField, sortDirection, selectedCategory, filterStatus, filterYear, filterType, isSearching]);  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching all categories from API...');
        
        // Sử dụng API endpoint mới để lấy tất cả thể loại
        const response = await axiosInstance.get('/admin/movies/categories');
        
        if (response.data && response.data.categories) {
          const categoriesFromAPI = response.data.categories;
          console.log(`Received ${categoriesFromAPI.length} unique categories from API`);
          setCategories(categoriesFromAPI);
        } else {
          console.log('No categories returned from API, falling back to extraction method');
          
          // Phương thức dự phòng: Trích xuất từ danh sách phim hiện tại
          if (movies && movies.length > 0) {
            const categoriesMap = new Map();
            
            movies.forEach(movie => {
              if (Array.isArray(movie.category)) {
                movie.category.forEach(cat => {
                  if (typeof cat === 'object' && cat !== null && cat.id && cat.name) {
                    categoriesMap.set(cat.id, {
                      id: cat.id,
                      name: cat.name,
                      slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
                    });
                  } 
                  else if (typeof cat === 'string') {
                    if (!categoriesMap.has(cat)) {
                      categoriesMap.set(cat, {
                        id: cat,
                        name: cat,
                        slug: cat.toLowerCase().replace(/\s+/g, '-')
                      });
                    }
                  }
                });
              }
            });
            
            const uniqueCategories = Array.from(categoriesMap.values());
            console.log(`Extracted ${uniqueCategories.length} unique categories from movies`);
            setCategories(uniqueCategories);
          } else {
            console.log('No movies data available to extract categories');
            setCategories([]);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Phương thức dự phòng khi API gặp lỗi
        if (movies && movies.length > 0) {
          const categoriesMap = new Map();
          // Trích xuất từ danh sách phim đã tải
          movies.forEach(movie => {
            if (Array.isArray(movie.category)) {
              movie.category.forEach(cat => {
                if (typeof cat === 'object' && cat !== null && cat.id && cat.name) {
                  categoriesMap.set(cat.id, {
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
                  });
                } 
                else if (typeof cat === 'string') {
                  if (!categoriesMap.has(cat)) {
                    categoriesMap.set(cat, {
                      id: cat,
                      name: cat,
                      slug: cat.toLowerCase().replace(/\s+/g, '-')
                    });
                  }
                }
              });
            }
          });
          
          const uniqueCategories = Array.from(categoriesMap.values());
          setCategories(uniqueCategories);
        } else {
          setCategories([]);
        }
      }
    };

    fetchCategories();
  }, [movies]); // Add movies as a dependency to update categories when movies list changes

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearValue = e.target.value ? parseInt(e.target.value) : undefined;
    setFilterYear(yearValue);
    setCurrentPage(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleAddMovie = () => {
    router.push('/admin/movies/add');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/movies/edit/${id}`);
  };

  const handleDeleteClick = (movie: Movie) => {
    setDeleteModal({ isOpen: true, movie });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.movie) {
      try {
        await deleteMovieByAdmin(deleteModal.movie._id);
        toast.success('Xóa phim thành công');
        fetchMovies(currentPage);
        setDeleteModal({ isOpen: false, movie: null });
      } catch (error) {
        console.error('Error deleting movie:', error);
        toast.error('Không thể xóa phim');
      }
    }
  };

  const handleToggleStatus = async (movie: Movie) => {
    try {
      if (!movie || !movie._id) {
        console.error('Invalid movie object or missing ID');
        toast.error('Không thể cập nhật trạng thái - Thiếu thông tin phim');
        return;
      }
      
      // Đảm bảo ID phim là chuỗi và hoàn chỉnh
      const movieId = String(movie._id).trim();
      
      console.log('Toggling visibility for movie:', {
        id: movieId,
        name: movie.name,
        currentVisibility: movie.isHidden ? 'hidden' : 'visible'
      });
      
      if (!movieId || movieId.length < 24) {
        console.error('Invalid movie ID:', movieId, 'Expected a 24-character MongoDB ObjectId');
        toast.error('ID phim không hợp lệ, không thể cập nhật trạng thái');
        return;
      }

      // Hiển thị loading toast
      const loadingToast = toast.loading('Đang cập nhật trạng thái phim...');
      
      // Gọi API để cập nhật trạng thái
      const response = await toggleMovieVisibility(movieId);
      
      // Đóng loading toast
      toast.dismiss(loadingToast);
      
      console.log('Toggle visibility response:', response);
      
      // Cập nhật trạng thái trong danh sách phim
      const newIsHidden = !movie.isHidden;
      toast.success(`Đã ${newIsHidden ? 'ẩn' : 'hiện'} phim thành công`);
      
      // Cập nhật state để UI hiển thị đúng ngay lập tức
      setMovies(prevMovies => 
        prevMovies.map(m => 
          m._id === movieId ? { ...m, isHidden: newIsHidden } : m
        )
      );
    } catch (error) {
      console.error('Error updating movie visibility:', error);
      toast.error('Không thể cập nhật trạng thái hiển thị phim');
    }
  };


  const combinedStyles = {
    ...styles,
    ...(theme === 'dark' ? darkStyles : {})
  };

  // const handleSort = (field: string) => {
  //   if (sortField === field) {
  //     setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortField(field);
  //     setSortDirection('asc');
  //   }
  //   setCurrentPage(1);
  // };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMoviesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
    const handleSyncAllRatings = async () => {
    try {
      setSyncingAllRatings(true);
      const loadingToast = toast.loading('Đang đồng bộ tất cả đánh giá...');
      
      await syncAllMovieRatings();
      
      toast.dismiss(loadingToast);
      toast.success('Đồng bộ tất cả đánh giá thành công!');
      
      // Refresh movie data to show updated ratings
      fetchMovies(currentPage);
    } catch (error) {
      console.error('Lỗi khi đồng bộ tất cả đánh giá:', error);
      toast.error('Không thể đồng bộ đánh giá');
    } finally {
      setSyncingAllRatings(false);
    }  };

  return (
    <div className={combinedStyles.container}>
      <div ref={topRef}></div>
      
      <header className={combinedStyles.header}>
        <h1 className={combinedStyles.headerTitle}>Quản lý Phim</h1>
        
        {esStatusChecked && (
          <div className={combinedStyles.elasticsearchStatus}>
            {elasticsearchStatus && (
              <div className={`${combinedStyles.esStatusBadge} ${combinedStyles[elasticsearchStatus.status]}`}>
                {elasticsearchStatus.status === 'active' ? (
                  <span title={`${elasticsearchStatus.documentCount || 0} documents indexed`}>
                    Elasticsearch: {isSearching && searchQuery.trim() ? 'Đang sử dụng' : 'Sẵn sàng'}
                  </span>
                ) : elasticsearchStatus.status === 'inactive' ? (
                  <span title="Elasticsearch is not available">
                    Elasticsearch: Không khả dụng
                  </span>
                ) : (
                  <span title={elasticsearchStatus.message}>
                    Elasticsearch: Lỗi
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <div className={combinedStyles.toolBar}>
        <div className={combinedStyles.searchInput}>
          <div className={combinedStyles.searchIcon}>
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder={isSearching && searchQuery.trim() ? "Tìm kiếm phim bằng Elasticsearch..." : "Tìm kiếm phim..."}
            value={searchQuery}
            onChange={handleSearch}
            className={combinedStyles.input}
          />
          {isSearching && searchQuery.trim() && (
            <div className={combinedStyles.searchBadge} title="Đang sử dụng Elasticsearch">
              <FaBolt className={combinedStyles.esBadgeIcon} />
            </div>
          )}
        </div>
        
        <div className={combinedStyles.filterControls}>          
        <div className={combinedStyles.filterSelect}>
            <FaFilter className={combinedStyles.filterIcon} />
            
            <select 
              id="categoryFilter"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={combinedStyles.select}
              aria-label="Lọc theo thể loại"
            >
              <option value="">Tất cả thể loại</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={combinedStyles.filterSelect}>
            <FaEye className={combinedStyles.filterIcon} />
            <select 
              id="statusFilter"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className={combinedStyles.select}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="inactive">Đang ẩn</option>
            </select>
          </div>
          
          <div className={combinedStyles.filterSelect}>
            <FaCalendarAlt className={combinedStyles.filterIcon} />
            <select 
              id="yearFilter"
              value={filterYear?.toString() || ''}
              onChange={handleYearChange}
              className={combinedStyles.select}
              aria-label="Lọc theo năm"
            >
              <option value="">Tất cả năm</option>
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className={combinedStyles.filterSelect}>
            <FaFilm className={combinedStyles.filterIcon} />
            <select 
              id="typeFilter"
              value={filterType}
              onChange={handleTypeChange}
              className={combinedStyles.select}
              aria-label="Lọc theo loại phim"
            >
              <option value="">Tất cả loại</option>
              <option value="series">Phim bộ</option>
              <option value="single">Phim lẻ</option>
            </select>
          </div>
          
          <div className={combinedStyles.filterSelect}>
            <select
              id="perPageFilter"
              value={moviesPerPage}
              onChange={handlePerPageChange}
              className={combinedStyles.select}
              aria-label="Số phim mỗi trang"
            >
              <option value="10">10 phim</option>
              <option value="20">20 phim</option>
              <option value="50">50 phim</option>
              <option value="100">100 phim</option>
            </select>
          </div>

          <button 
            className={combinedStyles.refreshButton}
            onClick={() => fetchMovies(currentPage)}
            title="Làm mới dữ liệu"
          >
            <FaSync />
          </button>        </div>          <div className={combinedStyles.actionButtons}>
            <button 
              className={`${combinedStyles.syncAllRatingsButton} ${combinedStyles.highlightedButton}`}
              onClick={handleSyncAllRatings}
              disabled={syncingAllRatings}
              title="Đồng bộ đánh giá cho tất cả phim"
            >
              <FaStar className={combinedStyles.starIcon} /> <FaSync className={syncingAllRatings ? combinedStyles.spinningIcon : ''} />
              <span>{syncingAllRatings ? 'Đang đồng bộ...' : 'Đồng bộ tất cả đánh giá'}</span>
            </button>
            
            <button 
              className={`${combinedStyles.crawlButton} ${combinedStyles.highlightedButton}`}
              onClick={() => setCrawlModalOpen(true)}
              title="Crawl phim từ nguồn bên ngoài"
            >
              <FaDownload className={combinedStyles.crawlIcon} /> 
              <span>Crawl Phim</span>
            </button>
            
            <button className={combinedStyles.addButton} onClick={handleAddMovie}>
              <FaPlus />
              <span>Thêm Phim Mới</span>
            </button>
          </div>
      </div>

      <div className={combinedStyles.tableContainer}>
        <table className={combinedStyles.table}>              
          <thead>
            <tr>
              <th>TÊN PHIM</th>
              <th>THÔNG TIN</th>
              <th className={combinedStyles.ratingColumn}>ĐÁNH GIÁ</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>            
            {loading ? (              
              <tr>                
                <td colSpan={4} className="text-center py-4">
                  <div className={combinedStyles.loadingSpinner}>
                    Đang tải...
                  </div>
                </td>
              </tr>
            ) : movies.length === 0 ? (
              <tr>                <td colSpan={4} className="text-center py-4">
                  {isSearching && searchQuery.trim() ? 
                    'Không tìm thấy phim nào khớp với tìm kiếm Elasticsearch' : 
                    'Không tìm thấy phim nào'
                  }
                </td>
              </tr>
            ): (
              movies.map((movie) => (                <tr 
                  key={movie._id} 
                  className={combinedStyles.movieRow}
                >
                  <td onClick={() => setDetailModal({ isOpen: true, movie })} className={combinedStyles.mainInfoColumn}>
                    <div className={combinedStyles.movieTitle}>{movie.name}</div>
                    <div className={combinedStyles.movieOriginalTitle}>{movie.origin_name}</div>
                  </td>                  <td onClick={() => setDetailModal({ isOpen: true, movie })} className={combinedStyles.infoColumn}>
                    <div className={combinedStyles.movieMetaInfo}>
                      <strong>Đạo diễn:</strong> {
                        movie.director ? (
                          Array.isArray(movie.director) 
                            ? movie.director.length > 2 ? `${movie.director[0]}, ${movie.director[1]}...` : movie.director.join(', ')
                            : movie.director
                        ) : (
                          <span className={combinedStyles.noInfo}>Chưa có</span>
                        )
                      }
                    </div>
                    <div className={combinedStyles.movieMetaInfo}>
                      <strong>Diễn viên:</strong> {
                        movie.actor ? (
                          Array.isArray(movie.actor) 
                            ? movie.actor.length > 2 ? `${movie.actor[0]}, ${movie.actor[1]}...` : movie.actor.join(', ')
                            : movie.actor
                        ) : (
                          <span className={combinedStyles.noInfo}>Chưa có</span>
                        )
                      }
                    </div>
                    <div className={combinedStyles.movieMetaInfo}>
                      <strong>Nội dung:</strong> {
                        movie.content ? (
                          <span className={combinedStyles.plotSummary}>
                            {movie.content.length > 70 ? `${movie.content.substring(0, 70)}...` : movie.content}
                          </span>
                        ) : (
                          <span className={combinedStyles.noInfo}>Chưa có</span>
                        )
                      }
                    </div>                  
                  </td>                  <td onClick={() => setDetailModal({ isOpen: true, movie })} className={combinedStyles.ratingColumn}>
                    <div className={combinedStyles.ratingDisplay}>
                      <div className={combinedStyles.ratingStarsBig}>
                              {renderStars(movie.rating || 0, combinedStyles)}
                            </div>                    
                      
                      <div className={combinedStyles.ratingInfo}>
                        <span className={`${styles.ratingValue} ${movie.rating <= 0 ? styles.lowRating : ''}`}>
                          {(movie.rating || 0).toFixed(1)}
                          <span className={styles.ratingScale}>/10</span>
                        </span>
                        <span className={styles.voteCount}>({movie.vote_count || 0})</span>
                      </div>
                    </div>
                  </td>
                  <td className={combinedStyles.actionColumn}>
                    <div className={combinedStyles.actions}>
                      <button 
                        className={combinedStyles.detailButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailModal({ isOpen: true, movie });
                        }}
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>                      <button 
                        className={combinedStyles.editIconButtonSmall}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(movie._id);
                        }}
                        title="Sửa phim"
                      >
                        <div className={combinedStyles.editIconContainerSmall}>
                          <FaPen className={combinedStyles.editIconPenSmall} />
                        </div>
                      </button>
                      <button
                        className={`${combinedStyles.statusButton} ${movie.isHidden ? combinedStyles.statusInactive : combinedStyles.statusActive}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(movie);
                        }}
                        title={movie.isHidden ? 'Hiển thị phim' : 'Ẩn phim'}
                      >
                        {movie.isHidden ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button 
                        className={combinedStyles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(movie);
                        }}
                        title="Xóa phim"
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

        <div className={combinedStyles.pagination}>
          <div className={combinedStyles.pageInfo}>
            <strong>Trang {currentPage}/{totalPages || 1}</strong>
            {totalMovies > 0 && (
              <span className={combinedStyles.totalInfo}> · Hiển thị {movies.length} trên {totalMovies} phim</span>
            )}
          </div>
          <div className={combinedStyles.pageButtons}>
            <button
              className={`${combinedStyles.pageButton} ${currentPage === 1 ? combinedStyles.disabled : ''}`}
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Trang đầu"
            >
              <span>«</span>
            </button>
            
            <button
              className={`${combinedStyles.pageButton} ${currentPage === 1 ? combinedStyles.disabled : ''}`}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Trang trước"
            >
              <FaChevronLeft />
            </button>
            
            {Array.from({ length: Math.min(5, Math.max(1, totalPages || 1)) }, (_, i) => {
              let pageNum;
              const validTotalPages = totalPages || 1;
              
              if (validTotalPages <= 5) {
                pageNum = i + 1;
                if (pageNum > validTotalPages) return null;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= validTotalPages - 2) {
                pageNum = validTotalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`${combinedStyles.pageButton} ${currentPage === pageNum ? combinedStyles.activeButton : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className={`${combinedStyles.pageButton} ${currentPage === totalPages ? combinedStyles.disabled : ''}`}
              onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
              disabled={currentPage === totalPages}
              title="Trang sau"
            >
              <FaChevronRight />
            </button>
            
            <button
              className={`${combinedStyles.pageButton} ${currentPage === totalPages ? combinedStyles.disabled : ''}`}
              onClick={() => setCurrentPage(totalPages || 1)}
              disabled={currentPage === totalPages}
              title="Trang cuối"
            >
              <span>»</span>
            </button>
          </div>
        </div>

        {totalMovies > 10 && (
          <div className={combinedStyles.backToTopContainer}>
            <button 
              className={combinedStyles.backToTopButton}
              onClick={scrollToTop}
              title="Về đầu trang"
            >
              <FaArrowUp className={combinedStyles.backToTopIcon} />
              <span>Về đầu trang</span>
            </button>
          </div>
        )}
      </div>

      <MovieDetailModal
        isOpen={detailModal.isOpen}
        movie={detailModal.movie}
        onClose={() => setDetailModal({ isOpen: false, movie: null })}
      />      <DeleteModal
        isOpen={deleteModal.isOpen}
        movie={deleteModal.movie}
        onClose={() => setDeleteModal({ isOpen: false, movie: null })}
        onConfirm={handleDeleteConfirm}
      />

      <CrawlModal
        isOpen={crawlModalOpen}
        onClose={() => setCrawlModalOpen(false)}
      />
    </div>
  );
};

MoviesAdmin.getLayout = (page: React.ReactElement) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default MoviesAdmin;