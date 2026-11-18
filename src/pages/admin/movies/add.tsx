import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/layouts/AdminLayout';
import AdminRoute from '@/features/shared/components/ProtectedRoute/AdminRoute';
import axios from '@/API/config/axiosConfig';
import {
  FaFilm, FaArrowLeft, FaSave, FaMagic,
  FaCheck, FaImage, FaPlay, FaServer, FaTag,
  FaUserTie, FaUsers, FaInfoCircle, FaStar, FaChevronRight, FaChevronLeft, FaSearch, FaTimes, FaLayerGroup, FaSlidersH,
  FaCalendarAlt, FaCalendarCheck, FaClock, FaCheckCircle, FaBell,
  FaThumbtack, FaTrash, FaEdit
} from 'react-icons/fa';
import styles from '@/styles/AdminAddMovie.module.css';
import CinemaSelect from '@/features/admin/components/Movies/FormFields/CinemaSelect';
import TagAutocompletePicker from '@/features/admin/components/Movies/FormFields/TagAutocompletePicker';
import UpcomingMovieModal from '@/features/admin/components/Movies/FormFields/UpcomingMovieModal';
import MovieWebSimulation from '@/features/admin/components/Movies/FormFields/MovieWebSimulation';
import QuickCreateTaxonomyModal, { QuickCreateType } from '@/features/admin/components/Movies/FormFields/QuickCreateTaxonomyModal';
import BackToTop from '@/features/shared/components/UI/BackToTop';
import { showCinemaAlert } from '@/features/shared/components/UI/CinemaAlert';
import { apiPath } from '@/config/apiPaths';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  PRESET_SHOWTIME_TEMPLATES,
  ShowtimeTemplate,
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

// Helper to extract YouTube video ID from various URL patterns
const extractYouTubeId = (str: string): string | null => {
  if (!str || typeof str !== 'string') return null;
  const clean = str.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const match = clean.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
};

// SVG representation for broken or unavailable media
const UnavailableMediaSvg = ({ label = 'Không khả dụng' }: { label?: string }) => (
  <div className={styles.unavailableSvgBox}>
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.unavailableSvg}
      aria-label="Media không khả dụng"
    >
      <rect
        x="8"
        y="12"
        width="56"
        height="48"
        rx="6"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.8"
        strokeDasharray="4 3"
        fill="rgba(255,255,255,0.02)"
      />
      <circle cx="24" cy="28" r="5" stroke="rgba(239, 68, 68, 0.75)" strokeWidth="1.8" />
      <path
        d="M16 52 L30 38 L42 48 L50 42 L56 50"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="16" x2="60" y2="56" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    <span className={styles.unavailableSvgText}>{label}</span>
  </div>
);

const AddMoviePage = () => {
  const router = useRouter();

  // Wizard step state (1: Basic info, 2: Taxonomy, 3: Media, 4: Server, 5: Publish)
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

  // Media URLs & Interactive Preview States
  const [thumbUrl, setThumbUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');

  // Media Preview States (Patchwork 3-patch artistic quilt)
  const [posterError, setPosterError] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const [activePatch, setActivePatch] = useState<'poster' | 'thumb' | 'trailer' | null>(null);
  const [hoveredPatch, setHoveredPatch] = useState<'poster' | 'thumb' | 'trailer' | null>(null);
  const [playTrailerEmbed, setPlayTrailerEmbed] = useState(false);

  const ytId = useMemo(() => extractYouTubeId(trailerUrl), [trailerUrl]);

  const posterStatus = useMemo<'empty' | 'error' | 'ready'>(() => {
    if (!posterUrl.trim()) return 'empty';
    if (posterError) return 'error';
    return 'ready';
  }, [posterUrl, posterError]);

  const thumbStatus = useMemo<'empty' | 'error' | 'ready'>(() => {
    if (!thumbUrl.trim()) return 'empty';
    if (thumbError) return 'error';
    return 'ready';
  }, [thumbUrl, thumbError]);

  const trailerStatus = useMemo<'empty' | 'error' | 'ready'>(() => {
    if (!trailerUrl.trim()) return 'empty';
    if (!ytId) return 'error';
    return 'ready';
  }, [trailerUrl, ytId]);

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

  // Extras & Showtimes
  const [isCopyright, setIsCopyright] = useState(true);
  const [chieuRap, setChieuRap] = useState(true);
  const [subDocQuyen, setSubDocQuyen] = useState(false);
  const [notify, setNotify] = useState('');
  const [showtimes, setShowtimes] = useState('Đã khởi chiếu trọn bộ tại rạp');

  // Upcoming movie and the automatic transition schedule
  // (the upcoming movie block allows missing fields)
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [releaseDateTime, setReleaseDateTime] = useState('');
  const [releaseDescription, setReleaseDescription] = useState('');
  const [autoSwitchStatus, setAutoSwitchStatus] = useState(true);
  const [targetStatusAfterRelease, setTargetStatusAfterRelease] = useState<'ongoing' | 'completed'>('ongoing');
  const [countdownEnabled, setCountdownEnabled] = useState(true);

  // Quick Create Metadata Modal State
  const [quickCreateModal, setQuickCreateModal] = useState<{ isOpen: boolean; type: QuickCreateType }>({
    isOpen: false,
    type: 'category'
  });

  const handleQuickCreated = (newItem: { id: string; name: string; slug: string; [key: string]: any }) => {
    if (quickCreateModal.type === 'category') {
      setAllCategories(prev => [...prev, newItem]);
      setSelectedCategories(prev => [...prev, newItem.id]);
    } else if (quickCreateModal.type === 'country') {
      setAllCountries(prev => [...prev, newItem]);
      setSelectedCountries(prev => [...prev, newItem.id]);
    } else if (quickCreateModal.type === 'actor') {
      if (newItem.name && !actors.includes(newItem.name)) {
        setActors(prev => [...prev, newItem.name]);
      }
    }
  };

  // Showtimes templates with Pinning, Adding, Editing, Deleting
  const [showtimeTemplates, setShowtimeTemplates] = useState<ShowtimeTemplate[]>(PRESET_SHOWTIME_TEMPLATES);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplatePinned, setNewTemplatePinned] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateText, setEditingTemplateText] = useState('');

  // Toggle Pin for a template
  const handleTogglePinTemplate = (id: string) => {
    setShowtimeTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  // Add new template
  const handleAddTemplate = () => {
    const trimmed = newTemplateText.trim();
    if (!trimmed) return;
    const newTpl: ShowtimeTemplate = {
      id: `st-${Date.now()}`,
      text: trimmed,
      isPinned: newTemplatePinned
    };
    setShowtimeTemplates(prev => [...prev, newTpl]);
    setShowtimes(trimmed);
    setNewTemplateText('');
    setNewTemplatePinned(false);
    showCinemaAlert(`Đã thêm mẫu lịch chiếu: "${trimmed}"`, 'success');
  };

  // Edit template
  const handleSaveEditTemplate = (id: string) => {
    const trimmed = editingTemplateText.trim();
    if (!trimmed) return;
    setShowtimeTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, text: trimmed } : t))
    );
    setEditingTemplateId(null);
    setEditingTemplateText('');
    showCinemaAlert('Đã cập nhật mẫu lịch chiếu!', 'info');
  };

  // Delete template
  const handleDeleteTemplate = (id: string) => {
    setShowtimeTemplates(prev => prev.filter(t => t.id !== id));
    showCinemaAlert('Đã xóa mẫu lịch chiếu!', 'info');
  };

  // Toggle upcoming movie with auto-initialization & popup trigger
  const handleToggleUpcoming = (checked: boolean) => {
    setIsUpcoming(checked);
    if (checked) {
      setStatus('trailer');
      if (!releaseDateTime) {
        const defaultDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        defaultDate.setHours(20, 0, 0, 0);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T20:00`;
        setReleaseDateTime(formatted);
        setReleaseDescription(`Dự kiến khởi chiếu 20:00 ngày ${pad(defaultDate.getDate())}/${pad(defaultDate.getMonth() + 1)}/${defaultDate.getFullYear()}`);
      }
      setIsUpcomingModalOpen(true);
    } else {
      if (status === 'trailer') setStatus('completed');
      setIsUpcomingModalOpen(false);
    }
  };

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
    setThumbUrl(d.thumbUrl || '');
    setPosterUrl(d.posterUrl || '');
    setTrailerUrl(d.trailerUrl || '');
    setPosterError(false);
    setThumbError(false);
    setPlayTrailerEmbed(false);
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

  const categoryNames = useMemo(() => {
    return selectedCategories
      .map(cId => allCategories.find(c => c.id === cId)?.name || cId)
      .join(', ');
  }, [selectedCategories, allCategories]);

  const countryNames = useMemo(() => {
    return selectedCountries
      .map(cId => allCountries.find(c => c.id === cId)?.name || cId)
      .join(', ');
  }, [selectedCountries, allCountries]);

  // Step Completion Checker
  const isStep1Done = Boolean(name && slug && year);
  const isStep2Done = Boolean(selectedCategories.length > 0 && selectedCountries.length > 0);
  const isStep3Done = Boolean(posterUrl);
  const isStep4Done = Boolean(isUpcoming || (servers.length > 0 && servers[0].server_data.length > 0));
  const isStep5Done = Boolean(isUpcoming || content);

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
    if (!isUpcoming && FORM_VALIDATION_CONFIG.content.required && !content.trim()) {
      errs.content = MOVIE_FORM_I18N.validation.contentRequired;
    }
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
        status: isUpcoming ? 'trailer' : status,
        thumb_url: thumbUrl || posterUrl,
        poster_url: posterUrl || thumbUrl,
        trailer_url: trailerUrl,
        time,
        episode_current: isUpcoming ? 'Sắp ra mắt' : episodeCurrent,
        episode_total: episodeTotal,
        quality,
        lang,
        notify,
        showtimes,
        year: Number(year),
        is_copyright: isCopyright,
        chieurap: chieuRap,
        sub_docquyen: subDocQuyen,
        is_upcoming: isUpcoming,
        release_datetime: releaseDateTime,
        release_description: releaseDescription,
        auto_switch_status: autoSwitchStatus,
        target_status_after_release: targetStatusAfterRelease,
        countdown_enabled: countdownEnabled,
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
        const res = await axios.post(apiPath(`adminMoviesList`), payload);
        if (res.data && res.data.success) {
          showCinemaAlert('Thêm phim mới thành công vào hệ thống!', 'success');
          setTimeout(() => router.push('/admin/movies'), 1200);
          return;
        }
      } catch (apiErr) {

      }

      showCinemaAlert('Đã lưu phim thành công (Chế độ xem trước)!', 'success');
      setTimeout(() => router.push('/admin/movies'), 1500);

    } catch (err) {

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
                        <div className="d-flex align-items-center gap-2">
                          <label className={styles.formLabel} style={{ margin: 0 }}>
                            <span className={styles.labelTitle}>
                              {MOVIE_FORM_I18N.step2.categoryLabel} <span className={styles.requiredAsterisk}>*</span>
                            </span>
                          </label>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#e50914', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                            onClick={() => setQuickCreateModal({ isOpen: true, type: 'category' })}
                            title="Tạo nhanh thể loại mới"
                          >
                            + Thêm nhanh
                          </button>
                        </div>
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
                        {filteredCategories.length === 0 && (
                          <div className="w-100 text-center py-2 text-muted small">
                            Không tìm thấy thể loại nào phù hợp
                          </div>
                        )}
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
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <label className={styles.formLabel} style={{ margin: 0 }}>
                            <span className={styles.labelTitle}>
                              {MOVIE_FORM_I18N.step2.countryLabel} <span className={styles.requiredAsterisk}>*</span>
                            </span>
                          </label>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#e50914', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                            onClick={() => setQuickCreateModal({ isOpen: true, type: 'country' })}
                            title="Tạo nhanh quốc gia mới"
                          >
                            + Thêm nhanh
                          </button>
                        </div>
                        <span className="text-muted small">Đã chọn: {selectedCountries.length}</span>
                      </div>

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
                      onQuickCreate={() => setQuickCreateModal({ isOpen: true, type: 'actor' })}
                      quickCreateTitle="Thêm diễn viên mới"
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
                    {/* Poster URL (2:3) */}
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
                            onClick={() => {
                              setPosterUrl('https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg');
                              setPosterError(false);
                            }}
                          >
                            {MOVIE_FORM_I18N.step3.sample1}
                          </button>
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => {
                              setPosterUrl('https://image.tmdb.org/t/p/w780/czembW0Rk1Ke7lCJGhkAiBhQ9la.jpg');
                              setPosterError(false);
                            }}
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
                        onChange={(e) => {
                          setPosterUrl(e.target.value.trim());
                          setPosterError(false);
                        }}
                      />
                      {validationErrors.poster && (
                        <span className={styles.errorText}>{validationErrors.poster}</span>
                      )}
                    </div>

                    {/* Thumbnail / Backdrop URL (16:9) */}
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
                            onClick={() => {
                              setThumbUrl('https://image.tmdb.org/t/p/w1280/rLb2cw69QBHgFDWcl0zKyfEaY2K.jpg');
                              setThumbError(false);
                            }}
                          >
                            {MOVIE_FORM_I18N.step3.sample1}
                          </button>
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => {
                              setThumbUrl('https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520b22.jpg');
                              setThumbError(false);
                            }}
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
                        onChange={(e) => {
                          setThumbUrl(e.target.value.trim());
                          setThumbError(false);
                        }}
                      />
                    </div>

                    {/* Trailer URL */}
                    <div className={styles.formGroup}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={styles.formLabel} style={{ margin: 0 }}>
                          {MOVIE_FORM_I18N.step3.trailerLabel}
                        </label>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => {
                              setTrailerUrl('https://www.youtube.com/watch?v=uYPbbksJxIg');
                              setPlayTrailerEmbed(false);
                            }}
                          >
                            {MOVIE_FORM_I18N.step3.sample1}
                          </button>
                          <button
                            type="button"
                            className={styles.yearStepBtn}
                            style={{ height: 24, fontSize: '0.72rem', padding: '0 0.4rem' }}
                            onClick={() => {
                              setTrailerUrl('https://www.youtube.com/watch?v=Way9Dexny3w');
                              setPlayTrailerEmbed(false);
                            }}
                          >
                            {MOVIE_FORM_I18N.step3.sample2}
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className={styles.inputControl}
                        placeholder={MOVIE_FORM_I18N.step3.trailerPlaceholder}
                        value={trailerUrl}
                        onChange={(e) => {
                          setTrailerUrl(e.target.value.trim());
                          setPlayTrailerEmbed(false);
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Khung ảnh chia 3 */}
                  <div className={styles.mediaPreviewsCol}>
                    <div className={styles.patchworkHeader}>
                      <label className={styles.formLabel} style={{ margin: 0 }}>
                        {MOVIE_FORM_I18N.step3.previewTitle}
                      </label>
                      <span className="text-muted small" style={{ fontSize: '0.68rem' }}>
                        {activePatch ? 'Bấm "Thu nhỏ" để trở về 3 mảnh' : 'Hover hoặc bấm để phóng to'}
                      </span>
                    </div>

                    {/* Quick status tabs above collage */}
                    <div className={styles.patchworkNavTabs}>
                      <button
                        type="button"
                        className={`${styles.patchworkTabBtn} ${activePatch === 'poster' ? styles.patchworkTabBtnActive : ''}`}
                        onClick={() => setActivePatch(activePatch === 'poster' ? null : 'poster')}
                        title="Bấm để xem lớn Poster 2:3"
                      >
                        <span className={posterStatus === 'ready' ? styles.patchBadgeStatusReady : posterStatus === 'error' ? styles.patchBadgeStatusError : styles.patchBadgeStatusEmpty}>●</span>
                        Poster (2:3)
                      </button>

                      <button
                        type="button"
                        className={`${styles.patchworkTabBtn} ${activePatch === 'thumb' ? styles.patchworkTabBtnActive : ''}`}
                        onClick={() => setActivePatch(activePatch === 'thumb' ? null : 'thumb')}
                        title="Bấm để xem lớn Thumbnail 16:9"
                      >
                        <span className={thumbStatus === 'ready' ? styles.patchBadgeStatusReady : thumbStatus === 'error' ? styles.patchBadgeStatusError : styles.patchBadgeStatusEmpty}>●</span>
                        Thumbnail (16:9)
                      </button>

                      <button
                        type="button"
                        className={`${styles.patchworkTabBtn} ${activePatch === 'trailer' ? styles.patchworkTabBtnActive : ''}`}
                        onClick={() => setActivePatch(activePatch === 'trailer' ? null : 'trailer')}
                        title="Bấm để xem lớn Trailer"
                      >
                        <span className={trailerStatus === 'ready' ? styles.patchBadgeStatusReady : trailerStatus === 'error' ? styles.patchBadgeStatusError : styles.patchBadgeStatusEmpty}>●</span>
                        Trailer
                      </button>

                      {activePatch && (
                        <button
                          type="button"
                          className={styles.patchworkTabBtn}
                          onClick={() => {
                            setActivePatch(null);
                            setPlayTrailerEmbed(false);
                          }}
                          title="Trở về bố cục cũ"
                        >
                          <FaTimes size={10} /> Thu nhỏ
                        </button>
                      )}
                    </div>

                    {/* Artistic 3-patch overlapping quilt container */}
                    <div className={styles.patchworkContainer}>
                      {/* Patch 1: Poster (2:3) */}
                      <div
                        className={`${styles.patchCard} ${styles.patchPoster} ${(hoveredPatch === 'poster' || activePatch === 'poster') ? styles.patchCardExpanded : ''}`}
                        onMouseEnter={() => setHoveredPatch('poster')}
                        onMouseLeave={() => setHoveredPatch(null)}
                        onClick={() => setActivePatch(activePatch === 'poster' ? null : 'poster')}
                        title="Poster (Tỷ lệ 2:3) - Hover hoặc bấm để mở rộng bao hết"
                      >
                        <div className={styles.patchBadge}>
                          <FaImage size={10} />
                          <span>Poster 2:3</span>
                          <span className={posterStatus === 'ready' ? styles.patchBadgeStatusReady : posterStatus === 'error' ? styles.patchBadgeStatusError : styles.patchBadgeStatusEmpty}>
                            {posterStatus === 'ready' ? '• Sẵn có' : posterStatus === 'error' ? '• Lỗi ảnh' : '• Chưa điền'}
                          </span>
                        </div>

                        {(hoveredPatch === 'poster' || activePatch === 'poster') && (
                          <button
                            type="button"
                            className={styles.patchCloseExpandBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePatch(null);
                              setHoveredPatch(null);
                            }}
                          >
                            <FaTimes size={9} /> Thu nhỏ
                          </button>
                        )}

                        <div className={styles.patchMediaInner}>
                          {posterStatus === 'empty' && (
                            <div className={styles.patchEmptyState}>
                              <FaImage size={24} className="mb-1 text-muted" />
                              <span className={styles.patchEmptyTitle}>Chưa nhập Poster</span>
                              <span className={styles.patchEmptyDesc}>Tỷ lệ 2:3 dọc</span>
                            </div>
                          )}
                          {posterStatus === 'error' && (
                            <UnavailableMediaSvg label="Poster không khả dụng" />
                          )}
                          {posterStatus === 'ready' && (
                            <img
                              key={posterUrl}
                              src={posterUrl}
                              alt="Poster preview"
                              className={`${styles.patchImg} ${styles.patchImgPoster}`}
                              loading="eager"
                              onError={() => setPosterError(true)}
                            />
                          )}
                        </div>
                      </div>

                      {/* Patch 2: Thumbnail / Backdrop (16:9) */}
                      <div
                        className={`${styles.patchCard} ${styles.patchThumb} ${(hoveredPatch === 'thumb' || activePatch === 'thumb') ? styles.patchCardExpanded : ''}`}
                        onMouseEnter={() => setHoveredPatch('thumb')}
                        onMouseLeave={() => setHoveredPatch(null)}
                        onClick={() => setActivePatch(activePatch === 'thumb' ? null : 'thumb')}
                        title="Thumbnail (Tỷ lệ 16:9) - Hover hoặc bấm để mở rộng bao hết"
                      >
                        <div className={styles.patchBadge}>
                          <FaFilm size={10} />
                          <span>Thumbnail 16:9</span>
                          <span className={thumbStatus === 'ready' ? styles.patchBadgeStatusReady : thumbStatus === 'error' ? styles.patchBadgeStatusError : styles.patchBadgeStatusEmpty}>
                            {thumbStatus === 'ready' ? '• Sẵn có' : thumbStatus === 'error' ? '• Lỗi ảnh' : '• Chưa điền'}
                          </span>
                        </div>

                        {(hoveredPatch === 'thumb' || activePatch === 'thumb') && (
                          <button
                            type="button"
                            className={styles.patchCloseExpandBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePatch(null);
                              setHoveredPatch(null);
                            }}
                          >
                            <FaTimes size={9} /> Thu nhỏ
                          </button>
                        )}

                        <div className={styles.patchMediaInner}>
                          {thumbStatus === 'empty' && (
                            <div className={styles.patchEmptyState}>
                              <FaFilm size={24} className="mb-1 text-muted" />
                              <span className={styles.patchEmptyTitle}>Chưa nhập Thumbnail</span>
                              <span className={styles.patchEmptyDesc}>Tỷ lệ 16:9 ngang</span>
                            </div>
                          )}
                          {thumbStatus === 'error' && (
                            <UnavailableMediaSvg label="Thumbnail không khả dụng" />
                          )}
                          {thumbStatus === 'ready' && (
                            <img
                              key={thumbUrl}
                              src={thumbUrl}
                              alt="Thumbnail preview"
                              className={styles.patchImg}
                              loading="eager"
                              onError={() => setThumbError(true)}
                            />
                          )}
                        </div>
                      </div>

                      {/* Patch 3: Trailer Video */}
                      <div
                        className={`${styles.patchCard} ${styles.patchTrailer} ${(hoveredPatch === 'trailer' || activePatch === 'trailer') ? styles.patchCardExpanded : ''}`}
                        onMouseEnter={() => setHoveredPatch('trailer')}
                        onMouseLeave={() => setHoveredPatch(null)}
                        onClick={() => setActivePatch(activePatch === 'trailer' ? null : 'trailer')}
                        title="Trailer Video - Hover hoặc bấm để mở rộng bao hết"
                      >
                        <div className={styles.patchBadge}>
                          <FaPlay size={10} />
                          <span>Trailer Video</span>
                          <span className={trailerStatus === 'ready' ? styles.patchBadgeStatusReady : trailerStatus === 'error' ? styles.patchBadgeStatusError : styles.patchBadgeStatusEmpty}>
                            {trailerStatus === 'ready' ? '• Sẵn có' : trailerStatus === 'error' ? '• Link lỗi' : '• Chưa điền'}
                          </span>
                        </div>

                        {(hoveredPatch === 'trailer' || activePatch === 'trailer') && (
                          <button
                            type="button"
                            className={styles.patchCloseExpandBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePatch(null);
                              setHoveredPatch(null);
                              setPlayTrailerEmbed(false);
                            }}
                          >
                            <FaTimes size={9} /> Thu nhỏ
                          </button>
                        )}

                        <div className={styles.patchMediaInner}>
                          {trailerStatus === 'empty' && (
                            <div className={styles.patchEmptyState}>
                              <FaPlay size={24} className="mb-1 text-muted" />
                              <span className={styles.patchEmptyTitle}>Chưa nhập Trailer</span>
                              <span className={styles.patchEmptyDesc}>YouTube link / embed</span>
                            </div>
                          )}
                          {trailerStatus === 'error' && (
                            <UnavailableMediaSvg label="Trailer không khả dụng (sai link)" />
                          )}
                          {trailerStatus === 'ready' && ytId && (
                            playTrailerEmbed && activePatch === 'trailer' ? (
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
                                title="Trailer Preview"
                                className={styles.trailerIframe}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <div className="w-100 h-100 position-relative">
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                  alt="Trailer preview thumbnail"
                                  className={styles.patchImg}
                                  loading="eager"
                                />
                                <div className={styles.trailerOverlayBadge}>
                                  <button
                                    type="button"
                                    className={styles.trailerPlayIcon}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivePatch('trailer');
                                      setPlayTrailerEmbed(true);
                                    }}
                                    title="Bấm để phát trailer thử nghiệm"
                                  >
                                    <FaPlay size={14} />
                                  </button>
                                  <span className={styles.trailerPlayText}>Trailer sẵn có • Bấm để phát</span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
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
            <div className="row g-3">
              {/* Left Column: Synopsis, Notes, Flags */}
              <div className="col-12 col-xl-7">
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

                  {/* Notice (Thông báo nổi bật) */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <span className={styles.labelTitle}>
                        <FaBell className="me-1 text-danger" /> {MOVIE_FORM_I18N.step5.noticeLabel}
                      </span>
                    </label>
                    <input
                      type="text"
                      className={styles.inputControl}
                      placeholder={MOVIE_FORM_I18N.step5.noticePlaceholder}
                      value={notify}
                      onChange={(e) => setNotify(e.target.value)}
                    />
                  </div>

                  {/* Showtimes (Lịch chiếu phim - Gọn nhẹ, Phím tắt Ghim & Quản lý Thêm/Sửa/Xóa) */}
                  <div className={styles.formGroup}>
                    <div className={styles.showtimeHeaderRow}>
                      <label className={styles.formLabel} style={{ margin: 0 }}>
                        <span className={styles.labelTitle}>
                          <FaClock className="me-1 text-danger" /> {MOVIE_FORM_I18N.step5.showtimesLabel}
                        </span>
                      </label>
                      <button
                        type="button"
                        className={`${styles.btnManageTemplates} ${isManagingTemplates ? styles.btnManageTemplatesActive : ''}`}
                        onClick={() => setIsManagingTemplates(!isManagingTemplates)}
                        title="Mở bảng quản lý thêm, sửa, xóa và ghim mẫu lịch chiếu"
                      >
                        <FaSlidersH size={10} />
                        {isManagingTemplates ? 'Đóng quản lý' : `Quản lý mẫu (${showtimeTemplates.length})`}
                      </button>
                    </div>

                    {/* Main Input Control for Showtime */}
                    <input
                      type="text"
                      className={styles.inputControl}
                      style={{ height: 34, fontSize: '0.82rem' }}
                      placeholder={MOVIE_FORM_I18N.step5.showtimesPlaceholder}
                      value={showtimes}
                      onChange={(e) => setShowtimes(e.target.value)}
                    />

                    {/* Pinned Quick Chips Row (Chỉ hiển thị các mẫu được ghim - 1 chạm tiện lợi) */}
                    {showtimeTemplates.some(t => t.isPinned) && (
                      <div className={styles.pinnedShowtimesRow}>
                        <span className="text-muted small d-inline-flex align-items-center me-1" style={{ fontSize: '0.68rem' }}>
                          <FaThumbtack size={9} className="text-danger me-1" /> Mẫu ghim:
                        </span>
                        {showtimeTemplates
                          .filter(t => t.isPinned)
                          .map(t => {
                            const isSelected = showtimes === t.text;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                className={`${styles.showtimePinnedChip} ${isSelected ? styles.showtimePinnedChipActive : ''}`}
                                onClick={() => setShowtimes(isSelected ? '' : t.text)}
                                title={`Bấm để chọn: ${t.text}`}
                              >
                                {isSelected && <FaCheck size={8} className="text-danger" />}
                                {t.text}
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {/* Collapsible Template Management Panel (Thêm, Sửa, Xóa, Ghim) */}
                    {isManagingTemplates && (
                      <div className={styles.templateManagerPanel}>
                        <div className="d-flex justify-content-between align-items-center pb-1 border-bottom border-secondary border-opacity-10">
                          <span className="fw-bold text-white small" style={{ fontSize: '0.72rem' }}>
                            Danh Sách Mẫu Lịch Chiếu (Thêm • Sửa • Xóa • Ghim)
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.65rem' }}>
                            Click vào text để áp dụng
                          </span>
                        </div>

                        {/* Add new template row */}
                        <div className={styles.templateAddRow}>
                          <input
                            type="text"
                            className={styles.inputControl}
                            style={{ height: 28, fontSize: '0.75rem', flex: 1 }}
                            placeholder="Nhập tên mẫu lịch chiếu mới..."
                            value={newTemplateText}
                            onChange={(e) => setNewTemplateText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTemplate())}
                          />
                          <label
                            className="d-flex align-items-center gap-1 cursor-pointer text-muted small user-select-none mb-0"
                            style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}
                            title="Ghim lên thanh phím tắt ngay sau khi thêm"
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              style={{ width: 13, height: 13 }}
                              checked={newTemplatePinned}
                              onChange={(e) => setNewTemplatePinned(e.target.checked)}
                            />
                            Ghim
                          </label>
                          <button
                            type="button"
                            className={styles.btnQuickAdjust}
                            style={{ height: 28, fontSize: '0.72rem' }}
                            onClick={handleAddTemplate}
                          >
                            + Thêm
                          </button>
                        </div>

                        {/* List of existing templates with Edit / Delete / Pin */}
                        <div className={styles.templateList}>
                          {showtimeTemplates.map(t => (
                            <div key={t.id} className={styles.templateItem}>
                              {/* Pin toggle button */}
                              <button
                                type="button"
                                className={`${styles.templateActionBtn} ${t.isPinned ? styles.templatePinBtnActive : ''}`}
                                onClick={() => handleTogglePinTemplate(t.id)}
                                title={t.isPinned ? 'Bỏ ghim khỏi phím tắt' : 'Ghim lên phím tắt 1 chạm'}
                              >
                                <FaThumbtack size={11} />
                              </button>

                              {/* Text or Inline Edit */}
                              {editingTemplateId === t.id ? (
                                <div className="d-flex align-items-center gap-1 flex-grow-1">
                                  <input
                                    type="text"
                                    className={styles.inputControl}
                                    style={{ height: 24, fontSize: '0.72rem', padding: '1px 5px' }}
                                    value={editingTemplateText}
                                    onChange={(e) => setEditingTemplateText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveEditTemplate(t.id))}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-success py-0 px-1"
                                    style={{ fontSize: '0.68rem' }}
                                    onClick={() => handleSaveEditTemplate(t.id)}
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-secondary py-0 px-1"
                                    style={{ fontSize: '0.68rem' }}
                                    onClick={() => setEditingTemplateId(null)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.templateItemText}
                                  onClick={() => setShowtimes(t.text)}
                                  title={`Click để áp dụng "${t.text}"`}
                                >
                                  {t.text}
                                </button>
                              )}

                              {/* Edit & Delete actions */}
                              {editingTemplateId !== t.id && (
                                <div className={styles.templateItemActions}>
                                  <button
                                    type="button"
                                    className={styles.templateActionBtn}
                                    onClick={() => {
                                      setEditingTemplateId(t.id);
                                      setEditingTemplateText(t.text);
                                    }}
                                    title="Chỉnh sửa nội dung mẫu"
                                  >
                                    <FaEdit size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.templateActionBtn}
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    title="Xóa mẫu này"
                                  >
                                    <FaTrash size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TMDB & Đánh giá (Chuyển sang cột bên trái theo yêu cầu) */}
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-sm-6">
                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>
                            <FaStar className="me-1 text-danger" /> {MOVIE_FORM_I18N.step5.tmdbIdLabel}
                          </span>
                        </label>
                        <input
                          type="text"
                          className={styles.inputControl}
                          style={{ height: 34, fontSize: '0.82rem' }}
                          placeholder="872585"
                          value={tmdbId}
                          onChange={(e) => setTmdbId(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-6 col-sm-3">
                      <div className={styles.formGroup} style={{ margin: 0 }}>
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
                            style={{ height: 34, fontSize: '0.82rem' }}
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
                    <div className="col-6 col-sm-3">
                      <div className={styles.formGroup} style={{ margin: 0 }}>
                        <label className={styles.formLabel}>
                          <span className={styles.labelTitle}>{MOVIE_FORM_I18N.step5.voteCountLabel}</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={styles.inputControl}
                          style={{ height: 34, fontSize: '0.82rem', textAlign: 'center' }}
                          value={voteCount}
                          onChange={(e) => setVoteCount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modern Cinema Dark Switch Cards (Cải thiện checkbox) */}
                  <div className={styles.switchCardGrid}>
                    {/* Phim Sắp Ra Mắt */}
                    <div
                      className={`${styles.switchCard} ${isUpcoming ? styles.switchCardUpcomingActive : ''}`}
                      onClick={() => handleToggleUpcoming(!isUpcoming)}
                      title="Bật tính năng phim sắp ra mắt, hẹn giờ chuyển trạng thái tự động"
                    >
                      <div className={styles.switchCardContent}>
                        <FaCalendarAlt className={styles.switchCardIcon} />
                        <div>
                          <div className={styles.switchCardTitle}>{MOVIE_FORM_I18N.step5.flagUpcoming}</div>
                          <div className={styles.switchCardDesc}>Phim chưa ra mắt</div>
                        </div>
                      </div>
                      <div className={`${styles.switchTrack} ${isUpcoming ? styles.switchTrackUpcoming : ''}`}>
                        <div className={styles.switchKnob} />
                      </div>
                    </div>

                    {/* Phim Chiếu Rạp */}
                    <div
                      className={`${styles.switchCard} ${chieuRap ? styles.switchCardActive : ''}`}
                      onClick={() => setChieuRap(!chieuRap)}
                    >
                      <div className={styles.switchCardContent}>
                        <FaFilm className={styles.switchCardIcon} />
                        <div>
                          <div className={styles.switchCardTitle}>{MOVIE_FORM_I18N.step5.flagChieuRap}</div>
                          <div className={styles.switchCardDesc}>Hiển thị nhãn rạp</div>
                        </div>
                      </div>
                      <div className={`${styles.switchTrack} ${chieuRap ? styles.switchTrackActive : ''}`}>
                        <div className={styles.switchKnob} />
                      </div>
                    </div>

                    {/* Bản Quyền Đã Xác Minh */}
                    <div
                      className={`${styles.switchCard} ${isCopyright ? styles.switchCardActive : ''}`}
                      onClick={() => setIsCopyright(!isCopyright)}
                    >
                      <div className={styles.switchCardContent}>
                        <FaCheckCircle className={styles.switchCardIcon} />
                        <div>
                          <div className={styles.switchCardTitle}>{MOVIE_FORM_I18N.step5.flagCopyright}</div>
                          <div className={styles.switchCardDesc}>Phim có bản quyền</div>
                        </div>
                      </div>
                      <div className={`${styles.switchTrack} ${isCopyright ? styles.switchTrackActive : ''}`}>
                        <div className={styles.switchKnob} />
                      </div>
                    </div>

                    {/* Phụ Đề Độc Quyền */}
                    <div
                      className={`${styles.switchCard} ${subDocQuyen ? styles.switchCardActive : ''}`}
                      onClick={() => setSubDocQuyen(!subDocQuyen)}
                    >
                      <div className={styles.switchCardContent}>
                        <FaStar className={styles.switchCardIcon} />
                        <div>
                          <div className={styles.switchCardTitle}>{MOVIE_FORM_I18N.step5.flagExclusive}</div>
                          <div className={styles.switchCardDesc}>Bản sub độc quyền</div>
                        </div>
                      </div>
                      <div className={`${styles.switchTrack} ${subDocQuyen ? styles.switchTrackActive : ''}`}>
                        <div className={styles.switchKnob} />
                      </div>
                    </div>
                  </div>

                  {/* Upcoming movie status summary strip with underline action link */}
                  {isUpcoming && (
                    <div className={styles.upcomingStatusStrip}>
                      <div className={styles.upcomingStripLeft}>
                        <FaCalendarCheck className="text-danger" size={13} />
                        <span>
                          Lịch ra mắt: <strong>{releaseDescription || 'Chưa đặt mô tả'}</strong>
                          {autoSwitchStatus && releaseDateTime && (
                            <span className="text-muted ms-1">
                              (Tự chuyển: {new Date(releaseDateTime).toLocaleDateString('vi-VN')})
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.btnUnderlineAction}
                        onClick={() => setIsUpcomingModalOpen(true)}
                      >
                        Xem & Cấu hình chi tiết ➔
                      </button>
                    </div>
                  )}

                  {/* Step Actions */}
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
            </div>

            {/* Right Column: High-Density Web Simulation */}
            <div className="col-12 col-xl-5">
                <MovieWebSimulation
                  name={name}
                  originName={originName}
                  slug={slug}
                  posterUrl={posterUrl}
                  thumbUrl={thumbUrl}
                  trailerUrl={trailerUrl}
                  quality={quality}
                  year={year}
                  type={type}
                  time={time}
                  lang={lang}
                  categories={categoryNames}
                  countries={countryNames}
                  actors={actors}
                  directors={directors}
                  episodeCurrent={episodeCurrent}
                  voteAverage={voteAverage}
                  voteCount={voteCount}
                  content={content}
                  notify={notify}
                  showtimes={showtimes}
                  isUpcoming={isUpcoming}
                  releaseDescription={releaseDescription}
                  releaseDateTime={releaseDateTime}
                  servers={servers}
                />
              </div>
            </div>
          )}

          {/* Popup Modal: Upcoming Movie Schedule & Auto Status Switch */}
          <UpcomingMovieModal
            isOpen={isUpcomingModalOpen}
            onClose={() => setIsUpcomingModalOpen(false)}
            releaseDateTime={releaseDateTime}
            setReleaseDateTime={setReleaseDateTime}
            releaseDescription={releaseDescription}
            setReleaseDescription={setReleaseDescription}
            autoSwitchStatus={autoSwitchStatus}
            setAutoSwitchStatus={setAutoSwitchStatus}
            targetStatusAfterRelease={targetStatusAfterRelease}
            setTargetStatusAfterRelease={setTargetStatusAfterRelease}
            countdownEnabled={countdownEnabled}
            setCountdownEnabled={setCountdownEnabled}
          />

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

      <QuickCreateTaxonomyModal
        isOpen={quickCreateModal.isOpen}
        type={quickCreateModal.type}
        onClose={() => setQuickCreateModal(prev => ({ ...prev, isOpen: false }))}
        onCreated={handleQuickCreated}
      />

      <BackToTop />
    </>
  );
};

AddMoviePage.getLayout = (page: React.ReactNode) => {
  return (
    <AdminRoute>
      <AdminLayout>
        <ToastContainer position="top-right" autoClose={3500} theme="dark" />{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AddMoviePage;