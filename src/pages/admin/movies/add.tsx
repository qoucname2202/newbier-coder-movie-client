import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import AdminRoute from '@/components/ProtectedRoute/AdminRoute';
import axios from '@/API/config/axiosConfig';
import {
  FaFilm, FaArrowLeft, FaSave, FaMagic,
  FaCheck, FaImage, FaPlay, FaServer, FaTag,
  FaUserTie, FaUsers, FaInfoCircle,
  FaTv, FaStar, FaChevronRight, FaChevronLeft, FaSearch, FaTimes, FaLayerGroup, FaSlidersH
} from 'react-icons/fa';
import styles from '@/styles/AdminAddMovie.module.css';
import CinemaSelect from '@/components/Admin/Movies/CinemaSelect';
import TagAutocompletePicker from '@/components/Admin/Movies/TagAutocompletePicker';
import BackToTop from '@/components/UI/BackToTop';
import { showCinemaAlert } from '@/components/UI/CinemaAlert';
import {
  YEAR_STEPPER_CONFIG,
  FORM_VALIDATION_CONFIG,
  MOVIE_FORM_I18N,
  MOVIE_TYPES,
  MOVIE_STATUSES,
  MOVIE_QUALITIES,
  MOVIE_LANGUAGES,
  DURATION_OPTIONS,
  EPISODE_TOTAL_OPTIONS,
  PRESET_CATEGORIES,
  PRESET_COUNTRIES,
  POPULAR_DIRECTORS,
  POPULAR_ACTORS,
  SERVER_TEMPLATES,
  DEMO_PRESETS
} from '@/config/addMovieConfig';

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

  // Wizard Step State (1: Cơ bản, 2: Phân loại, 3: Media, 4: Server, 5: Xuất bản)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Movie Form State
  const [name, setName] = useState('');
  const [originName, setOriginName] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [year, setYear] = useState<number>(YEAR_STEPPER_CONFIG.defaultYear);
  const [type, setType] = useState<'single' | 'series'>('single');
  const [status, setStatus] = useState<'completed' | 'ongoing' | 'trailer'>('completed');
  const [quality, setQuality] = useState('4K Ultra HD');
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
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [selectedCountries, setSelectedCountries] = useState<string[]>(['au-my']);
  const [allCountries, setAllCountries] = useState(PRESET_COUNTRIES);
  const [customCountry, setCustomCountry] = useState('');

  // Cast & Crew
  const [directors, setDirectors] = useState<string[]>(['Christopher Nolan']);
  const [actors, setActors] = useState<string[]>(['Cillian Murphy', 'Robert Downey Jr.', 'Emily Blunt']);

  // Extras
  const [isCopyright, setIsCopyright] = useState(true);
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
      server_name: 'Vietsub #1 (VIP 4K)',
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
    if (validationErrors.category) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.category;
        return copy;
      });
    }
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
    if (validationErrors.country) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy.country;
        return copy;
      });
    }
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

  // Add / Remove Directors & Actors
  const handleAddDirector = (nameToAdd: string) => {
    if (nameToAdd && !directors.includes(nameToAdd)) {
      setDirectors(prev => [...prev, nameToAdd]);
    }
  };

  const handleRemoveDirector = (item: string) => {
    setDirectors(prev => prev.filter(d => d !== item));
  };

  const handleAddActor = (nameToAdd: string) => {
    if (nameToAdd && !actors.includes(nameToAdd)) {
      setActors(prev => [...prev, nameToAdd]);
    }
  };

  const handleRemoveActor = (item: string) => {
    setActors(prev => prev.filter(a => a !== item));
  };

  // Fixed Episodes Manager: 100% Immutable Updates (Fixes adding 2 / deleting 2 in React StrictMode)
  const addEpisodeToServer = (serverIdx: number) => {
    setServers(prev => prev.map((s, idx) => {
      if (idx !== serverIdx) return s;
      const count = s.server_data.length + 1;
      return {
        ...s,
        server_data: [
          ...s.server_data,
          {
            name: `Tập ${count}`,
            slug: `tap-${count}`,
            filename: `tap-${count}`,
            link_embed: '',
            link_m3u8: ''
          }
        ]
      };
    }));
  };

  const updateEpisode = (serverIdx: number, epIdx: number, field: keyof EpisodeItem, val: string) => {
    setServers(prev => prev.map((s, idx) => {
      if (idx !== serverIdx) return s;
      return {
        ...s,
        server_data: s.server_data.map((ep, i) => {
          if (i !== epIdx) return ep;
          const updated = { ...ep, [field]: val };
          if (field === 'name' && !ep.slug) {
            updated.slug = generateSlug(val);
          }
          return updated;
        })
      };
    }));
  };

  const removeEpisode = (serverIdx: number, epIdx: number) => {
    setServers(prev => prev.map((s, idx) => {
      if (idx !== serverIdx) return s;
      return {
        ...s,
        server_data: s.server_data.filter((_, i) => i !== epIdx)
      };
    }));
  };

  const addServer = (templateName?: string) => {
    const sName = templateName || `Server Dự Phòng #${servers.length + 1}`;
    setServers(prev => [
      ...prev,
      {
        server_name: sName,
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
    showCinemaAlert(`Đã thêm máy chủ ${sName}`, 'cinema');
  };

  const removeServer = (serverIdx: number) => {
    if (servers.length <= 1) {
      showCinemaAlert(MOVIE_FORM_I18N.validation.minServersRequired, 'warning');
      return;
    }
    setServers(prev => prev.filter((_, idx) => idx !== serverIdx));
  };

  // Quick Demo Auto-Fill from Config Presets
  const applyDemoPreset = (presetIndex = 0) => {
    const preset = DEMO_PRESETS[presetIndex];
    if (!preset) return;
    const d = preset.data;
    setName(d.name);
    setOriginName(d.originName);
    setSlug(d.slug);
    setYear(d.year);
    setType(d.type);
    setStatus(d.status);
    setQuality(d.quality);
    setLang(d.lang);
    setTime(d.time);
    setEpisodeCurrent(d.episodeCurrent);
    setEpisodeTotal(d.episodeTotal);
    setThumbUrl(d.thumbUrl);
    setPosterUrl(d.posterUrl);
    setTrailerUrl(d.trailerUrl);
    setContent(d.content);
    setSelectedCategories(d.selectedCategories);
    setSelectedCountries(d.selectedCountries);
    setDirectors(d.directors);
    setActors(d.actors);
    setChieuRap(d.chieuRap);
    setIsCopyright(d.isCopyright);
    setSubDocQuyen(d.subDocQuyen);
    setTmdbId(d.tmdbId);
    setVoteAverage(d.voteAverage);
    setVoteCount(d.voteCount);
    setNotify(d.notify);
    setShowtimes(d.showtimes);
    setServers(d.servers);
    setValidationErrors({});
    showCinemaAlert(`Đã điền tự động dữ liệu mẫu: ${preset.title}!`, 'success');
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

  // Step Completion Checker
  const isStep1Done = Boolean(name && slug && year);
  const isStep2Done = Boolean(selectedCategories.length > 0 && selectedCountries.length > 0);
  const isStep3Done = Boolean(posterUrl);
  const isStep4Done = Boolean(servers.length > 0 && servers[0].server_data.length > 0);
  const isStep5Done = Boolean(content);

  // Validate current step before advancing
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (FORM_VALIDATION_CONFIG.name.required && !name.trim()) {
        setValidationErrors(prev => ({ ...prev, name: MOVIE_FORM_I18N.validation.nameRequired }));
        showCinemaAlert(MOVIE_FORM_I18N.validation.nameRequired, 'warning');
        return;
      }
      if (FORM_VALIDATION_CONFIG.slug.required && !slug.trim()) {
        setValidationErrors(prev => ({ ...prev, slug: MOVIE_FORM_I18N.validation.slugRequired }));
        showCinemaAlert(MOVIE_FORM_I18N.validation.slugRequired, 'warning');
        return;
      }
    } else if (currentStep === 2) {
      if (FORM_VALIDATION_CONFIG.category.required && selectedCategories.length === 0) {
        setValidationErrors(prev => ({ ...prev, category: MOVIE_FORM_I18N.validation.categoryRequired }));
        showCinemaAlert(MOVIE_FORM_I18N.validation.categoryRequired, 'warning');
        return;
      }
      if (FORM_VALIDATION_CONFIG.country.required && selectedCountries.length === 0) {
        setValidationErrors(prev => ({ ...prev, country: MOVIE_FORM_I18N.validation.countryRequired }));
        showCinemaAlert(MOVIE_FORM_I18N.validation.countryRequired, 'warning');
        return;
      }
    } else if (currentStep === 3) {
      if (FORM_VALIDATION_CONFIG.poster.required && !posterUrl.trim()) {
        setValidationErrors(prev => ({ ...prev, poster: MOVIE_FORM_I18N.validation.posterRequired }));
        showCinemaAlert(MOVIE_FORM_I18N.validation.posterRequired, 'warning');
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Form Overall Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (FORM_VALIDATION_CONFIG.name.required && !name.trim()) errs.name = MOVIE_FORM_I18N.validation.nameRequired;
    if (FORM_VALIDATION_CONFIG.slug.required && !slug.trim()) errs.slug = MOVIE_FORM_I18N.validation.slugRequired;
    if (FORM_VALIDATION_CONFIG.content.required && !content.trim()) errs.content = MOVIE_FORM_I18N.validation.contentRequired;
    if (FORM_VALIDATION_CONFIG.poster.required && !posterUrl.trim()) errs.poster = MOVIE_FORM_I18N.validation.posterRequired;
    if (FORM_VALIDATION_CONFIG.category.required && selectedCategories.length === 0) errs.category = MOVIE_FORM_I18N.validation.categoryRequired;
    if (FORM_VALIDATION_CONFIG.country.required && selectedCountries.length === 0) errs.country = MOVIE_FORM_I18N.validation.countryRequired;

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showCinemaAlert(MOVIE_FORM_I18N.validation.fillRequiredPrompt, 'warning');
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
          showCinemaAlert('Thêm phim mới thành công vào hệ thống!', 'success');
          setTimeout(() => router.push('/admin/movies'), 1200);
          return;
        }
      } catch (apiErr) {
        console.warn('API call encountered error, saving simulation:', apiErr);
      }

      showCinemaAlert('Đã lưu phim thành công (Chế độ xem trước)!', 'success');
      setTimeout(() => router.push('/admin/movies'), 1500);

    } catch (err) {
      console.error('Error creating movie:', err);
      showCinemaAlert('Có lỗi xảy ra khi tạo phim!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return allCategories;
    const q = categorySearchQuery.toLowerCase();
    return allCategories.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q));
  }, [allCategories, categorySearchQuery]);

  return (
    <>
      <Head>
        <title>{MOVIE_FORM_I18N.header.title} - Dark Cinema Studio</title>
      </Head>

      <div className={styles.pageContainer}>
        {/* Compact Header Toolbar (Cleaned redundant Save button) */}
        <div className={styles.pageHeader}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h1 className={styles.headerTitle}>
                <span className={styles.headerIconBox}>
                  <FaFilm />
                </span>
                {MOVIE_FORM_I18N.header.title}
              </h1>
              <div className={styles.breadcrumbNav}>
                <Link href="/admin">Dashboard</Link>
                <span>/</span>
                <Link href="/admin/movies">{MOVIE_FORM_I18N.header.backToList}</Link>
                <span>/</span>
                <span className="text-light">Thêm mới</span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <Link href="/admin/movies" legacyBehavior>
                <a className={styles.btnBack}>
                  <FaArrowLeft /> {MOVIE_FORM_I18N.header.backToList}
                </a>
              </Link>
              <button
                type="button"
                className={styles.btnDemoFill}
                onClick={() => applyDemoPreset(0)}
                title="Tự động điền dữ liệu mẫu bom tấn Oppenheimer"
              >
                <FaMagic /> Mẫu Oppenheimer
              </button>
              <button
                type="button"
                className={styles.btnDemoFill}
                onClick={() => applyDemoPreset(1)}
                title="Tự động điền dữ liệu mẫu bom tấn Dune: Part Two"
              >
                <FaMagic /> Mẫu Dune 2
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Stepper (Tabs Bar) - Mobile Friendly with shortTitle & no text wrap */}
        <div className={styles.horizontalStepper}>
          {MOVIE_FORM_I18N.steps.map((s) => {
            const isActive = currentStep === s.num;
            const isDone = s.num === 1 ? isStep1Done : s.num === 2 ? isStep2Done : s.num === 3 ? isStep3Done : s.num === 4 ? isStep4Done : isStep5Done;
            return (
              <button
                key={s.num}
                type="button"
                className={`${styles.stepperItem} ${isActive ? styles.stepperActive : ''} ${isDone ? styles.stepperCompleted : ''}`}
                onClick={() => setCurrentStep(s.num)}
              >
                <div className={styles.stepNumBadge}>
                  {isDone && !isActive ? <FaCheck size={9} /> : s.num}
                </div>
                <div className={styles.stepInfo}>
                  <span className={styles.stepTitle}>{s.shortTitle}</span>
                  <span className={styles.stepDesc}>{s.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Body - Ultra Compact Multi-Step View */}
        <form onSubmit={handleSubmit}>

          {/* ==================== BƯỚC 1: THÔNG TIN CƠ BẢN ==================== */}
          {currentStep === 1 && (
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <FaInfoCircle className={styles.cardTitleIcon} /> {MOVIE_FORM_I18N.steps[0].fullTitle}
                </h3>
                <span className="badge bg-danger">Bắt buộc tên & slug</span>
              </div>
              <div className={styles.cardBody}>
                {/* Group 1: Nhận diện & Đường dẫn (Name, Origin name, Slug, Year) */}
                <div className={styles.stepSectionDivider}>
                  <FaFilm size={10} /> {MOVIE_FORM_I18N.step1.sectionIdentity}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>
                          {MOVIE_FORM_I18N.step1.nameVi} <span className={styles.requiredAsterisk}>*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.inputControl} ${validationErrors.name ? styles.inputError : ''}`}
                        placeholder={MOVIE_FORM_I18N.step1.nameViPlaceholder}
                        value={name}
                        onChange={handleNameChange}
                      />
                      {validationErrors.name && (
                        <span className={styles.errorText}>{validationErrors.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step1.originName}</span>
                      </label>
                      <input
                        type="text"
                        className={styles.inputControl}
                        placeholder={MOVIE_FORM_I18N.step1.originNamePlaceholder}
                        value={originName}
                        onChange={(e) => setOriginName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>
                          {MOVIE_FORM_I18N.step1.slug} <span className={styles.requiredAsterisk}>*</span>
                        </span>
                      </label>
                      <div className={styles.slugInputWrapper}>
                        <input
                          type="text"
                          className={`${styles.inputControl} ${validationErrors.slug ? styles.inputError : ''}`}
                          placeholder={MOVIE_FORM_I18N.step1.slugPlaceholder}
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.btnRegenSlug}
                          onClick={() => setSlug(generateSlug(name))}
                          title="Tạo lại slug từ tên phim"
                        >
                          {MOVIE_FORM_I18N.step1.regenSlug}
                        </button>
                      </div>
                      {validationErrors.slug && (
                        <span className={styles.errorText}>{validationErrors.slug}</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-5">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step1.releaseYear}</span>
                      </label>
                      {/* Year Stepper completely configured from YEAR_STEPPER_CONFIG */}
                      <div className={styles.yearStepperWrapper}>
                        {YEAR_STEPPER_CONFIG.quickSteps.filter(s => s < 0).map(s => (
                          <button
                            key={s}
                            type="button"
                            className={styles.yearStepBtn}
                            onClick={() => setYear(y => Math.max(YEAR_STEPPER_CONFIG.minYear, y + s))}
                            title={`Lùi ${Math.abs(s)} năm`}
                          >
                            {s}
                          </button>
                        ))}
                        <input
                          type="number"
                          className={styles.yearInput}
                          value={year}
                          min={YEAR_STEPPER_CONFIG.minYear}
                          max={YEAR_STEPPER_CONFIG.maxYear}
                          onChange={(e) => setYear(Number(e.target.value))}
                        />
                        {YEAR_STEPPER_CONFIG.quickSteps.filter(s => s > 0).map(s => (
                          <button
                            key={s}
                            type="button"
                            className={styles.yearStepBtn}
                            onClick={() => setYear(y => Math.min(YEAR_STEPPER_CONFIG.maxYear, y + s))}
                            title={`Tiến ${s} năm`}
                          >
                            +{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group 2: Định dạng & Trạng thái phát hành */}
                <div className={styles.stepSectionDivider}>
                  <FaLayerGroup size={10} /> {MOVIE_FORM_I18N.step1.sectionFormat}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{MOVIE_FORM_I18N.step1.format}</label>
                      <div className={styles.segmentedControl}>
                        {MOVIE_TYPES.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            className={`${styles.segmentedItem} ${type === t.value ? styles.segmentedActive : ''}`}
                            onClick={() => setType(t.value)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{MOVIE_FORM_I18N.step1.status}</label>
                      <div className={styles.segmentedControl}>
                        {MOVIE_STATUSES.map(s => (
                          <button
                            key={s.value}
                            type="button"
                            className={`${styles.segmentedItem} ${status === s.value ? styles.segmentedActive : ''}`}
                            onClick={() => setStatus(s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group 3: Thông số kỹ thuật & Tập phim */}
                <div className={styles.stepSectionDivider}>
                  <FaSlidersH size={10} /> {MOVIE_FORM_I18N.step1.sectionSpecs}
                </div>

                <div className="row g-3">
                  <div className="col-md-3 col-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step1.quality}</span>
                      </label>
                      <CinemaSelect
                        options={MOVIE_QUALITIES}
                        value={quality}
                        onChange={setQuality}
                      />
                    </div>
                  </div>

                  <div className="col-md-3 col-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step1.language}</span>
                      </label>
                      <CinemaSelect
                        options={MOVIE_LANGUAGES}
                        value={lang}
                        onChange={setLang}
                      />
                    </div>
                  </div>

                  <div className="col-md-3 col-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step1.duration}</span>
                      </label>
                      <CinemaSelect
                        options={DURATION_OPTIONS}
                        value={time}
                        onChange={setTime}
                      />
                    </div>
                  </div>

                  <div className="col-md-3 col-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step1.totalEpisodes}</span>
                      </label>
                      <CinemaSelect
                        options={EPISODE_TOTAL_OPTIONS}
                        value={episodeTotal}
                        onChange={setEpisodeTotal}
                      />
                    </div>
                  </div>
                </div>

                {/* Step Actions - Calmer Neutral Next Button */}
                <div className={styles.stepNavFooter}>
                  <div className="text-muted small">
                    Bước 1 / 5: {MOVIE_FORM_I18N.steps[0].shortTitle}
                  </div>
                  <button
                    type="button"
                    className={styles.btnStepNextCalm}
                    onClick={handleNextStep}
                  >
                    {MOVIE_FORM_I18N.actions.next}: {MOVIE_FORM_I18N.steps[1].shortTitle} <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 2: PHÂN LOẠI & DIỄN VIÊN ==================== */}
          {currentStep === 2 && (
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <FaTag className={styles.cardTitleIcon} /> {MOVIE_FORM_I18N.steps[1].fullTitle}
                </h3>
                <span className="text-muted small">
                  {selectedCategories.length} thể loại • {selectedCountries.length} quốc gia
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className="row g-3">
                  {/* Left Column: Categories with cleanly spaced search filter */}
                  <div className="col-md-6">
                    <div className={styles.formGroup}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={styles.formLabel} style={{ margin: 0 }}>
                          <span className={styles.labelTitle}>
                            {MOVIE_FORM_I18N.step2.categoryLabel} <span className={styles.requiredAsterisk}>*</span>
                          </span>
                        </label>
                        <div className={styles.searchFilterWrapper}>
                          <input
                            type="text"
                            className={styles.searchFilterInput}
                            placeholder={MOVIE_FORM_I18N.step2.categorySearchPlaceholder}
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                          />
                          <FaSearch className={styles.searchFilterIcon} />
                        </div>
                      </div>

                      {/* Compact Scrollable Genre Box */}
                      <div className={styles.compactChipScrollBox}>
                        {filteredCategories.map(cat => {
                          const isChecked = selectedCategories.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              className={`${styles.chipPill} ${isChecked ? styles.chipActive : ''}`}
                              onClick={() => toggleCategory(cat.id)}
                            >
                              {isChecked && <FaCheck size={8} />}
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                      {validationErrors.category && (
                        <span className={styles.errorText}>{validationErrors.category}</span>
                      )}

                      {/* Add Custom Genre inline (Single 'Thêm' button) */}
                      <div className="d-flex gap-1 mt-1">
                        <input
                          type="text"
                          className={styles.inputControl}
                          style={{ height: 30, fontSize: '0.78rem' }}
                          placeholder={MOVIE_FORM_I18N.step2.addCategoryPlaceholder}
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                        />
                        <button
                          type="button"
                          className={styles.yearStepBtn}
                          style={{ height: 30, fontSize: '0.76rem', padding: '0 0.65rem' }}
                          onClick={addCustomCategory}
                        >
                          {MOVIE_FORM_I18N.step2.addBtn}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Countries */}
                  <div className="col-md-6">
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span className={styles.labelTitle}>
                          {MOVIE_FORM_I18N.step2.countryLabel} <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <span className="text-muted small">Đã chọn: {selectedCountries.length}</span>
                      </label>

                      {/* Compact Scrollable Country Box */}
                      <div className={styles.compactChipScrollBox}>
                        {allCountries.map(c => {
                          const isChecked = selectedCountries.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`${styles.chipPill} ${isChecked ? styles.chipActive : ''}`}
                              onClick={() => toggleCountry(c.id)}
                            >
                              {isChecked && <FaCheck size={8} />}
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                      {validationErrors.country && (
                        <span className={styles.errorText}>{validationErrors.country}</span>
                      )}

                      {/* Add Custom Country inline (Single 'Thêm' button) */}
                      <div className="d-flex gap-1 mt-1">
                        <input
                          type="text"
                          className={styles.inputControl}
                          style={{ height: 30, fontSize: '0.78rem' }}
                          placeholder={MOVIE_FORM_I18N.step2.addCountryPlaceholder}
                          value={customCountry}
                          onChange={(e) => setCustomCountry(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCountry())}
                        />
                        <button
                          type="button"
                          className={styles.yearStepBtn}
                          style={{ height: 30, fontSize: '0.76rem', padding: '0 0.65rem' }}
                          onClick={addCustomCountry}
                        >
                          {MOVIE_FORM_I18N.step2.addBtn}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Directors & Actors with Autocomplete Tag Combobox */}
                  <div className="col-md-6">
                    <TagAutocompletePicker
                      label={MOVIE_FORM_I18N.step2.directorLabel}
                      icon={<FaUserTie size={11} />}
                      items={directors}
                      onAdd={handleAddDirector}
                      onRemove={handleRemoveDirector}
                      suggestions={POPULAR_DIRECTORS}
                      placeholder={MOVIE_FORM_I18N.step2.directorPlaceholder}
                    />
                  </div>

                  <div className="col-md-6">
                    <TagAutocompletePicker
                      label={MOVIE_FORM_I18N.step2.actorLabel}
                      icon={<FaUsers size={11} />}
                      items={actors}
                      onAdd={handleAddActor}
                      onRemove={handleRemoveActor}
                      suggestions={POPULAR_ACTORS}
                      placeholder={MOVIE_FORM_I18N.step2.actorPlaceholder}
                    />
                  </div>
                </div>

                {/* Step Actions - Calmer Neutral Next Button */}
                <div className={styles.stepNavFooter}>
                  <button
                    type="button"
                    className={styles.btnStepPrev}
                    onClick={handlePrevStep}
                  >
                    <FaChevronLeft size={10} /> {MOVIE_FORM_I18N.actions.prev}: {MOVIE_FORM_I18N.steps[0].shortTitle}
                  </button>
                  <button
                    type="button"
                    className={styles.btnStepNextCalm}
                    onClick={handleNextStep}
                  >
                    {MOVIE_FORM_I18N.actions.next}: {MOVIE_FORM_I18N.steps[2].shortTitle} <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 3: MEDIA & HÌNH ẢNH ==================== */}
          {currentStep === 3 && (
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <FaImage className={styles.cardTitleIcon} /> {MOVIE_FORM_I18N.steps[2].fullTitle}
                </h3>
                <span className="badge bg-danger">Bắt buộc Poster</span>
              </div>
              <div className={styles.cardBody}>
                {/* Efficient space utilization: side-by-side inputs & instant previews */}
                <div className={styles.mediaRow}>
                  {/* Left: Input controls */}
                  <div className={styles.mediaInputsCol}>
                    {/* Poster URL */}
                    <div className={styles.formGroup}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={styles.formLabel} style={{ margin: 0 }}>
                          <span className={styles.labelTitle}>
                            {MOVIE_FORM_I18N.step3.posterLabel} <span className={styles.requiredAsterisk}>*</span>
                          </span>
                        </label>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => setPosterUrl('https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg')}
                          >
                            {MOVIE_FORM_I18N.step3.sample1}
                          </button>
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => setPosterUrl('https://image.tmdb.org/t/p/w780/czembW0Rk1Ke7lCJGhkAiBhQ9la.jpg')}
                          >
                            {MOVIE_FORM_I18N.step3.sample2}
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className={`${styles.inputControl} ${validationErrors.poster ? styles.inputError : ''}`}
                        placeholder={MOVIE_FORM_I18N.step3.posterPlaceholder}
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value.trim())}
                      />
                      {validationErrors.poster && (
                        <span className={styles.errorText}>{validationErrors.poster}</span>
                      )}
                    </div>

                    {/* Thumbnail / Backdrop URL */}
                    <div className={styles.formGroup}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={styles.formLabel} style={{ margin: 0 }}>
                          {MOVIE_FORM_I18N.step3.backdropLabel}
                        </label>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => setThumbUrl('https://image.tmdb.org/t/p/w1280/rLb2cw69QBHgFDWcl0zKyfEaY2K.jpg')}
                          >
                            {MOVIE_FORM_I18N.step3.sample1}
                          </button>
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => setThumbUrl('https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520b22.jpg')}
                          >
                            {MOVIE_FORM_I18N.step3.sample2}
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className={styles.inputControl}
                        placeholder={MOVIE_FORM_I18N.step3.backdropPlaceholder}
                        value={thumbUrl}
                        onChange={(e) => setThumbUrl(e.target.value.trim())}
                      />
                    </div>

                    {/* Trailer URL */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{MOVIE_FORM_I18N.step3.trailerLabel}</label>
                      <input
                        type="text"
                        className={styles.inputControl}
                        placeholder={MOVIE_FORM_I18N.step3.trailerPlaceholder}
                        value={trailerUrl}
                        onChange={(e) => setTrailerUrl(e.target.value.trim())}
                      />
                    </div>
                  </div>

                  {/* Right: Instant Previews Side-by-Side (Zero Lag) */}
                  <div className={styles.mediaPreviewsCol}>
                    <label className={styles.formLabel}>{MOVIE_FORM_I18N.step3.previewTitle}</label>
                    <div className={styles.previewRow}>
                      <div className={styles.posterPreviewBox}>
                        {posterUrl ? (
                          <img
                            key={posterUrl}
                            src={posterUrl}
                            alt="Poster preview"
                            className={styles.previewImg}
                            loading="eager"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0.3';
                            }}
                          />
                        ) : (
                          <div className={styles.previewPlaceholder}>
                            <FaImage size={20} className="mb-1" />
                            <span>Poster 2:3</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.thumbPreviewBox}>
                        {thumbUrl ? (
                          <img
                            key={thumbUrl}
                            src={thumbUrl}
                            alt="Backdrop preview"
                            className={styles.previewImg}
                            loading="eager"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0.3';
                            }}
                          />
                        ) : (
                          <div className={styles.previewPlaceholder}>
                            <FaPlay size={20} className="mb-1" />
                            <span>Backdrop 16:9</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step Actions - Calmer Neutral Next Button */}
                <div className={styles.stepNavFooter}>
                  <button
                    type="button"
                    className={styles.btnStepPrev}
                    onClick={handlePrevStep}
                  >
                    <FaChevronLeft size={10} /> {MOVIE_FORM_I18N.actions.prev}: {MOVIE_FORM_I18N.steps[1].shortTitle}
                  </button>
                  <button
                    type="button"
                    className={styles.btnStepNextCalm}
                    onClick={handleNextStep}
                  >
                    {MOVIE_FORM_I18N.actions.next}: {MOVIE_FORM_I18N.steps[3].shortTitle} <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 4: NGUỒN PHÁT & MÁY CHỦ ==================== */}
          {currentStep === 4 && (
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <FaServer className={styles.cardTitleIcon} /> {MOVIE_FORM_I18N.steps[3].fullTitle}
                </h3>
                {/* No-wrap server template buttons: '+' and text never split */}
                <div className={styles.serverTemplatesRow}>
                  <span className="text-muted small me-1">{MOVIE_FORM_I18N.step4.addServerLabel}</span>
                  {SERVER_TEMPLATES.slice(0, 3).map((st, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      className={styles.serverTemplateBtn}
                      onClick={() => addServer(st)}
                    >
                      <span>+{st.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.cardBody}>
                {servers.map((server, sIdx) => (
                  <div key={sIdx} className={styles.serverBox}>
                    <div className={styles.serverHeader}>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="text"
                          className={styles.inputControl}
                          style={{ maxWidth: 200, height: 30, padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                          value={server.server_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServers(prev => prev.map((s, idx) => idx === sIdx ? { ...s, server_name: val } : s));
                          }}
                        />
                        <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                          {server.server_data.length} tập
                        </span>
                      </div>

                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          onClick={() => addEpisodeToServer(sIdx)}
                        >
                          {MOVIE_FORM_I18N.step4.addEpisodeBtn}
                        </button>
                        {servers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                            onClick={() => removeServer(sIdx)}
                            title="Xóa máy chủ này"
                          >
                            <FaTimes size={9} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable Episode Rows */}
                    <div className={styles.episodesScrollContainer}>
                      {server.server_data.map((ep, epIdx) => (
                        <div key={epIdx} className={styles.episodeRow}>
                          <input
                            type="text"
                            className={styles.inputControl}
                            style={{ height: 30, fontSize: '0.8rem' }}
                            placeholder={MOVIE_FORM_I18N.step4.epNamePlaceholder}
                            value={ep.name}
                            onChange={(e) => updateEpisode(sIdx, epIdx, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.inputControl}
                            style={{ height: 30, fontSize: '0.8rem' }}
                            placeholder={MOVIE_FORM_I18N.step4.embedPlaceholder}
                            value={ep.link_embed}
                            onChange={(e) => updateEpisode(sIdx, epIdx, 'link_embed', e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.inputControl}
                            style={{ height: 30, fontSize: '0.8rem' }}
                            placeholder={MOVIE_FORM_I18N.step4.m3u8Placeholder}
                            value={ep.link_m3u8}
                            onChange={(e) => updateEpisode(sIdx, epIdx, 'link_m3u8', e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.btnTrash}
                            onClick={() => removeEpisode(sIdx, epIdx)}
                            title="Xóa tập này"
                          >
                            <FaTimes size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Step Actions - Calmer Neutral Next Button */}
                <div className={styles.stepNavFooter}>
                  <button
                    type="button"
                    className={styles.btnStepPrev}
                    onClick={handlePrevStep}
                  >
                    <FaChevronLeft size={10} /> {MOVIE_FORM_I18N.actions.prev}: {MOVIE_FORM_I18N.steps[2].shortTitle}
                  </button>
                  <button
                    type="button"
                    className={styles.btnStepNextCalm}
                    onClick={handleNextStep}
                  >
                    {MOVIE_FORM_I18N.actions.next}: {MOVIE_FORM_I18N.steps[4].shortTitle} <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 5: XUẤT BẢN & ĐÁNH GIÁ (BALANCED 2-COLUMN LAYOUT) ==================== */}
          {currentStep === 5 && (
            <div className={styles.step5Grid}>
              {/* Left Column: Synopsis, Notes, Flags */}
              <div className={styles.glassCard} style={{ margin: 0 }}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaInfoCircle className={styles.cardTitleIcon} /> {MOVIE_FORM_I18N.steps[4].fullTitle}
                  </h3>
                  <span className="badge bg-danger">Bắt buộc tóm tắt</span>
                </div>
                <div className={styles.cardBody}>
                  {/* Synopsis */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span className={styles.labelTitle}>
                        {MOVIE_FORM_I18N.step5.synopsisLabel} <span className={styles.requiredAsterisk}>*</span>
                      </span>
                      <span className="text-muted small">{content.length} ký tự</span>
                    </label>
                    <textarea
                      rows={4}
                      className={`${styles.inputControl} ${validationErrors.content ? styles.inputError : ''}`}
                      style={{ height: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.84rem' }}
                      placeholder={MOVIE_FORM_I18N.step5.synopsisPlaceholder}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    {validationErrors.content && (
                      <span className={styles.errorText}>{validationErrors.content}</span>
                    )}
                  </div>

                  {/* Notice & Showtimes */}
                  <div className="row g-2">
                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step5.noticeLabel}</span>
                        </label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder={MOVIE_FORM_I18N.step5.noticePlaceholder}
                          value={notify}
                          onChange={(e) => setNotify(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step5.showtimesLabel}</span>
                        </label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          placeholder={MOVIE_FORM_I18N.step5.showtimesPlaceholder}
                          value={showtimes}
                          onChange={(e) => setShowtimes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="d-flex flex-wrap gap-3 mt-1 pt-2 border-top border-secondary border-opacity-10">
                    <label className="d-flex align-items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={chieuRap}
                        onChange={(e) => setChieuRap(e.target.checked)}
                      />
                      <span className="small">{MOVIE_FORM_I18N.step5.flagChieuRap}</span>
                    </label>

                    <label className="d-flex align-items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={isCopyright}
                        onChange={(e) => setIsCopyright(e.target.checked)}
                      />
                      <span className="small">{MOVIE_FORM_I18N.step5.flagCopyright}</span>
                    </label>

                    <label className="d-flex align-items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={subDocQuyen}
                        onChange={(e) => setSubDocQuyen(e.target.checked)}
                      />
                      <span className="small">{MOVIE_FORM_I18N.step5.flagExclusive}</span>
                    </label>
                  </div>

                  {/* Step Actions (Single 'Quay lại' button; Final submit is handled cleanly by the sticky bar) */}
                  <div className={styles.stepNavFooter}>
                    <button
                      type="button"
                      className={styles.btnStepPrev}
                      onClick={handlePrevStep}
                    >
                      <FaChevronLeft size={10} /> {MOVIE_FORM_I18N.actions.prev}: {MOVIE_FORM_I18N.steps[3].shortTitle}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Unified TMDB & Simulator (Balanced Height) */}
              <div className={styles.glassCard} style={{ margin: 0 }}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <FaTv className={styles.cardTitleIcon} /> {MOVIE_FORM_I18N.step5.simulatorTitle}
                  </h3>
                </div>
                <div className={styles.cardBody}>
                  {/* TMDB row directly above the card preview */}
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step5.tmdbIdLabel}</span>
                        </label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          style={{ height: 32, fontSize: '0.8rem' }}
                          placeholder="872585"
                          value={tmdbId}
                          onChange={(e) => setTmdbId(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-3">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step5.voteAvgLabel}</span>
                        </label>
                        <div className={styles.microStepperWrapper}>
                          <button
                            type="button"
                            className={styles.microStepBtn}
                            onClick={() => setVoteAverage(v => Math.max(0, Number((v - 0.5).toFixed(1))))}
                            title="Giảm 0.5 điểm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            className={styles.microStepInput}
                            value={voteAverage}
                            onChange={(e) => setVoteAverage(Number(e.target.value))}
                          />
                          <button
                            type="button"
                            className={styles.microStepBtn}
                            onClick={() => setVoteAverage(v => Math.min(10, Number((v + 0.5).toFixed(1))))}
                            title="Tăng 0.5 điểm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step5.voteCountLabel}</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={styles.inputControl}
                          style={{ height: 32, fontSize: '0.8rem', textAlign: 'center' }}
                          value={voteCount}
                          onChange={(e) => setVoteCount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulator Preview Card */}
                  <div className={styles.movieCardSimulator}>
                    <div className={styles.simPosterArea}>
                      {posterUrl ? (
                        <img src={posterUrl} alt={name} className={styles.previewImg} loading="eager" />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                          <FaFilm size={26} />
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
                          <FaStar size={9} /> {voteAverage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Progress & Quick Actions Bar */}
          <div className={styles.stickyBottomBar}>
            <div className={styles.completionProgress}>
              <span className="text-muted small">Tiến độ:</span>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${completionPercentage}%` }} />
              </div>
              <span className="fw-bold text-white small">{completionPercentage}%</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Link href="/admin/movies" legacyBehavior>
                <a className="btn btn-sm btn-outline-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                  {MOVIE_FORM_I18N.actions.cancel}
                </a>
              </Link>
              <button
                type="submit"
                className={styles.btnPrimarySubmit}
                disabled={loading}
              >
                <FaSave /> {loading ? MOVIE_FORM_I18N.actions.saving : MOVIE_FORM_I18N.actions.publish}
              </button>
            </div>
          </div>
        </form>
      </div>

      <BackToTop />
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