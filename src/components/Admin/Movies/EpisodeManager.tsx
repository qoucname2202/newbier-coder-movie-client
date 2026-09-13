import React, { useState } from 'react';
import { FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa';
import styles from '@/styles/AdminMoviesEnhanced.module.css';

// Interface cho dữ liệu tập phim
interface Episode {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

// Interface cho dữ liệu server
interface ServerData {
  server_name: string;
  server_data: Episode[];
}

interface EpisodeManagerProps {
  episodes: ServerData[];
  onAddServer: () => void;
  onRemoveServer: (index: number) => void;
  onServerNameChange: (index: number, name: string) => void;
  onAddEpisode: (serverIndex: number) => void;
  onRemoveEpisode: (serverIndex: number, episodeIndex: number) => void;
  onUpdateEpisode: (serverIndex: number, episodeIndex: number, field: keyof Episode, value: string) => void;
}

const EpisodeManager: React.FC<EpisodeManagerProps> = ({
  episodes,
  onAddServer,
  onRemoveServer,
  onServerNameChange,
  onAddEpisode,
  onRemoveEpisode,
  onUpdateEpisode
}) => {
  const [expandedServer, setExpandedServer] = useState<number | null>(0);

  const toggleServer = (index: number) => {
    setExpandedServer(expandedServer === index ? null : index);
  };

  return (
    <div className={styles.formCard}>
      <div className={`${styles.formCardHeader} ${styles.blue}`}>
        <h3>Quản lý tập phim</h3>
        <button
          type="button"
          className={styles.navButtonNext}
          onClick={onAddServer}
        >
          <FaPlus className="mr-2" /> Thêm server
        </button>
      </div>
      <div className={styles.formCardBody}>
        {episodes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <FaPlus />
            </div>
            <p>Chưa có server nào được thêm</p>
            <button
              type="button"
              className={styles.navButtonNext}
              onClick={onAddServer}
            >
              <FaPlus className="mr-2" /> Thêm server đầu tiên
            </button>
          </div>
        ) : (
          <div className={styles.serverList}>
            {episodes.map((server, serverIndex) => (
              <div className={styles.serverCard} key={serverIndex}>
                <div className={styles.serverHeader}>
                  <div className={styles.serverNameInput}>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={server.server_name}
                      onChange={(e) => onServerNameChange(serverIndex, e.target.value)}
                      placeholder="Tên server"
                      aria-label="Tên server"
                    />
                  </div>                  <div className={styles.serverActions}>
                    <button
                      type="button"
                      className={styles.serverToggle}
                      onClick={() => toggleServer(serverIndex)}
                      title={expandedServer === serverIndex ? "Thu gọn" : "Mở rộng"}
                    >
                      <FaChevronDown className={expandedServer === serverIndex ? styles.iconRotated : ''} />
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => onRemoveServer(serverIndex)}
                      title="Xóa server này"
                    >
                      <FaTrash /> Xóa
                    </button>
                  </div>
                </div>
                
                {expandedServer === serverIndex && (
                  <div className={styles.serverContent}>
                    <table className={styles.episodeTable}>
                      <thead>
                        <tr>
                          <th>Tên tập</th>
                          <th>Slug</th>
                          <th>Link nhúng</th>
                          <th>Link m3u8</th>
                          <th className={styles.actionColumn}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {server.server_data.map((episode, episodeIndex) => (
                          <tr key={episodeIndex}>
                            <td>
                              <input
                                type="text"
                                className={styles.episodeInput}
                                value={episode.name}
                                onChange={(e) => onUpdateEpisode(serverIndex, episodeIndex, 'name', e.target.value)}
                                placeholder="Tên tập phim"
                                aria-label="Tên tập phim"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.episodeInput}
                                value={episode.slug}
                                onChange={(e) => onUpdateEpisode(serverIndex, episodeIndex, 'slug', e.target.value)}
                                placeholder="Slug của tập phim"
                                aria-label="Slug của tập phim"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.episodeInput}
                                value={episode.link_embed}
                                onChange={(e) => onUpdateEpisode(serverIndex, episodeIndex, 'link_embed', e.target.value)}
                                placeholder="Link nhúng"
                                aria-label="Link nhúng"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.episodeInput}
                                value={episode.link_m3u8}
                                onChange={(e) => onUpdateEpisode(serverIndex, episodeIndex, 'link_m3u8', e.target.value)}
                                placeholder="Link m3u8"
                                aria-label="Link m3u8"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.deleteButton}
                                onClick={() => onRemoveEpisode(serverIndex, episodeIndex)}
                                disabled={server.server_data.length <= 1}
                                title="Xóa tập phim này"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className={styles.episodeActions}>                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={() => onAddEpisode(serverIndex)}
                      >
                        <FaPlus /> Thêm tập
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {episodes.length > 0 && (
        <div className={styles.formCardFooter}>
          <button
            type="button"
            className={styles.addButton}
            onClick={onAddServer}
          >
            <FaPlus className="mr-2" /> Thêm server mới
          </button>
        </div>
      )}
    </div>
  );
};

export default EpisodeManager;
