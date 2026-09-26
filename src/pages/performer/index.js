import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaSearch, FaUserCircle, FaStar } from 'react-icons/fa';
import Skeleton from '@/components/UI/Skeleton';

export default function PerformerListPage() {
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '5739ebb7d66fa1dd775f806325ab4067';
  const baseUrl = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
  const imageBase = process.env.NEXT_PUBLIC_TMDB_IMAGE_URL || 'https://image.tmdb.org/t/p/w500';

  useEffect(() => {
    let isSubscribed = true;

    const fetchPerformers = async () => {
      setLoading(true);
      try {
        const endpoint = searchTerm.trim()
          ? `${baseUrl}/search/person?api_key=${apiKey}&query=${encodeURIComponent(searchTerm.trim())}&language=vi-VN`
          : `${baseUrl}/person/popular?api_key=${apiKey}&language=vi-VN&page=1`;

        const res = await fetch(endpoint).then((r) => r.json()).catch(() => null);
        if (isSubscribed && res?.results) {
          setPerformers(res.results);
        }
      } catch {
        if (isSubscribed) setPerformers([]);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    const timer = setTimeout(fetchPerformers, searchTerm ? 400 : 0);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [searchTerm, apiKey, baseUrl]);

  return (
    <>
      <Head>
        <title>Diễn Viên Điện Ảnh | MovieStreaming</title>
        <meta name="description" content="Danh sách diễn viên điện ảnh nổi tiếng, thông tin tiểu sử, sự nghiệp và các bộ phim tham gia." />
      </Head>

      <div className="container-fluid px-3 px-lg-5 py-4" style={{ minHeight: '80vh', paddingTop: '90px' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="h3 text-white fw-bold text-uppercase m-0">Diễn Viên Nổi Bật</h1>
            <p className="text-secondary small m-0 mt-1">Khám phá các ngôi sao điện ảnh và tác phẩm nổi tiếng</p>
          </div>

          <div className="search-bar-wrapper">
            <FaSearch className="text-secondary me-2" />
            <input
              type="text"
              placeholder="Tìm kiếm diễn viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="row g-3 g-lg-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div className="card bg-dark border-0 rounded-3 overflow-hidden text-center p-3">
                  <div className="mx-auto rounded-circle overflow-hidden mb-2" style={{ width: '90px', height: '90px' }}>
                    <Skeleton width="100%" height="100%" />
                  </div>
                  <Skeleton height="16px" width="70%" className="mx-auto" />
                  <Skeleton height="12px" width="50%" className="mx-auto mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : performers.length > 0 ? (
          <div className="row g-3 g-lg-4">
            {performers.map((person) => {
              const photo = person.profile_path ? `${imageBase}${person.profile_path}` : '/img/user-avatar.png';
              const knownFor = person.known_for?.map((k) => k.title || k.name).filter(Boolean).slice(0, 2).join(', ');

              return (
                <div key={person.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                  <Link href={`/performer/${person.id}`} className="text-decoration-none">
                    <div className="card bg-dark border-0 rounded-3 overflow-hidden text-center p-3 performer-card h-100">
                      <div className="avatar-wrapper mx-auto mb-2">
                        <img
                          src={photo}
                          alt={person.name}
                          className="rounded-circle avatar-img"
                          onError={(e) => { e.target.src = '/img/user-avatar.png'; }}
                        />
                      </div>
                      <h6 className="text-white text-truncate m-0 fw-semibold" style={{ fontSize: '0.9rem' }} title={person.name}>
                        {person.name}
                      </h6>
                      <p className="text-secondary small text-truncate m-0 mt-1" style={{ fontSize: '0.75rem' }}>
                        {knownFor || (person.known_for_department === 'Acting' ? 'Diễn viên' : person.known_for_department || 'Điện ảnh')}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 text-secondary">
            <FaUserCircle className="fs-1 mb-3 text-secondary text-opacity-50" />
            <p>Không tìm thấy diễn viên phù hợp.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .search-bar-wrapper {
          display: flex;
          align-items: center;
          background: rgba(22, 27, 34, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 6px 16px;
          width: 100%;
          max-width: 280px;
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 0.88rem;
          width: 100%;
        }
        .avatar-wrapper {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(229, 9, 20, 0.35);
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .performer-card {
          background: #161b22 !important;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .performer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.3);
        }
        .performer-card:hover .avatar-wrapper {
          transform: scale(1.06);
          border-color: #e50914;
        }
      `}</style>
    </>
  );
}
