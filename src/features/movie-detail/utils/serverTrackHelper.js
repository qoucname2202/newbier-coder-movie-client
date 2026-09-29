/**
 * @file serverTrackHelper.js
 * @description Helper to parse, classify, and group server / audio stream tracks (Vietsub, Thuyết Minh, Lồng Tiếng).
 * Eliminates duplicate buttons and enables hover-to-select multiple sources (Nguồn 1, Nguồn 2).
 */

export function parseServerTrack(serverName = '', index = 0) {
  const raw = String(serverName || '').trim();
  const lower = raw.toLowerCase();

  let type = 'server';
  let title = 'Bản Chuẩn';
  let icon = 'fas fa-play-circle';
  let badge = '';

  if (lower.includes('thuyết minh') || lower.includes('thuyet minh')) {
    type = 'voice';
    title = 'Thuyết Minh';
    icon = 'fas fa-microphone-alt';
    const match = raw.match(/#\s*(\d+)|\b(\d+)\b/);
    if (match) badge = `#${match[1] || match[2]}`;
  } else if (lower.includes('lồng tiếng') || lower.includes('long tieng')) {
    type = 'dub';
    title = 'Lồng Tiếng';
    icon = 'fas fa-headset';
    const match = raw.match(/#\s*(\d+)|\b(\d+)\b/);
    if (match) badge = `#${match[1] || match[2]}`;
  } else if (lower.includes('vietsub') || lower.includes('phụ đề') || lower.includes('sub')) {
    type = 'sub';
    title = 'Vietsub';
    icon = 'fas fa-closed-captioning';
    const match = raw.match(/#\s*(\d+)|\b(\d+)\b/);
    if (match) badge = `#${match[1] || match[2]}`;
  } else if (raw) {
    const match = raw.match(/#\s*(\d+)|\b(\d+)\b/);
    if (match) badge = `#${match[1] || match[2]}`;
    const cleaned = raw.replace(/#\s*\d+/g, '').trim();
    title = cleaned || `Server ${index + 1}`;
  } else {
    title = `Server ${index + 1}`;
  }

  return {
    type,
    title,
    badge,
    icon,
    displayName: badge ? `${title} ${badge}` : title,
    rawName: raw || `Server ${index + 1}`
  };
}

/**
 * Groups an array of raw servers by audio version (Vietsub, Thuyết Minh, Lồng Tiếng).
 * Each group has 1 or more sources (Nguồn 1, Nguồn 2) to prevent duplicate buttons.
 *
 * @param {Array<Object>} [servers=[]]
 * @returns {Array<Object>} Grouped track list
 */
export function groupServersByTrack(servers = []) {
  if (!Array.isArray(servers) || servers.length === 0) return [];

  const groupMap = new Map();

  servers.forEach((srv, index) => {
    const raw = String(srv?.server_name || '').trim();
    const lower = raw.toLowerCase();

    let key = 'server';
    let label = 'Bản Chuẩn';
    let icon = 'fas fa-play-circle';

    if (lower.includes('thuyết minh') || lower.includes('thuyet minh')) {
      key = 'thuyet-minh';
      label = 'Thuyết Minh';
      icon = 'fas fa-microphone-alt';
    } else if (lower.includes('lồng tiếng') || lower.includes('long tieng')) {
      key = 'long-tieng';
      label = 'Lồng Tiếng';
      icon = 'fas fa-headset';
    } else if (lower.includes('vietsub') || lower.includes('phụ đề') || lower.includes('sub')) {
      key = 'vietsub';
      label = 'Vietsub';
      icon = 'fas fa-closed-captioning';
    } else if (raw) {
      const match = raw.match(/#\s*(\d+)|\b(\d+)\b/);
      if (match) {
        key = 'server-general';
        label = 'Nguồn Phát';
        icon = 'fas fa-server';
      } else {
        key = `custom-${raw.toLowerCase()}`;
        label = raw;
      }
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        label,
        icon,
        sources: []
      });
    }

    const group = groupMap.get(key);
    const sourceCount = group.sources.length + 1;
    const sourceLabel = sourceCount === 1 ? `Nguồn 1 (Chính)` : `Nguồn ${sourceCount} (Dự phòng)`;

    group.sources.push({
      originalIndex: index,
      serverName: raw || `Server ${index + 1}`,
      sourceLabel,
      shortLabel: `Nguồn ${sourceCount}`,
      sourceNumber: sourceCount
    });
  });

  return Array.from(groupMap.values());
}
