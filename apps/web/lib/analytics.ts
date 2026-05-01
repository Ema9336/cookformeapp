import { analyticsApi } from './api';

const VISITOR_KEY = 'cf_visitor_id';
const SESSION_KEY = 'cf_session_id';
const CONSENT_KEY = 'cf_analytics_consent';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateStorageId(key: string, storage: Storage) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = randomId();
  storage.setItem(key, id);
  return id;
}

export function getAnalyticsIdentity() {
  if (typeof window === 'undefined') {
    return { visitorId: '', sessionId: '' };
  }

  const visitorId = getOrCreateStorageId(VISITOR_KEY, window.localStorage);
  const sessionId = getOrCreateStorageId(SESSION_KEY, window.sessionStorage);

  return { visitorId, sessionId };
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown';
  const value = window.localStorage.getItem(CONSENT_KEY);
  if (value === 'granted' || value === 'denied') return value;
  return 'unknown';
}

export function setAnalyticsConsent(consent: Exclude<AnalyticsConsent, 'unknown'>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, consent);
}

export function canTrackAnalytics() {
  return getAnalyticsConsent() === 'granted';
}

export function trackAnalyticsEvent(params: {
  eventType: 'PAGE_VIEW' | 'CLICK' | 'FORM_SUBMIT' | 'CUSTOM';
  path?: string;
  element?: string;
  label?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!canTrackAnalytics()) return;

  const { visitorId, sessionId } = getAnalyticsIdentity();
  if (!sessionId) return;

  const safePath = params.path || (typeof window !== 'undefined' ? window.location.pathname : undefined);

  void analyticsApi.trackEvent({
    eventType: params.eventType,
    path: safePath,
    element: params.element,
    label: params.label,
    sessionId,
    visitorId,
    userId: params.userId,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    metadata: {
      ...params.metadata,
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined,
    },
  }).catch(() => {
    // Never block UX on analytics failures.
  });
}
