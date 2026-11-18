// src/components/Admin/Movies/EpisodeManagerModal.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FaTimes,
  FaServer,
  FaFilm,
  FaPlay,
  FaPlus,
  FaTrash,
  FaPen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaBan,
  FaCopy,
  FaChevronDown,
  FaTh,
  FaList,
  FaSearch,
  FaPaste,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaLayerGroup} from 'react-icons/fa';
import styles from '@/styles/EpisodeManager.module.css';
import { showCinemaAlert } from '@/features/shared/components/UI/CinemaAlert';

export type EpisodeStatus = 'ACTIVE' | 'PROCESSING' | 'ERROR' | 'DISABLED';

export interface EpisodeItem {
  id: string;
  episodeNumber: number | string;
  name: string;
  slug: string;
  linkM3u8: string;
  linkEmbed?: string;
  quality?: string;
  status: EpisodeStatus;
}

export interface ServerGroup {
  id: string;
  name: string;
  serverType: string;
  episodes: EpisodeItem[];
}

interface EpisodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: {
    id?: string;
    _id?: string;
    name: string;
    origin_name?: string;
    slug?: string;
  } | null;
}

// Generate realistic mock episodes to test large datasets (120+ episodes)
const generateMockEpisodes = (count: number): EpisodeItem[] => {
  const list: EpisodeItem[] = [];
  for (let i = 1; i <= count; i++) {
    let status: EpisodeStatus = 'ACTIVE';
    if (i === 4 || i === 48 || i === 95) status = 'PROCESSING';
    if (i === 12 || i === 67 || i === 114) status = 'ERROR';
    if (i === 25 || i === 80) status = 'DISABLED';

    list.push({
      id: `ep-${i}`,
      episodeNumber: i,
      name: `Tập ${i}`,
      slug: `tap-${i}`,
      linkM3u8: `https://stream.cinema.vn/hls/series/ep${i}/index.m3u8`,
      linkEmbed: `https://player.cinema.vn/embed/series-ep${i}`,
      quality: '1080p',
      status
    });
  }
  return list;
};

const INITIAL_SERVERS: ServerGroup[] = [
  {
    id: 'srv-1',
    name: 'Server VIP #1 (FPT HLS - 120 Tập)',
    serverType: 'HLS',
    episodes: generateMockEpisodes(120)
  },
  {
    id: 'srv-2',
    name: 'Server Dự Phòng #2 (Cloudflare CDN)',
    serverType: 'CDN',
    episodes: [
      { id: 'ep-cf-1', episodeNumber: 1, name: 'Tập 1', slug: 'tap-1', linkM3u8: 'https://cdn.backup-stream.net/dune2/ep1.m3u8', quality: '1080p', status: 'ACTIVE' },
      { id: 'ep-cf-2', episodeNumber: 2, name: 'Tập 2', slug: 'tap-2', linkM3u8: 'https://cdn.backup-stream.net/dune2/ep2.m3u8', quality: '1080p', status: 'ACTIVE' }
    ]
  },
  {
    id: 'srv-3',
    name: 'Server Embed #3 (Hydra Player)',
    serverType: 'EMBED',
    episodes: [
      { id: 'ep-emb-1', episodeNumber: 1, name: 'Tập 1', slug: 'tap-1', linkM3u8: '', linkEmbed: 'https://hydra.stream/e/dune-p2-01', quality: '720p', status: 'ACTIVE' }
    ]
  }
];

export default function EpisodeManagerModal({
  isOpen,
  onClose,
  movie
}: EpisodeManagerModalProps) {
  const [servers, setServers] = useState<ServerGroup[]>(INITIAL_SERVERS);
  const [activeServerId, setActiveServerId] = useState<string>('srv-1');

  // View Mode: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EpisodeStatus>('ALL');
  const [activeRange, setActiveRange] = useState<string>('ALL');

  // Pagination for large episode collections (prevents DOM bloat & lag)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [highlightEpId, setHighlightEpId] = useState<string | null>(null);

  // Bulk actions selection
  const [selectedEpIds, setSelectedEpIds] = useState<string[]>([]);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  // Status Filter Dropdown state & ref
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Sub-modal 1: Single Episode Add / Edit Form Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<EpisodeItem | null>(null);

  // Sub-modal 2: Batch Import Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Test Player State
  const [testPlayingEp, setTestPlayingEp] = useState<EpisodeItem | null>(null);

  // Active status dropdown menu
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Reset pagination & selection when server or filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedEpIds([]);
  }, [activeServerId, searchTerm, statusFilter, activeRange]);

  // Close status dropdown, filter menu & bulk menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setOpenStatusMenuId(null);
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setIsBulkMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeServer = useMemo(() => {
    return servers.find(s => s.id === activeServerId) || servers[0];
  }, [servers, activeServerId]);

  // Overall Stats
  const totalEpisodesCount = useMemo(() => {
    return activeServer ? activeServer.episodes.length : 0;
  }, [activeServer]);

  const activeCount = useMemo(() => {
    return activeServer ? activeServer.episodes.filter(e => e.status === 'ACTIVE').length : 0;
  }, [activeServer]);

  const processingCount = useMemo(() => {
    return activeServer ? activeServer.episodes.filter(e => e.status === 'PROCESSING').length : 0;
  }, [activeServer]);

  const errorCount = useMemo(() => {
    return activeServer ? activeServer.episodes.filter(e => e.status === 'ERROR').length : 0;
  }, [activeServer]);

  const disabledCount = useMemo(() => {
    return activeServer ? activeServer.episodes.filter(e => e.status === 'DISABLED').length : 0;
  }, [activeServer]);

  // Builds the range chunks (for example Episode 1 - 50, Episode 51 - 100)
  // so long series do not overflow the episode picker.
  const episodeRanges = useMemo(() => {
    if (!activeServer || activeServer.episodes.length <= 30) return [];
    const total = activeServer.episodes.length;
    const chunkSize = 50;
    const ranges: { label: string; rangeKey: string; start: number; end: number }[] = [];
    for (let i = 1; i <= total; i += chunkSize) {
      const end = Math.min(i + chunkSize - 1, total);
      ranges.push({ label: `Tập ${i} - ${end}`, rangeKey: `${i}-${end}`, start: i, end });
    }
    return ranges;
  }, [activeServer]);

  // Filtered Episodes
  const filteredEpisodes = useMemo(() => {
    if (!activeServer) return [];
    let list = activeServer.episodes;

    // 1. Filter by Status
    if (statusFilter !== 'ALL') {
      list = list.filter(ep => ep.status === statusFilter);
    }

    // 2. Filter by Episode Range
    if (activeRange !== 'ALL') {
      const [startStr, endStr] = activeRange.split('-');
      const start = Number(startStr);
      const end = Number(endStr);
      if (!isNaN(start) && !isNaN(end)) {
        list = list.filter(ep => {
          const num = Number(ep.episodeNumber);
          return !isNaN(num) && num >= start && num <= end;
        });
      }
    }

    // 3. Filter by Search Query
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(ep =>
        String(ep.episodeNumber).includes(term) ||
        ep.name.toLowerCase().includes(term) ||
        ep.slug.toLowerCase().includes(term)
      );
    }

    return list;
  }, [activeServer, statusFilter, activeRange, searchTerm]);

  // Paginated episodes (limits rendering to 24-48 items, keeping DOM light & fast)
  const totalFilteredCount = filteredEpisodes.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalFilteredCount / pageSize) : 1;
  const paginatedEpisodes = useMemo(() => {
    if (pageSize <= 0) return filteredEpisodes;
    const startIdx = (currentPage - 1) * pageSize;
    return filteredEpisodes.slice(startIdx, startIdx + pageSize);
  }, [filteredEpisodes, currentPage, pageSize]);

  // Bulk selection helpers
  const isAllCurrentPageSelected = paginatedEpisodes.length > 0 && paginatedEpisodes.every(ep => selectedEpIds.includes(ep.id));

  const handleToggleSelectEp = (epId: string) => {
    setSelectedEpIds(prev =>
      prev.includes(epId) ? prev.filter(id => id !== epId) : [...prev, epId]
    );
  };

  const handleToggleSelectAllPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedEpisodes.map(ep => ep.id));
      setSelectedEpIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedEpIds, ...paginatedEpisodes.map(ep => ep.id)]);
      setSelectedEpIds(Array.from(newIds));
    }
  };

  const handleBulkChangeStatus = (newStatus: EpisodeStatus) => {
    if (selectedEpIds.length === 0) return;
    const selectedSet = new Set(selectedEpIds);
    setServers(prev => prev.map(s => {
      if (s.id !== activeServerId) return s;
      return {
        ...s,
        episodes: s.episodes.map(e => selectedSet.has(e.id) ? { ...e, status: newStatus } : e)
      };
    }));
    setIsBulkMenuOpen(false);
    const labels: Record<EpisodeStatus, string> = {
      ACTIVE: 'Hoạt động',
      PROCESSING: 'Đang xử lý',
      ERROR: 'Lỗi link',
      DISABLED: 'Tạm ẩn'
    };
    showCinemaAlert(`Đã đổi trạng thái ${selectedEpIds.length} tập sang: ${labels[newStatus]}`, 'cinema');
    setSelectedEpIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedEpIds.length === 0) return;
    const count = selectedEpIds.length;
    const selectedSet = new Set(selectedEpIds);
    setServers(prev => prev.map(s => {
      if (s.id !== activeServerId) return s;
      return {
        ...s,
        episodes: s.episodes.filter(e => !selectedSet.has(e.id))
      };
    }));
    setSelectedEpIds([]);
    showCinemaAlert(`Đã xóa ${count} tập đã chọn!`, 'warning');
  };

  // Quick jump to episode
  const handleJumpToEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = jumpInput.trim();
    if (!targetNum) return;

    // Check if target episode is inside filteredEpisodes
    const targetIndex = filteredEpisodes.findIndex(ep => String(ep.episodeNumber) === targetNum);
    if (targetIndex !== -1) {
      const targetPage = pageSize > 0 ? Math.floor(targetIndex / pageSize) + 1 : 1;
      setCurrentPage(targetPage);
      const targetEp = filteredEpisodes[targetIndex];
      setHighlightEpId(targetEp.id);
      setTimeout(() => setHighlightEpId(null), 3500);
      showCinemaAlert(`Đã nhảy tới Tập ${targetNum} (Trang ${targetPage})`, 'cinema');
    } else {
      // Find in server episodes (might be hidden by filters)
      const foundInServer = activeServer?.episodes.find(ep => String(ep.episodeNumber) === targetNum);
      if (foundInServer) {
        setStatusFilter('ALL');
        setActiveRange('ALL');
        setSearchTerm('');
        setTimeout(() => {
          const idx = activeServer!.episodes.findIndex(ep => String(ep.episodeNumber) === targetNum);
          const p = pageSize > 0 ? Math.floor(idx / pageSize) + 1 : 1;
          setCurrentPage(p);
          setHighlightEpId(foundInServer.id);
          setTimeout(() => setHighlightEpId(null), 3500);
        }, 50);
        showCinemaAlert(`Đã đặt lại bộ lọc và chuyển tới Tập ${targetNum}`, 'cinema');
      } else {
        showCinemaAlert(`Không tìm thấy Tập ${targetNum} trong máy chủ này!`, 'warning');
      }
    }
    setJumpInput('');
  };

  if (!isOpen || !movie) return null;

  // Change Status for an episode
  const handleSetStatus = (epId: string, newStatus: EpisodeStatus) => {
    setServers(prev => prev.map(s => {
      if (s.id !== activeServerId) return s;
      return {
        ...s,
        episodes: s.episodes.map(e => e.id === epId ? { ...e, status: newStatus } : e)
      };
    }));
    setOpenStatusMenuId(null);

    const labels: Record<EpisodeStatus, string> = {
      ACTIVE: 'Hoạt động',
      PROCESSING: 'Đang xử lý',
      ERROR: 'Lỗi link',
      DISABLED: 'Tạm ẩn'
    };

    showCinemaAlert(`Đã đổi trạng thái sang: ${labels[newStatus]}`, newStatus === 'ACTIVE' ? 'cinema' : newStatus === 'ERROR' ? 'error' : 'warning');
  };

  // Open Form to Add
  const handleOpenAddForm = () => {
    setEditingEpisode(null);
    setIsFormModalOpen(true);
  };

  // Open Form to Edit
  const handleOpenEditForm = (ep: EpisodeItem) => {
    setEditingEpisode(ep);
    setIsFormModalOpen(true);
  };

  // Save Episode from Form Modal
  const handleSaveEpisode = (formData: {
    episodeNumber: string;
    name: string;
    linkM3u8: string;
    linkEmbed: string;
    quality: string;
    status: EpisodeStatus;
  }) => {
    const num = formData.episodeNumber.trim();
    const finalName = formData.name.trim() || `Tập ${num}`;
    const slug = `tap-${num}`.toLowerCase();

    if (editingEpisode) {
      // Update
      setServers(prev => prev.map(s => {
        if (s.id !== activeServerId) return s;
        return {
          ...s,
          episodes: s.episodes.map(e => e.id === editingEpisode.id ? {
            ...e,
            episodeNumber: num,
            name: finalName,
            slug,
            linkM3u8: formData.linkM3u8.trim(),
            linkEmbed: formData.linkEmbed.trim(),
            quality: formData.quality,
            status: formData.status
          } : e)
        };
      }));
      showCinemaAlert(`Đã cập nhật ${finalName}!`, 'cinema');
    } else {
      // Add new
      const newEp: EpisodeItem = {
        id: `ep-${Date.now()}`,
        episodeNumber: num,
        name: finalName,
        slug,
        linkM3u8: formData.linkM3u8.trim(),
        linkEmbed: formData.linkEmbed.trim(),
        quality: formData.quality,
        status: formData.status
      };

      setServers(prev => prev.map(s => {
        if (s.id !== activeServerId) return s;
        return { ...s, episodes: [...s.episodes, newEp] };
      }));
      showCinemaAlert(`Đã thêm ${finalName}!`, 'cinema');
    }

    setIsFormModalOpen(false);
  };

  // Batch Import
  const handleBatchImport = () => {
    if (!batchText.trim()) return;

    const lines = batchText.split('\n').filter(l => l.trim().length > 0);
    const parsedEpisodes: EpisodeItem[] = [];

    lines.forEach((line, index) => {
      const parts = line.split('|').map(p => p.trim());
      let parsedNum = `${index + 1}`;
      let parsedName = `Tập ${index + 1}`;
      let parsedUrl = '';

      if (parts.length >= 2) {
        parsedName = parts[0];
        parsedNum = parts[0].replace(/[^0-9]/g, '') || `${index + 1}`;
        parsedUrl = parts[1];
      } else {
        parsedUrl = parts[0];
      }

      parsedEpisodes.push({
        id: `ep-batch-${Date.now()}-${index}`,
        episodeNumber: parsedNum,
        name: parsedName,
        slug: `tap-${parsedNum}`.toLowerCase(),
        linkM3u8: parsedUrl.endsWith('.m3u8') ? parsedUrl : '',
        linkEmbed: !parsedUrl.endsWith('.m3u8') ? parsedUrl : '',
        quality: '1080p',
        status: 'ACTIVE'
      });
    });

    if (parsedEpisodes.length > 0) {
      setServers(prev => prev.map(s => {
        if (s.id !== activeServerId) return s;
        return { ...s, episodes: [...s.episodes, ...parsedEpisodes] };
      }));

      showCinemaAlert(`Đã nhập thành công ${parsedEpisodes.length} tập phim hàng loạt!`, 'cinema');
      setBatchText('');
      setIsBatchModalOpen(false);
    }
  };

  // Delete Episode
  const handleDeleteEpisode = (epId: string, name: string) => {
    setServers(prev => prev.map(s => {
      if (s.id !== activeServerId) return s;
      return { ...s, episodes: s.episodes.filter(e => e.id !== epId) };
    }));

    if (testPlayingEp?.id === epId) setTestPlayingEp(null);
    showCinemaAlert(`Đã xóa ${name}`, 'warning');
  };

  // Add Server
  const handleAddNewServer = () => {
    const srvIndex = servers.length + 1;
    const newServer: ServerGroup = {
      id: `srv-${Date.now()}`,
      name: `Server Mới #${srvIndex} (Dự phòng)`,
      serverType: 'HLS',
      episodes: []
    };

    setServers(prev => [...prev, newServer]);
    setActiveServerId(newServer.id);
    showCinemaAlert(`Đã tạo ${newServer.name}!`, 'cinema');
  };

  // Render Status Interactive Button
  const renderStatusButton = (ep: EpisodeItem) => {
    const isMenuOpen = openStatusMenuId === ep.id;

    return (
      <div className={styles.statusButtonWrapper} ref={isMenuOpen ? statusMenuRef : null}>
        <button
          type="button"
          className={`${styles.interactiveStatusBtn} ${
            ep.status === 'ACTIVE' ? styles.statusActive :
            ep.status === 'PROCESSING' ? styles.statusProcessing :
            ep.status === 'ERROR' ? styles.statusError :
            styles.statusDisabled
          }`}
          title="Bấm để chuyển đổi trạng thái tập"
          onClick={(e) => {
            e.stopPropagation();
            setOpenStatusMenuId(isMenuOpen ? null : ep.id);
          }}
        >
          {ep.status === 'ACTIVE' && <FaCheckCircle />}
          {ep.status === 'PROCESSING' && <FaClock />}
          {ep.status === 'ERROR' && <FaExclamationTriangle />}
          {ep.status === 'DISABLED' && <FaBan />}
          <span>
            {ep.status === 'ACTIVE' && 'Hoạt động'}
            {ep.status === 'PROCESSING' && 'Đang xử lý'}
            {ep.status === 'ERROR' && 'Lỗi link'}
            {ep.status === 'DISABLED' && 'Tạm ẩn'}
          </span>
          <FaChevronDown className={styles.statusChevron} />
        </button>

        {isMenuOpen && (
          <div className={styles.statusMenu}>
            <button
              type="button"
              className={styles.statusMenuItem}
              onClick={() => handleSetStatus(ep.id, 'ACTIVE')}
            >
              <FaCheckCircle style={{ color: '#4ade80' }} /> Hoạt động
            </button>
            <button
              type="button"
              className={styles.statusMenuItem}
              onClick={() => handleSetStatus(ep.id, 'PROCESSING')}
            >
              <FaClock style={{ color: '#60a5fa' }} /> Đang xử lý
            </button>
            <button
              type="button"
              className={styles.statusMenuItem}
              onClick={() => handleSetStatus(ep.id, 'ERROR')}
            >
              <FaExclamationTriangle style={{ color: '#f87171' }} /> Lỗi link
            </button>
            <button
              type="button"
              className={styles.statusMenuItem}
              onClick={() => handleSetStatus(ep.id, 'DISABLED')}
            >
              <FaBan style={{ color: '#9ca3af' }} /> Tạm ẩn
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* MAIN POPUP */}
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIconBox}>
                <FaFilm />
              </div>
              <div>
                <h2 className={styles.movieTitle}>
                  Quản Lý Tập Phim: <span>{movie.name}</span>
                </h2>
                <div className={styles.movieSub}>
                  {movie.origin_name && `${movie.origin_name} • `}
                  /{movie.slug || 'phim'}
                </div>
              </div>
            </div>

            <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* ROW 1: SLIM SERVER & RANGE NAVIGATION (34px height) */}
            <div className={styles.serverAndRangeBar}>
              <div className={styles.serverSectionLeft}>
                {servers.map(server => (
                  <button
                    key={server.id}
                    type="button"
                    className={`${styles.serverTab} ${server.id === activeServerId ? styles.serverTabActive : ''}`}
                    onClick={() => {
                      setActiveServerId(server.id);
                      setTestPlayingEp(null);
                    }}
                  >
                    <FaServer style={{ fontSize: '0.72rem', color: server.id === activeServerId ? '#e50914' : '#9ca3af' }} />
                    <span>{server.name}</span>
                    <span className={styles.serverBadgeCount}>
                      {server.episodes.length}
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  className={styles.addServerBtn}
                  onClick={handleAddNewServer}
                  title="Thêm máy chủ phát dự phòng"
                >
                  <FaPlus /> Server
                </button>
              </div>

              {/* Dải tập (Range Chunks) - Right side of row 1 */}
              {episodeRanges.length > 0 && (
                <div className={styles.rangeSectionRight}>
                  <span className={styles.rangeLabel}>
                    <FaLayerGroup style={{ color: '#e50914' }} /> Dải:
                  </span>
                  <select
                    className={styles.rangeSelect}
                    value={activeRange}
                    onChange={(e) => setActiveRange(e.target.value)}
                    title="Chọn phân đoạn tập phim"
                  >
                    <option value="ALL">Tất cả ({activeServer?.episodes.length} tập)</option>
                    {episodeRanges.map(rg => (
                      <option key={rg.rangeKey} value={rg.rangeKey}>
                        {rg.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Test Player Banner (If active) */}
            {testPlayingEp && (
              <div className={styles.testPlayerCard}>
                <div className={styles.testPlayerHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaPlay style={{ color: '#e50914', fontSize: '0.75rem' }} />
                    <strong>Kiểm tra phát: {testPlayingEp.name} ({activeServer?.name})</strong>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => setTestPlayingEp(null)}
                  >
                    <FaTimes /> Đóng Test
                  </button>
                </div>

                <div className={styles.testVideoPlaceholder}>
                  <FaPlay style={{ fontSize: '1.8rem', color: '#e50914' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#38bdf8', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {testPlayingEp.linkM3u8 || testPlayingEp.linkEmbed || 'Không có stream URL'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                    Đang giả lập luồng phát Video Stream HLS độ phân giải {testPlayingEp.quality || '1080p'}
                  </span>
                </div>
              </div>
            )}

            {/* ROW 2: COMPACT ACTION & FILTER TOOLBAR (38px height) */}
            <div className={styles.actionToolbar}>
              <div className={styles.toolbarLeft}>
                <button
                  type="button"
                  className={styles.primaryAddEpBtn}
                  onClick={handleOpenAddForm}
                >
                  <FaPlus /> Thêm Tập
                </button>

                <button
                  type="button"
                  className={styles.secondaryBatchBtn}
                  onClick={() => setIsBatchModalOpen(true)}
                >
                  <FaPaste /> Nhập Hàng Loạt
                </button>
              </div>

              {/* Center: Compact Status Filter Dropdown & Quick Error Toggle */}
              <div className={styles.toolbarCenter} ref={filterMenuRef}>
                <button
                  type="button"
                  className={styles.statusFilterBtn}
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  title="Lọc danh sách tập theo trạng thái"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {statusFilter === 'ALL' && <span>Trạng thái: <strong>Tất cả ({totalEpisodesCount})</strong></span>}
                    {statusFilter === 'ACTIVE' && <span><FaCheckCircle style={{ color: '#4ade80' }} /> Hoạt động ({activeCount})</span>}
                    {statusFilter === 'PROCESSING' && <span><FaClock style={{ color: '#60a5fa' }} /> Đang xử lý ({processingCount})</span>}
                    {statusFilter === 'ERROR' && <span><FaExclamationTriangle style={{ color: '#ef4444' }} /> Lỗi link ({errorCount})</span>}
                    {statusFilter === 'DISABLED' && <span><FaBan style={{ color: '#9ca3af' }} /> Tạm ẩn ({disabledCount})</span>}
                  </span>
                  <FaChevronDown style={{ fontSize: '0.65rem', marginLeft: '0.2rem' }} />
                </button>

                {isFilterMenuOpen && (
                  <div className={styles.statusMenu} style={{ top: 34, left: 0, minWidth: 175, zIndex: 50 }}>
                    <button
                      type="button"
                      className={styles.statusMenuItem}
                      onClick={() => { setStatusFilter('ALL'); setIsFilterMenuOpen(false); }}
                    >
                      Tất cả ({totalEpisodesCount})
                    </button>
                    <button
                      type="button"
                      className={styles.statusMenuItem}
                      onClick={() => { setStatusFilter('ACTIVE'); setIsFilterMenuOpen(false); }}
                    >
                      <FaCheckCircle style={{ color: '#4ade80' }} /> Hoạt động ({activeCount})
                    </button>
                    {processingCount > 0 && (
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => { setStatusFilter('PROCESSING'); setIsFilterMenuOpen(false); }}
                      >
                        <FaClock style={{ color: '#60a5fa' }} /> Đang xử lý ({processingCount})
                      </button>
                    )}
                    {errorCount > 0 && (
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => { setStatusFilter('ERROR'); setIsFilterMenuOpen(false); }}
                      >
                        <FaExclamationTriangle style={{ color: '#ef4444' }} /> Lỗi link ({errorCount})
                      </button>
                    )}
                    {disabledCount > 0 && (
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => { setStatusFilter('DISABLED'); setIsFilterMenuOpen(false); }}
                      >
                        <FaBan style={{ color: '#9ca3af' }} /> Tạm ẩn ({disabledCount})
                      </button>
                    )}
                  </div>
                )}

                {/* 1-Click Quick Error Filter Button if errors exist */}
                {errorCount > 0 && (
                  <button
                    type="button"
                    className={`${styles.quickErrorBtn} ${statusFilter === 'ERROR' ? styles.quickErrorBtnActive : ''}`}
                    onClick={() => setStatusFilter(statusFilter === 'ERROR' ? 'ALL' : 'ERROR')}
                    title="Nhấn để chỉ lọc các tập bị lỗi link"
                  >
                    <FaExclamationTriangle />
                    <span>{errorCount} lỗi</span>
                  </button>
                )}
              </div>

              <div className={styles.toolbarRight}>
                {/* Search Box */}
                <div className={styles.searchBox}>
                  <FaSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Tìm tập..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', paddingRight: '0.3rem' }}
                      onClick={() => setSearchTerm('')}
                    >
                      <FaTimes style={{ fontSize: '0.75rem' }} />
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className={styles.viewModeToggle}>
                  <button
                    type="button"
                    className={`${styles.viewModeBtn} ${viewMode === 'grid' ? styles.viewModeBtnActive : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Xem dạng Lưới Thẻ"
                  >
                    <FaTh />
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.viewModeBtnActive : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Xem dạng Bảng"
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Action Floating Bar (Visible when items selected) */}
            {selectedEpIds.length > 0 && (
              <div className={styles.bulkActionBar}>
                <div className={styles.bulkLeft}>
                  <input
                    type="checkbox"
                    className={styles.customCheckbox}
                    checked={isAllCurrentPageSelected}
                    onChange={handleToggleSelectAllPage}
                    title="Chọn tất cả tập trong trang hiện tại"
                  />
                  <span>Đã chọn:</span>
                  <span className={styles.bulkCountTag}>{selectedEpIds.length} tập</span>
                  <button
                    type="button"
                    className={styles.filterPill}
                    onClick={() => setSelectedEpIds([])}
                  >
                    Bỏ chọn
                  </button>
                  {selectedEpIds.length < totalFilteredCount && (
                    <button
                      type="button"
                      className={styles.filterPill}
                      onClick={() => setSelectedEpIds(filteredEpisodes.map(e => e.id))}
                    >
                      Chọn tất cả {totalFilteredCount} tập
                    </button>
                  )}
                </div>

                <div className={styles.bulkRight} ref={bulkMenuRef}>
                  <button
                    type="button"
                    className={styles.bulkActionBtn}
                    onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
                  >
                    <span>Đổi trạng thái</span>
                    <FaChevronDown style={{ fontSize: '0.7rem' }} />
                  </button>

                  {isBulkMenuOpen && (
                    <div className={styles.statusMenu} style={{ right: 80, minWidth: 150 }}>
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => handleBulkChangeStatus('ACTIVE')}
                      >
                        <FaCheckCircle style={{ color: '#4ade80' }} /> Hoạt động
                      </button>
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => handleBulkChangeStatus('PROCESSING')}
                      >
                        <FaClock style={{ color: '#60a5fa' }} /> Đang xử lý
                      </button>
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => handleBulkChangeStatus('ERROR')}
                      >
                        <FaExclamationTriangle style={{ color: '#f87171' }} /> Báo lỗi link
                      </button>
                      <button
                        type="button"
                        className={styles.statusMenuItem}
                        onClick={() => handleBulkChangeStatus('DISABLED')}
                      >
                        <FaBan style={{ color: '#9ca3af' }} /> Tạm ẩn
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className={`${styles.bulkActionBtn} ${styles.bulkDeleteBtn}`}
                    onClick={handleBulkDelete}
                    title="Xóa toàn bộ các tập đã chọn"
                  >
                    <FaTrash />
                    <span>Xóa ({selectedEpIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* MAIN CONTENT: Episodes List or Grid */}
            {totalFilteredCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280', background: '#0a0a0c', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <FaFilm style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.95rem' }}>Không tìm thấy tập phim nào</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {searchTerm || statusFilter !== 'ALL' || activeRange !== 'ALL'
                    ? 'Không có tập nào khớp với bộ lọc hiện tại. Hãy xóa từ khóa hoặc chọn "Tất cả".'
                    : 'Hãy bấm "+ Thêm Tập Mới" hoặc "Nhập Hàng Loạt" để bắt đầu.'}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className={styles.episodesGrid}>
                {paginatedEpisodes.map(ep => {
                  const isSelected = selectedEpIds.includes(ep.id);
                  const isHighlighted = highlightEpId === ep.id;
                  const hasLink = Boolean(ep.linkM3u8 || ep.linkEmbed);

                  const cleanName = ep.name.trim();
                  const isBasicName = /^Tập\s*\d+(\s*[-:]*\s*Chương\s*\d+)?$/i.test(cleanName);
                  const subTitle = isBasicName ? '' : cleanName.replace(/^Tập\s*\d+[\s:–-]*/i, '').trim();

                  return (
                    <div
                      key={ep.id}
                      className={styles.episodeCard}
                      style={{
                        borderColor: isHighlighted
                          ? '#e50914'
                          : isSelected
                          ? 'rgba(229, 9, 20, 0.5)'
                          : undefined
                      }}
                      title={`${ep.name}${hasLink ? ` • ${ep.linkM3u8 || ep.linkEmbed}` : ' • Chưa có link'}`}
                    >
                      <div className={styles.cardLeftGroup}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={isSelected}
                          onChange={() => handleToggleSelectEp(ep.id)}
                          title="Chọn tập này"
                        />
                        <span
                          className={hasLink ? styles.streamDotActive : styles.streamDotMissing}
                          title={hasLink ? 'Đã có stream URL' : 'Chưa có stream URL'}
                        />
                        <span className={styles.cardEpTitle}>
                          Tập {ep.episodeNumber}
                          {subTitle && <span className={styles.cardEpSubname}>• {subTitle}</span>}
                        </span>
                      </div>

                      <div className={styles.cardRightGroup}>
                        {renderStatusButton(ep)}
                        <div className={styles.cardActionGroup}>
                          <button
                            type="button"
                            className={`${styles.miniActionBtn} ${styles.miniActionBtnPlay}`}
                            title="Phát thử tập này"
                            onClick={() => setTestPlayingEp(ep)}
                            disabled={!hasLink}
                            style={{ opacity: hasLink ? 1 : 0.35 }}
                          >
                            <FaPlay />
                          </button>
                          <button
                            type="button"
                            className={styles.miniActionBtn}
                            title="Sao chép link stream"
                            onClick={() => {
                              const link = ep.linkM3u8 || ep.linkEmbed || '';
                              if (link) {
                                navigator.clipboard.writeText(link);
                                showCinemaAlert('Đã sao chép link stream!', 'cinema');
                              } else {
                                showCinemaAlert('Tập này chưa có link stream!', 'warning');
                              }
                            }}
                          >
                            <FaCopy />
                          </button>
                          <button
                            type="button"
                            className={styles.miniActionBtn}
                            title="Chỉnh sửa tập này"
                            onClick={() => handleOpenEditForm(ep)}
                          >
                            <FaPen />
                          </button>
                          <button
                            type="button"
                            className={`${styles.miniActionBtn} ${styles.miniActionBtnDelete}`}
                            title="Xóa tập này"
                            onClick={() => handleDeleteEpisode(ep.id, ep.name)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* CLEAN LIST VIEW */
              <div className={styles.epTableCard}>
                <table className={styles.cleanTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>
                        <input
                          type="checkbox"
                          className={styles.customCheckbox}
                          checked={isAllCurrentPageSelected}
                          onChange={handleToggleSelectAllPage}
                          title="Chọn tất cả trên trang này"
                        />
                      </th>
                      <th style={{ width: '30%' }}>Tập Phim</th>
                      <th style={{ width: '25%' }}>Nguồn Stream</th>
                      <th style={{ width: '20%' }}>Trạng Thái</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEpisodes.map(ep => {
                      const isSelected = selectedEpIds.includes(ep.id);
                      const isHighlighted = highlightEpId === ep.id;
                      const hasLink = Boolean(ep.linkM3u8 || ep.linkEmbed);

                      const cleanName = ep.name.trim();
                      const isBasicName = /^Tập\s*\d+(\s*[-:]*\s*Chương\s*\d+)?$/i.test(cleanName);
                      const subTitle = isBasicName ? '' : cleanName.replace(/^Tập\s*\d+[\s:–-]*/i, '').trim();

                      return (
                        <tr
                          key={ep.id}
                          style={{
                            background: isHighlighted
                              ? 'rgba(229, 9, 20, 0.12)'
                              : isSelected
                              ? 'rgba(229, 9, 20, 0.05)'
                              : undefined
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className={styles.customCheckbox}
                              checked={isSelected}
                              onChange={() => handleToggleSelectEp(ep.id)}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span
                                className={hasLink ? styles.streamDotActive : styles.streamDotMissing}
                                title={hasLink ? 'Đã có stream' : 'Chưa có stream'}
                              />
                              <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.84rem' }}>
                                Tập {ep.episodeNumber}
                              </span>
                              {subTitle && (
                                <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>
                                  • {subTitle}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {ep.linkM3u8 ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '0.15rem 0.45rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                HLS Stream
                              </span>
                            ) : ep.linkEmbed ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '0.15rem 0.45rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                Video Embed
                              </span>
                            ) : (
                              <span style={{ color: '#f87171', fontSize: '0.75rem' }}>
                                Chưa có link
                              </span>
                            )}
                          </td>
                          <td>
                            {renderStatusButton(ep)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className={styles.cardActionGroup} style={{ justifyContent: 'center' }}>
                              <button
                                type="button"
                                className={`${styles.miniActionBtn} ${styles.miniActionBtnPlay}`}
                                title="Phát thử"
                                onClick={() => setTestPlayingEp(ep)}
                                disabled={!hasLink}
                                style={{ opacity: hasLink ? 1 : 0.35 }}
                              >
                                <FaPlay />
                              </button>
                              <button
                                type="button"
                                className={styles.miniActionBtn}
                                title="Sửa chi tiết"
                                onClick={() => handleOpenEditForm(ep)}
                              >
                                <FaPen />
                              </button>
                              <button
                                type="button"
                                className={`${styles.miniActionBtn} ${styles.miniActionBtnDelete}`}
                                title="Xóa"
                                onClick={() => handleDeleteEpisode(ep.id, ep.name)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Bar */}
            {totalFilteredCount > 0 && (
              <div className={styles.paginationBar}>
                <div className={styles.paginationInfo}>
                  <span>
                    Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, totalFilteredCount)} - {Math.min(currentPage * pageSize, totalFilteredCount)}</strong> trong tổng số <strong>{totalFilteredCount}</strong> tập
                  </span>

                  <span style={{ color: '#4b5563' }}>•</span>

                  <span>Mỗi trang:</span>
                  <select
                    className={styles.pageSizeSelect}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={12}>12 tập</option>
                    <option value={24}>24 tập</option>
                    <option value={48}>48 tập</option>
                    <option value={96}>96 tập</option>
                    <option value={0}>Tất cả</option>
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      title="Trang đầu"
                    >
                      <FaAngleDoubleLeft />
                    </button>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      title="Trang trước"
                    >
                      <FaChevronLeft />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span style={{ color: '#6b7280', fontSize: '0.75rem', padding: '0 2px' }}>...</span>
                            )}
                            <button
                              type="button"
                              className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      title="Trang sau"
                    >
                      <FaChevronRight />
                    </button>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      title="Trang cuối"
                    >
                      <FaAngleDoubleRight />
                    </button>

                    {/* Quick Jump Input */}
                    <form onSubmit={handleJumpToEpisode} className={styles.pageJumpBox} title="Nhập số tập để nhảy thẳng tới tập đó">
                      <span>Đến tập:</span>
                      <input
                        type="text"
                        placeholder="#"
                        value={jumpInput}
                        onChange={(e) => setJumpInput(e.target.value)}
                        className={styles.pageJumpInput}
                      />
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button className={styles.doneBtn} onClick={onClose}>
              Hoàn Tất & Đóng
            </button>
          </div>
        </div>
      </div>

      {/* POPUP CON 1: EPISODE FORM SUB-MODAL */}
      {isFormModalOpen && (
        <EpisodeFormSubModal
          isOpen={isFormModalOpen}
          initialData={editingEpisode}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveEpisode}
        />
      )}

      {/* POPUP CON 2: BATCH IMPORT SUB-MODAL */}
      {isBatchModalOpen && (
        <BatchImportSubModal
          isOpen={isBatchModalOpen}
          batchText={batchText}
          setBatchText={setBatchText}
          onClose={() => setIsBatchModalOpen(false)}
          onImport={handleBatchImport}
        />
      )}
    </>
  );
}

// Sub-component 1: Single Episode Add / Edit Modal (Popup Con)
interface EpisodeFormSubModalProps {
  isOpen: boolean;
  initialData: EpisodeItem | null;
  onClose: () => void;
  onSave: (data: {
    episodeNumber: string;
    name: string;
    linkM3u8: string;
    linkEmbed: string;
    quality: string;
    status: EpisodeStatus;
  }) => void;
}

function EpisodeFormSubModal({
  isOpen,
  initialData,
  onClose,
  onSave
}: EpisodeFormSubModalProps) {
  const [episodeNumber, setEpisodeNumber] = useState(initialData ? String(initialData.episodeNumber) : '');
  const [name, setName] = useState(initialData ? initialData.name : '');
  const [linkM3u8, setLinkM3u8] = useState(initialData ? initialData.linkM3u8 : '');
  const [linkEmbed, setLinkEmbed] = useState(initialData?.linkEmbed || '');
  const [quality, setQuality] = useState(initialData?.quality || '1080p');
  const [status, setStatus] = useState<EpisodeStatus>(initialData?.status || 'ACTIVE');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeNumber.trim()) return;

    onSave({
      episodeNumber,
      name,
      linkM3u8,
      linkEmbed,
      quality,
      status
    });
  };

  return (
    <div className={styles.subModalOverlay} onClick={onClose}>
      <div className={styles.subModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h3 className={styles.subModalTitle}>
            {initialData ? `Chỉnh Sửa: ${initialData.name}` : 'Thêm Tập Phim Mới'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.subModalBody}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số Tập *</label>
                <input
                  type="text"
                  placeholder="VD: 1"
                  className={styles.formInput}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên Hiển Thị</label>
                <input
                  type="text"
                  placeholder="VD: Tập 1 - Khởi Đầu"
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Link Stream HLS (.m3u8)</label>
              <input
                type="url"
                placeholder="https://stream.server.vn/dune2/ep1/index.m3u8"
                className={styles.formInput}
                value={linkM3u8}
                onChange={(e) => setLinkM3u8(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Link Embed Player (Iframe)</label>
              <input
                type="url"
                placeholder="https://hydra.stream/embed/dune2-ep1"
                className={styles.formInput}
                value={linkEmbed}
                onChange={(e) => setLinkEmbed(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Chất Lượng Video</label>
                <select
                  className={styles.formSelect}
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="4K">4K Ultra HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Trạng Thái Ban Đầu</label>
                <select
                  className={styles.formSelect}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EpisodeStatus)}
                >
                  <option value="ACTIVE">Hoạt động (Sẵn sàng)</option>
                  <option value="PROCESSING">Đang xử lý / render</option>
                  <option value="ERROR">Báo hỏng / lỗi link</option>
                  <option value="DISABLED">Tạm ẩn</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.subModalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Hủy Bỏ
            </button>
            <button type="submit" className={styles.submitBtn}>
              {initialData ? 'Lưu Thay Đổi' : 'Thêm Vào Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Sub-component 2: Batch Import Modal (Popup Con)
interface BatchImportSubModalProps {
  isOpen: boolean;
  batchText: string;
  setBatchText: (text: string) => void;
  onClose: () => void;
  onImport: () => void;
}

function BatchImportSubModal({
  isOpen,
  batchText,
  setBatchText,
  onClose,
  onImport
}: BatchImportSubModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.subModalOverlay} onClick={onClose}>
      <div className={styles.subModalContent} style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.subModalHeader}>
          <h3 className={styles.subModalTitle}>
            Nhập Danh Sách Tập Hàng Loạt
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.subModalBody}>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Mỗi tập một dòng theo định dạng: <code style={{ color: '#f87171', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>Tên Tập|URL Stream</code> hoặc chỉ dán <code style={{ color: '#60a5fa', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>URL</code>.
          </div>

          <textarea
            className={styles.batchTextarea}
            placeholder={`Tập 1|https://stream.cinema.vn/ep1.m3u8\nTập 2|https://stream.cinema.vn/ep2.m3u8\nTập 3|https://stream.cinema.vn/ep3.m3u8`}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
          />
        </div>

        <div className={styles.subModalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Hủy Bỏ
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={onImport}
            disabled={!batchText.trim()}
          >
            Tiến Hành Nhập Dữ Liệu
          </button>
        </div>
      </div>
    </div>
  );
}
