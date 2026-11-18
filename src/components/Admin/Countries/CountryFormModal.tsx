// src/components/Admin/Countries/CountryFormModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FaTimes,
  FaMagic,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaFlag,
} from 'react-icons/fa';
import styles from '@/styles/AdminTaxonomies.module.css';
import type { TaxonomyItem } from '@/components/Admin/Taxonomies/TaxonomyFormModal';
import type { CountryLookupResult } from '@/pages/api/admin/countries/lookup';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Debounce delay (ms) before auto-lookup fires after the user stops typing. */
const AUTOLOOKUP_DEBOUNCE_MS = 700;

/** Minimum query length before triggering an auto-lookup. */
const AUTOLOOKUP_MIN_LENGTH = 2;

/**
 * Derives a PNG flag image URL from an ISO alpha-2 code using the
 * restcountries CDN — works even when flag data was entered manually.
 * Returns empty string if the code is blank.
 */
const buildFlagUrl = (alpha2: string): string =>
  alpha2.trim().length === 2
    ? `https://flags.restcountries.com/v5/w320/${alpha2.trim().toLowerCase()}.png`
    : '';

// ─── Types ────────────────────────────────────────────────────────────────────

type LookupStatus = 'idle' | 'loading' | 'success' | 'error' | 'not_found';

export interface CountryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<TaxonomyItem>) => void;
  initialData?: TaxonomyItem | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts a display name to a URL-safe slug (handles Vietnamese diacritics). */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Calls the internal Next.js proxy route to look up country metadata by name.
 * The upstream bearer token is held server-side and never reaches the browser.
 */
async function fetchCountryByName(
  query: string,
  signal: AbortSignal
): Promise<CountryLookupResult | null> {
  const res = await fetch(
    '/api/admin/countries/lookup?q=' + encodeURIComponent(query),
    { signal }
  );
  const json = (await res.json()) as { success: boolean; data?: CountryLookupResult };
  return json.success && json.data ? json.data : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CountryFormModal - Modal form for creating/editing a Country entry.
 *
 * Auto-fill: typing a country name debounces a lookup request through the
 * /api/admin/countries/lookup proxy. The flag image, emoji, alpha-2 code,
 * and short description are pre-filled from the API response.
 * Manual edits are preserved. The flag image preview updates live as the
 * alpha-2 code field is changed.
 */
export default function CountryFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CountryFormModalProps) {
  // ── Form fields ──────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [code, setCode] = useState('');
  const [flag, setFlag] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSlugTouched, setIsSlugTouched] = useState(false);

  /** PNG URL for the flag preview — sourced from API or derived from code field. */
  const [flagImageUrl, setFlagImageUrl] = useState('');
  const [flagImgError, setFlagImgError] = useState(false);

  // ── Auto-fill state ───────────────────────────────────────────────────────
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupMessage, setLookupMessage] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync form with initialData ─────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '');
      setSlug(initialData.slug ?? '');
      setCode(initialData.code ?? '');
      setFlag(initialData.flag ?? '');
      setDescription(initialData.description ?? '');
      setIsActive(initialData.isActive ?? true);
      setIsSlugTouched(true);
      // Derive flag image from the existing alpha-2 code
      setFlagImageUrl(buildFlagUrl(initialData.code ?? ''));
    } else {
      setName('');
      setSlug('');
      setCode('');
      setFlag('');
      setDescription('');
      setIsActive(true);
      setIsSlugTouched(false);
      setFlagImageUrl('');
    }
    setFlagImgError(false);
    setLookupStatus('idle');
    setLookupMessage('');
  }, [initialData, isOpen]);

  // Cleanup abort + debounce on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // ── Flag preview derived from code ────────────────────────────────────────

  /** Called when the user edits the alpha-2 code field manually. */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCode(val);
    setFlagImgError(false);
    setFlagImageUrl(buildFlagUrl(val));
  };

  // ── Lookup helpers ────────────────────────────────────────────────────────

  /**
   * Applies lookup result to empty fields only — preserves user edits.
   * Also updates the flag image preview URL from the API CDN response.
   */
  const applyLookupResult = (result: CountryLookupResult) => {
    if (!code) setCode(result.alpha2);
    if (!flag) setFlag(result.flagEmoji);
    if (!description) setDescription(result.description);
    if (!isSlugTouched) setSlug(generateSlug(result.nameCommon || name));

    // Prefer the CDN URL from the API; fall back to deriving from alpha-2 code
    const imageUrl = result.flagPngUrl || buildFlagUrl(result.alpha2);
    setFlagImageUrl(imageUrl);
    setFlagImgError(false);
  };

  /** Immediate lookup triggered by the button. */
  const handleLookupNow = async () => {
    const query = name.trim();
    if (!query) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLookupStatus('loading');
    setLookupMessage('');

    try {
      const result = await fetchCountryByName(query, ctrl.signal);
      if (result) {
        applyLookupResult(result);
        setLookupStatus('success');
        setLookupMessage(`Da tim thay: ${result.nameCommon} (${result.alpha2})`);
      } else {
        setLookupStatus('not_found');
        setLookupMessage(`Khong tim thay "${query}". Ban co the nhap thu cong.`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setLookupStatus('error');
      setLookupMessage('Loi ket noi API. Vui long nhap thu cong.');
    }
  };

  // ── Name input handler (debounced auto-lookup in create mode) ─────────────
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugTouched) setSlug(generateSlug(val));

    setLookupStatus('idle');
    setLookupMessage('');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (val.trim().length < AUTOLOOKUP_MIN_LENGTH || Boolean(initialData)) return;

    debounceRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLookupStatus('loading');

      fetchCountryByName(val.trim(), ctrl.signal)
        .then((result) => {
          if (result) {
            applyLookupResult(result);
            setLookupStatus('success');
            setLookupMessage(`Da tim thay: ${result.nameCommon} (${result.alpha2})`);
          } else {
            setLookupStatus('not_found');
            setLookupMessage('Khong tim thay. Ban co the nhap thu cong.');
          }
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === 'AbortError') return;
          setLookupStatus('error');
          setLookupMessage('Loi ket noi API. Vui long nhap thu cong.');
        });
    }, AUTOLOOKUP_DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: initialData?.id,
      name: name.trim(),
      slug: slug.trim() || generateSlug(name),
      code: code.trim(),
      flag: flag.trim(),
      description: description.trim(),
      isActive,
    });
    onClose();
  };

  const isEdit = Boolean(initialData);

  const statusColor =
    lookupStatus === 'success' ? '#4ade80' :
    lookupStatus === 'not_found' ? '#f59e0b' : '#f87171';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Chinh sua quoc gia' : 'Them moi quoc gia'}
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {flagImageUrl && !flagImgError ? (
              <img
                src={flagImageUrl}
                alt="Flag preview"
                width={24}
                height={16}
                style={{ borderRadius: 3, objectFit: 'cover', flexShrink: 0 }}
                onError={() => setFlagImgError(true)}
              />
            ) : (
              <span role="img" aria-hidden="true">🌍</span>
            )}
            {isEdit ? 'Chinh Sua Quoc Gia' : 'Them Moi Quoc Gia'}
          </h3>
          <button type="button" className={styles.closeModalBtn} onClick={onClose} aria-label="Dong">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>

            {/* ── Name + auto-fill button ──────────────────────────────── */}
            <div className={styles.formGroup}>
              <label htmlFor="input-country-name" className={styles.formLabel}>
                Ten quoc gia *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="input-country-name"
                  type="text"
                  className={styles.formInput}
                  placeholder="VD: Viet Nam, United States, Canada..."
                  value={name}
                  onChange={handleNameChange}
                  required
                  autoFocus
                  style={{ flex: 1 }}
                  aria-describedby="lookup-status-msg"
                />
                <button
                  type="button"
                  onClick={handleLookupNow}
                  disabled={lookupStatus === 'loading' || !name.trim()}
                  aria-label="Tu dong dien thong tin tu API"
                  title="Tim va dien tu dong tu restcountries.com"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0 0.85rem',
                    height: '38px',
                    background: lookupStatus === 'success' ? 'rgba(74,222,128,0.12)' : 'rgba(229,9,20,0.12)',
                    border: '1px solid ' + (lookupStatus === 'success' ? 'rgba(74,222,128,0.35)' : 'rgba(229,9,20,0.35)'),
                    borderRadius: '8px',
                    color: lookupStatus === 'success' ? '#4ade80' : '#e50914',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: (lookupStatus === 'loading' || !name.trim()) ? 'not-allowed' : 'pointer',
                    opacity: !name.trim() ? 0.5 : 1,
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lookupStatus === 'loading' ? (
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                  ) : lookupStatus === 'success' ? (
                    <FaCheckCircle aria-hidden="true" />
                  ) : (
                    <FaMagic aria-hidden="true" />
                  )}
                  <span>Tu dong dien</span>
                </button>
              </div>

              {/* Status feedback */}
              {lookupMessage && (
                <div
                  id="lookup-status-msg"
                  role="status"
                  aria-live="polite"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.75rem', color: statusColor }}
                >
                  {lookupStatus === 'success'
                    ? <FaCheckCircle aria-hidden="true" />
                    : <FaExclamationCircle aria-hidden="true" />}
                  {lookupMessage}
                </div>
              )}

              {!initialData && lookupStatus === 'idle' && name.trim().length >= AUTOLOOKUP_MIN_LENGTH && (
                <span className={styles.formHint}>
                  Dang cho... hoac nhan "Tu dong dien" de tra cuu ngay.
                </span>
              )}
            </div>

            {/* ── Slug ─────────────────────────────────────────────────── */}
            <div className={styles.formGroup}>
              <label htmlFor="input-country-slug" className={styles.formLabel}>
                Ma dinh danh (Slug) *
              </label>
              <input
                id="input-country-slug"
                type="text"
                className={styles.formInput}
                placeholder="VD: viet-nam, united-states"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setIsSlugTouched(true); }}
                required
              />
              <span className={styles.formHint}>Dung lam URL tren website (tu sinh khong dau)</span>
            </div>

            {/* ── Code + Flag emoji + Flag image preview ───────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Alpha-2 code — typing here live-updates the flag preview */}
              <div className={styles.formGroup}>
                <label htmlFor="input-country-code" className={styles.formLabel}>
                  Ma Code (Alpha-2)
                </label>
                <input
                  id="input-country-code"
                  type="text"
                  className={styles.formInput}
                  placeholder="VD: VN, US, KR"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={4}
                />
              </div>

              {/* Flag emoji input with flag image preview */}
              <div className={styles.formGroup}>
                <label htmlFor="input-country-flag" className={styles.formLabel}>
                  Bieu tuong Co (Emoji)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    id="input-country-flag"
                    type="text"
                    className={styles.formInput}
                    placeholder="VD: 🇻🇳 🇺🇸"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* ── Flag image preview panel ─────────────────────────────── */}
            {(flagImageUrl || code.trim().length === 2) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  marginBottom: '0.25rem',
                }}
              >
                {/* Flag image */}
                <div
                  style={{
                    width: 96,
                    height: 64,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {flagImageUrl && !flagImgError ? (
                    <img
                      src={flagImageUrl}
                      alt={`Co ${name || code}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setFlagImgError(true)}
                    />
                  ) : (
                    <FaFlag style={{ color: '#4b5563', fontSize: '1.5rem' }} aria-hidden="true" />
                  )}
                </div>

                {/* Info text beside image */}
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
                  {!flagImgError && flagImageUrl ? (
                    <>
                      <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '0.2rem' }}>
                        Anh co hien thi
                      </div>
                      {code && <div>Code: <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{code}</span></div>}
                    </>
                  ) : (
                    <>
                      <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: '0.2rem' }}>
                        Khong tai duoc anh co
                      </div>
                      <div>Kiem tra lai Ma Code Alpha-2</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Description ──────────────────────────────────────────── */}
            <div className={styles.formGroup}>
              <label htmlFor="input-country-description" className={styles.formLabel}>
                Mo ta ngan
              </label>
              <textarea
                id="input-country-description"
                className={styles.formTextarea}
                placeholder="Mo ta tom tat ve nen dien anh cua quoc gia nay..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* ── Status toggle ─────────────────────────────────────────── */}
            <div
              className={styles.formGroup}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}
            >
              <div>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                  Trang thai hoat dong
                </label>
                <div className={styles.formHint}>
                  Cho phep hien thi trong thanh loc va tim kiem web
                </div>
              </div>
              <label className={styles.toggleSwitch} aria-label="Bat/tat trang thai hoat dong">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Huy bo
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={!name.trim()}
              style={{ opacity: !name.trim() ? 0.6 : 1 }}
            >
              {isEdit ? 'Cap Nhat' : 'Tao Moi'}
            </button>
          </div>
        </form>

        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
