/**
 * @file formDraft.ts
 * @description Non-sensitive form draft storage in sessionStorage to prevent user data loss during session expiration.
 */

import type { FormDraft } from './types';

const DRAFT_PREFIX = 'mv_form_draft_';
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Sensitive field names that MUST NEVER be persisted to Web Storage.
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /credential/i,
  /creditcard/i,
  /cvv/i,
  /cardnumber/i,
  /ssn/i,
  /pin/i
];

/**
 * Sanitizes form data by stripping sensitive keys before persisting to storage.
 *
 * @param data - Raw form payload.
 * @returns Cleaned record containing only safe user input.
 */
export const sanitizeDraftData = <T extends Record<string, unknown>>(data: T): Partial<T> => {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (!isSensitive) {
      clean[key] = value;
    }
  }

  return clean as Partial<T>;
};

/**
 * Saves non-sensitive form input data into sessionStorage under a namespaced key.
 *
 * @param formId - Unique form identifier (e.g. 'movie_edit_form', 'user_profile_form').
 * @param data - The form values to persist.
 * @param pathname - The current route path.
 */
export const saveFormDraft = <T extends Record<string, unknown>>(
  formId: string,
  data: T,
  pathname?: string
): void => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  try {
    const safeData = sanitizeDraftData(data);
    const draft: FormDraft<Partial<T>> = {
      formId,
      timestamp: Date.now(),
      pathname: pathname || window.location.pathname,
      data: safeData
    };

    window.sessionStorage.setItem(`${DRAFT_PREFIX}${formId}`, JSON.stringify(draft));
  } catch (error) {
    // sessionStorage quota or security restriction: swallow silently
    console.warn('[FormDraft] Failed to save form draft:', error);
  }
};

/**
 * Retrieves and validates an existing form draft from sessionStorage.
 *
 * @param formId - Unique form identifier.
 * @returns The restored data or null if not found or expired.
 */
export const getFormDraft = <T extends Record<string, unknown>>(formId: string): Partial<T> | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;

  try {
    const raw = window.sessionStorage.getItem(`${DRAFT_PREFIX}${formId}`);
    if (!raw) return null;

    const draft = JSON.parse(raw) as FormDraft<Partial<T>>;
    if (Date.now() - draft.timestamp > MAX_DRAFT_AGE_MS) {
      clearFormDraft(formId);
      return null;
    }

    return draft.data;
  } catch {
    return null;
  }
};

/**
 * Clears a specific form draft from sessionStorage upon successful submission.
 *
 * @param formId - Unique form identifier.
 */
export const clearFormDraft = (formId: string): void => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(`${DRAFT_PREFIX}${formId}`);
  } catch {
    // ignore
  }
};
