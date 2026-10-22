'use client';

/**
 * Remembers where a visitor has been in this tab, so a contact submission can
 * say which page it was sent from and which page led there. A director who
 * clicks "Contact" on a show page and submits on /contact is traced back to
 * the show page.
 *
 * In-site pages are kept as paths. The first page of a visit falls back to
 * document.referrer (Google, Instagram, an email link). sessionStorage can be
 * missing (private mode, blocked storage); every access is guarded and the
 * form still submits without a trail.
 */

const CURRENT_KEY = 'bd:page-trail:current';
const PREVIOUS_KEY = 'bd:page-trail:previous';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function here(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** Call on every navigation (PageTrailRecorder does). */
export function recordPage(path: string = here()): void {
  const store = storage();
  if (!store) return;
  try {
    const current = store.getItem(CURRENT_KEY);
    if (current === path) return;
    if (current) store.setItem(PREVIOUS_KEY, current);
    store.setItem(CURRENT_KEY, path);
  } catch {
    // Quota or blocked storage: tracing is best-effort.
  }
}

/** The page a form is on, and the page before it (or the external referrer). */
export function pageTrail(): { pageUrl?: string; referrerUrl?: string } {
  if (typeof window === 'undefined') return {};
  const pageUrl = here();
  let previous: string | null = null;
  try {
    const store = storage();
    // Only trust "previous" when "current" is this page; otherwise the trail
    // is stale (another tab, storage cleared mid-visit).
    if (store?.getItem(CURRENT_KEY) === pageUrl) previous = store.getItem(PREVIOUS_KEY);
  } catch {
    previous = null;
  }
  const referrerUrl = previous ?? externalReferrer();
  return { pageUrl, ...(referrerUrl ? { referrerUrl } : {}) };
}

function externalReferrer(): string | undefined {
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    const url = new URL(ref);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : ref;
  } catch {
    return undefined;
  }
}

/**
 * POSTs a contact-form payload with the page trail attached. Every form that
 * posts to /api/contact goes through here.
 */
export function postContact(payload: Record<string, unknown>): Promise<Response> {
  return fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ...pageTrail() }),
  });
}
