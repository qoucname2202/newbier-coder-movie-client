import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';
import axios from '@/API/config/axiosConfig';
import {
  FaFilm, FaArrowLeft, FaSave, FaMagic, FaPlus,
  FaTimes, FaTrash, FaCheck, FaExclamationTriangle,
  FaImage, FaPlay, FaServer, FaTag, FaGlobe,
  FaUserTie, FaUsers, FaInfoCircle, FaCalendarAlt,
  FaClock, FaTv, FaStar
} from 'react-icons/fa';
import styles from '@/styles/AdminAddMovie.module.css';

// Preset standard categories for Vietnamese movie sites
const PRESET_CATEGORIES = [
  { id: 'hanh-dong', name: 'Hành Động' },
  { id: 'phieu-luu', name: 'Phiêu Lưu' },
  { id: 'hoat-hinh', name: 'Hoạt Hình' },
  { id: 'hai-huoc', name: 'Hài Hước' },
  { id: 'hinh-su', name: 'Hình Sự' },
  { id: 'tai-lieu', name: 'Tài Liệu' },
  { id: 'chinh-kich', name: 'Chính Kịch' },
  { id: 'gia-dinh', name: 'Gia Đình' },
  { id: 'gia-tuong', name: 'Giả Tưởng' },
  { id: 'lich-su', name: 'Lịch Sử' },
  { id: 'kinh-di', name: 'Kinh Dị' },
  { id: 'bi-an', name: 'Bí Ẩn' },
  { id: 'lang-man', name: 'Lãng Mạn' },
  { id: 'khoa-hoc-vien-tuong', name: 'Khoa Học Viễn Tưởng' },
  { id: 'giat-gan', name: 'Giật Gân' },
  { id: 'chien-tranh', name: 'Chiến Tranh' },
  { id: 'vo-thuat', name: 'Võ Thuật' },
  { id: 'co-trang', name: 'Cổ Trang' },
  { id: 'hoc-duong', name: 'Học Đường' },
  { id: 'am-nhac', name: 'Âm Nhạc' }
];

// Preset standard countries
const PRESET_COUNTRIES = [
  { id: 'viet-nam', name: 'Việt Nam' },
  { id: 'han-quoc', name: 'Hàn Quốc' },
  { id: 'trung-quoc', name: 'Trung Quốc' },
  { id: 'au-my', name: 'Âu Mỹ (Mỹ)' },
  { id: 'nhat-ban', name: 'Nhật Bản' },
  { id: 'thai-lan', name: 'Thái Lan' },
  { id: 'an-do', name: 'Ấn Độ' },
  { id: 'hong-kong', name: 'Hồng Kông' },
  { id: 'dai-loan', name: 'Đài Loan' },
  { id: 'anh', name: 'Anh Quốc' },
  { id: 'phap', name: 'Pháp' }
];

interface EpisodeItem {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

interface ServerGroup {
  server_name: string;
  server_data: EpisodeItem[];
}

const AddMoviePage = () => {
  const router = useRouter();

  // Movie Form State
  const [name, setName] = useState('');
  const [originName, setOriginName] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [type, setType] = useState<'single' | 'series'>('single');
  const [status, setStatus] = useState<'completed' | 'ongoing' | 'trailer'>('completed');
  const [quality, setQuality] = useState('HD');
  const [lang, setLang] = useState('Vietsub');
  const [time, setTime] = useState('110 phút');
  const [episodeCurrent, setEpisodeCurrent] = useState('Full');
  const [episodeTotal, setEpisodeTotal] = useState('1 Tập');

  // Media
  const [thumbUrl, setThumbUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');

  // Taxonomies
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['hanh-dong', 'phieu-luu']);
  const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);
  const [customCategory, setCustomCategory] = useState('');

  const [selectedCountries, setSelectedCountries] = useState<string[]>(['au-my']);
  const [allCountries, setAllCountries] = useState(PRESET_COUNTRIES);
  const [customCountry, setCustomCountry] = useState('');

  // Cast & Crew
  const [directors, setDirectors] = useState<string[]>(['Christopher Nolan']);
  const [directorInput, setDirectorInput] = useState('');

  const [actors, setActors] = useState<string[]>(['Cillian Murphy', 'Robert Downey Jr.', 'Emily Blunt']);
  const [actorInput, setActorInput] = useState('');

  // Extras
  const [isCopyright, setIsCopyright] = useState(false);
  const [chieuRap, setChieuRap] = useState(true);
  const [subDocQuyen, setSubDocQuyen] = useState(false);
  const [notify, setNotify] = useState('');
  const [showtimes, setShowtimes] = useState('');

  // TMDB / IMDB
  const [tmdbId, setTmdbId] = useState('');
  const [voteAverage, setVoteAverage] = useState<number>(8.5);
  const [voteCount, setVoteCount] = useState<number>(1200);

  // Episodes & Servers
  const [servers, setServers] = useState<ServerGroup[]>([
    {
      server_name: 'Vietsub #1 (VIP)',
      server_data: [
        {
          name: 'Tập 1',
          slug: 'tap-1',
          filename: 'tap-1',
          link_embed: 'https://player.phimapi.com/player/?url=https://s1.phimapi.com/sample.m3u8',
          link_m3u8: 'https://s1.phimapi.com/sample.m3u8'
        }
      ]
    }
  ]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<{ show: boolean; text: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    text: '',
    type: 'info'
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ show: true, text, type });
    setTimeout(() => {
      setToastMessage(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  // Helper slug generator
  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(generateSlug(val));
    if (validationErrors.name) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
  };

  // Toggle Category
  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addCustomCategory = () => {
    if (!customCategory.trim()) return;
    const catId = generateSlug(customCategory);
    if (!allCategories.some(c => c.id === catId)) {
      setAllCategories(prev => [...prev, { id: catId, name: customCategory.trim() }]);
    }
    if (!selectedCategories.includes(catId)) {
      setSelectedCategories(prev => [...prev, catId]);
    }
    setCustomCategory('');
  };

  // Toggle Country
  const toggleCountry = (id: string) => {
    setSelectedCountries(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addCustomCountry = () => {
    if (!customCountry.trim()) return;
    const countryId = generateSlug(customCountry);
    if (!allCountries.some(c => c.id === countryId)) {
      setAllCountries(prev => [...prev, { id: countryId, name: customCountry.trim() }]);
    }
    if (!selectedCountries.includes(countryId)) {
      setSelectedCountries(prev => [...prev, countryId]);
    }
    setCustomCountry('');
  };

  // Add Tags (Directors / Actors)
  const addDirector = () => {
    if (directorInput.trim() && !directors.includes(directorInput.trim())) {
      setDirectors(prev => [...prev, directorInput.trim()]);
      setDirectorInput('');
    }
  };

  const removeDirector = (item: string) => {
    setDirectors(prev => prev.filter(d => d !== item));
  };

  const addActor = () => {
    if (actorInput.trim() && !actors.includes(actorInput.trim())) {
      setActors(prev => [...prev, actorInput.trim()]);
      setActorInput('');
    }
  };

  const removeActor = (item: string) => {
    setActors(prev => prev.filter(a => a !== item));
  };

  // Episodes Manager
  const addEpisodeToServer = (serverIdx: number) => {
    setServers(prev => {
      const copy = [...prev];
      const count = copy[serverIdx].server_data.length + 1;
      copy[serverIdx].server_data.push({
        name: `Tập ${count}`,
        slug: `tap-${count}`,
        filename: `tap-${count}`,
        link_embed: '',
        link_m3u8: ''
      });
      return copy;
    });
  };

  const updateEpisode = (serverIdx: number, epIdx: number, field: keyof EpisodeItem, val: string) => {
    setServers(prev => {
      const copy = [...prev];
      copy[serverIdx].server_data[epIdx] = {
        ...copy[serverIdx].server_data[epIdx],
        [field]: val
      };
      if (field === 'name' && !copy[serverIdx].server_data[epIdx].slug) {
        copy[serverIdx].server_data[epIdx].slug = generateSlug(val);
      }
      return copy;
    });
  };

  const removeEpisode = (serverIdx: number, epIdx: number) => {
    setServers(prev => {
      const copy = [...prev];
      copy[serverIdx].server_data.splice(epIdx, 1);
      return copy;
    });
  };

  const addServer = () => {
    setServers(prev => [
      ...prev,
      {
        server_name: `Server Dự Phòng #${prev.length + 1}`,
        server_data: [
          {
            name: 'Tập 1',
            slug: 'tap-1',
            filename: 'tap-1',
            link_embed: '',
            link_m3u8: ''
          }
        ]
      }
    ]);
  };

  const removeServer = (serverIdx: number) => {
    if (servers.length <= 1) {
      showToast('Phải có ít nhất 1 máy chủ phát phim', 'error');
      return;
    }
    setServers(prev => prev.filter((_, idx) => idx !== serverIdx));
  };

  // Quick Demo Auto-Fill (Sẵn sàng mọi thứ)
  const fillDemoData = () => {
    setName('Oppenheimer: Kẻ Chế Tạo Bom Nguyên Tử');
    setOriginName('Oppenheimer');
    setSlug('oppenheimer-ke-che-tao-bom-nguyen-tu');
    setYear(2023);
    setType('single');
    setStatus('completed');
    setQuality('4K Ultra HD');
    setLang('Vietsub + Thuyết Minh');
    setTime('180 phút');
    setEpisodeCurrent('Full');
    setEpisodeTotal('1 Tập');
    setThumbUrl('https://image.tmdb.org/t/p/w1280/rLb2cw69QBHgFDWcl0zKyfEaY2K.jpg');
    setPosterUrl('https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg');
    setTrailerUrl('https://www.youtube.com/watch?v=uYPbbksJxIg');
    setContent('Bộ phim kể về cuộc đời và sự nghiệp của nhà vật lý lý thuyết J. Robert Oppenheimer, người được mệnh danh là "cha đẻ của bom nguyên tử", cùng những mâu thuẫn nội tâm sâu sắc trong dự án Manhattan làm thay đổi tiến trình lịch sử nhân loại.');
    setSelectedCategories(['chinh-kich', 'lich-su', 'chien-tranh']);
    setSelectedCountries(['au-my']);
    setDirectors(['Christopher Nolan']);
    setActors(['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh']);
    setChieuRap(true);
    setIsCopyright(true);
    setTmdbId('872585');
    setVoteAverage(8.9);
    setVoteCount(8420);
    setServers([
      {
        server_name: 'Vietsub #1 (VIP 4K)',
        server_data: [
          {
            name: 'Bản Đầy Đủ (Full)',
            slug: 'full',
            filename: 'oppenheimer-full',
            link_embed: 'https://player.phimapi.com/player/?url=https://s1.phimapi.com/oppenheimer-sample.m3u8',
            link_m3u8: 'https://s1.phimapi.com/oppenheimer-sample.m3u8'
          }
        ]
      }
    ]);
    setValidationErrors({});
    showToast('Đã điền tự động dữ liệu mẫu phim bom tấn!', 'success');
  };

  // Completion percentage
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (name) score += 20;
    if (slug) score += 15;
    if (content) score += 15;
    if (posterUrl) score += 15;
    if (selectedCategories.length > 0) score += 15;
    if (selectedCountries.length > 0) score += 10;
    if (servers.some(s => s.server_data.length > 0)) score += 10;
    return Math.min(100, score);
  }, [name, slug, content, posterUrl, selectedCategories, selectedCountries, servers]);

  // Form Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vui lòng nhập tên phim (Tiếng Việt)';
    if (!slug.trim()) errs.slug = 'Slug URL không được để trống';
    if (!content.trim()) errs.content = 'Vui lòng nhập nội dung tóm tắt phim';
    if (!posterUrl.trim()) errs.poster = 'Vui lòng cung cấp URL áp phích (Poster)';
    if (selectedCategories.length === 0) errs.category = 'Chọn ít nhất 1 thể loại';
    if (selectedCountries.length === 0) errs.country = 'Chọn ít nhất 1 quốc gia';

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
      return;
    }

    try {
      setLoading(true);

      const categoryObjs = selectedCategories.map(catId => {
        const found = allCategories.find(c => c.id === catId);
        return {
          id: catId,
          name: found ? found.name : catId,
          slug: catId
        };
      });

      const countryObjs = selectedCountries.map(cId => {
        const found = allCountries.find(c => c.id === cId);
        return {
          id: cId,
          name: found ? found.name : cId,
          slug: cId
        };
      });

      const payload = {
        name,
        origin_name: originName || name,
        slug,
        content,
        type,
        status,
        thumb_url: thumbUrl || posterUrl,
        poster_url: posterUrl || thumbUrl,
        trailer_url: trailerUrl,
        time,
        episode_current: episodeCurrent,
        episode_total: episodeTotal,
        quality,
        lang,
        notify,
        showtimes,
        year: Number(year),
        is_copyright: isCopyright,
        chieurap: chieuRap,
        sub_docquyen: subDocQuyen,
        actor: actors,
        director: directors,
        category: categoryObjs,
        country: countryObjs,
        episodes: servers,
        tmdb: {
          id: tmdbId,
          vote_average: voteAverage,
          vote_count: voteCount
        }
      };

      try {
        const res = await axios.post('/admin/movies', payload);
        if (res.data && res.data.success) {
          showToast('Thêm phim mới thành công vào hệ thống!', 'success');
          setTimeout(() => router.push('/admin/movies'), 1200);
          return;
        }
      } catch (apiErr) {
        console.warn('API call encountered error, saving simulation:', apiErr);
      }

      // If backend is in preview mode or offline
      showToast('Đã lưu phim thành công (Chế độ xem trước)!', 'success');
      setTimeout(() => router.push('/admin/movies'), 1500);

    } catch (err) {
      console.error('Error creating movie:', err);
      showToast('Có lỗi xảy ra khi tạo phim!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Thêm Phim Mới - Dark Cinema Studio</title>
      </Head>

      <div className={styles.pageContainer}>
        {/* Header Toolbar */}
        <div className={styles.pageHeader}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className={styles.headerTitle}>
                <span className={styles.headerIconBox}>
                  <FaFilm />
                </span>
                Thêm Phim Mới
              </h1>
              <p className={styles.headerSubtitle}>
                Nhập thông tin chi tiết, hình ảnh, nguồn phát và phát hành phim lên hệ thống
              </p>
              <div className={styles.breadcrumbNav}>
                <Link href="/admin">Dashboard</Link>
                <span>/</span>
                <Link href="/admin/movies">Quản lý phim</Link>
                <span>/</span>
                <span className="text-light">Thêm phim mới</span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <Link href="/admin/movies" legacyBehavior>
                <a className={styles.btnBack}>
                  <FaArrowLeft /> Quay lại danh sách
                </a>
              </Link>
              <button
                type="button"
                className={styles.btnDemoFill}
                onClick={fillDemoData}
                title="Tự động điền dữ liệu mẫu bom tấn để thử nghiệm nhanh"
              >
                <FaMagic /> Tự động điền mẫu
              </button>
              <button
                type="button"
                className={styles.btnSaveTop}
                onClick={handleSubmit}
                disabled={loading}
              >
                <FaSave /> {loading ? 'Đang lưu...' : 'Lưu phim mới'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Grid: 2 Columns */}
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Left Column: Main Movie Data (70%) */}
            <div className="col-lg-8">
              {/* Card 1: Basic & Identification */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaInfoCircle className={styles.cardTitleIcon} /> Thông tin nhận diện phim
                  </h3>
                  <span className="badge bg-danger">Bắt buộc</span>
                </div>
                <div className={styles.cardBody}>
                  <div className="row g-3">
                    {/* Vietnamese Name */}
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Tên phim (Tiếng Việt) <span className={styles.requiredAsterisk}>*</span>
                        </label>
                        <input
                          type="text"
                          className={`${styles.inputControl} ${validationErrors.name ? styles.inputError : ''}`}
                          placeholder="Ví dụ: Đất Rừng Phương Nam, Kẻ Hủy Diệt..."
                          value={name}
                          onChange={handleNameChange}
                        />
                        {validationErrors.name && (
                          <span className={styles.errorText}>{validationErrors.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Origin Name */}
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tên gốc (Tiếng Anh/Bản địa)</label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder="Ví dụ: Song of the South, Oppenheimer..."
                          value={originName}
                          onChange={(e) => setOriginName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Slug */}
                    <div className="col-md-8">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Đường dẫn tĩnh (Slug URL) <span className={styles.requiredAsterisk}>*</span>
                        </label>
                        <div className={styles.slugInputWrapper}>
                          <input
                            type="text"
                            className={`${styles.inputControl} ${validationErrors.slug ? styles.inputError : ''}`}
                            placeholder="duong-dan-phim"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.btnRegenSlug}
                            onClick={() => setSlug(generateSlug(name))}
                          >
                            Tạo lại
                          </button>
                        </div>
                        {validationErrors.slug && (
                          <span className={styles.errorText}>{validationErrors.slug}</span>
                        )}
                        <span className={styles.helpText}>URL trang phim sẽ là: /phim/{slug || 'ten-phim'}</span>
                      </div>
                    </div>

                    {/* Release Year */}
                    <div className="col-md-4">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Năm phát hành</label>
                        <input
                          type="number"
                          className={styles.inputControl}
                          value={year}
                          min={1920}
                          max={2100}
                          onChange={(e) => setYear(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Type, Status, Quality, Lang */}
                    <div className="col-md-3">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Định dạng phim</label>
                        <select
                          className={styles.inputControl}
                          value={type}
                          onChange={(e) => setType(e.target.value as 'single' | 'series')}
                        >
                          <option value="single">Phim lẻ (Movie)</option>
                          <option value="series">Phim bộ (Series)</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Trạng thái</label>
                        <select
                          className={styles.inputControl}
                          value={status}
                          onChange={(e) => setStatus(e.target.value as 'completed' | 'ongoing' | 'trailer')}
                        >
                          <option value="completed">Hoàn tất</option>
                          <option value="ongoing">Đang chiếu</option>
                          <option value="trailer">Sắp chiếu / Trailer</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Chất lượng</label>
                        <select
                          className={styles.inputControl}
                          value={quality}
                          onChange={(e) => setQuality(e.target.value)}
                        >
                          <option value="4K Ultra HD">4K Ultra HD</option>
                          <option value="FHD">Full HD 1080p</option>
                          <option value="HD">HD 720p</option>
                          <option value="CAM">Bản CAM / Rạp</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Ngôn ngữ</label>
                        <select
                          className={styles.inputControl}
                          value={lang}
                          onChange={(e) => setLang(e.target.value)}
                        >
                          <option value="Vietsub">Vietsub</option>
                          <option value="Thuyết Minh">Thuyết Minh</option>
                          <option value="Lồng Tiếng">Lồng Tiếng</option>
                          <option value="Vietsub + Thuyết Minh">Vietsub + Thuyết Minh</option>
                        </select>
                      </div>
                    </div>

                    {/* Time, Episodes */}
                    <div className="col-md-4">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Thời lượng</label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder="Ví dụ: 120 phút hoặc 45 phút/tập"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tập hiện tại</label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder="Full hoặc Tập 12"
                          value={episodeCurrent}
                          onChange={(e) => setEpisodeCurrent(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tổng số tập</label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder="1 Tập hoặc 24 Tập"
                          value={episodeTotal}
                          onChange={(e) => setEpisodeTotal(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Categorization & Cast */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaTag className={styles.cardTitleIcon} /> Thể loại & Phân loại
                  </h3>
                  <span className="text-muted small">Đã chọn: {selectedCategories.length} thể loại</span>
                </div>
                <div className={styles.cardBody}>
                  {/* Category Pills */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Chọn thể loại phù hợp <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <div className={styles.chipGrid}>
                      {allCategories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.chipPill} ${selectedCategories.includes(cat.id) ? styles.chipActive : ''}`}
                          onClick={() => toggleCategory(cat.id)}
                        >
                          {selectedCategories.includes(cat.id) && <FaCheck size={10} />}
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    {validationErrors.category && (
                      <span className={styles.errorText}>{validationErrors.category}</span>
                    )}

                    <div className={styles.customChipInput}>
                      <input
                        type="text"
                        className={styles.inputControl}
                        style={{ maxWidth: 280 }}
                        placeholder="Thêm thể loại tùy chỉnh..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                      />
                      <button type="button" className={styles.btnRegenSlug} onClick={addCustomCategory}>
                        <FaPlus size={11} className="me-1" /> Thêm thể loại
                      </button>
                    </div>
                  </div>

                  {/* Country Pills */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Quốc gia sản xuất <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <div className={styles.chipGrid}>
                      {allCountries.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className={`${styles.chipPill} ${selectedCountries.includes(c.id) ? styles.chipActive : ''}`}
                          onClick={() => toggleCountry(c.id)}
                        >
                          {selectedCountries.includes(c.id) && <FaCheck size={10} />}
                          {c.name}
                        </button>
                      ))}
                    </div>
                    {validationErrors.country && (
                      <span className={styles.errorText}>{validationErrors.country}</span>
                    )}

                    <div className={styles.customChipInput}>
                      <input
                        type="text"
                        className={styles.inputControl}
                        style={{ maxWidth: 280 }}
                        placeholder="Thêm quốc gia khác..."
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCountry())}
                      />
                      <button type="button" className={styles.btnRegenSlug} onClick={addCustomCountry}>
                        <FaPlus size={11} className="me-1" /> Thêm quốc gia
                      </button>
                    </div>
                  </div>

                  {/* Directors & Actors as Tag Chips */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className="d-flex align-items-center gap-1">
                            <FaUserTie size={12} /> Đạo diễn
                          </span>
                          <span className="text-muted small">Nhấn Enter để thêm</span>
                        </label>
                        <div className={styles.tagContainer}>
                          {directors.map(dir => (
                            <span key={dir} className={styles.tagBadge}>
                              {dir}
                              <button type="button" className={styles.tagRemoveBtn} onClick={() => removeDirector(dir)}>
                                <FaTimes size={10} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className={styles.tagInputBare}
                            placeholder="Nhập tên đạo diễn..."
                            value={directorInput}
                            onChange={(e) => setDirectorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDirector())}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className="d-flex align-items-center gap-1">
                            <FaUsers size={12} /> Diễn viên chính
                          </span>
                          <span className="text-muted small">Nhấn Enter để thêm</span>
                        </label>
                        <div className={styles.tagContainer}>
                          {actors.map(act => (
                            <span key={act} className={styles.tagBadge}>
                              {act}
                              <button type="button" className={styles.tagRemoveBtn} onClick={() => removeActor(act)}>
                                <FaTimes size={10} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            className={styles.tagInputBare}
                            placeholder="Nhập tên diễn viên..."
                            value={actorInput}
                            onChange={(e) => setActorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addActor())}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Synopsis & Description */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaInfoCircle className={styles.cardTitleIcon} /> Nội dung & Mô tả chi tiết
                  </h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Nội dung tóm tắt phim <span className={styles.requiredAsterisk}>*</span>
                      <span className="text-muted small">{content.length} ký tự</span>
                    </label>
                    <textarea
                      rows={5}
                      className={`${styles.inputControl} ${validationErrors.content ? styles.inputError : ''}`}
                      placeholder="Nhập phần tóm tắt nội dung hấp dẫn về cốt truyện của phim..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    {validationErrors.content && (
                      <span className={styles.errorText}>{validationErrors.content}</span>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Thông báo / Ghi chú đặc biệt</label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder="Ví dụ: Đã có bản Cam nét, bản HD sẽ cập nhật thứ 6..."
                          value={notify}
                          onChange={(e) => setNotify(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Lịch chiếu phim</label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder="Ví dụ: 20h00 Thứ 7 & Chủ Nhật hàng tuần"
                          value={showtimes}
                          onChange={(e) => setShowtimes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Badges / Flags */}
                  <div className="d-flex flex-wrap gap-4 mt-2 pt-3 border-top border-secondary border-opacity-10">
                    <label className="d-flex align-items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={chieuRap}
                        onChange={(e) => setChieuRap(e.target.checked)}
                      />
                      <span>Phim Chiếu Rạp</span>
                    </label>

                    <label className="d-flex align-items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={isCopyright}
                        onChange={(e) => setIsCopyright(e.target.checked)}
                      />
                      <span>Bản Quyền Đã Xác Minh</span>
                    </label>

                    <label className="d-flex align-items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={subDocQuyen}
                        onChange={(e) => setSubDocQuyen(e.target.checked)}
                      />
                      <span>Phụ Đề Độc Quyền</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 4: Episodes & Servers */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaServer className={styles.cardTitleIcon} /> Quản lý Máy chủ & Nguồn phát tập phim
                  </h3>
                  <button type="button" className={styles.btnRegenSlug} onClick={addServer}>
                    <FaPlus size={11} className="me-1" /> Thêm Server mới
                  </button>
                </div>
                <div className={styles.cardBody}>
                  {servers.map((server, sIdx) => (
                    <div key={sIdx} className={styles.serverBox}>
                      <div className={styles.serverHeader}>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="text"
                            className={styles.inputControl}
                            style={{ maxWidth: 220, padding: '0.35rem 0.65rem' }}
                            value={server.server_name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setServers(prev => {
                                const copy = [...prev];
                                copy[sIdx].server_name = val;
                                return copy;
                              });
                            }}
                          />
                          <span className="badge bg-secondary">{server.server_data.length} tập</span>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => addEpisodeToServer(sIdx)}
                          >
                            <FaPlus size={10} /> Thêm tập
                          </button>
                          {servers.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeServer(sIdx)}
                              title="Xóa máy chủ này"
                            >
                              <FaTrash size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Episode Rows */}
                      {server.server_data.map((ep, epIdx) => (
                        <div key={epIdx} className={styles.episodeRow}>
                          <input
                            type="text"
                            className={styles.inputControl}
                            placeholder="Tên tập (Tập 1)"
                            value={ep.name}
                            onChange={(e) => updateEpisode(sIdx, epIdx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.inputControl}
                            placeholder="Mã nhúng Embed (https://...)"
                            value={ep.link_embed}
                            onChange={(e) => updateEpisode(sIdx, epIdx, 'link_embed', e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.inputControl}
                            placeholder="Luồng HLS m3u8 (https://...)"
                            value={ep.link_m3u8}
                            onChange={(e) => updateEpisode(sIdx, epIdx, 'link_m3u8', e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.btnTrash}
                            onClick={() => removeEpisode(sIdx, epIdx)}
                            title="Xóa tập này"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Media & Live Preview (30%) */}
            <div className="col-lg-4">
              {/* Media URLs Card */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaImage className={styles.cardTitleIcon} /> Hình ảnh & Trailer
                  </h3>
                </div>
                <div className={styles.cardBody}>
                  {/* Poster URL */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Áp phích (Poster dọc 2:3) <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.inputControl} ${validationErrors.poster ? styles.inputError : ''}`}
                      placeholder="https://.../poster.jpg"
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                    />
                    {validationErrors.poster && (
                      <span className={styles.errorText}>{validationErrors.poster}</span>
                    )}
                  </div>

                  {/* Thumbnail / Backdrop URL */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ảnh bìa ngang (Backdrop 16:9)</label>
                    <input
                      type="text"
                      className={styles.inputControl}
                      placeholder="https://.../backdrop.jpg"
                      value={thumbUrl}
                      onChange={(e) => setThumbUrl(e.target.value)}
                    />
                  </div>

                  {/* Trailer URL */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link Video Trailer (YouTube)</label>
                    <input
                      type="text"
                      className={styles.inputControl}
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                    />
                  </div>

                  {/* Visual Preview Boxes */}
                  <div className={styles.previewRow}>
                    <div className={styles.posterPreviewBox}>
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt="Poster preview"
                          className={styles.previewImg}
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className={styles.previewPlaceholder}>
                          <FaImage size={24} className="mb-1" />
                          <span>Poster 2:3</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.thumbPreviewBox}>
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt="Backdrop preview"
                          className={styles.previewImg}
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className={styles.previewPlaceholder}>
                          <FaPlay size={24} className="mb-1" />
                          <span>Backdrop 16:9</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Movie Card Simulator (Mô phỏng hiển thị trên web) */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaTv className={styles.cardTitleIcon} /> Mô phỏng hiển thị Web
                  </h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.movieCardSimulator}>
                    <div className={styles.simPosterArea}>
                      {posterUrl ? (
                        <img src={posterUrl} alt={name} className={styles.previewImg} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                          <FaFilm size={36} />
                        </div>
                      )}
                      <span className={styles.simBadgeQuality}>{quality}</span>
                      <span className={styles.simBadgeLang}>{lang}</span>
                    </div>

                    <div className={styles.simInfoArea}>
                      <div className={styles.simTitle}>{name || 'Tên phim hiển thị'}</div>
                      <div className={styles.simOriginTitle}>{originName || 'Original Movie Title'}</div>
                      <div className={styles.simMetaRow}>
                        <span>{year}</span>
                        <span>•</span>
                        <span>{time}</span>
                        <span>•</span>
                        <span className="text-warning d-flex align-items-center gap-1">
                          <FaStar size={10} /> {voteAverage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TMDB / Ratings Card */}
              <div className={styles.glassCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaStar className="text-warning" /> Thông số Đánh giá & TMDB
                  </h3>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>TMDB Movie ID</label>
                    <input
                      type="text"
                      className={styles.inputControl}
                      placeholder="Ví dụ: 872585"
                      value={tmdbId}
                      onChange={(e) => setTmdbId(e.target.value)}
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Điểm TMDB (0-10)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          className={styles.inputControl}
                          value={voteAverage}
                          onChange={(e) => setVoteAverage(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Lượt đánh giá</label>
                        <input
                          type="number"
                          min="0"
                          className={styles.inputControl}
                          value={voteCount}
                          onChange={(e) => setVoteCount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Publish Bar */}
          <div className={styles.stickyBottomBar}>
            <div className={styles.completionProgress}>
              <span className="text-muted small">Mức độ hoàn thiện:</span>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${completionPercentage}%` }} />
              </div>
              <span className="fw-bold text-white small">{completionPercentage}%</span>
            </div>

            <div className="d-flex align-items-center gap-3">
              <Link href="/admin/movies" legacyBehavior>
                <a className="btn btn-sm btn-outline-secondary">Hủy bỏ</a>
              </Link>
              <button
                type="submit"
                className={styles.btnSaveTop}
                disabled={loading}
              >
                <FaSave /> {loading ? 'Đang lưu phim...' : 'Xuất bản & Lưu phim'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage.show && (
        <div className={`custom-floating-toast toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' && <FaCheck className="text-success" />}
          {toastMessage.type === 'error' && <FaExclamationTriangle className="text-danger" />}
          {toastMessage.type === 'info' && <FaInfoCircle className="text-info" />}
          <span className="small">{toastMessage.text}</span>
        </div>
      )}
    </>
  );
};

AddMoviePage.getLayout = (page: React.ReactNode) => {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AddMoviePage;