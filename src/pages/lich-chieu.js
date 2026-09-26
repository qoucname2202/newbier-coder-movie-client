import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaCalendarAlt, FaPlay, FaClock, FaCheckCircle } from 'react-icons/fa';
import movieService from '@/API/services/movieService';
import { LOCAL_DEFAULT_POSTER } from '@/config/movieFallbackConfig';
import Skeleton from '@/components/UI/Skeleton';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2', short: 'T2' },
  { id: 2, label: 'Thứ 3', short: 'T3' },
  { id: 3, label: 'Thứ 4', short: 'T4' },
  { id: 4, label: 'Thứ 5', short: 'T5' },
  { id: 5, label: 'Thứ 6', short: 'T6' },
  { id: 6, label: 'Thứ 7', short: 'T7' },
  { id: 0, label: 'Chủ Nhật', short: 'CN' }
];

export default function ReleaseSchedulePage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const fetchScheduleMovies = async () => {
      setLoading(true);
      try {
        const list = await movieService.getMoviesPage(1, 24);
        if (isSubscribed) {
          // Distribute movies stably across days
          const filtered = list.filter((_, idx) => idx % 7 === selectedDay);
          setMovies(filtered.length > 0 ? filtered : list.slice(0, 6));
        }
      } catch {
        if (isSubscribed) setMovies([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchScheduleMovies();
    return () => {
      isSubscribed = false;
    };
  }, [selectedDay]);

  return (
    <>
      <Head>
        <title>Lịch Chiếu Phim | MovieStreaming</title>
        <meta name="description" content="Lịch chiếu phim mới cập nhật theo ngày trong tuần, theo dõi lịch phát sóng các bộ phim bộ và phim hoạt hình hot nhất." />
      </Head>

      <div className="container-fluid px-3 px-lg-5 py-4" style={{ minHeight: '80vh', paddingTop: '90px' }}>
        <div className="text-center max-w-xl mx-auto mb-4">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger small fw-semibold mb-2">
            <FaCalendarAlt /> LỊCH PHÁT SÓNG
          </div>
          <h1 className="h3 text-white fw-bold text-uppercase m-0">Lịch Chiếu Phim Trong Tuần</h1>
          <p className="text-secondary small mt-1">Cập nhật tập mới nhất theo khung giờ mỗi ngày</p>
        </div>

        {/* Days of Week Tab Bar */}
        <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 mb-4">
          {DAYS_OF_WEEK.map((day) => {
            const isToday = new Date().getDay() === day.id;
            const isActive = selectedDay === day.id;

            return (
              <button
                key={day.id}
                type="button"
                className={`btn btn-day-tab ${isActive ? 'btn-day-active' : ''}`}
                onClick={() => setSelectedDay(day.id)}
              >
                <span>{day.label}</span>
                {isToday && <span className="today-badge">Hôm nay</span>}
              </button>
            );
          })}
        </div>

        {/* Schedule Grid */}
        {loading ? (
          <div className="row g-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-12 col-md-6 col-lg-4">
                <div className="card bg-dark border-0 p-3 rounded-3 d-flex flex-row gap-3">
                  <Skeleton width="90px" height="120px" borderRadius="6px" />
                  <div className="flex-grow-1">
                    <Skeleton height="18px" width="80%" />
                    <Skeleton height="14px" width="40%" className="mt-2" />
                    <Skeleton height="14px" width="60%" className="mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <div className="row g-3">
            {movies.map((movie, idx) => (
              <div key={movie._id || idx} className="col-12 col-md-6 col-lg-4">
                <Link href={`/movie/${movie.slug}`} className="text-decoration-none">
                  <div className="card bg-dark border-0 p-2 p-sm-3 rounded-3 schedule-card h-100 d-flex flex-row gap-3">
                    <div className="schedule-poster-wrap">
                      <img
                        src={movie.poster_url || movie.thumb_url || LOCAL_DEFAULT_POSTER}
                        alt={movie.name}
                        className="schedule-poster"
                        onError={(e) => { e.target.src = LOCAL_DEFAULT_POSTER; }}
                      />
                      <span className="badge bg-danger schedule-ep-badge">
                        Tập {idx + 1}
                      </span>
                    </div>

                    <div className="d-flex flex-column justify-content-between flex-grow-1 overflow-hidden text-white py-1">
                      <div>
                        <h6 className="text-truncate fw-semibold m-0" title={movie.name} style={{ fontSize: '0.95rem' }}>
                          {movie.name}
                        </h6>
                        <p className="text-secondary text-truncate small m-0 mt-1">
                          {movie.origin_name || movie.name}
                        </p>
                      </div>

                      <div className="d-flex align-items-center justify-content-between text-secondary small mt-2">
                        <span className="d-flex align-items-center gap-1">
                          <FaClock style={{ fontSize: '0.75rem' }} /> 20:00 hàng tuần
                        </span>
                        <span className="text-danger fw-semibold d-flex align-items-center gap-1">
                          <FaPlay style={{ fontSize: '0.7rem' }} /> Xem ngay
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 text-secondary">
            <p>Không có phim nào lên sóng vào ngày này.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .btn-day-tab {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 18px;
          border-radius: 12px;
          background: rgba(22, 27, 34, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .btn-day-tab:hover {
          color: #ffffff;
          border-color: rgba(229, 9, 20, 0.4);
          background: rgba(229, 9, 20, 0.1);
        }
        .btn-day-active {
          background: #e50914 !important;
          color: #ffffff !important;
          border-color: #e50914 !important;
          box-shadow: 0 4px 16px rgba(229, 9, 20, 0.4);
        }
        .today-badge {
          font-size: 0.65rem;
          opacity: 0.85;
          margin-top: 2px;
        }
        .schedule-card {
          background: #161b22 !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .schedule-card:hover {
          transform: translateY(-3px);
          border-color: rgba(229, 9, 20, 0.4) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }
        .schedule-poster-wrap {
          width: 80px;
          min-width: 80px;
          height: 110px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }
        .schedule-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .schedule-ep-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          font-size: 0.65rem;
          padding: 2px 6px;
        }
      `}</style>
    </>
  );
}
