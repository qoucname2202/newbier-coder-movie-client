import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import styles from '@/styles/Performer.module.css';

const PerformerDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [performer, setPerformer] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(8);
  const [activeFilter, setActiveFilter] = useState('all');
  const [debug, setDebug] = useState({});  // For debugging API responses

  const imageBaseUrl = process.env.NEXT_PUBLIC_TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p/w500';
  const placeholderImage = '/img/default-poster.jpg';
  const profilePlaceholder = '/img/user-avatar.png';

  useEffect(() => {
    // Only fetch data when id is available (after hydration)
    if (!id) return;    const fetchPerformerDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const authToken = process.env.NEXT_PUBLIC_TMDB_AUTH_TOKEN;
        
        // Lưu debug info
        const debugInfo = { 
          id,
          baseUrl,
          hasApiKey: !!apiKey,
          hasAuthToken: !!authToken
        };
        
        // Get performer details
        const personResponse = await axios.get(`${baseUrl}/person/${id}`, {
          params: {
            api_key: apiKey,
            language: 'vi-VN,en-US',  // Thử lấy tiếng Việt trước, nếu không có thì lấy tiếng Anh
            append_to_response: 'images,external_ids'  // Lấy thêm thông tin hình ảnh và ID khác
          },
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'accept': 'application/json'
          }
        });
        
        setPerformer(personResponse.data);
        debugInfo.performerData = personResponse.data;
        
        // Get performer's movie credits
        const creditsResponse = await axios.get(`${baseUrl}/person/${id}/combined_credits`, {
          params: {
            api_key: apiKey,
            language: 'vi-VN,en-US'  // Thử tiếng Việt trước, nếu không có thì lấy tiếng Anh
          },
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'accept': 'application/json'
          }
        });
        
        debugInfo.rawCredits = creditsResponse.data;
        
        // Lọc và sắp xếp các bộ phim theo độ phổ biến
        let allMovies = [];
        
      // Lọc phim từ phần cast (diễn viên)
        let castCredits = [];
        if (creditsResponse.data.cast && Array.isArray(creditsResponse.data.cast)) {
          // Lấy tất cả các dự án (phim và TV) mà diễn viên tham gia
          castCredits = creditsResponse.data.cast
            // Bao gồm cả phim không có poster để hiển thị với ảnh mặc định
            .filter(item => (item.media_type === 'movie' || item.media_type === 'tv'))
            .map(item => ({
              ...item,
              credit_type: 'cast',
              display_media_type: item.media_type === 'movie' ? 'Phim' : 'TV',
              title: item.media_type === 'movie' ? item.title : item.name,
              release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date
            }))
            .sort((a, b) => b.popularity - a.popularity || b.vote_count - a.vote_count);
        }
        
        // Lấy phim từ phần crew (đoàn làm phim)
        let crewCredits = [];
        if (creditsResponse.data.crew && Array.isArray(creditsResponse.data.crew)) {
          crewCredits = creditsResponse.data.crew
            .filter(item => (item.media_type === 'movie' || item.media_type === 'tv'))
            .map(item => ({
              ...item,
              credit_type: 'crew',
              display_media_type: item.media_type === 'movie' ? 'Phim' : 'TV',
              title: item.media_type === 'movie' ? item.title : item.name,
              release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date
            }))
            .sort((a, b) => b.popularity - a.popularity || b.vote_count - a.vote_count);
        }
        
        // Kết hợp cả hai danh sách, ưu tiên phim có vai diễn
        allMovies = [...castCredits, ...crewCredits];
        
        // Loại bỏ các dự án trùng lặp (người đó có thể vừa đóng vai vừa làm đạo diễn)
        const uniqueIds = new Set();
        allMovies = allMovies.filter(movie => {
          const key = `${movie.id}-${movie.media_type}`;
          if (!uniqueIds.has(key)) {
            uniqueIds.add(key);
            return true;
          }
          return false;
        });
        
        // Thêm field `role` để phân biệt vai trò trong phim
        allMovies = allMovies.map(movie => ({
          ...movie,
          role: movie.character ? movie.character : (movie.job ? movie.job : 'Không xác định')
        }));
        
        setMovies(allMovies);
        debugInfo.processedMovies = allMovies;
        setDebug(debugInfo);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching performer data:', err);
        setError('Không thể tải thông tin diễn viên. Vui lòng thử lại sau.');
        setDebug({ error: err.message, stack: err.stack });
        setLoading(false);
      }
    };

    fetchPerformerDetails();
  }, [id]);

  // Format date to display in Vietnamese format
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không có thông tin';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    
    const birthDate = new Date(birthday);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner animation="border" variant="danger" />
        <p>Đang tải thông tin diễn viên...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-4">
          <button 
            className="btn btn-primary me-3"
            onClick={() => router.back()}
          >
            Quay lại
          </button>
          <button 
            className="btn btn-outline-light"
            onClick={() => router.reload()}
          >
            Thử lại
          </button>
        </div>
      </Container>
    );
  }
  if (!performer) {
    return null; // Wait for data to load before rendering
  }
  
  // Handle pagination
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  
  // Filter movies based on the active filter
  const filteredMovies = movies.filter(movie => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'movies') return movie.media_type === 'movie';
    if (activeFilter === 'tv') return movie.media_type === 'tv';
    if (activeFilter === 'cast') return movie.credit_type === 'cast';
    if (activeFilter === 'crew') return movie.credit_type === 'crew';
    return true;
  });
  
  const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
  
  // Create an array of page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      <Head>
        <title>{performer.name} - Thông tin diễn viên | MovieStreaming</title>
        <meta name="description" content={`Thông tin chi tiết về diễn viên ${performer.name} và các bộ phim đã tham gia`} />
      </Head>      <div 
        className={styles.performerBanner}
        style={{
          backgroundImage: `url(${performer.profile_path ? `${imageBaseUrl}/original${performer.profile_path}` : profilePlaceholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        <div className={styles.backdropOverlay}></div>        
        <Container className={styles.containerRelative}>
          <div className={styles.performerHeader}>
            <div className={styles.profileImageWrapper}>
              <div className={styles.profileImageContainer}>
                <img 
                  src={performer.profile_path ? `${imageBaseUrl}${performer.profile_path}` : profilePlaceholder}
                  alt={performer.name}
                  className={styles.profileImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = profilePlaceholder;
                  }}
                />
                {performer.known_for_department && (
                  <div className={styles.departmentBadge}>
                    {performer.known_for_department === 'Acting' ? 'Diễn viên' : performer.known_for_department}
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.performerDetails}>
              <h1 className={styles.performerName}>{performer.name}</h1>
              
              {performer.also_known_as?.length > 0 && (
                <div className={styles.alsoKnownAs}>
                  <span className={styles.infoLabel}>Tên khác:</span>
                  <span className={styles.infoValue}>{performer.also_known_as.join(', ')}</span>
                </div>
              )}
              
              <div className={styles.bioStats}>
                {performer.birthday && (
                  <div className={styles.bioStat}>
                    <i className="bi bi-calendar"></i>
                    <span className={styles.infoLabel}>Ngày sinh:</span>
                    <span className={styles.infoValue}>
                      {formatDate(performer.birthday)}
                      {calculateAge(performer.birthday) && ` (${calculateAge(performer.birthday)} tuổi)`}
                    </span>
                  </div>
                )}
                
                {performer.place_of_birth && (
                  <div className={styles.bioStat}>
                    <i className="bi bi-geo-alt"></i>
                    <span className={styles.infoLabel}>Nơi sinh:</span>
                    <span className={styles.infoValue}>{performer.place_of_birth}</span>
                  </div>
                )}
                
                {performer.known_for_department && (
                  <div className={styles.bioStat}>
                    <i className="bi bi-film"></i>
                    <span className={styles.infoLabel}>Nổi tiếng với vai trò:</span>
                    <span className={styles.infoValue}>
                      {performer.known_for_department === 'Acting' ? 'Diễn viên' : performer.known_for_department}
                    </span>
                  </div>
                )}
                
                <div className={styles.bioStat}>
                  <i className="bi bi-camera-reels"></i>
                  <span className={styles.infoLabel}>Số phim đã tham gia:</span>
                  <span className={styles.infoValue}>{movies.length}</span>
                </div>
                
                {performer.popularity && (
                  <div className={styles.bioStat}>
                    <i className="bi bi-graph-up"></i>
                    <span className={styles.infoLabel}>Độ nổi tiếng:</span>
                    <span className={styles.infoValue}>
                      {parseFloat(performer.popularity).toFixed(1)}
                    </span>
                  </div>
                )}
                <div className={styles.biography}>
                <h3 className={styles.sectionTitle}>
                  <i className="bi bi-file-person me-2"></i>
                  Tiểu sử
                </h3>
                <div className={styles.biographyText}>
                  {performer.biography ? (
                      <div className={styles.biographyContent}>
                        {performer.biography.split('\n').map((paragraph, idx) => (
                          <p key={idx}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.noBiography}>
                        <i className="bi bi-exclamation-circle me-2"></i>
                        <p className="text-muted">Chưa có thông tin tiểu sử về diễn viên này.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div><div className={styles.sectionBackground}>
        <Container className={styles.movieListContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.filmographyTitle}>
              <i className="bi bi-film me-2"></i>
              Phim đã tham gia
            </h2>
            {movies.length > 0 && (
              <div className={styles.movieCounter}>
                <Badge bg="danger" className={styles.countBadge}>
                  {movies.length} phim
                </Badge>
              </div>
            )}
          </div>
          
          {/* Filter buttons */}
          {movies.length > 0 && (
            <div className={styles.filterControls}>            <div className={styles.filterButtons}>
                <button 
                  onClick={() => {setActiveFilter('all'); setCurrentPage(1);}} 
                  className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
                >
                  <i className="bi bi-grid me-2"></i>
                  Tất cả ({movies.length})
                </button>
                <button 
                  onClick={() => {setActiveFilter('movies'); setCurrentPage(1);}} 
                  className={`${styles.filterBtn} ${activeFilter === 'movies' ? styles.active : ''}`}
                >
                  <i className="bi bi-film me-2"></i>
                  Phim ({movies.filter(m => m.media_type === 'movie').length})
                </button>
                <button 
                  onClick={() => {setActiveFilter('tv'); setCurrentPage(1);}} 
                  className={`${styles.filterBtn} ${activeFilter === 'tv' ? styles.active : ''}`}
                >
                  <i className="bi bi-tv me-2"></i>
                  TV ({movies.filter(m => m.media_type === 'tv').length})
                </button>
                <button 
                  onClick={() => {setActiveFilter('cast'); setCurrentPage(1);}}
                  className={`${styles.filterBtn} ${activeFilter === 'cast' ? styles.active : ''}`}
                >
                  <i className="bi bi-person-badge me-2"></i>
                  Diễn viên ({movies.filter(m => m.credit_type === 'cast').length})
                </button>
                <button 
                  onClick={() => {setActiveFilter('crew'); setCurrentPage(1);}} 
                  className={`${styles.filterBtn} ${activeFilter === 'crew' ? styles.active : ''}`}
                >
                  <i className="bi bi-camera-reels me-2"></i>
                  Đoàn phim ({movies.filter(m => m.credit_type === 'crew').length})
                </button>
              </div>
            </div>
          )}
          
          {filteredMovies.length > 0 ? (
            <>
              <Row className={styles.movieGrid}>                  {currentMovies.map(movie => {                  // Tạo slug từ title hoặc name của phim
                  const createSlug = (text) => {
                    if (!text) return `movie-${movie.id}`;
                    
                    // Hàm chuyển đổi tiếng Việt sang không dấu
                    const removeVietnameseTones = (str) => {
                      str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
                      str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
                      str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
                      str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
                      str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
                      str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
                      str = str.replace(/đ/g, "d");
                      str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
                      str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
                      str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
                      str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
                      str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
                      str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
                      str = str.replace(/Đ/g, "D");
                      return str;
                    }
                    
                    // Chuyển đổi tên phim thành slug
                    return removeVietnameseTones(text)
                      .toLowerCase()
                      .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
                      .replace(/\s+/g, '-')     // Thay thế khoảng trắng bằng dấu gạch ngang
                      .replace(/--+/g, '-')     // Thay thế nhiều dấu gạch ngang bằng một dấu
                      .trim();                  // Xóa khoảng trắng đầu/cuối
                  };
                  
                  const movieTitle = movie.title || movie.name || `Movie-${movie.id}`;                  const movieSlug = createSlug(movieTitle);
                  
                  return (
                    <Col key={`${movie.id}-${movie.credit_id || Math.random()}`} xs={6} sm={6} md={4} lg={3} xl={3} className={styles.movieCol}>
                      <Link href={`/movie/${movieSlug}`} className={styles.movieLink}>
                        <Card className={styles.movieCard}>
                          <div className={styles.posterContainer}>
                            <Card.Img 
                              variant="top" 
                              src={movie.poster_path ? `${imageBaseUrl}${movie.poster_path}` : placeholderImage}
                              alt={movieTitle}
                              className={styles.posterImage}
                              onError={(e) => { 
                                e.target.onerror = null;
                                e.target.src = placeholderImage;
                              }}
                            />
                            <div className={styles.movieOverlay}>
                              <div className={styles.characterBadge}>
                                {movie.role || 'Không xác định'}
                              </div>
                              <div className={styles.playButton}>
                                <i className="bi bi-play-circle-fill"></i>
                              </div>
                            </div>
                            
                            <div className={styles.ratingBadge}>
                              <i className="bi bi-star-fill me-1"></i>
                              {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                            </div>
                            
                            <Badge 
                              className={`${styles.mediaTypeBadge} ${movie.media_type === 'tv' ? styles.tvBadge : ''}`}
                            >
                              {movie.display_media_type}
                            </Badge>
                            {movie.release_date && (
                              <div className={styles.yearBadge}>
                                {new Date(movie.release_date).getFullYear()}
                              </div>
                            )}
                          </div>
                          <Card.Body className={styles.cardBody}>
                            <Card.Title className={styles.movieTitle}>{movieTitle}</Card.Title>
                            <div className={styles.movieMeta}>
                              {movie.credit_type === 'cast' ? (
                                <span className={styles.characterName} title={`Vai: ${movie.role}`}>
                                  <i className="bi bi-person-fill me-1"></i>
                                  {movie.role.length > 15 ? movie.role.substring(0, 15) + '...' : movie.role}
                                </span>
                              ) : (
                                <span className={styles.jobTitle} title={movie.role}>
                                  <i className="bi bi-gear-fill me-1"></i>
                                  {movie.role.length > 15 ? movie.role.substring(0, 15) + '...' : movie.role}
                                </span>
                              )}                            </div>
                          </Card.Body>
                        </Card>
                      </Link>
                    </Col>
                  );
                })}
              </Row>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1} 
                    className={styles.paginationButton}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  
                  {currentPage > 3 && (
                    <>
                      <button onClick={() => paginate(1)} className={styles.paginationButton}>1</button>
                      {currentPage > 4 && <span className={styles.paginationEllipsis}>...</span>}
                    </>
                  )}
                  
                  {pageNumbers
                    .filter(number => Math.abs(number - currentPage) <= 2)
                    .map(number => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`${styles.paginationButton} ${currentPage === number ? styles.activePage : ''}`}
                      >
                        {number}
                      </button>
                    ))
                  }
                  
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className={styles.paginationEllipsis}>...</span>}
                      <button onClick={() => paginate(totalPages)} className={styles.paginationButton}>{totalPages}</button>
                    </>
                  )}
                  
                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages} 
                    className={styles.paginationButton}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noMoviesFound}>
              <div className={styles.noMoviesIcon}>
                <i className="bi bi-film"></i>
                <i className="bi bi-slash-circle overlay-icon"></i>
              </div>
              <h5>Không tìm thấy phim</h5>
              <p>Không có {activeFilter !== 'all' ? `${activeFilter === 'movies' ? 'phim điện ảnh' : 
                (activeFilter === 'tv' ? 'phim truyền hình' : 
                  (activeFilter === 'cast' ? 'vai diễn' : 'công việc đoàn phim'))} của` : ''} diễn viên này trong cơ sở dữ liệu.</p>
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default PerformerDetail;
