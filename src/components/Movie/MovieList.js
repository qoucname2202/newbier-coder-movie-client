import React, { useEffect, useState } from "react";
import Link from "next/link";
import MovieCategory from "./MovieCategory";


const MovieList = () => {
  const [categories, setCategories] = useState([
    {
      id: 'new',
      title: "Phim mới cập nhật",
      endpoint: 'danh-sach/phim-moi-cap-nhat',
      movies: []
    },

  ]);
  
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMovieDetail = async (slug) => {
    const response = await fetch(`http://localhost:5000/api/movies/${movie.slug}`);
    const data = await response.json();
    return data.movie;
  };

  const fetchMoviesForCategory = async (endpoint, categoryId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${movie.slug}`);
      const data = await response.json();
      
      if (data.items) {
        const moviePromises = data.items.map(async (movie) => {
          const movieDetail = await fetchMovieDetail(movie.slug);
          return movieDetail;
        });

        let movies = await Promise.all(moviePromises);
        movies = movies.filter(movie => movie !== null);

        // Lọc theo category
        if (categoryId === 'series') {
          movies = movies.filter(movie => 
            movie.type === 'series' || 
            movie.episode_current !== 'Full' ||
            movie.category?.some(cat => 
              cat.name.toLowerCase().includes('phim bộ'))
          );
        } else if (categoryId === 'single') {
          movies = movies.filter(movie => 
            movie.type === 'single' || 
            movie.episode_current === 'Full' ||
            movie.category?.some(cat => 
              cat.name.toLowerCase().includes('phim lẻ'))
          );
        }

        return movies;
      }
      return [];
    } catch (error) {
      console.error(`Lỗi khi fetch ${endpoint}:`, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        const updatedCategories = [...categories];
        
        for (let i = 0; i < categories.length; i++) {
          const movies = await fetchMoviesForCategory(
            categories[i].endpoint,
            categories[i].id
          );
          
          updatedCategories[i] = {
            ...categories[i],
            movies: movies
          };
        }
        
        setCategories(updatedCategories);
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu phim:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMovies();
  }, []);

  const loadMoreMovies = async (categoryId) => {
    try {
      setLoading(true);
      const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
      if (categoryIndex === -1) return;

      const category = categories[categoryIndex];
      const nextPage = Math.ceil(category.movies.length / 20) + 1;

      const newMovies = await fetchMoviesForCategory(
        `${category.endpoint}?page=${nextPage}`,
        category.id
      );

      if (newMovies.length > 0) {
        const updatedCategories = [...categories];
        updatedCategories[categoryIndex] = {
          ...category,
          movies: [...category.movies, ...newMovies]
        };
        setCategories(updatedCategories);
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm phim:", error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container-fluid">
      {categories.map((category) => (
        <MovieCategory
          key={category.id}
          title={category.title}
          endpoint={category.endpoint}
        />
      ))}

      {showModal && selectedMovie && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  {selectedMovie.name}
                  <small className="text-muted ms-2">({selectedMovie.year})</small>
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="position-relative">
                      <img
                        src={selectedMovie.thumb_url || selectedMovie.poster_url}
                        alt={selectedMovie.name}
                        className="img-fluid rounded w-100"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = "";
                        }}
                      />
                      <div className="position-absolute bottom-0 start-0 end-0 p-2 text-center" 
                        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            className="btn btn-danger"
                            onClick={() => setShowTrailer(true)} // Show trailer
                          >
                            <i className="fas fa-play me-2"></i>
                            Xem trailer
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => setShowPlayer(true)} // Play the movie
                          >
                            <i className="fas fa-play me-2"></i>
                            Xem phim
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                  </div>
                </div>

                {/* Show Trailer */}
                {showTrailer && selectedMovie.trailer_url && (
                  <div className="mt-4">
                    <div className="ratio ratio-16x9">
                      <iframe
                        src={`https://www.youtube.com/embed/${selectedMovie.trailer_url}`}
                        allowFullScreen
                        className="rounded"
                      ></iframe>
                    </div>
                  </div>
                )}

                {/* Player section */}
                {showPlayer && selectedMovie.episodes && selectedMovie.episodes[0] && (
                  <div className="mt-4">
                    <div className="ratio ratio-16x9">
                      <iframe
                        src={selectedMovie.episodes[0].server_data[0].link_embed}
                        allowFullScreen
                        className="rounded"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Đóng
                </button>
                <Link 
                  href={`/movie/${selectedMovie.slug}`}
                  className="btn btn-danger"
                >
                  Chi tiết phim
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Loại bỏ tất cả margin và padding mặc định */
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #0d1117; /* hoặc màu nền tối khác bạn muốn sử dụng */
        }
        
        /* Tùy chỉnh thanh cuộn cho WebKit browsers (Chrome, Safari, Edge mới) */
        ::-webkit-scrollbar {
          width: 5px; /* Chiều rộng thanh cuộn mỏng hơn */
          height: 5px; /* Dành cho thanh cuộn ngang */
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1); /* Nền thanh cuộn tối */
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(70, 70, 90, 0.5); /* Màu xám xanh phù hợp */
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(90, 90, 115, 0.7); /* Màu đậm hơn khi di chuột */
        }

        /* Cho Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(70, 70, 90, 0.5) rgba(0, 0, 0, 0.1);
        }
        
        /* Loại bỏ padding mặc định của container-fluid */
        .container-fluid {
          padding-left: 0;
          padding-right: 0;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        /* Điều chỉnh các phần tử con để sử dụng toàn bộ chiều rộng */
        .row {
          margin-left: 0;
          margin-right: 0;
        }

        /* Reset padding cho phần tử con của row */
        .row > * {
          padding-right: calc(var(--bs-gutter-x) * 0.3);
          padding-left: calc(var(--bs-gutter-x) * 0.3);
        }
        
        /* Các phần CSS đã có trước */
        .col-xl-1-7 {
          flex: 0 0 calc(100% / 7);
          max-width: calc(100% / 7);
        }
        
        @media (max-width: 1200px) {
          .col-xl-1-7 {
            flex: 0 0 20%;
            max-width: 20%;
          }
        }
        
        @media (max-width: 992px) {
          .col-xl-1-7 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
        
        @media (max-width: 768px) {
          .col-xl-1-7 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
        }
        
        @media (max-width: 576px) {
          .col-xl-1-7 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }
        
        .movie-poster {
          position: relative;
          overflow: hidden;
          border-radius: 3px; /* Reduced from 8px to 3px */
        }
        
        .movie-poster img {
          transition: transform 0.3s ease;
        }
        
        .movie-poster:hover img {
          transform: scale(1.05);
        }
        
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .movie-poster:hover .overlay {
          opacity: 1;
        }
        
        .watch-button {
          transform: translateY(20px);
          transition: transform 0.3s ease;
        }
        
        .movie-poster:hover .watch-button {
          transform: translateY(0);
        }

        /* Added: Spacing adjustments */
        .card {
          border: none !important;
          margin-bottom: 0.25rem;
          border-radius: 3px;
        }

        .card-body {
          padding: 0.5rem 0.5rem;
        }

        /* Added: Tighter spacing between movie items */
        .row.g-1 > * {
          padding-right: calc(var(--bs-gutter-x) * 0.3);
          padding-left: calc(var(--bs-gutter-x) * 0.3);
        }

        /* Added: Make badges smaller */
        .badge {
          padding: 0.25em 0.5em;
          font-size: 0.75em;
        }

        /* Updating modal styling */
        .modal-content {
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        img.rounded, iframe.rounded {
          border-radius: 3px !important;
        }
      `}</style>
    </div>
  );
};

export default MovieList;
